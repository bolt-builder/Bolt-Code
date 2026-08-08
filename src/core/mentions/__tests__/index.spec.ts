// npx vitest core/mentions/__tests__/index.spec.ts

import * as vscode from "vscode"

import { parseMentions } from "../index"

// Mock vscode
vi.mock("vscode", () => ({
	window: {
		showErrorMessage: vi.fn(),
	},
}))

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
