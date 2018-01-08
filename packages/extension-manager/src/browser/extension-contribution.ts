/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from "inversify";
import { MessageService } from "@theia/core";
import { FrontendApplication, FrontendApplicationContribution, CommonMenus, ApplicationShell } from '@theia/core/lib/browser';
import { ExtensionManager } from '../common';
import { WidgetManager } from '@theia/core/lib/browser/widget-manager';
import { CommandContribution, Command, CommandRegistry } from '@theia/core/lib/common/command';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/common/keybinding';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { KeyCode, Key, Modifier } from '@theia/core/lib/common/keys';
import { Widget } from '@phosphor/widgets';

export const EXTENSIONS_WIDGET_FACTORY_ID = 'extensions';

export namespace ExtensionCommands {
    export const OPEN: Command = {
        id: 'extensions:open',
        label: 'Open Extensions View'
    };
}

@injectable()
export class ExtensionContribution implements CommandContribution, KeybindingContribution, MenuContribution, FrontendApplicationContribution {

    constructor(
        @inject(ApplicationShell) protected readonly shell: ApplicationShell,
        @inject(WidgetManager) protected readonly widgetManager: WidgetManager,
        @inject(ExtensionManager) protected readonly extensionManager: ExtensionManager,
        @inject(MessageService) protected readonly messageService: MessageService,
    ) {
        this.extensionManager.onWillStartInstallation(({ reverting }) => {
            if (!reverting) {
                this.messageService.info('Installing extensions...');
            } else {
                this.messageService.error('Failed to install extensions. Reverting...');
            }
        });
        this.extensionManager.onDidStopInstallation(({ reverting, failed }) => {
            if (!failed) {
                const reloadMessage = !reverting ? 'Reload to complete the installation.' : 'Reload to revert the installation.';
                this.messageService.info(reloadMessage).then(() => window.location.reload());
            }
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        this.openExtensionsView(false);
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(ExtensionCommands.OPEN, {
            execute: () => this.openExtensionsView(true)
        });
    }

    protected async openExtensionsView(activate: boolean): Promise<Widget> {
        const extensionWidget = await this.widgetManager.getOrCreateWidget(EXTENSIONS_WIDGET_FACTORY_ID);
        if (!extensionWidget.isAttached) {
            this.shell.addToLeftArea(extensionWidget, { rank: 300 });
        }
        if (activate) {
            this.shell.activateWidget(extensionWidget.id);
        }
        return extensionWidget;
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeybinding({
            commandId: ExtensionCommands.OPEN.id,
            keyCode: KeyCode.createKeyCode({
                first: Key.KEY_X, modifiers: [Modifier.M2, Modifier.M1]
            })
        });
    }

    registerMenus(registry: MenuModelRegistry) {
        registry.registerMenuAction(CommonMenus.VIEW, {
            commandId: ExtensionCommands.OPEN.id,
            label: 'Extensions'
        });
    }

}
