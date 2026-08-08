import fs from "fs/promises"
import * as path from "path"

import * as vscode from "vscode"
import { isBinaryFile } from "isbinaryfile"

import { mentionRegexGlobal, commandRegexGlobal, unescapeSpaces } from "../../shared/context-mentions"

import { getCommitInfo, getRecentFiles, getRefDiff, getWorkingState } from "../../utils/git"

import { openFile } from "../../integrations/misc/open-file"
import { extractTextFromFileWithMetadata, type ExtractTextResult } from "../../integrations/misc/extract-text"
import { diagnosticsToProblemsString } from "../../integrations/diagnostics"
import { DEFAULT_LINE_LIMIT } from "../prompts/tools/native-tools/read_file"

import { FileContextTracker } from "../context-tracking/FileContextTracker"
import { EditorUtils } from "../../integrations/editor/EditorUtils"

import { RooIgnoreController } from "../ignore/RooIgnoreController"
import { getCommand, type Command } from "../../services/command/commands"
import { regexSearchFiles } from "../../services/ripgrep"
import { listFiles } from "../../services/glob/list-files"
import { formatResponse } from "../prompts/responses"
import { buildSkillResult, resolveSkillContentForMode, type SkillLookup } from "../../services/skills/skillInvocation"
import type { SkillContent } from "../../shared/skills"
import type { VectorStoreSearchResult } from "../../services/code-index/interfaces"
import type { HistoryItem } from "@roo-code/types"

/**
 * Optional provider-backed services for mentions that need access to
 * state outside the workspace filesystem (e.g. the code index).
 */
export interface MentionServices {
	/** Semantic codebase search; resolves to null when indexing is unavailable. */
	searchCodebase?: (query: string) => Promise<VectorStoreSearchResult[] | null>
	/** Task history lookup; resolves to null when task history is unavailable. */
	getTaskInfo?: (taskId: string) => Promise<HistoryItem | null>
}

export async function openMention(cwd: string, mention?: string): Promise<void> {
	if (!mention) {
		return
	}

	if (mention.startsWith("/")) {
		// Slice off the leading slash and unescape any spaces in the path
		const relPath = unescapeSpaces(mention.slice(1))
		const absPath = path.resolve(cwd, relPath)
		if (mention.endsWith("/")) {
			vscode.commands.executeCommand("revealInExplorer", vscode.Uri.file(absPath))
		} else {
			openFile(absPath)
		}
	} else if (mention === "problems") {
		vscode.commands.executeCommand("workbench.actions.view.problems")
	} else if (mention === "terminal") {
		vscode.commands.executeCommand("workbench.action.terminal.focus")
	} else if (mention.startsWith("http")) {
		vscode.env.openExternal(vscode.Uri.parse(mention))
	}
}

/**
 * Represents a content block generated from an @ mention.
 * These are returned separately from the user's text to enable
 * proper formatting as distinct message blocks.
 */
export interface MentionContentBlock {
	type: "file" | "folder" | "url" | "diagnostics" | "git_changes" | "git_commit" | "terminal" | "command"
	/** Path for file/folder mentions */
	path?: string
	/** The content to display */
	content: string
	/** Metadata about truncation (for files) */
	metadata?: {
		totalLines: number
		returnedLines: number
		wasTruncated: boolean
		linesShown?: [number, number]
	}
}

export interface ParseMentionsResult {
	/** User's text with @ mentions replaced by clean path references */
	text: string
	/** Separate content blocks for each mention (file content, URLs, etc.) */
	contentBlocks: MentionContentBlock[]
	slashCommandHelp?: string
	mode?: string // Mode from the first slash command that has one
}

/**
 * Formats file content to look like a read_file tool result.
 * Includes Gemini-style truncation warning when content is truncated.
 */
function formatFileReadResult(filePath: string, result: ExtractTextResult): string {
	const header = `[read_file for '${filePath}']`

	if (result.wasTruncated && result.linesShown) {
		const [start, end] = result.linesShown
		const nextOffset = end + 1
		return `${header}
IMPORTANT: File content truncated.
Status: Showing lines ${start}-${end} of ${result.totalLines} total lines.
To read more: Use the read_file tool with offset=${nextOffset} and limit=${DEFAULT_LINE_LIMIT}.

File: ${filePath}
${result.content}`
	}

	return `${header}
File: ${filePath}
${result.content}`
}

export async function parseMentions(
	text: string,
	cwd: string,
	fileContextTracker?: FileContextTracker,
	rooIgnoreController?: RooIgnoreController,
	showRooIgnoredFiles: boolean = false,
	includeDiagnosticMessages: boolean = true,
	maxDiagnosticMessages: number = 50,
	skillsManager?: SkillLookup,
	currentMode: string = "code",
	mentionServices?: MentionServices,
): Promise<ParseMentionsResult> {
	const mentions: Set<string> = new Set()
	const validCommands: Map<string, Command> = new Map()
	const validSkills: Map<string, SkillContent> = new Map()
	const contentBlocks: MentionContentBlock[] = []
	let commandMode: string | undefined // Track mode from the first slash command that has one

	// First pass: check which command mentions exist and cache the results
	const commandMatches = Array.from(text.matchAll(commandRegexGlobal))
	const uniqueCommandNames = new Set(commandMatches.map(([, commandName]) => commandName))

	const commandExistenceChecks = await Promise.all(
		Array.from(uniqueCommandNames).map(async (commandName) => {
			try {
				const command = await getCommand(cwd, commandName)
				if (command) {
					return { commandName, command, skillContent: null }
				}

				const skillContent = await resolveSkillContentForMode(skillsManager, commandName, currentMode)
				return { commandName, command: undefined, skillContent }
			} catch (error) {
				// If there's an error checking command existence, treat it as non-existent
				return { commandName, command: undefined, skillContent: null }
			}
		}),
	)

	// Store valid commands for later use and capture the first mode found
	for (const { commandName, command, skillContent } of commandExistenceChecks) {
		if (command) {
			validCommands.set(commandName, command)
			// Capture the mode from the first command that has one
			if (!commandMode && command.mode) {
				commandMode = command.mode
			}
			continue
		}

		if (skillContent) {
			validSkills.set(commandName, skillContent)
		}
	}

	// Only replace text for commands that actually exist (keep "see below" for commands)
	let parsedText = text
	for (const [match, commandName] of commandMatches) {
		if (validCommands.has(commandName) || validSkills.has(commandName)) {
			parsedText = parsedText.replace(match, `Command '${commandName}' (see below for command content)`)
		}
	}

	// Second pass: handle regular mentions - replace with clean references
	// Content will be provided as separate blocks that look like read_file results
	parsedText = parsedText.replace(mentionRegexGlobal, (match, mention) => {
		mentions.add(mention)
		if (mention.startsWith("http")) {
			return `'${mention}'`
		} else if (mention.startsWith("/")) {
			// Clean path reference - no "see below" since we format like tool results
			const mentionPath = mention.slice(1)
			return mentionPath.endsWith("/") ? `'${mentionPath}'` : `'${mentionPath}'`
		} else if (mention === "problems") {
			return `Workspace Problems (see below for diagnostics)`
		} else if (mention === "git-changes") {
			return `Working directory changes (see below for details)`
		} else if (/^[a-f0-9]{7,40}$/.test(mention)) {
			return `Git commit '${mention}' (see below for commit info)`
		} else if (mention === "terminal") {
			return `Terminal Output (see below for output)`
		} else if (mention === "selection") {
			return `Editor selection (see below for content)`
		} else if (mention === "tab") {
			return `Active editor tab (see below for content)`
		} else if (mention === "tabs") {
			return `Open editor tabs (see below for list)`
		} else if (mention === "clipboard") {
			return `Clipboard contents (see below for content)`
		} else if (mention.startsWith("search:")) {
			return `Workspace search for '${unescapeSpaces(mention.slice("search:".length))}' (see below for results)`
		} else if (mention.startsWith("codebase:")) {
			return `Codebase search for '${unescapeSpaces(mention.slice("codebase:".length))}' (see below for results)`
		} else if (mention.startsWith("skill:")) {
			return `Skill '${unescapeSpaces(mention.slice("skill:".length))}' (see below for skill instructions)`
		} else if (mention.startsWith("task:")) {
			return `Task '${mention.slice("task:".length)}' (see below for task details)`
		} else if (mention.startsWith("diff:")) {
			return `Git diff against '${mention.slice("diff:".length)}' (see below for diff)`
		} else if (mention.startsWith("symbol:")) {
			return `Workspace symbols for '${unescapeSpaces(mention.slice("symbol:".length))}' (see below for symbols)`
		} else if (mention === "recent") {
			return `Recently changed files (see below for list)`
		} else if (mention === "tree") {
			return `Workspace file tree (see below for listing)`
		}
		return match
	})

	for (const mention of mentions) {
		if (mention.startsWith("/")) {
			const mentionPath = mention.slice(1)
			try {
				const fileResult = await getFileOrFolderContentWithMetadata(
					mentionPath,
					cwd,
					rooIgnoreController,
					showRooIgnoredFiles,
					fileContextTracker,
				)
				contentBlocks.push(fileResult)
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error)
				contentBlocks.push({
					type: mention.endsWith("/") ? "folder" : "file",
					path: mentionPath,
					content: `[read_file for '${mentionPath}']\nError: ${errorMsg}`,
				})
			}
		} else if (mention === "problems") {
			try {
				const problems = await getWorkspaceProblems(cwd, includeDiagnosticMessages, maxDiagnosticMessages)
				parsedText += `\n\n<workspace_diagnostics>\n${problems}\n</workspace_diagnostics>`
			} catch (error) {
				parsedText += `\n\n<workspace_diagnostics>\nError fetching diagnostics: ${error.message}\n</workspace_diagnostics>`
			}
		} else if (mention === "git-changes") {
			try {
				const workingState = await getWorkingState(cwd)
				parsedText += `\n\n<git_working_state>\n${workingState}\n</git_working_state>`
			} catch (error) {
				parsedText += `\n\n<git_working_state>\nError fetching working state: ${error.message}\n</git_working_state>`
			}
		} else if (/^[a-f0-9]{7,40}$/.test(mention)) {
			try {
				const commitInfo = await getCommitInfo(mention, cwd)
				parsedText += `\n\n<git_commit hash="${mention}">\n${commitInfo}\n</git_commit>`
			} catch (error) {
				parsedText += `\n\n<git_commit hash="${mention}">\nError fetching commit info: ${error.message}\n</git_commit>`
			}
		} else if (mention === "terminal") {
			try {
				const terminalOutput = await getLatestTerminalOutput()
				parsedText += `\n\n<terminal_output>\n${terminalOutput}\n</terminal_output>`
			} catch (error) {
				parsedText += `\n\n<terminal_output>\nError fetching terminal output: ${error.message}\n</terminal_output>`
			}
		} else if (mention === "selection") {
			try {
				const editorContext = EditorUtils.getEditorContext()
				if (editorContext) {
					parsedText += `\n\n<editor_selection file="${editorContext.filePath}" lines="${editorContext.startLine}-${editorContext.endLine}">\n${editorContext.selectedText}\n</editor_selection>`
				} else {
					parsedText += `\n\n<editor_selection>\nNo active editor selection found.\n</editor_selection>`
				}
			} catch (error) {
				parsedText += `\n\n<editor_selection>\nError fetching editor selection: ${error.message}\n</editor_selection>`
			}
		} else if (mention === "tab") {
			const activeEditor = vscode.window.activeTextEditor
			if (!activeEditor || activeEditor.document.isUntitled) {
				parsedText += `\n\n<active_tab>\nNo active editor tab found.\n</active_tab>`
			} else {
				const relPath = path.relative(cwd, activeEditor.document.uri.fsPath).toPosix()
				try {
					const fileResult = await getFileOrFolderContentWithMetadata(
						relPath,
						cwd,
						rooIgnoreController,
						showRooIgnoredFiles,
						fileContextTracker,
					)
					contentBlocks.push(fileResult)
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : String(error)
					contentBlocks.push({
						type: "file",
						path: relPath,
						content: `[read_file for '${relPath}']\nError: ${errorMsg}`,
					})
				}
			}
		} else if (mention === "tabs") {
			try {
				const tabPaths = vscode.window.tabGroups.all
					.flatMap((group) => group.tabs)
					.filter((tab) => tab.input instanceof vscode.TabInputText)
					.map((tab) => (tab.input as vscode.TabInputText).uri.fsPath)
					.filter(Boolean)
					.map((absolutePath) => path.relative(cwd, absolutePath).toPosix())
				const listing = tabPaths.length > 0 ? tabPaths.join("\n") : "No open editor tabs found."
				parsedText += `\n\n<open_tabs>\n${listing}\n</open_tabs>`
			} catch (error) {
				parsedText += `\n\n<open_tabs>\nError fetching open tabs: ${error.message}\n</open_tabs>`
			}
		} else if (mention === "clipboard") {
			try {
				const clipboardText = (await vscode.env.clipboard.readText()).trim()
				parsedText += `\n\n<clipboard>\n${clipboardText || "Clipboard is empty."}\n</clipboard>`
			} catch (error) {
				parsedText += `\n\n<clipboard>\nError fetching clipboard contents: ${error.message}\n</clipboard>`
			}
		} else if (mention.startsWith("search:")) {
			const query = unescapeSpaces(mention.slice("search:".length))
			try {
				const results = await regexSearchFiles(cwd, cwd, query, undefined, rooIgnoreController)
				parsedText += `\n\n<search_results query="${query}">\n${results}\n</search_results>`
			} catch (error) {
				parsedText += `\n\n<search_results query="${query}">\nError searching workspace: ${error.message}\n</search_results>`
			}
		} else if (mention.startsWith("codebase:")) {
			const query = unescapeSpaces(mention.slice("codebase:".length))
			try {
				const results = mentionServices?.searchCodebase ? await mentionServices.searchCodebase(query) : null
				if (results === null) {
					parsedText += `\n\n<codebase_search query="${query}">\nCodebase indexing is not enabled or not configured.\n</codebase_search>`
				} else if (results.length === 0) {
					parsedText += `\n\n<codebase_search query="${query}">\nNo results found.\n</codebase_search>`
				} else {
					const formatted = results
						.flatMap((result) =>
							result.payload && "filePath" in result.payload
								? [{ score: result.score, payload: result.payload }]
								: [],
						)
						.map(
							({ score, payload }) =>
								`File path: ${payload.filePath}\nScore: ${score}\nLines: ${payload.startLine}-${payload.endLine}\nCode Chunk: ${payload.codeChunk.trim()}\n`,
						)
						.join("\n")
					parsedText += `\n\n<codebase_search query="${query}">\n${formatted}\n</codebase_search>`
				}
			} catch (error) {
				parsedText += `\n\n<codebase_search query="${query}">\nError searching codebase: ${error.message}\n</codebase_search>`
			}
		} else if (mention.startsWith("skill:")) {
			const skillName = unescapeSpaces(mention.slice("skill:".length))
			try {
				const skillContent = await resolveSkillContentForMode(skillsManager, skillName, currentMode)
				if (skillContent) {
					parsedText += `\n\n${buildSkillResult(skillName, undefined, skillContent)}`
				} else {
					parsedText += `\n\n<skill name="${skillName}">\nSkill '${skillName}' not found.\n</skill>`
				}
			} catch (error) {
				parsedText += `\n\n<skill name="${skillName}">\nError loading skill: ${error.message}\n</skill>`
			}
		} else if (mention.startsWith("task:")) {
			const taskId = mention.slice("task:".length)
			try {
				const historyItem = mentionServices?.getTaskInfo ? await mentionServices.getTaskInfo(taskId) : null
				if (historyItem) {
					parsedText += `\n\n<task_history id="${taskId}">\n${formatTaskHistoryItem(historyItem)}\n</task_history>`
				} else {
					parsedText += `\n\n<task_history id="${taskId}">\nTask history is not available.\n</task_history>`
				}
			} catch (error) {
				parsedText += `\n\n<task_history id="${taskId}">\nError fetching task: ${error.message}\n</task_history>`
			}
		} else if (mention.startsWith("diff:")) {
			const ref = mention.slice("diff:".length)
			try {
				const refDiff = await getRefDiff(ref, cwd)
				parsedText += `\n\n<git_diff ref="${ref}">\n${refDiff}\n</git_diff>`
			} catch (error) {
				parsedText += `\n\n<git_diff ref="${ref}">\nError fetching diff: ${error.message}\n</git_diff>`
			}
		} else if (mention.startsWith("symbol:")) {
			const symbolName = unescapeSpaces(mention.slice("symbol:".length))
			try {
				const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[] | undefined>(
					"vscode.executeWorkspaceSymbolProvider",
					symbolName,
				)
				if (!symbols || symbols.length === 0) {
					parsedText += `\n\n<workspace_symbols query="${symbolName}">\nNo symbols found.\n</workspace_symbols>`
				} else {
					const listing = symbols
						.slice(0, 50)
						.map((symbol) => {
							const relPath = path.relative(cwd, symbol.location.uri.fsPath).toPosix()
							const line = symbol.location.range.start.line + 1
							const container = symbol.containerName ? ` in ${symbol.containerName}` : ""
							return `${symbol.name} (${vscode.SymbolKind[symbol.kind]})${container} - ${relPath}:${line}`
						})
						.join("\n")
					parsedText += `\n\n<workspace_symbols query="${symbolName}">\n${listing}\n</workspace_symbols>`
				}
			} catch (error) {
				parsedText += `\n\n<workspace_symbols query="${symbolName}">\nError fetching symbols: ${error.message}\n</workspace_symbols>`
			}
		} else if (mention === "recent") {
			try {
				const recentFiles = await getRecentFiles(cwd)
				parsedText += `\n\n<recent_files>\n${recentFiles}\n</recent_files>`
			} catch (error) {
				parsedText += `\n\n<recent_files>\nError fetching recent files: ${error.message}\n</recent_files>`
			}
		} else if (mention === "tree") {
			try {
				const [files, didHitLimit] = await listFiles(cwd, true, 200)
				const listing = formatResponse.formatFilesList(
					cwd,
					files,
					didHitLimit,
					rooIgnoreController,
					showRooIgnoredFiles,
				)
				parsedText += `\n\n<workspace_tree>\n${listing}\n</workspace_tree>`
			} catch (error) {
				parsedText += `\n\n<workspace_tree>\nError fetching workspace tree: ${error.message}\n</workspace_tree>`
			}
		}
	}

	// Process valid command mentions using cached results
	let slashCommandHelp = ""
	for (const [commandName, command] of validCommands) {
		try {
			let commandOutput = ""
			if (command.description) {
				commandOutput += `Description: ${command.description}\n\n`
			}
			commandOutput += command.content
			slashCommandHelp += `\n\n<command name="${commandName}">\n${commandOutput}\n</command>`
		} catch (error) {
			slashCommandHelp += `\n\n<command name="${commandName}">\nError loading command '${commandName}': ${error.message}\n</command>`
		}
	}

	for (const [skillName, skillContent] of validSkills) {
		slashCommandHelp += `\n\n${buildSkillResult(skillName, undefined, skillContent)}`
	}

	return {
		text: parsedText,
		contentBlocks,
		mode: commandMode,
		slashCommandHelp: slashCommandHelp.trim() || undefined,
	}
}

function formatTaskHistoryItem(historyItem: HistoryItem): string {
	const lines = [
		`Created: ${new Date(historyItem.ts).toISOString()}`,
		`Mode: ${historyItem.mode ?? "unknown"}`,
		`Status: ${historyItem.status ?? "unknown"}`,
		`Tokens: ${historyItem.tokensIn} in, ${historyItem.tokensOut} out`,
		"",
		"Task:",
		historyItem.task,
	]

	if (historyItem.completionResultSummary) {
		lines.push("", "Result summary:", historyItem.completionResultSummary)
	}

	return lines.join("\n")
}

/**
 * Gets file or folder content and returns it as a MentionContentBlock
 * formatted to look like a read_file tool result.
 */
async function getFileOrFolderContentWithMetadata(
	mentionPath: string,
	cwd: string,
	rooIgnoreController?: any,
	showRooIgnoredFiles: boolean = false,
	fileContextTracker?: FileContextTracker,
): Promise<MentionContentBlock> {
	const unescapedPath = unescapeSpaces(mentionPath)
	const absPath = path.resolve(cwd, unescapedPath)
	const isFolder = mentionPath.endsWith("/")

	try {
		const stats = await fs.stat(absPath)

		if (stats.isFile()) {
			// Avoid trying to include image binary content as text context.
			// Image mentions are handled separately via image attachment flow.
			const isBinary = await isBinaryFile(absPath).catch(() => false)
			if (isBinary) {
				return {
					type: "file",
					path: mentionPath,
					content: `[read_file for '${mentionPath}']\nNote: Binary file omitted from context.`,
				}
			}
			if (rooIgnoreController && !rooIgnoreController.validateAccess(unescapedPath)) {
				return {
					type: "file",
					path: mentionPath,
					content: `[read_file for '${mentionPath}']\nNote: File is ignored by .rooignore.`,
				}
			}
			try {
				const result = await extractTextFromFileWithMetadata(absPath)

				// Track file context
				if (fileContextTracker) {
					await fileContextTracker.trackFileContext(mentionPath, "file_mentioned")
				}

				return {
					type: "file",
					path: mentionPath,
					content: formatFileReadResult(mentionPath, result),
					metadata: {
						totalLines: result.totalLines,
						returnedLines: result.returnedLines,
						wasTruncated: result.wasTruncated,
						linesShown: result.linesShown,
					},
				}
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error)
				return {
					type: "file",
					path: mentionPath,
					content: `[read_file for '${mentionPath}']\nError: ${errorMsg}`,
				}
			}
		} else if (stats.isDirectory()) {
			const entries = await fs.readdir(absPath, { withFileTypes: true })
			let folderListing = ""
			const fileReadResults: string[] = []
			const LOCK_SYMBOL = "🔒"

			for (let index = 0; index < entries.length; index++) {
				const entry = entries[index]
				const isLast = index === entries.length - 1
				const linePrefix = isLast ? "└── " : "├── "
				const entryPath = path.join(absPath, entry.name)

				let isIgnored = false
				if (rooIgnoreController) {
					isIgnored = !rooIgnoreController.validateAccess(entryPath)
				}

				if (isIgnored && !showRooIgnoredFiles) {
					continue
				}

				const displayName = isIgnored ? `${LOCK_SYMBOL} ${entry.name}` : entry.name

				if (entry.isFile()) {
					folderListing += `${linePrefix}${displayName}\n`
					if (!isIgnored) {
						const filePath = path.join(mentionPath, entry.name)
						const absoluteFilePath = path.resolve(absPath, entry.name)
						try {
							const isBinary = await isBinaryFile(absoluteFilePath).catch(() => false)
							if (!isBinary) {
								const result = await extractTextFromFileWithMetadata(absoluteFilePath)
								fileReadResults.push(formatFileReadResult(filePath.toPosix(), result))
							}
						} catch (error) {
							// Skip files that can't be read
						}
					}
				} else if (entry.isDirectory()) {
					folderListing += `${linePrefix}${displayName}/\n`
				} else {
					folderListing += `${linePrefix}${displayName}\n`
				}
			}

			// Format folder content similar to read_file output
			let content = `[read_file for folder '${mentionPath}']\nFolder listing:\n${folderListing}`
			if (fileReadResults.length > 0) {
				content += `\n\n--- File Contents ---\n\n${fileReadResults.join("\n\n")}`
			}

			return {
				type: "folder",
				path: mentionPath,
				content,
			}
		} else {
			return {
				type: isFolder ? "folder" : "file",
				path: mentionPath,
				content: `[read_file for '${mentionPath}']\nError: Unable to read (not a file or directory)`,
			}
		}
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to access path "${mentionPath}": ${errorMsg}`)
	}
}

async function getWorkspaceProblems(
	cwd: string,
	includeDiagnosticMessages: boolean = true,
	maxDiagnosticMessages: number = 50,
): Promise<string> {
	const diagnostics = vscode.languages.getDiagnostics()
	const result = await diagnosticsToProblemsString(
		diagnostics,
		[vscode.DiagnosticSeverity.Error, vscode.DiagnosticSeverity.Warning],
		cwd,
		includeDiagnosticMessages,
		maxDiagnosticMessages,
	)
	if (!result) {
		return "No errors or warnings detected."
	}
	return result
}

/**
 * Gets the contents of the active terminal
 * @returns The terminal contents as a string
 */
export async function getLatestTerminalOutput(): Promise<string> {
	// Store original clipboard content to restore later
	const originalClipboard = await vscode.env.clipboard.readText()

	try {
		// Select terminal content
		await vscode.commands.executeCommand("workbench.action.terminal.selectAll")

		// Copy selection to clipboard
		await vscode.commands.executeCommand("workbench.action.terminal.copySelection")

		// Clear the selection
		await vscode.commands.executeCommand("workbench.action.terminal.clearSelection")

		// Get terminal contents from clipboard
		let terminalContents = (await vscode.env.clipboard.readText()).trim()

		// Check if there's actually a terminal open
		if (terminalContents === originalClipboard) {
			return ""
		}

		// Clean up command separation
		const lines = terminalContents.split("\n")
		const lastLine = lines.pop()?.trim()

		if (lastLine) {
			let i = lines.length - 1

			while (i >= 0 && !lines[i].trim().startsWith(lastLine)) {
				i--
			}

			terminalContents = lines.slice(Math.max(i, 0)).join("\n")
		}

		return terminalContents
	} finally {
		// Restore original clipboard content
		await vscode.env.clipboard.writeText(originalClipboard)
	}
}

// Export processUserContentMentions from its own file
export { processUserContentMentions } from "./processUserContentMentions"
export type { ProcessUserContentMentionsResult } from "./processUserContentMentions"
