import { getBuiltInCommands, getBuiltInCommand, getBuiltInCommandNames } from "../built-in-commands"

describe("Built-in Commands", () => {
	describe("getBuiltInCommands", () => {
		it("should return all built-in commands", async () => {
			const commands = await getBuiltInCommands()

			expect(commands).toHaveLength(6)
			expect(commands.map((cmd) => cmd.name)).toEqual(
				expect.arrayContaining(["init", "review", "commit", "test", "fix", "docs"]),
			)

			// Verify all commands have required properties
			commands.forEach((command) => {
				expect(command.name).toBeDefined()
				expect(typeof command.name).toBe("string")
				expect(command.content).toBeDefined()
				expect(typeof command.content).toBe("string")
				expect(command.source).toBe("built-in")
				expect(command.filePath).toMatch(/^<built-in:.+>$/)
				expect(command.description).toBeDefined()
				expect(typeof command.description).toBe("string")
			})
		})

		it("should return commands with proper content", async () => {
			const commands = await getBuiltInCommands()

			const initCommand = commands.find((cmd) => cmd.name === "init")
			expect(initCommand).toBeDefined()
			expect(initCommand!.content).toContain("AGENTS.md")
			expect(initCommand!.content).toContain(".roo/rules-")
			expect(initCommand!.description).toBe(
				"Analyze codebase and create concise AGENTS.md files for AI assistants",
			)
		})
	})

	describe("getBuiltInCommand", () => {
		it("should return specific built-in command by name", async () => {
			const initCommand = await getBuiltInCommand("init")

			expect(initCommand).toBeDefined()
			expect(initCommand!.name).toBe("init")
			expect(initCommand!.source).toBe("built-in")
			expect(initCommand!.filePath).toBe("<built-in:init>")
			expect(initCommand!.content).toContain("AGENTS.md")
			expect(initCommand!.description).toBe(
				"Analyze codebase and create concise AGENTS.md files for AI assistants",
			)
		})

		it("should return undefined for non-existent command", async () => {
			const nonExistentCommand = await getBuiltInCommand("non-existent")
			expect(nonExistentCommand).toBeUndefined()
		})

		it("should handle empty string command name", async () => {
			const emptyCommand = await getBuiltInCommand("")
			expect(emptyCommand).toBeUndefined()
		})
	})

	describe("getBuiltInCommandNames", () => {
		it("should return all built-in command names", async () => {
			const names = await getBuiltInCommandNames()

			expect(names).toHaveLength(6)
			expect(names).toEqual(expect.arrayContaining(["init"]))
			// Order doesn't matter since it's based on filesystem order
			expect(names.sort()).toEqual(["commit", "docs", "fix", "init", "review", "test"])
		})

		it("should return array of strings", async () => {
			const names = await getBuiltInCommandNames()

			names.forEach((name) => {
				expect(typeof name).toBe("string")
				expect(name.length).toBeGreaterThan(0)
			})
		})
	})

	describe("Command Content Validation", () => {
		it("every non-init command should describe a task, a workflow, and argument handling", async () => {
			const commands = await getBuiltInCommands()
			const names = ["review", "commit", "test", "fix", "docs"]

			for (const name of names) {
				const command = commands.find((cmd) => cmd.name === name)
				expect(command, name).toBeDefined()
				expect(command!.content, name).toContain("<task>")
				expect(command!.content, name).toContain("<workflow>")
				// Arguments are not templated; each prompt must explain how to
				// interpret text following the slash command.
				expect(command!.content, name).toContain(`/${name}`)
				expect(command!.argumentHint, name).toBeDefined()
			}
		})

		it("review command should be read-only", async () => {
			const command = await getBuiltInCommand("review")
			expect(command!.content).toContain("Do not modify any files")
		})

		it("commit command should forbid history rewrites and pushing by default", async () => {
			const command = await getBuiltInCommand("commit")
			expect(command!.content).toContain("Do not push unless the user asked")
			expect(command!.content).toContain("Never amend, rebase, or force-push")
		})

		it("init command should have comprehensive content", async () => {
			const command = await getBuiltInCommand("init")
			const content = command!.content

			// Should contain key sections
			expect(content).toContain("Please analyze this codebase")
			expect(content).toContain("Build/lint/test commands")
			expect(content).toContain("Code style guidelines")
			expect(content).toContain("non-obvious")
			expect(content).toContain("discovered by reading files")

			// Should mention important concepts
			expect(content).toContain("AGENTS.md")
			expect(content).toContain(".roo/rules-")
			expect(content).toContain("rules-code")
			expect(content).toContain("rules-debug")
			expect(content).toContain("rules-ask")
			expect(content).toContain("rules-architect")
		})
	})
})
