/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from "inversify";
import { FrontendApplicationContribution, FrontendApplication, ApplicationShell } from "@theia/core/lib/browser";
import { FILE_NAVIGATOR_ID } from './navigator-widget';
import { WidgetManager } from '@theia/core/lib/browser/widget-manager';
import { Command, CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/common/keybinding';
import { KeyCode, Key, Modifier } from '@theia/core/lib/common/keys';
import { Widget } from '@phosphor/widgets';

export namespace FileNavigatorCommands {
    export const OPEN: Command = {
        id: 'fileNavigator:open',
        label: 'Open Files View'
    };
}

@injectable()
export class FileNavigatorContribution implements CommandContribution, KeybindingContribution, FrontendApplicationContribution {

    id = 'navigator';

    constructor(
        @inject(ApplicationShell) protected readonly shell: ApplicationShell,
        @inject(WidgetManager) protected readonly widgetManager: WidgetManager
    ) { }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        this.openFileNavigatorView(false);
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(FileNavigatorCommands.OPEN, {
            execute: () => this.openFileNavigatorView(true)
        });
    }

    protected async openFileNavigatorView(activate: boolean): Promise<Widget> {
        const fileNavigator = await this.widgetManager.getOrCreateWidget(FILE_NAVIGATOR_ID);
        if (!fileNavigator.isAttached) {
            this.shell.addToLeftArea(fileNavigator, { rank: 100 });
        }
        if (activate) {
            this.shell.activateWidget(fileNavigator.id);
        }
        return fileNavigator;
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeybinding({
            commandId: FileNavigatorCommands.OPEN.id,
            keyCode: KeyCode.createKeyCode({
                first: Key.KEY_E, modifiers: [Modifier.M2, Modifier.M1]
            })
        });
    }
}
