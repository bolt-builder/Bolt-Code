<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=bolt-builder.bolt-code"><img src="https://img.shields.io/badge/VS_Code_Marketplace-007ACC?style=flat&logo=visualstudiocode&logoColor=white" alt="VS Code Marketplace"></a>
  <a href="https://github.com/bolt-builder/Bolt-Code/issues"><img src="https://img.shields.io/badge/GitHub-Issues-181717?style=flat&logo=github&logoColor=white" alt="GitHub Issues"></a>
</p>

# Bolt Code

> Your AI-Powered Dev Team, Right in Your Editor

## About this fork

Bolt Code is a fork of [Zoo Code](https://github.com/Zoo-Code-Org/Zoo-Code), which itself continues the work of [Roo Code](https://github.com/RooCodeInc/Roo-Code). Full credit and thanks to the Roo Code and Zoo Code teams and their communities for everything they built. Bolt Code is maintained by [bolt-builder](https://github.com/bolt-builder) under the same Apache-2.0 license.

Bugs and feature requests for this fork belong in [our issue tracker](https://github.com/bolt-builder/Bolt-Code/issues), not upstream's.

## What's New in v3.74.0

**Bolt Gateway is live!**

The gateway is a single endpoint for all providers, with one balance and per-request spending/usage breakdown.

**Setup:**

- Add credits: https://www.zoocode.dev/dashboard/credits
- Sign in from the extension.
- In the settings, select Bolt Gateway as the provider when creating profiles for different models

Usage and charges can be viewed in the [dashboard](https://www.zoocode.dev/dashboard).

Models: https://www.zoocode.dev/dashboard/models

- **More OpenAI controls** — use Fast priority mode with OpenAI Codex and choose higher reasoning effort for OpenAI-compatible models.
- **More reliable providers and models** — improved router metadata handling, Ollama model refresh, Bedrock proxy support, and Friendli reasoning controls.
- **Smoother settings and developer workflows** — settings now preserve unsaved edits, short terminal commands complete cleanly, architect plans use workspace-relative paths, and remaining user-facing Roo branding is updated to Bolt.
- **Stronger task foundations** — new task registry and semaphore-based scheduler primitives prepare Bolt Code for safer task coordination.
- **Consistent provider architecture** — provider identifiers and service-tier primitives are now centralized across the API, core, shared types, and webview.
- Security, dependency, lint, visual-regression, and end-to-end test improvements.

<details>
  <summary>🌐 Available languages</summary>

- [English](README.md)
- [Català](locales/ca/README.md)
- [Deutsch](locales/de/README.md)
- [Español](locales/es/README.md)
- [Français](locales/fr/README.md)
- [हिंदी](locales/hi/README.md)
- [Bahasa Indonesia](locales/id/README.md)
- [Italiano](locales/it/README.md)
- [日本語](locales/ja/README.md)
- [한국어](locales/ko/README.md)
- [Nederlands](locales/nl/README.md)
- [Polski](locales/pl/README.md)
- [Português (BR)](locales/pt-BR/README.md)
- [Русский](locales/ru/README.md)
- [Türkçe](locales/tr/README.md)
- [Tiếng Việt](locales/vi/README.md)
- [简体中文](locales/zh-CN/README.md)
- [繁體中文](locales/zh-TW/README.md)

</details>

---

## What Can Bolt Code Do For YOU?

- Generate Code from natural language descriptions and specs
- Adapt with Modes: Code, Architect, Ask, Debug, and Custom Modes
- Refactor & Debug existing code
- Write & Update documentation
- Answer Questions about your codebase
- Automate repetitive tasks
- Utilize MCP Servers

## Modes

Bolt Code adapts to how you work:

- Code Mode: everyday coding, edits, and file ops
- Architect Mode: plan systems, specs, and migrations
- Ask Mode: fast answers, explanations, and docs
- Debug Mode: trace issues, add logs, isolate root causes
- Custom Modes: build specialized modes for your team or workflow

Learn more: [Using Modes](https://docs.zoocode.dev/basic-usage/using-modes) •
[Custom Modes](https://docs.zoocode.dev/advanced-usage/custom-modes)

## Tutorial & Feature Videos

<div align="center">

|                                                                                                                                                                                                               |                                                                                                                                                                                                       |                                                                                                                                                                                                   |
| :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| <a href="https://www.youtube.com/watch?v=Mcq3r1EPZ-4"><img src="https://img.youtube.com/vi/Mcq3r1EPZ-4/maxresdefault.jpg" width="100%" alt="Installing the Extension"></a><br><b>Installing the Extension</b> | <a href="https://www.youtube.com/watch?v=ZBML8h5cCgo"><img src="https://img.youtube.com/vi/ZBML8h5cCgo/maxresdefault.jpg" width="100%" alt="Configuring Profiles"></a><br><b>Configuring Profiles</b> |  <a href="https://www.youtube.com/watch?v=r1bpod1VWhg"><img src="https://img.youtube.com/vi/r1bpod1VWhg/maxresdefault.jpg" width="100%" alt="Codebase Indexing"></a><br><b>Codebase Indexing</b>  |
|             <a href="https://www.youtube.com/watch?v=iiAv1eKOaxk"><img src="https://img.youtube.com/vi/iiAv1eKOaxk/maxresdefault.jpg" width="100%" alt="Custom Modes"></a><br><b>Custom Modes</b>             |          <a href="https://www.youtube.com/watch?v=Ho30nyY332E"><img src="https://img.youtube.com/vi/Ho30nyY332E/maxresdefault.jpg" width="100%" alt="Checkpoints"></a><br><b>Checkpoints</b>          | <a href="https://www.youtube.com/watch?v=HmnNSasv7T8"><img src="https://img.youtube.com/vi/HmnNSasv7T8/maxresdefault.jpg" width="100%" alt="Context Management"></a><br><b>Context Management</b> |

</div>
<p align="center">
<a href="https://docs.zoocode.dev/tutorial-videos">More quick tutorial and feature videos...</a>
</p>

## Resources

- **[Documentation](https://docs.zoocode.dev):** The official guide to
  installing, configuring, and mastering Bolt Code.
- **[YouTube Channel](https://youtube.com/@roocodeyt?feature=shared):** Watch
  tutorials and see features in action.
- **[Discord Server](https://discord.gg/VxfP4Vx3gX):** Join the community for
  real-time help and discussion.
- **[Reddit Community](https://www.reddit.com/r/ZooCode/):** Share your
  experiences and see what others are building.
- **[GitHub Issues](https://github.com/bolt-builder/Bolt-Code/issues):** Report
  bugs and track development.
- **[Feature Requests](https://github.com/bolt-builder/Bolt-Code/discussions/categories/feature-requests?discussions_q=is%3Aopen+category%3A%22Feature+Requests%22+sort%3Atop):**
  Have an idea? Share it with the developers.

---

## Local Setup & Development

1. **Clone** the repo:

```sh
git clone https://github.com/bolt-builder/Bolt-Code.git
```

2. **Install dependencies**:

```sh
pnpm install
```

3. **Run the extension**:

There are several ways to run the Bolt Code extension:

### Development Mode (F5)

For active development, use VSCode's built-in debugging:

Press `F5` (or go to **Run** → **Start Debugging**) in VSCode. This will open a
new VSCode window with the Bolt Code extension running.

- Changes to the webview will appear immediately.
- Changes to the core extension will also hot reload automatically.

### Automated VSIX Installation

To build and install the extension as a VSIX package directly into VSCode:

```sh
pnpm install:vsix [-y] [--editor=<command>]
```

This command will:

- Ask which editor command to use (code/cursor/code-insiders) - defaults to
  'code'
- Uninstall any existing version of the extension.
- Build the latest VSIX package.
- Install the newly built VSIX.
- Prompt you to restart VS Code for changes to take effect.

Options:

- `-y`: Skip all confirmation prompts and use defaults
- `--editor=<command>`: Specify the editor command (e.g., `--editor=cursor` or
  `--editor=code-insiders`)

### Manual VSIX Installation

If you prefer to install the VSIX package manually:

1. First, build the VSIX package:
    ```sh
    pnpm vsix
    ```
2. A `.vsix` file will be generated in the `bin/` directory (e.g.,
   `bin/bolt-code-<version>.vsix`).
3. Install it manually using the VSCode CLI:
    ```sh
    code --install-extension bin/bolt-code-<version>.vsix
    ```

---

We use [changesets](https://github.com/changesets/changesets) for versioning and
publishing. Check our `CHANGELOG.md` for release notes.

---

## Disclaimer

**Please note** that Bolt Code does **not** make any representations or
warranties regarding any code, models, or other tools provided or made available
in connection with Bolt Code, any associated third-party tools, or any resulting
outputs. You assume **all risks** associated with the use of any such tools or
outputs; such tools are provided on an **"AS IS"** and **"AS AVAILABLE"** basis.
Such risks may include, without limitation, intellectual property infringement,
cyber vulnerabilities or attacks, bias, inaccuracies, errors, defects, viruses,
downtime, property loss or damage, and/or personal injury. You are solely
responsible for your use of any such tools or outputs (including, without
limitation, the legality, appropriateness, and results thereof).

---

## Contributing

We love community contributions! Get started by reading our
[CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[Apache 2.0 © 2026 Bolt Code Org](./LICENSE)

---

**Enjoy Bolt Code!** Whether you keep it on a short leash or let it roam
autonomously, we can’t wait to see what you build. If you have questions or
feature ideas, drop by our [Reddit community](https://www.reddit.com/r/ZooCode/)
or [Discord](https://discord.gg/VxfP4Vx3gX), or open an
[issue](https://github.com/bolt-builder/Bolt-Code/issues). Happy coding!
