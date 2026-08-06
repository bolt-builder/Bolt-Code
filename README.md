<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=bolt-builder.bolt-code"><img src="https://img.shields.io/badge/VS_Code_Marketplace-007ACC?style=flat&logo=visualstudiocode&logoColor=white" alt="VS Code Marketplace"></a>
  <a href="https://github.com/bolt-builder/Bolt-Code/issues"><img src="https://img.shields.io/badge/GitHub-Issues-181717?style=flat&logo=github&logoColor=white" alt="GitHub Issues"></a>
</p>

# Bolt Code

> Your AI-Powered Dev Team, Right in Your Editor

## About this fork

Bolt Code is a fork of [Zoo Code](https://github.com/Zoo-Code-Org/Zoo-Code), which itself continues the work of [Roo Code](https://github.com/RooCodeInc/Roo-Code). Full credit and thanks to the Roo Code and Zoo Code teams and their communities for everything they built. Bolt Code is maintained by [bolt-builder](https://github.com/bolt-builder) under the same Apache-2.0 license.

Bugs and feature requests for this fork belong in [our issue tracker](https://github.com/bolt-builder/Bolt-Code/issues), not upstream's.

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

## Resources

- **[GitHub Issues](https://github.com/bolt-builder/Bolt-Code/issues):** Report
  bugs and track development for this fork.
- **[GitHub Discussions](https://github.com/bolt-builder/Bolt-Code/discussions):**
  Ask questions and share feature ideas.
- **[Upstream documentation](https://docs.zoocode.dev):** Bolt Code tracks Zoo
  Code closely, so the upstream docs apply to most features.

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

[Apache 2.0 © 2026 bolt-builder](./LICENSE)

---

**Enjoy Bolt Code!** Whether you keep it on a short leash or let it roam
autonomously, we can't wait to see what you build. If you have questions or
feature ideas, open an
[issue](https://github.com/bolt-builder/Bolt-Code/issues) or start a
[discussion](https://github.com/bolt-builder/Bolt-Code/discussions). Happy coding!
