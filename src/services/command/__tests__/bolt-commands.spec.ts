import fs from "fs/promises"
import * as os from "os"
import * as path from "path"

import { getCommand, getCommands } from "../commands"

vi.mock("fs/promises")
vi.mock("../built-in-commands", () => ({
	getBuiltInCommands: vi.fn(() => Promise.resolve([])),
	getBuiltInCommand: vi.fn(() => Promise.resolve(undefined)),
	getBuiltInCommandNames: vi.fn(() => Promise.resolve([])),
}))

const mockFs = vi.mocked(fs)

const cwd = "/proj"
const projectBoltDir = path.join(cwd, ".bolt", "commands")
const projectRooDir = path.join(cwd, ".roo", "commands")
const globalBoltDir = path.join(os.homedir(), ".bolt", "commands")
const globalRooDir = path.join(os.homedir(), ".roo", "commands")

/**
 * Configure the fs mocks from a map of directory path -> { fileName: content }.
 * Directories not present in the map behave as missing (ENOENT).
 */
function mockCommandDirs(dirs: Record<string, Record<string, string>>) {
	mockFs.stat = vi.fn().mockImplementation((target: unknown) => {
		const key = String(target)
		if (dirs[key]) {
			return Promise.resolve({ isDirectory: () => true, isFile: () => false })
		}
		if (dirs[path.dirname(key)]?.[path.basename(key)] !== undefined) {
			return Promise.resolve({ isDirectory: () => false, isFile: () => true })
		}
		return Promise.reject(new Error("ENOENT"))
	})
	mockFs.readdir = vi.fn().mockImplementation((target: unknown) => {
		const entries = dirs[String(target)]
		if (!entries) {
			return Promise.reject(new Error("ENOENT"))
		}
		return Promise.resolve(
			Object.keys(entries).map((name) => ({
				name,
				isFile: () => true,
				isSymbolicLink: () => false,
				parentPath: String(target),
			})),
		)
	})
	mockFs.readFile = vi.fn().mockImplementation((target: unknown) => {
		const key = String(target)
		const content = dirs[path.dirname(key)]?.[path.basename(key)]
		if (content === undefined) {
			return Promise.reject(new Error("ENOENT"))
		}
		return Promise.resolve(content)
	})
	mockFs.lstat = vi.fn().mockImplementation(() => Promise.reject(new Error("ENOENT")))
}

describe(".bolt command directories with .roo fallback", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("getCommands", () => {
		it("prefers project .bolt commands over same-name project .roo commands", async () => {
			mockCommandDirs({
				[projectBoltDir]: { "deploy.md": "Bolt deploy" },
				[projectRooDir]: { "deploy.md": "Roo deploy", "legacy.md": "Legacy only" },
			})

			const commands = await getCommands(cwd)
			const deploy = commands.find((cmd) => cmd.name === "deploy")
			const legacy = commands.find((cmd) => cmd.name === "legacy")

			expect(deploy?.content).toBe("Bolt deploy")
			expect(deploy?.filePath).toBe(path.join(projectBoltDir, "deploy.md"))
			// Commands that only exist in the legacy directory remain available.
			expect(legacy?.content).toBe("Legacy only")
		})

		it("prefers global .bolt commands over same-name global .roo commands", async () => {
			mockCommandDirs({
				[globalBoltDir]: { "review.md": "Bolt review" },
				[globalRooDir]: { "review.md": "Roo review", "old.md": "Old global" },
			})

			const commands = await getCommands(cwd)
			const review = commands.find((cmd) => cmd.name === "review")
			const old = commands.find((cmd) => cmd.name === "old")

			expect(review?.content).toBe("Bolt review")
			expect(review?.filePath).toBe(path.join(globalBoltDir, "review.md"))
			expect(old?.content).toBe("Old global")
		})

		it("project commands from either directory override global commands", async () => {
			mockCommandDirs({
				[projectRooDir]: { "deploy.md": "Project roo deploy" },
				[globalBoltDir]: { "deploy.md": "Global bolt deploy" },
			})

			const commands = await getCommands(cwd)
			const deploy = commands.find((cmd) => cmd.name === "deploy")

			expect(deploy?.content).toBe("Project roo deploy")
			expect(deploy?.source).toBe("project")
		})
	})

	describe("getCommand", () => {
		it("loads a project command from .bolt before .roo", async () => {
			mockCommandDirs({
				[projectBoltDir]: { "setup.md": "Bolt setup" },
				[projectRooDir]: { "setup.md": "Roo setup" },
			})

			const command = await getCommand(cwd, "setup")

			expect(command?.content).toBe("Bolt setup")
			expect(command?.filePath).toBe(path.join(projectBoltDir, "setup.md"))
			expect(command?.source).toBe("project")
		})

		it("falls back to the project .roo command when .bolt has no match", async () => {
			mockCommandDirs({
				[projectRooDir]: { "setup.md": "Roo setup" },
			})

			const command = await getCommand(cwd, "setup")

			expect(command?.content).toBe("Roo setup")
			expect(command?.filePath).toBe(path.join(projectRooDir, "setup.md"))
			expect(command?.source).toBe("project")
		})

		it("falls back to a global .roo command when no project or global .bolt match exists", async () => {
			mockCommandDirs({
				[globalRooDir]: { "setup.md": "Global roo setup" },
			})

			const command = await getCommand(cwd, "setup")

			expect(command?.content).toBe("Global roo setup")
			expect(command?.source).toBe("global")
		})
	})
})
