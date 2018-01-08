/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
import { injectable, inject } from "inversify";
import { GitRepositoryProvider } from './git-repository-provider';
import { FrontendApplication, FrontendApplicationContribution, ApplicationShell, CommonMenus } from '@theia/core/lib/browser';
import { WidgetManager } from '@theia/core/lib/browser/widget-manager';
import { StatusBar, StatusBarAlignment } from "@theia/core/lib/browser/status-bar/status-bar";
import { Git } from '../common';
import { GitWatcher, GitStatusChangeEvent } from '../common/git-watcher';
import { GIT_COMMANDS } from './git-command';
import { DisposableCollection } from "@theia/core";
import { Command, CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/common/keybinding';
import { KeyCode, Key, Modifier } from '@theia/core/lib/common/keys';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { Widget } from '@phosphor/widgets';

export const GIT_WIDGET_FACTORY_ID = 'git';

export namespace GitCommands {
    export const OPEN: Command = {
        id: 'git:open',
        label: 'Open Git View'
    };
}

@injectable()
export class GitFrontendContribution implements CommandContribution, KeybindingContribution, MenuContribution, FrontendApplicationContribution {

    protected toDispose = new DisposableCollection();

    constructor(
        @inject(ApplicationShell) protected readonly shell: ApplicationShell,
        @inject(WidgetManager) protected readonly widgetManager: WidgetManager,
        @inject(GitRepositoryProvider) protected readonly repositoryProvider: GitRepositoryProvider,
        @inject(Git) protected readonly git: Git,
        @inject(GitWatcher) protected readonly gitWatcher: GitWatcher,
        @inject(StatusBar) protected readonly statusBar: StatusBar
    ) { }

    onStart(app: FrontendApplication) {
        this.repositoryProvider.onDidChangeRepository(async repository => {
            if (repository) {
                this.toDispose.dispose();
                this.toDispose.push(await this.gitWatcher.watchGitChanges(repository));
                this.toDispose.push(
                    this.gitWatcher.onGitEvent((gitStatus: GitStatusChangeEvent) => {
                        if (gitStatus.status.branch) {
                            this.statusBar.setElement('git-repository-status', {
                                text: `$(code-fork) ${gitStatus.status.branch}`,
                                alignment: StatusBarAlignment.LEFT,
                                priority: 100,
                                command: GIT_COMMANDS.CHECKOUT.id
                            });
                        }
                    }));
            }
        });
        this.repositoryProvider.refresh();
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        this.openGitView(false);
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(GitCommands.OPEN, {
            execute: () => this.openGitView(true)
        });
    }

    protected async openGitView(activate: boolean): Promise<Widget> {
        const gitWidget = await this.widgetManager.getOrCreateWidget(GIT_WIDGET_FACTORY_ID);
        if (!gitWidget.isAttached) {
            this.shell.addToLeftArea(gitWidget, { rank: 200 });
        }
        if (activate) {
            this.shell.activateWidget(gitWidget.id);
        }
        return gitWidget;
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeybinding({
            commandId: GitCommands.OPEN.id,
            keyCode: KeyCode.createKeyCode({
                first: Key.KEY_S, modifiers: [Modifier.M2, Modifier.M1]
            })
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(CommonMenus.VIEW, {
            commandId: GitCommands.OPEN.id,
            label: 'Git'
        });
    }

}
