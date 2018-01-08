/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { Container, interfaces } from 'inversify';
import { ITree, ITreeModel, TreeProps, defaultTreeProps } from "@theia/core/lib/browser";
import { createFileTreeContainer, FileTree, FileTreeModel, FileTreeWidget, FileTreeServices, DirNode } from '@theia/filesystem/lib/browser';
import { FileNavigatorTree } from "./navigator-tree";
import { FileNavigatorModel, FileNavigatorServices } from "./navigator-model";
import { FileNavigatorWidget } from "./navigator-widget";
import { NAVIGATOR_CONTEXT_MENU } from "./navigator-menu";
import { SelectionService } from '@theia/core/lib/common';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import URI from '@theia/core/lib/common/uri';

export const FILE_NAVIGATOR_PROPS = <TreeProps>{
    ...defaultTreeProps,
    contextMenuPath: NAVIGATOR_CONTEXT_MENU
};

export function createFileNavigatorContainer(parent: interfaces.Container): Container {
    const child = createFileTreeContainer(parent);

    child.unbind(FileTree);
    child.bind(FileNavigatorTree).toSelf();
    child.rebind(ITree).toDynamicValue(ctx => ctx.container.get(FileNavigatorTree));

    child.unbind(FileTreeServices);
    child.bind(FileNavigatorServices).toSelf();

    child.unbind(FileTreeModel);
    child.bind(FileNavigatorModel).toSelf();
    child.rebind(ITreeModel).toDynamicValue(ctx => ctx.container.get(FileNavigatorModel));

    child.unbind(FileTreeWidget);
    child.bind(FileNavigatorWidget).toSelf();

    child.rebind(TreeProps).toConstantValue(FILE_NAVIGATOR_PROPS);

    return child;
}

export function createFileNavigatorWidget(parent: interfaces.Container): FileNavigatorWidget {
    const fileNavigator = createFileNavigatorContainer(parent).get(FileNavigatorWidget);

    const selectionService = parent.get(SelectionService);
    fileNavigator.model.onSelectionChanged(selection =>
        selectionService.selection = selection
    );

    const workspaceService = parent.get(WorkspaceService);
    const labelProvider = parent.get(LabelProvider);
    workspaceService.root.then(async resolvedRoot => {
        if (resolvedRoot) {
            const uri = new URI(resolvedRoot.uri);
            const label = labelProvider.getName(uri);
            const icon = await labelProvider.getIcon(resolvedRoot);
            fileNavigator.model.root = DirNode.createRoot(resolvedRoot, label, icon);
        } else {
            fileNavigator.update();
        }
    });

    return fileNavigator;
}
