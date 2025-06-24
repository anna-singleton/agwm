import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { registerCreateNewBranch, registerDeleteBranch, registerOpenProject } from './actions';

export class AGWM implements vscode.TreeDataProvider<AGWMItem> {
private _onDidChangeTreeData = new vscode.EventEmitter<AGWMItem | undefined>();
public readonly onDidChangeTreeData: vscode.Event<AGWMItem | undefined> = this._onDidChangeTreeData.event;

  constructor(
	private readonly projectHomes: Array<string>,
	private readonly projects: Array<string>,
  ) {}

  refresh(): void {
	this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: AGWMItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AGWMItem): Thenable<AGWMItem[]> {
	console.log("resolving: ", element?.label);
    if (element) {
		if (element.itemType === AGWMItemType.Project)
		{
			return Promise.resolve([]);
		}
		else
		{
			var realpath = fs.realpathSync(element.fullPath);
			var dir:fs.Dir = fs.opendirSync(realpath);
			var entries = [];
			var next = dir.readSync();
			while (next !== null)
			{
				if (!next.isDirectory())
				{
					next = dir.readSync();
					continue;
				}

				if (next.name === ".bare")
				{
					next = dir.readSync();
					continue;
				}

				var dir_path = next.parentPath + "/" + next.name;

				var is_project_home = false;
				var inner_dir = fs.opendirSync(dir_path);
				var next_inner = inner_dir.readSync();

				while (next_inner !== null)
				{
					if (next_inner.name === ".bare")
					{
						is_project_home = true;
						break;
					}
					next_inner = inner_dir.readSync();
				}

				var item_type;
				if (is_project_home)
				{
					item_type = AGWMItemType.ImplicitHome;
				}
				else
				{
					item_type = AGWMItemType.Project;
				}

				entries.push(new AGWMItem(next.name, dir_path, item_type));
				next = dir.readSync();
			}

			return Promise.resolve(entries);
		}
    } else {
		var items:Array<AGWMItem> = [];
		this.projects.forEach(elem => {
			items.push(new AGWMItem(elem, fs.realpathSync(elem), AGWMItemType.Project));
		});
		this.projectHomes.forEach(elem => {
			items.push(new AGWMItem(elem, elem, AGWMItemType.ExplicitHome));
		});
		return Promise.resolve(items);
    }
  }
}

export enum AGWMItemType {
	Project,
	ImplicitHome,
	ExplicitHome
}

export class AGWMItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly fullPath: string,
		public itemType: AGWMItemType,
	) {
		var collapsibleState;
		if (itemType === AGWMItemType.Project)
		{
			collapsibleState = vscode.TreeItemCollapsibleState.None;
		}
		else
		{
			collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		}

		super(label, collapsibleState);

		if (itemType === AGWMItemType.ImplicitHome)
		{
			this.contextValue = "projectHome";
		}
		else
		{
			this.contextValue = "project";
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration();
	const projectHomes = config.get<Array<string>>('agwm.projectHomes');
	const projects = config.get<Array<string>>('agwm.projects');
	console.log(projectHomes);
	console.log(projects);
	if (projectHomes === undefined || projects === undefined)
	{
		return;
	}
	const agwmProvider = new AGWM(projectHomes, projects);
	vscode.window.registerTreeDataProvider("agwm-projects", agwmProvider);
	registerCreateNewBranch(context, agwmProvider);
	registerDeleteBranch(context, agwmProvider);
	registerOpenProject(context);
}