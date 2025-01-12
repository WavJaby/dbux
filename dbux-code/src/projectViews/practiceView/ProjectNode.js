import { ProgressLocation, Uri, workspace, window } from 'vscode';
import { pathGetBasename } from '@dbux/common/src/util/pathUtil';
import sleep from '@dbux/common/src/util/sleep';
import Project from '@dbux/projects/src/projectLib/Project';
import RunStatus, { isStatusRunningType } from '@dbux/projects/src/projectLib/RunStatus';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import BugNode from './BugNode';
import { runTaskWithProgressBar } from '../../codeUtil/runTaskWithProgressBar';

export default class ProjectNode extends BaseTreeViewNode {
  static makeLabel(project) {
    return project.name;
  }

  /**
   * @type {Project}
   */
  get project() {
    return this.entry;
  }

  get manager() {
    return this.treeNodeProvider.controller.manager;
  }

  get description() {
    return this.project._installed ? 'installed' : '';
  }

  get contextValue() {
    return `dbuxProjectView.projectNode.${RunStatus.getName(this.status)}`;
  }

  makeIconPath() {
    switch (this.project.runStatus) {
      case RunStatus.None:
        return '';
      case RunStatus.Busy:
        return 'hourglass.svg';
      case RunStatus.RunningInBackground:
        return 'play.svg';
      case RunStatus.Done:
        return 'dependency.svg';
      default:
        return '';
    }
  }

  buildChildren() {
    // getOrLoadBugs returns a `BugList`, use Array.from to convert to array
    const bugs = Array.from(this.project.getOrLoadBugs());
    return bugs.map(this.buildBugNode.bind(this));
  }

  buildBugNode(bug) {
    return this.treeNodeProvider.buildNode(BugNode, bug);
  }

  async deleteProject() {
    if (isStatusRunningType(this.status)) {
      window.showInformationMessage('[dbux] project is running now...');
    }
    else {
      const confirmMessage = `Do you really want to delete project: ${this.project.name}`;
      const result = await window.showInformationMessage(confirmMessage, { modal: true }, 'Ok');
      if (result === 'Ok') {
        await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
          progress.report({ message: 'deleting project folder...' });
          // wait for progress bar to show
          await sleep(100);
          await this.project.deleteProjectFolder();
          this.treeNodeProvider.refresh();
          progress.report({ message: 'Done.' });
        }, {
          cancellable: false,
          location: ProgressLocation.Notification,
          title: `[dbux] ${this.project.name}`
        });
      }
    }
  }

  addToWorkspace() {
    const uri = Uri.file(this.project.projectPath);
    const i = workspace.workspaceFolders?.length || 0;
    workspace.updateWorkspaceFolders(i, null, {
      name: pathGetBasename(this.project.projectPath),
      uri
    });
  }
}