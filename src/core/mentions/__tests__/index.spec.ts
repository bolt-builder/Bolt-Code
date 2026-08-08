// npx vitest core/mentions/__tests__/index.spec.ts

import * as vscode from "vscode"

import { parseMentions, type MentionServices } from "../index"

// Mock vscode
vi.mock("vscode", () => {
	class TabInputText {
		constructor(public uri: { fsPath: string }) {}
	}

	return {
		window: {
			showErrorMessage: vi.fn(),
			activeTextEditor: undefined,
			tabGroups: { all: [] },
		},
		TabInputText,
		Uri: {
			file: vi.fn((fsPath: string) => ({ fsPath, path: fsPath, scheme: "file" })),
		},
		env: {
			clipboard: { readText: vi.fn(), writeText: vi.fn() },
		},
		commands: {
			executeCommand: vi.fn(),
		},
		SymbolKind: {
			4: "Class",
			11: "Function",
			Class: 4,
			Function: 11,
		},
	}
})

// Mock i18n
vi.mock("../../../i18n", () => ({
	t: vi.fn((key: string) => key),
}))

// Mock EditorUtils
vi.mock("../../../integrations/editor/EditorUtils", () => ({
	EditorUtils: {
		getEditorContext: vi.fn(),
	},
}))

// Mock ripgrep service
vi.mock("../../../services/ripgrep", () => ({
	regexSearchFiles: vi.fn(),
}))

// Mock file listing
vi.mock("../../../services/glob/list-files", () => ({
	listFiles: vi.fn(),
}))

// Mock git utils
vi.mock("../../../utils/git", () => ({
	getCommitInfo: vi.fn(),
	getRecentFiles: vi.fn(),
	getRefDiff: vi.fn(),
	getWorkingState: vi.fn(),
	searchCommits: vi.fn(),
}))

describe("parseMentions - URL mention handling", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should replace URL mentions with quoted URL reference", async () => {
		const result = await parseMentions("Check @https://example.com", "/test")

		// URL mentions are now replaced with a quoted reference (no fetching)
		expect(result.text).toContain("'https://example.com'")
	})
})

describe("parseMentions - @selection", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should append the active editor selection", async () => {
		const { EditorUtils } = await import("../../../integrations/editor/EditorUtils")
		vi.mocked(EditorUtils.getEditorContext).mockReturnValue({
			filePath: "src/foo.ts",
			selectedText: "const foo = 1",
			startLine: 3,
			endLine: 3,
		})

		const result = await parseMentions("Explain @selection", "/test")

		expect(result.text).toContain("Editor selection (see below for content)")
		expect(result.text).toContain('<editor_selection file="src/foo.ts" lines="3-3">')
		expect(result.text).toContain("const foo = 1")
	})

	it("should report when there is no selection", async () => {
		const { EditorUtils } = await import("../../../integrations/editor/EditorUtils")
		vi.mocked(EditorUtils.getEditorContext).mockReturnValue(null)

		const result = await parseMentions("Explain @selection", "/test")

		expect(result.text).toContain("No active editor selection found.")
	})
})

describe("parseMentions - @tab and @tabs", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		Object.assign(vscode.window, { activeTextEditor: undefined })
		Object.assign(vscode.window.tabGroups, { all: [] })
	})

	it("should include the active tab as a file content block", async () => {
		const os = await import("os")
		const fs = await import("fs/promises")
		const path = await import("path")
		const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "bolt-mentions-"))
		const filePath = path.join(tmpDir, "active.ts")
		await fs.writeFile(filePath, "const active = true\n")

		Object.assign(vscode.window, {
			activeTextEditor: { document: { isUntitled: false, uri: { fsPath: filePath } } },
		})

		const result = await parseMentions("Look at @tab", tmpDir)

		expect(result.text).toContain("Active editor tab (see below for content)")
		expect(result.contentBlocks).toHaveLength(1)
		expect(result.contentBlocks[0].type).toBe("file")
		expect(result.contentBlocks[0].path).toBe("active.ts")
		expect(result.contentBlocks[0].content).toContain("const active = true")

		await fs.rm(tmpDir, { recursive: true, force: true })
	})

	it("should report when there is no active tab", async () => {
		const result = await parseMentions("Look at @tab", "/test")

		expect(result.text).toContain("No active editor tab found.")
	})

	it("should list open tabs", async () => {
		Object.assign(vscode.window.tabGroups, {
			all: [
				{
					tabs: [
						{ input: new vscode.TabInputText(vscode.Uri.file("/test/src/a.ts")) },
						{ input: new vscode.TabInputText(vscode.Uri.file("/test/src/b.ts")) },
						{ input: {} }, // Non-text tab is skipped
					],
				},
			],
		})

		const result = await parseMentions("Review @tabs", "/test")

		expect(result.text).toContain("Open editor tabs (see below for list)")
		expect(result.text).toContain("<open_tabs>\nsrc/a.ts\nsrc/b.ts\n</open_tabs>")
	})

	it("should report when no tabs are open", async () => {
		const result = await parseMentions("Review @tabs", "/test")

		expect(result.text).toContain("No open editor tabs found.")
	})
})

describe("parseMentions - @clipboard", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should append clipboard contents", async () => {
		vi.mocked(vscode.env.clipboard.readText).mockResolvedValue("copied snippet")

		const result = await parseMentions("Use @clipboard", "/test")

		expect(result.text).toContain("Clipboard contents (see below for content)")
		expect(result.text).toContain("<clipboard>\ncopied snippet\n</clipboard>")
	})

	it("should report when the clipboard is empty", async () => {
		vi.mocked(vscode.env.clipboard.readText).mockResolvedValue("   ")

		const result = await parseMentions("Use @clipboard", "/test")

		expect(result.text).toContain("Clipboard is empty.")
	})

	it("should report clipboard read errors", async () => {
		vi.mocked(vscode.env.clipboard.readText).mockRejectedValue(new Error("denied"))

		const result = await parseMentions("Use @clipboard", "/test")

		expect(result.text).toContain("Error fetching clipboard contents: denied")
	})
})

describe("parseMentions - @search:", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should append ripgrep search results", async () => {
		const { regexSearchFiles } = await import("../../../services/ripgrep")
		vi.mocked(regexSearchFiles).mockResolvedValue("# src/foo.ts\n  1 | const foo = 1")

		const result = await parseMentions("Find @search:foo", "/test")

		expect(regexSearchFiles).toHaveBeenCalledWith("/test", "/test", "foo", undefined, undefined)
		expect(result.text).toContain("Workspace search for 'foo' (see below for results)")
		expect(result.text).toContain('<search_results query="foo">\n# src/foo.ts')
	})

	it("should unescape spaces in the search query", async () => {
		const { regexSearchFiles } = await import("../../../services/ripgrep")
		vi.mocked(regexSearchFiles).mockResolvedValue("No results found")

		await parseMentions("Find @search:foo\\ bar", "/test")

		expect(regexSearchFiles).toHaveBeenCalledWith("/test", "/test", "foo bar", undefined, undefined)
	})

	it("should report search errors", async () => {
		const { regexSearchFiles } = await import("../../../services/ripgrep")
		vi.mocked(regexSearchFiles).mockRejectedValue(new Error("rg missing"))

		const result = await parseMentions("Find @search:foo", "/test")

		expect(result.text).toContain("Error searching workspace: rg missing")
	})
})

describe("parseMentions - @codebase:", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	const parseWithServices = (text: string, searchCodebase: MentionServices["searchCodebase"]) =>
		parseMentions(text, "/test", undefined, undefined, false, true, 50, undefined, "code", { searchCodebase })

	it("should append formatted code index results", async () => {
		const searchCodebase = vi.fn().mockResolvedValue([
			{
				id: "1",
				score: 0.87,
				payload: { filePath: "src/auth.ts", codeChunk: "function login() {}", startLine: 10, endLine: 12 },
			},
		])

		const result = await parseWithServices("Explain @codebase:user\\ authentication", searchCodebase)

		expect(searchCodebase).toHaveBeenCalledWith("user authentication")
		expect(result.text).toContain("Codebase search for 'user authentication' (see below for results)")
		expect(result.text).toContain('<codebase_search query="user authentication">')
		expect(result.text).toContain("File path: src/auth.ts")
		expect(result.text).toContain("Lines: 10-12")
		expect(result.text).toContain("Code Chunk: function login() {}")
	})

	it("should report when indexing is unavailable", async () => {
		const searchCodebase = vi.fn().mockResolvedValue(null)

		const result = await parseWithServices("Explain @codebase:auth", searchCodebase)

		expect(result.text).toContain("Codebase indexing is not enabled or not configured.")
	})

	it("should report when indexing is unavailable because no services were provided", async () => {
		const result = await parseMentions("Explain @codebase:auth", "/test")

		expect(result.text).toContain("Codebase indexing is not enabled or not configured.")
	})

	it("should report when there are no results", async () => {
		const searchCodebase = vi.fn().mockResolvedValue([])

		const result = await parseWithServices("Explain @codebase:auth", searchCodebase)

		expect(result.text).toContain("No results found.")
	})

	it("should report codebase search errors", async () => {
		const searchCodebase = vi.fn().mockRejectedValue(new Error("index offline"))

		const result = await parseWithServices("Explain @codebase:auth", searchCodebase)

		expect(result.text).toContain("Error searching codebase: index offline")
	})
})

describe("parseMentions - @skill:", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	const parseWithSkills = (text: string, getSkillContent: ReturnType<typeof vi.fn>) =>
		parseMentions(text, "/test", undefined, undefined, false, true, 50, { getSkillContent }, "code")

	it("should append skill instructions", async () => {
		const getSkillContent = vi.fn().mockResolvedValue({
			name: "deploy-runbook",
			description: "How to deploy",
			path: "/skills/deploy-runbook/SKILL.md",
			source: "project",
			instructions: "1. Run the deploy script",
		})

		const result = await parseWithSkills("Use @skill:deploy-runbook", getSkillContent)

		expect(getSkillContent).toHaveBeenCalledWith("deploy-runbook", "code")
		expect(result.text).toContain("Skill 'deploy-runbook' (see below for skill instructions)")
		expect(result.text).toContain("Skill: deploy-runbook")
		expect(result.text).toContain("1. Run the deploy script")
	})

	it("should report when the skill is not found", async () => {
		const getSkillContent = vi.fn().mockResolvedValue(null)

		const result = await parseWithSkills("Use @skill:missing", getSkillContent)

		expect(result.text).toContain("Skill 'missing' not found.")
	})

	it("should report when no skills manager is available", async () => {
		const result = await parseMentions("Use @skill:deploy-runbook", "/test")

		expect(result.text).toContain("Skill 'deploy-runbook' not found.")
	})

	it("should report skill loading errors", async () => {
		const getSkillContent = vi.fn().mockRejectedValue(new Error("disk error"))

		const result = await parseWithSkills("Use @skill:deploy-runbook", getSkillContent)

		expect(result.text).toContain("Error loading skill: disk error")
	})
})

describe("parseMentions - @task:", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	const parseWithServices = (text: string, getTaskInfo: MentionServices["getTaskInfo"]) =>
		parseMentions(text, "/test", undefined, undefined, false, true, 50, undefined, "code", { getTaskInfo })

	it("should append task history details", async () => {
		const getTaskInfo = vi.fn().mockResolvedValue({
			id: "abc-123",
			number: 1,
			ts: 1700000000000,
			task: "Fix the login bug",
			tokensIn: 100,
			tokensOut: 200,
			totalCost: 0.05,
			mode: "code",
			status: "completed",
			completionResultSummary: "Fixed by updating the session guard.",
		})

		const result = await parseWithServices("Continue from @task:abc-123", getTaskInfo)

		expect(getTaskInfo).toHaveBeenCalledWith("abc-123")
		expect(result.text).toContain("Task 'abc-123' (see below for task details)")
		expect(result.text).toContain('<task_history id="abc-123">')
		expect(result.text).toContain("Task:\nFix the login bug")
		expect(result.text).toContain("Status: completed")
		expect(result.text).toContain("Result summary:\nFixed by updating the session guard.")
	})

	it("should report when task history is unavailable", async () => {
		const result = await parseMentions("Continue from @task:abc-123", "/test")

		expect(result.text).toContain("Task history is not available.")
	})

	it("should report task lookup errors", async () => {
		const getTaskInfo = vi.fn().mockRejectedValue(new Error("Task not found"))

		const result = await parseWithServices("Continue from @task:missing", getTaskInfo)

		expect(result.text).toContain("Error fetching task: Task not found")
	})
})

describe("parseMentions - @diff:", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should append the diff against the given ref", async () => {
		const { getRefDiff } = await import("../../../utils/git")
		vi.mocked(getRefDiff).mockResolvedValue("Diff against 'main':\n\n1 file changed\n\n+new line")

		const result = await parseMentions("Review @diff:main", "/test")

		expect(getRefDiff).toHaveBeenCalledWith("main", "/test")
		expect(result.text).toContain("Git diff against 'main' (see below for diff)")
		expect(result.text).toContain('<git_diff ref="main">')
		expect(result.text).toContain("+new line")
	})

	it("should report diff errors", async () => {
		const { getRefDiff } = await import("../../../utils/git")
		vi.mocked(getRefDiff).mockRejectedValue(new Error("bad ref"))

		const result = await parseMentions("Review @diff:main", "/test")

		expect(result.text).toContain("Error fetching diff: bad ref")
	})
})

describe("parseMentions - @symbol:", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should list workspace symbols", async () => {
		vi.mocked(vscode.commands.executeCommand).mockResolvedValue([
			{
				name: "login",
				kind: 11,
				containerName: "AuthService",
				location: { uri: { fsPath: "/test/src/auth.ts" }, range: { start: { line: 9 } } },
			},
			{
				name: "LoginView",
				kind: 4,
				containerName: "",
				location: { uri: { fsPath: "/test/src/view.ts" }, range: { start: { line: 0 } } },
			},
		])

		const result = await parseMentions("Find @symbol:login", "/test")

		expect(vscode.commands.executeCommand).toHaveBeenCalledWith("vscode.executeWorkspaceSymbolProvider", "login")
		expect(result.text).toContain("Workspace symbols for 'login' (see below for symbols)")
		expect(result.text).toContain("login (Function) in AuthService - src/auth.ts:10")
		expect(result.text).toContain("LoginView (Class) - src/view.ts:1")
	})

	it("should report when no symbols are found", async () => {
		vi.mocked(vscode.commands.executeCommand).mockResolvedValue([])

		const result = await parseMentions("Find @symbol:missing", "/test")

		expect(result.text).toContain("No symbols found.")
	})

	it("should report symbol provider errors", async () => {
		vi.mocked(vscode.commands.executeCommand).mockRejectedValue(new Error("no provider"))

		const result = await parseMentions("Find @symbol:login", "/test")

		expect(result.text).toContain("Error fetching symbols: no provider")
	})
})

describe("parseMentions - @recent", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should append recently changed files", async () => {
		const { getRecentFiles } = await import("../../../utils/git")
		vi.mocked(getRecentFiles).mockResolvedValue("src/a.ts\nsrc/b.ts")

		const result = await parseMentions("What changed? @recent", "/test")

		expect(getRecentFiles).toHaveBeenCalledWith("/test")
		expect(result.text).toContain("Recently changed files (see below for list)")
		expect(result.text).toContain("<recent_files>\nsrc/a.ts\nsrc/b.ts\n</recent_files>")
	})

	it("should report recent files errors", async () => {
		const { getRecentFiles } = await import("../../../utils/git")
		vi.mocked(getRecentFiles).mockRejectedValue(new Error("git broke"))

		const result = await parseMentions("What changed? @recent", "/test")

		expect(result.text).toContain("Error fetching recent files: git broke")
	})
})

describe("parseMentions - @tree", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should append the workspace file tree", async () => {
		const { listFiles } = await import("../../../services/glob/list-files")
		vi.mocked(listFiles).mockResolvedValue([["/test/src/", "/test/src/index.ts", "/test/README.md"], false])

		const result = await parseMentions("Explain @tree", "/test")

		expect(listFiles).toHaveBeenCalledWith("/test", true, 200)
		expect(result.text).toContain("Workspace file tree (see below for listing)")
		expect(result.text).toContain("<workspace_tree>")
		expect(result.text).toContain("src/index.ts")
		expect(result.text).toContain("README.md")
	})

	it("should note when the listing hit the limit", async () => {
		const { listFiles } = await import("../../../services/glob/list-files")
		vi.mocked(listFiles).mockResolvedValue([["/test/a.ts"], true])

		const result = await parseMentions("Explain @tree", "/test")

		expect(result.text).toContain("File list truncated.")
	})

	it("should report tree listing errors", async () => {
		const { listFiles } = await import("../../../services/glob/list-files")
		vi.mocked(listFiles).mockRejectedValue(new Error("fs error"))

		const result = await parseMentions("Explain @tree", "/test")

		expect(result.text).toContain("Error fetching workspace tree: fs error")
	})
})

describe("parseMentions - @commits", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should append the recent commit log", async () => {
		const { searchCommits } = await import("../../../utils/git")
		vi.mocked(searchCommits).mockResolvedValue([
			{
				hash: "abc123def456",
				shortHash: "abc123d",
				subject: "fix: login bug",
				author: "Alice",
				date: "2026-08-01",
			},
			{
				hash: "789fed321cba",
				shortHash: "789fed3",
				subject: "feat: add dashboard",
				author: "Bob",
				date: "2026-07-30",
			},
		])

		const result = await parseMentions("Summarize @commits", "/test")

		expect(searchCommits).toHaveBeenCalledWith("", "/test")
		expect(result.text).toContain("Recent commits (see below for log)")
		expect(result.text).toContain("abc123d 2026-08-01 Alice: fix: login bug")
		expect(result.text).toContain("789fed3 2026-07-30 Bob: feat: add dashboard")
	})

	it("should report when there are no commits", async () => {
		const { searchCommits } = await import("../../../utils/git")
		vi.mocked(searchCommits).mockResolvedValue([])

		const result = await parseMentions("Summarize @commits", "/test")

		expect(result.text).toContain("No commits found.")
	})

	it("should report commit log errors", async () => {
		const { searchCommits } = await import("../../../utils/git")
		vi.mocked(searchCommits).mockRejectedValue(new Error("git broke"))

		const result = await parseMentions("Summarize @commits", "/test")

		expect(result.text).toContain("Error fetching commits: git broke")
	})
})
