import { window, Uri } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection';
import { registerCommand } from './commandUtil';
import { showInformationMessage, showWarningMessage } from '../codeUtil/codeModals';
import { translate } from '../lang';
import { emitAnnotateTraceAction } from '../userEvents';
import { getLogsDirectory } from '../resources';
import { showPathwaysView } from '../webViews/pathwaysWebView';

/** @typedef {import('../projectViews/projectViewsController').ProjectViewController} ProjectViewController */

const logger = newLogger('projectCommands');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

/**
 * @param {ProjectViewController} projectViewController 
 */
export function initProjectCommands(extensionContext, projectViewController) {
  registerCommand(extensionContext, 'dbuxProjectView.showDiff', (/* node */) => {
    return projectViewController.manager.externals.showMessage.info(`You may click 'Source Control' button to review your change.`);
  });

  registerCommand(extensionContext, 'dbuxProject.uploadLog', async (/* node */) => {
    return projectViewController.manager.uploadLog();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.addProjectToWorkspace', (node) => {
    return projectViewController.nodeAddToWorkspace(node);
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.deleteProject', (node) => {
    return node.deleteProject();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.stopProject', (/* node */) => {
    return projectViewController.manager.runner.cancel();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.activateBug', (node) => {
    return projectViewController.startPractice(node);
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.busyIcon', (/* node */) => {
    return window.showInformationMessage(translate('busyNow')); // how to triggger this
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.stopBug', (/* node */) => {
    return projectViewController.manager.runner.cancel();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.resetBug', async (node) => {
    await node.tryResetBug();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.showWebsite', (node) => {
    return node.showWebsite?.();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.showBugIntroduction', async (node) => {
    await node.showBugIntroduction();
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.showBugLog', async (node) => {
    await node.showBugLog();
  });

  registerCommand(extensionContext, 'dbux.cancelBugRunner', (/* node */) => {
    return projectViewController.manager.runner.cancel();
  });

  registerCommand(extensionContext, 'dbux.resetPracticeLog', async () => {
    await projectViewController.manager.resetLog();
    projectViewController.projectViewNodeProvider.refreshIcon();
    await showInformationMessage('Practice log cleared');
  });

  registerCommand(extensionContext, 'dbux.resetPracticeProgress', async () => {
    await projectViewController.manager.resetProgress();
    projectViewController.projectViewNodeProvider.refreshIcon();
    await showInformationMessage('Bug progress cleared');
  });

  registerCommand(extensionContext, 'dbux.loadPracticeLogFile', async () => {
    const options = {
      title: 'Select a log file to read',
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'Dbux Log File': ['dbuxlog']
      },
      defaultUri: Uri.file(getLogsDirectory())
    };
    const file = (await window.showOpenDialog(options))?.[0];
    if (file) {
      const loaded = await projectViewController.manager.loadPracticeSessionFromFile(file.fsPath);
      if (loaded) {
        await showInformationMessage(`Log file ${file.fsPath} loaded`);
        await showPathwaysView();
      }
    }
  });

  registerCommand(extensionContext, 'dbux.togglePracticeView', async () => {
    await projectViewController.toggleTreeView();
  });

  registerCommand(extensionContext, 'dbux.showDBStats', () => {
    projectViewController.manager._backend.showDBStats();
  });

  registerCommand(extensionContext, 'dbux.clearDBStats', async () => {
    projectViewController.manager._backend.clearDBStats();
  });

  registerCommand(extensionContext, 'dbuxSessionView.node.annotateTraceQ', async (node) => {
    if (!traceSelection.selected) {
      await showWarningMessage('You have not selected any trace yet.');
      return;
    }

    const session = node.bug.manager.practiceSession;
    const annotation = await window.showInputBox({ value: session.lastAnnotation });
    if (annotation) {
      session.lastAnnotation = annotation;
      emitAnnotateTraceAction(UserActionType.AnnotateTraceQ, traceSelection.selected, annotation);
    }
  });

  registerCommand(extensionContext, 'dbuxSessionView.node.annotateTraceI', async (node) => {
    if (!traceSelection.selected) {
      await showWarningMessage('You have not selected any trace yet.');
      return;
    }

    const session = node.bug.manager.practiceSession;
    const annotation = await window.showInputBox({ value: session.lastAnnotation });
    if (annotation) {
      session.lastAnnotation = annotation;
      emitAnnotateTraceAction(UserActionType.AnnotateTraceI, traceSelection.selected, annotation);
    }
  });
}