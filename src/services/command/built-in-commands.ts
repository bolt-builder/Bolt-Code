import { Command } from "./commands"

interface BuiltInCommandDefinition {
	name: string
	description: string
	argumentHint?: string
	content: string
}

const BUILT_IN_COMMANDS: Record<string, BuiltInCommandDefinition> = {
	init: {
		name: "init",
		description: "Analyze codebase and create concise AGENTS.md files for AI assistants",
		content: `<task>
Please analyze this codebase and create an AGENTS.md file containing:
1. Build/lint/test commands - especially for running a single test
2. Code style guidelines including imports, formatting, types, naming conventions, error handling, etc.
</task>

<initialization>
  <purpose>
    Create (or update) a concise AGENTS.md file that enables immediate productivity for AI assistants.
    Focus ONLY on project-specific, non-obvious information that you had to discover by reading files.
    
    CRITICAL: Only include information that is:
    - Non-obvious (couldn't be guessed from standard practices)
    - Project-specific (not generic to the framework/language)
    - Discovered by reading files (config files, code patterns, custom utilities)
    - Essential for avoiding mistakes or following project conventions
    
    Usage notes:
    - The file you create will be given to agentic coding agents (such as yourself) that operate in this repository
    - Keep the main AGENTS.md concise - aim for about 20 lines, but use more if the project complexity requires it
    - If there's already an AGENTS.md, improve it
    - If there are Claude Code rules (in CLAUDE.md), Cursor rules (in .cursor/rules/ or .cursorrules), or Copilot rules (in .github/copilot-instructions.md), make sure to include them
    - Be sure to prefix the file with: "# AGENTS.md\\n\\nThis file provides guidance to agents when working with code in this repository."
  </purpose>
  
  <todo_list_creation>
    If the update_todo_list tool is available, create a todo list with these focused analysis steps:
    
    1. Check for existing AGENTS.md files
       CRITICAL - Check these EXACT paths IN THE PROJECT ROOT:
       - AGENTS.md (in project root directory)
       - .roo/rules-code/AGENTS.md (relative to project root)
       - .roo/rules-debug/AGENTS.md (relative to project root)
       - .roo/rules-ask/AGENTS.md (relative to project root)
       - .roo/rules-architect/AGENTS.md (relative to project root)
       
       IMPORTANT: All paths are relative to the project/workspace root, NOT system root!
       
       If ANY of these exist:
       - Read them thoroughly
       - CRITICALLY EVALUATE: Remove ALL obvious information
       - DELETE entries that are standard practice or framework defaults
       - REMOVE anything that could be guessed without reading files
       - Only KEEP truly non-obvious, project-specific discoveries
       - Then add any new non-obvious patterns you discover
       
       Also check for other AI assistant rules:
       - .cursorrules, CLAUDE.md, .roorules
       - .cursor/rules/, .github/copilot-instructions.md
    
    2. Identify stack
       - Language, framework, build tools
       - Package manager and dependencies
    
    3. Extract commands
       - Build, test, lint, run
       - Critical directory-specific commands
    
    4. Map core architecture
       - Main components and flow
       - Key entry points
    
    5. Document critical patterns
       - Project-specific utilities (that you discovered by reading code)
       - Non-standard approaches (that differ from typical patterns)
       - Custom conventions (that aren't obvious from file structure)
    
    6. Extract code style
       - From config files only
       - Key conventions
    
    7. Testing specifics
       - Framework and run commands
       - Directory requirements
    
    8. Compile/Update AGENTS.md files
       - If files exist: AGGRESSIVELY clean them up
         * DELETE all obvious information (even if it was there before)
         * REMOVE standard practices, framework defaults, common patterns
         * STRIP OUT anything derivable from file structure or names
         * ONLY KEEP truly non-obvious discoveries
         * Then add newly discovered non-obvious patterns
         * Result should be SHORTER and MORE FOCUSED than before
       - If creating new: Follow the non-obvious-only principle
       - Create mode-specific files in .roo/rules-*/ directories (IN PROJECT ROOT)
       
    Note: If update_todo_list is not available, proceed with the analysis workflow directly without creating a todo list.
  </todo_list_creation>
</initialization>

<analysis_workflow>
  Follow the comprehensive analysis workflow to:
  
  1. **Discovery Phase**:
     CRITICAL - First check for existing AGENTS.md files at these EXACT locations IN PROJECT ROOT:
     - AGENTS.md (in project/workspace root)
     - .roo/rules-code/AGENTS.md (relative to project root)
     - .roo/rules-debug/AGENTS.md (relative to project root)
     - .roo/rules-ask/AGENTS.md (relative to project root)
     - .roo/rules-architect/AGENTS.md (relative to project root)
     
     IMPORTANT: The .roo folder should be created in the PROJECT ROOT, not system root!
     
     If found, perform CRITICAL analysis:
     - What information is OBVIOUS and must be DELETED?
     - What violates the non-obvious-only principle?
     - What would an experienced developer already know?
     - DELETE first, then consider what to add
     - The file should get SHORTER, not longer
     
     Also find other AI assistant rules and documentation
     
  2. **Project Identification**: Identify language, stack, and build system
  3. **Command Extraction**: Extract and verify essential commands
  4. **Architecture Mapping**: Create visual flow diagrams of core processes
  5. **Component Analysis**: Document key components and their interactions
  6. **Pattern Analysis**: Identify project-specific patterns and conventions
  7. **Code Style Extraction**: Extract formatting and naming conventions
  8. **Security & Performance**: Document critical patterns if relevant
  9. **Testing Discovery**: Understand testing setup and practices
  10. **Example Extraction**: Find real examples from the codebase
</analysis_workflow>

<output_structure>
  <main_file>
    Create or deeply improve AGENTS.md with ONLY non-obvious information:
    
    If AGENTS.md exists:
    - FIRST: Delete ALL obvious information
    - REMOVE: Standard commands, framework defaults, common patterns
    - STRIP: Anything that doesn't require file reading to know
    - EVALUATE: Each line - would an experienced dev be surprised?
    - If not surprised, DELETE IT
    - THEN: Add only truly non-obvious new discoveries
    - Goal: File should be SHORTER and MORE VALUABLE
    
    Content should include:
    - Header: "# AGENTS.md\\n\\nThis file provides guidance to agents when working with code in this repository."
    - Build/lint/test commands - ONLY if they differ from standard package.json scripts
    - Code style - ONLY project-specific rules not covered by linter configs
    - Custom utilities or patterns discovered by reading the code
    - Non-standard directory structures or file organizations
    - Project-specific conventions that violate typical practices
    - Critical gotchas that would cause errors if not followed
    
    EXCLUDE obvious information like:
    - Standard npm/yarn commands visible in package.json
    - Framework defaults (e.g., "React uses JSX")
    - Common patterns (e.g., "tests go in __tests__ folders")
    - Information derivable from file extensions or directory names
    
    Keep it concise (aim for ~20 lines, but expand as needed for complex projects).
    Include existing AI assistant rules from CLAUDE.md, Cursor rules (.cursor/rules/ or .cursorrules), or Copilot rules (.github/copilot-instructions.md).
  </main_file>
  
  <mode_specific_files>
    Create or deeply improve mode-specific AGENTS.md files IN THE PROJECT ROOT.
    
    CRITICAL: For each of these paths (RELATIVE TO PROJECT ROOT), check if the file exists FIRST:
    - .roo/rules-code/AGENTS.md (create .roo in project root, not system root!)
    - .roo/rules-debug/AGENTS.md (relative to project root)
    - .roo/rules-ask/AGENTS.md (relative to project root)
    - .roo/rules-architect/AGENTS.md (relative to project root)
    
    IMPORTANT: The .roo directory must be created in the current project/workspace root directory,
    NOT at the system root (/) or home directory. All paths are relative to where the project is located.
    
    If files exist:
    - AGGRESSIVELY DELETE obvious information
    - Remove EVERYTHING that's standard practice
    - Strip out framework defaults and common patterns
    - Each remaining line must be surprising/non-obvious
    - Only then add new non-obvious discoveries
    - Files should become SHORTER, not longer
    
    Example structure (ALL IN PROJECT ROOT):
    \`\`\`
    project-root/
    ├── AGENTS.md                    # General project guidance
    ├── .roo/                        # IN PROJECT ROOT, NOT SYSTEM ROOT!
    │   ├── rules-code/
    │   │   └── AGENTS.md           # Code mode specific instructions
    │   ├── rules-debug/
    │   │   └── AGENTS.md           # Debug mode specific instructions
    │   ├── rules-ask/
    │   │   └── AGENTS.md           # Ask mode specific instructions
    │   └── rules-architect/
    │       └── AGENTS.md           # Architect mode specific instructions
    ├── src/
    ├── package.json
    └── ... other project files
    \`\`\`
    
    .roo/rules-code/AGENTS.md - ONLY non-obvious coding rules discovered by reading files:
    - Custom utilities that replace standard approaches
    - Non-standard patterns unique to this project
    - Hidden dependencies or coupling between components
    - Required import orders or naming conventions not enforced by linters
    
    Example of non-obvious rules worth documenting:
    \`\`\`
    # Project Coding Rules (Non-Obvious Only)
    - Always use safeWriteJson() from src/utils/ instead of JSON.stringify for file writes (prevents corruption)
    - API retry mechanism in src/api/providers/utils/ is mandatory (not optional as it appears)
    - Database queries MUST use the query builder pattern (raw SQL will fail)
    - Provider interface in packages/types/src/ has undocumented required methods
    - Test files must be in same directory as source for vitest to work (not in separate test folder)
    \`\`\`
    
    .roo/rules-debug/AGENTS.md - ONLY non-obvious debugging discoveries:
    - Hidden log locations not mentioned in docs
    - Non-standard debugging tools or flags
    - Gotchas that cause silent failures
    - Required environment variables for debugging
    
    Example of non-obvious debug rules worth documenting:
    \`\`\`
    # Project Debug Rules (Non-Obvious Only)
    - Webview dev tools accessed via Command Palette > "Developer: Open Webview Developer Tools" (not F12)
    - IPC messages fail silently if not wrapped in try/catch in packages/ipc/src/
    - Production builds require NODE_ENV=production or certain features break without error
    - Database migrations must run from the correct package directory, not root
    - Extension logs only visible in "Extension Host" output channel, not Debug Console
    \`\`\`
    
    .roo/rules-ask/AGENTS.md - ONLY non-obvious documentation context:
    - Hidden or misnamed documentation
    - Counterintuitive code organization
    - Misleading folder names or structures
    - Important context not evident from file structure
    
    Example of non-obvious documentation rules worth documenting:
    \`\`\`
    # Project Documentation Rules (Non-Obvious Only)
    - "src/" contains VSCode extension code, not source for web apps (counterintuitive)
    - Provider examples in src/api/providers/ are the canonical reference (docs are outdated)
    - UI runs in VSCode webview with restrictions (no localStorage, limited APIs)
    - Package.json scripts must be run from specific directories, not root
    - Locales in root are for extension, webview-ui/src/i18n for UI (two separate systems)
    \`\`\`
    
    .roo/rules-architect/AGENTS.md - ONLY non-obvious architectural constraints:
    - Hidden coupling between components
    - Undocumented architectural decisions
    - Non-standard patterns that must be followed
    - Performance bottlenecks discovered through investigation
    
    Example of non-obvious architecture rules worth documenting:
    \`\`\`
    # Project Architecture Rules (Non-Obvious Only)
    - Providers MUST be stateless - hidden caching layer assumes this
    - Webview and extension communicate through specific IPC channel patterns only
    - Database migrations cannot be rolled back - forward-only by design
    - React hooks required because external state libraries break webview isolation
    - Monorepo packages have circular dependency on types package (intentional)
    \`\`\`
  </mode_specific_files>
</output_structure>

<quality_criteria>
  - ONLY include non-obvious information discovered by reading files
  - Exclude anything that could be guessed from standard practices
  - Focus on gotchas, hidden requirements, and counterintuitive patterns
  - Include specific file paths when referencing custom utilities
  - Be extremely concise - if it's obvious, don't include it
  - Every line should prevent a potential mistake or confusion
  - Test: Would an experienced developer be surprised by this information?
  - If updating existing files: DELETE obvious info first, files should get SHORTER
  - Measure success: Is the file more concise and valuable than before?
</quality_criteria>

Remember: The goal is to create documentation that enables AI assistants to be immediately productive in this codebase, focusing on project-specific knowledge that isn't obvious from the code structure alone.`,
	},
	review: {
		name: "review",
		description: "Review code changes for correctness, clarity, and risk",
		argumentHint: "branch, commit range, or file paths (defaults to uncommitted changes)",
		content: `<task>
Perform a focused code review. If the user provided arguments after /review, treat them as the review target (a branch, commit range, PR number, or specific file paths). Otherwise review the current uncommitted changes (staged and unstaged).
</task>

<workflow>
1. Identify the change set: use git (e.g. \`git diff\`, \`git diff --staged\`, \`git diff <range>\`, \`git log\`) to enumerate what changed. Read every changed file with enough surrounding context to judge the change, and trace callers of any modified function or type.
2. Evaluate, in priority order:
   - Correctness: logic errors, unhandled edge cases, race conditions, broken contracts with callers, off-by-one errors, error handling gaps.
   - Security: injection, unvalidated input, secrets in code, unsafe file or network access.
   - Tests: are the changes covered? Do existing tests need updating? Point at specific missing cases.
   - Clarity and conventions: naming, dead code, duplication, divergence from the project's established patterns.
3. Report findings grouped by severity (blocking, should-fix, nit). For each finding cite the file and line, explain why it matters, and propose a concrete fix. If the change looks good, say so briefly instead of inventing issues.
</workflow>

Do not modify any files during the review; only read and report. Offer to implement fixes as a follow-up.`,
	},
	commit: {
		name: "commit",
		description: "Stage, write a conventional commit message, and commit current changes",
		argumentHint: "optional instructions, e.g. scope hint or files to include",
		content: `<task>
Create a well-formed git commit for the current changes. If the user provided arguments after /commit, treat them as instructions (e.g. which files to include, a scope hint, or intent to split into multiple commits).
</task>

<workflow>
1. Inspect state: run \`git status\` and \`git diff\` (and \`git diff --staged\`) to understand exactly what changed. Run \`git log --oneline -10\` to learn the repository's commit message style.
2. Decide staging: stage the files that belong together in one logical change. Never use \`git add .\` blindly; exclude unrelated edits, generated artifacts, and anything that looks like a secret or credential. If the working tree contains multiple unrelated changes, propose splitting into separate commits.
3. Write the message following the repository's existing convention (inspect recent history; many projects use \`type(scope): summary\`). The subject line must describe WHY/WHAT at a glance, not restate the diff. Add a short body only when the change needs explanation.
4. Commit and show the result with \`git log -1 --stat\`. Do not push unless the user asked for it.
</workflow>

Never amend, rebase, or force-push existing commits unless the user explicitly asked. If there is nothing to commit, say so instead of creating an empty commit.`,
	},
	test: {
		name: "test",
		description: "Write or improve tests for the specified code",
		argumentHint: "file, function, or feature to cover (defaults to recent changes)",
		content: `<task>
Add or improve automated tests. If the user provided arguments after /test, treat them as the target (a file, function, module, or feature). Otherwise cover the most recent code changes (use git to find them).
</task>

<workflow>
1. Study the target code and its contracts: inputs, outputs, error paths, and edge cases. Trace how it is called in practice.
2. Find the project's testing conventions before writing anything: locate existing test files for neighboring code, note the framework, file naming, directory placement, assertion style, and how the project runs a single test. Match those conventions exactly; do not introduce a new framework or pattern.
3. Write focused tests at the narrowest layer that proves the behavior: happy path, boundary conditions, and error handling. Prefer real implementations over mocks where practical; mock only true external boundaries (network, clock, filesystem when needed).
4. Run the new tests and iterate until they pass. Then run the surrounding suite to make sure nothing else broke. Report what is now covered and any gaps you deliberately left.
</workflow>

Do not weaken or delete existing assertions to make tests pass. If the code under test appears to have a bug, write the test that exposes it and flag the bug instead of encoding the buggy behavior as expected.`,
	},
	fix: {
		name: "fix",
		description: "Diagnose and fix a bug or failing build/test",
		argumentHint: "error message, failing test, or bug description",
		content: `<task>
Diagnose and fix a problem. If the user provided arguments after /fix, treat them as the starting point (an error message, stack trace, failing test name, or bug description). Otherwise look for the most obvious current failure (failing tests, type errors, or lint errors).
</task>

<workflow>
1. Reproduce first: run the failing test, build, or command to see the actual error. Never fix from the description alone when a reproduction is available.
2. Trace the root cause: read the code path implicated by the error, inspect recent changes to it (\`git log -p\` on the file), and form a hypothesis. Verify the hypothesis with evidence (targeted logging, a narrower test, or reading the relevant code) before editing.
3. Implement the smallest change that fixes the root cause, not the symptom. Avoid drive-by refactoring.
4. Prove it: re-run the original reproduction and confirm it passes. Add a regression test at the lowest layer that would have caught the bug. Run the surrounding tests to check for collateral damage.
5. Summarize: state the root cause in one or two sentences, what changed, and how it was verified.
</workflow>

If you cannot reproduce the problem, report exactly what you tried and what additional information you need instead of guessing at a fix.`,
	},
	docs: {
		name: "docs",
		description: "Write or update documentation for the specified code or feature",
		argumentHint: "file, feature, or doc to update (defaults to recent changes)",
		content: `<task>
Write or update documentation. If the user provided arguments after /docs, treat them as the target (a file, module, feature, or an existing doc that is stale). Otherwise document the most recent code changes (use git to find them).
</task>

<workflow>
1. Read the code being documented until you can explain its behavior precisely, including defaults, edge cases, and error behavior. Documentation must be derived from the code as it is, not from assumptions.
2. Find where documentation lives in this project (README sections, docs/ directory, doc comments, CHANGELOG) and match the existing format, tone, and heading structure.
3. Prefer updating existing documents over creating new files. Fix anything the change made stale: examples, option tables, API signatures, and cross-references.
4. Keep it tight: lead with what the reader needs to accomplish a task, show a minimal working example where helpful, and cut filler. Accuracy beats completeness; never document behavior you have not verified in the code.
5. Verify examples: if a documented command or code snippet can be executed, run it to confirm it works.
</workflow>

Do not invent features, options, or behavior. If the code's behavior seems wrong while documenting it, flag it rather than documenting around it.`,
	},
}

/**
 * Get all built-in commands as Command objects
 */
export async function getBuiltInCommands(): Promise<Command[]> {
	return Object.values(BUILT_IN_COMMANDS).map((cmd) => ({
		name: cmd.name,
		content: cmd.content,
		source: "built-in" as const,
		filePath: `<built-in:${cmd.name}>`,
		description: cmd.description,
		argumentHint: cmd.argumentHint,
	}))
}

/**
 * Get a specific built-in command by name
 */
export async function getBuiltInCommand(name: string): Promise<Command | undefined> {
	const cmd = BUILT_IN_COMMANDS[name]
	if (!cmd) return undefined

	return {
		name: cmd.name,
		content: cmd.content,
		source: "built-in" as const,
		filePath: `<built-in:${name}>`,
		description: cmd.description,
		argumentHint: cmd.argumentHint,
	}
}

/**
 * Get names of all built-in commands
 */
export async function getBuiltInCommandNames(): Promise<string[]> {
	return Object.keys(BUILT_IN_COMMANDS)
}
