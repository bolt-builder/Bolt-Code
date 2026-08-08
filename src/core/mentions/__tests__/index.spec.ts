// npx vitest core/mentions/__tests__/index.spec.ts

import * as vscode from "vscode"

import { parseMentions } from "../index"

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
