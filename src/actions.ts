import * as vscode from 'vscode';
import * as cp from 'child_process';
import { AGWM, AGWMItem } from './extension';

export function registerCreateNewBranch(context: vscode.ExtensionContext, treeDataProvider: AGWM)
{
    context.subscriptions.push(vscode.commands.registerCommand("agwm.newBranch", (item: AGWMItem) => createNewBranch(item, treeDataProvider)));
}

async function createNewBranch(item: AGWMItem, treeDataProvider: AGWM)
{
    cp.execSync("cd " + item.fullPath + " && git fetch");
    var branchname = await vscode.window.showInputBox({title: "Branch Name"});
    var sanitised_branchname = branchname;
    if (branchname?.includes('/'))
    {
        sanitised_branchname = branchname.split('/', 2)[1];
    }

    var worktree_name = await vscode.window.showInputBox({title: "Worktree Name", value: sanitised_branchname});

    cp.execSync("cd " + item.fullPath + " && git worktree add -b " + branchname + " " + worktree_name);
    treeDataProvider.refresh();
}

export function registerDeleteBranch(context: vscode.ExtensionContext, treeDataProvider: AGWM)
{
    context.subscriptions.push(vscode.commands.registerCommand("agwm.deleteBranch", (item: AGWMItem) => deleteBranch(item, treeDataProvider)));
}

async function deleteBranch(item: AGWMItem, treeDataProvider: AGWM)
{
    cp.execSync("cd " + item.fullPath + " && git worktree remove " + item.label);
    treeDataProvider.refresh();
}

export function registerOpenProject(context: vscode.ExtensionContext)
{
    context.subscriptions.push(vscode.commands.registerCommand("agwm.openInWindow", openProject));
}

async function openProject(item: AGWMItem)
{
    await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(item.fullPath), {forceNewWindow: true});
}