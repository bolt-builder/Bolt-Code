// npx vitest run src/__tests__/index.test.ts

import { generatePackageJson } from "../index.js"

describe("generatePackageJson", () => {
	it("should be a test", () => {
		const generatedPackageJson = generatePackageJson({
			packageJson: {
				name: "roo-cline",
				displayName: "%extension.displayName%",
				description: "%extension.description%",
				publisher: "RooVeterinaryInc",
				version: "3.17.2",
				icon: "assets/icons/icon.png",
				contributes: {
					viewsContainers: {
						activitybar: [
							{
								id: "roo-cline-ActivityBar",
								title: "%views.activitybar.title%",
								icon: "assets/icons/icon.svg",
							},
						],
					},
					views: {
						"roo-cline-ActivityBar": [
							{
								type: "webview",
								id: "roo-cline.SidebarProvider",
								name: "",
							},
						],
					},
					commands: [
						{
							command: "roo-cline.plusButtonClicked",
							title: "%command.newTask.title%",
							icon: "$(edit)",
						},
						{
							command: "roo-cline.openInNewTab",
							title: "%command.openInNewTab.title%",
							category: "%configuration.title%",
						},
					],
					menus: {
						"editor/context": [
							{
								submenu: "roo-cline.contextMenu",
								group: "navigation",
							},
						],
						"roo-cline.contextMenu": [
							{
								command: "roo-cline.addToContext",
								group: "1_actions@1",
							},
						],
						"editor/title": [
							{
								command: "roo-cline.plusButtonClicked",
								group: "navigation@1",
								when: "activeWebviewPanelId == roo-cline.TabPanelProvider",
							},
							{
								command: "roo-cline.settingsButtonClicked",
								group: "navigation@6",
								when: "activeWebviewPanelId == roo-cline.TabPanelProvider",
							},
							{
								command: "roo-cline.accountButtonClicked",
								group: "navigation@6",
								when: "activeWebviewPanelId == roo-cline.TabPanelProvider",
							},
						],
					},
					submenus: [
						{
							id: "roo-cline.contextMenu",
							label: "%views.contextMenu.label%",
						},
						{
							id: "roo-cline.terminalMenu",
							label: "%views.terminalMenu.label%",
						},
					],
					configuration: {
						title: "%configuration.title%",
						properties: {
							"roo-cline.allowedCommands": {
								type: "array",
								items: {
									type: "string",
								},
								default: ["npm test", "npm install", "tsc", "git log", "git diff", "git show"],
								description: "%commands.allowedCommands.description%",
							},
							"roo-cline.customStoragePath": {
								type: "string",
								default: "",
								description: "%settings.customStoragePath.description%",
							},
						},
					},
				},
				scripts: {
					lint: "eslint **/*.ts",
				},
			},
			overrideJson: {
				name: "bolt-code-nightly",
				displayName: "Bolt Code Nightly",
				publisher: "bolt-builder",
				version: "0.0.1",
				icon: "assets/icons/icon-nightly.png",
				scripts: {},
			},
			substitution: ["roo-cline", "bolt-code-nightly"],
		})

		expect(generatedPackageJson).toStrictEqual({
			name: "bolt-code-nightly",
			displayName: "Bolt Code Nightly",
			description: "%extension.description%",
			publisher: "bolt-builder",
			version: "0.0.1",
			icon: "assets/icons/icon-nightly.png",
			contributes: {
				viewsContainers: {
					activitybar: [
						{
							id: "bolt-code-nightly-ActivityBar",
							title: "%views.activitybar.title%",
							icon: "assets/icons/icon.svg",
						},
					],
				},
				views: {
					"bolt-code-nightly-ActivityBar": [
						{
							type: "webview",
							id: "bolt-code-nightly.SidebarProvider",
							name: "",
						},
					],
				},
				commands: [
					{
						command: "bolt-code-nightly.plusButtonClicked",
						title: "%command.newTask.title%",
						icon: "$(edit)",
					},
					{
						command: "bolt-code-nightly.openInNewTab",
						title: "%command.openInNewTab.title%",
						category: "%configuration.title%",
					},
				],
				menus: {
					"editor/context": [
						{
							submenu: "bolt-code-nightly.contextMenu",
							group: "navigation",
						},
					],
					"bolt-code-nightly.contextMenu": [
						{
							command: "bolt-code-nightly.addToContext",
							group: "1_actions@1",
						},
					],
					"editor/title": [
						{
							command: "bolt-code-nightly.plusButtonClicked",
							group: "navigation@1",
							when: "activeWebviewPanelId == bolt-code-nightly.TabPanelProvider",
						},
						{
							command: "bolt-code-nightly.settingsButtonClicked",
							group: "navigation@6",
							when: "activeWebviewPanelId == bolt-code-nightly.TabPanelProvider",
						},
						{
							command: "bolt-code-nightly.accountButtonClicked",
							group: "navigation@6",
							when: "activeWebviewPanelId == bolt-code-nightly.TabPanelProvider",
						},
					],
				},
				submenus: [
					{
						id: "bolt-code-nightly.contextMenu",
						label: "%views.contextMenu.label%",
					},
					{
						id: "bolt-code-nightly.terminalMenu",
						label: "%views.terminalMenu.label%",
					},
				],
				configuration: {
					title: "%configuration.title%",
					properties: {
						"bolt-code-nightly.allowedCommands": {
							type: "array",
							items: {
								type: "string",
							},
							default: ["npm test", "npm install", "tsc", "git log", "git diff", "git show"],
							description: "%commands.allowedCommands.description%",
						},
						"bolt-code-nightly.customStoragePath": {
							type: "string",
							default: "",
							description: "%settings.customStoragePath.description%",
						},
					},
				},
			},
			scripts: {},
		})
	})
})
