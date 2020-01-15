/* eslint-disable class-methods-use-this */
'use strict'

import * as vscode from 'vscode';
import * as path from 'path';

export class EventNodeProvider {

    constructor(contextData) {
        this.contextData = contextData;
        this.treeData = this.parseData(contextData)
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    parseData(arrData){
        console.log('In parseData func')
        const collapsibleState = vscode.TreeItemCollapsibleState
        const children = [
            new Event('Push meow()', 'index.js', collapsibleState.None, 'dbuxExtension.showMsg', []),
            new Event('Pop meow()', 'index.js', collapsibleState.None, 'dbuxExtension.showMsg', []),
        ]
        console.log('Finished constructing children')
        const rootEvent = new Event("Push index.js", "index.js", collapsibleState.Expanded, 'dbuxExtension.showMsg', children)
        console.log('Finished construction rootEvent')
        return [rootEvent]
    }
    refresh() { 
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        console.log('Called getTreeItem.');
        return element;
    }
    getChildren(element) {
        console.log('Called getChildren');
        if (element){
            return Promise.resolve(element.children)
        }
        else {
            return Promise.resolve(this.treeData)
        }
        // if (!this.workspaceRoot) {
        //     vscode.window.showInformationMessage('No event logged.');
        //     return Promise.resolve([]);
        // }
        // if (element) {
        //     return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')));
        // }
        // else {
        //     const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
        //     if (this.pathExists(packageJsonPath)) {
        //         return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
        //     }
        //     else {
        //         vscode.window.showInformationMessage('Workspace has no package.json');
        //         return Promise.resolve([]);
        //     }
        // }
    }
    set data(arrData){
        this.data = arrData
        this.treeData = this.parseData(arrData)
        this.refresh()
    }
}

export class Event extends vscode.TreeItem {

	constructor(label, position, collapsibleState, command, children) {
        super(label, collapsibleState);
        this.lable = label;
        this.position = position;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.children = children;
        this.contextValue = 'event';
		this.iconPath = {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
		};
	}

	get tooltip() {
		return `at ${this.position}(tooltip)`;
	}

	get description() {
		return "(description)";
	}

}