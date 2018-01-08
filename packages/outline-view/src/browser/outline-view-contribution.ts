/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from "inversify";
import { FrontendApplicationContribution, FrontendApplication, CommonMenus, ApplicationShell } from '@theia/core/lib/browser';
import { WidgetManager } from '@theia/core/lib/browser/widget-manager';
import { CommandContribution, CommandRegistry, Command } from '@theia/core/lib/common/command';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/common/keybinding';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { KeyCode, Key, Modifier } from '@theia/core/lib/common/keys';

export const OUTLINE_WIDGET_FACTORY_ID = 'outline-view';

export namespace OutlineViewCommands {
    export const OPEN: Command = {
        id: 'outlineView:open',
        label: 'Open Outline View'
    };
}

@injectable()
export class OutlineViewContribution implements CommandContribution, KeybindingContribution, MenuContribution, FrontendApplicationContribution {

    constructor(
        @inject(ApplicationShell) protected readonly shell: ApplicationShell,
        @inject(WidgetManager) protected readonly widgetManager: WidgetManager
    ) { }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        this.openOutlineView();
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(OutlineViewCommands.OPEN, {
            execute: () => this.openOutlineView()
        });
    }

    protected async openOutlineView(): Promise<void> {
        const outlineView = await this.widgetManager.getOrCreateWidget(OUTLINE_WIDGET_FACTORY_ID);
        if (!outlineView.isAttached) {
            this.shell.addToRightArea(outlineView, { rank: 100 });
        }
        this.shell.activateWidget(outlineView.id);
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeybinding({
            commandId: OutlineViewCommands.OPEN.id,
            keyCode: KeyCode.createKeyCode({
                first: Key.KEY_U, modifiers: [Modifier.M2, Modifier.M1]
            })
        });
    }

    registerMenus(registry: MenuModelRegistry) {
        registry.registerMenuAction(CommonMenus.VIEW, {
            commandId: OutlineViewCommands.OPEN.id,
            label: 'Outline'
        });
    }

}
