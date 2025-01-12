import { env, window, Uri } from 'vscode';
import path from 'path';
import { newLogger } from '@dbux/common/src/log/logger';
import { initDbuxProjects } from '@dbux/projects/src';
import Process from '@dbux/projects/src/util/Process';
import { showWarningMessage, showInformationMessage } from '../codeUtil/codeModals';
import { showTextDocument, showTextInNewFile } from '../codeUtil/codeNav';
import TerminalWrapper from '../terminal/TerminalWrapper';
import { set as storageSet, get as storageGet } from '../memento';
import { getResourcePath, getLogsDirectory } from '../resources';
import { interactiveGithubLogin } from '../net/GithubAuth';
import WebviewWrapper from '../codeUtil/WebviewWrapper';
import { showBugIntroduction } from './BugIntroduction';
import { getStopwatch } from './practiceStopwatch';
import { initUserEvent } from '../userEvents';

/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */

const logger = newLogger('projectControl');
// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

/**
 * @type {ProjectsManager}
 */
let projectManager = null;

/**
 * @return {ProjectsManager}
 */
export function getOrCreateProjectManager() {
  return projectManager;
}

export async function initProjectManager(extensionContext) {
  // ########################################
  // cfg + externals
  // ########################################

  // the folder that is parent to `node_modules` for installing all extraneous dependencies (such as @dbux/cli, firebase etc.)
  let dependencyRoot = extensionContext.asAbsolutePath('.');     // extension_folder
  // let dependencyRoot = extensionContext.extensionPath;              // extension_folder
  const pathMatch = dependencyRoot.match(/(.+)[/\\](?:.+\.)?dbux-code(?:.*[/\\]?)?/);    // NOTE: in prod, folder name changes to "author.dbux-code-version"
  if (pathMatch) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line prefer-destructuring
      dependencyRoot = pathMatch[1];                                          // same as DBUX_ROOT
      if (dependencyRoot.toLowerCase() !== process.env.DBUX_ROOT?.toLowerCase()) { // weird drive letter inconsistencies in Windows force us to do case-insensitive comparison
        throw new Error(`Path problems: ${dependencyRoot} !== DBUX_ROOT (${process.env.DBUX_ROOT})`);
      }
    }
    else {
      // production: dependencyRoot is the dbux-code folder itself
      // eslint-disable-next-line prefer-destructuring
      // dependencyRoot = pathMatch[0];
    }
  }

  // the folder that contains the sample projects for dbux-practice
  const projectsRoot = path.join(dependencyRoot, 'dbux_projects');
  const dbuxLanguage = storageGet(`dbux.language`);
  const stopwatch = getStopwatch();

  debug(`Initializing dbux-projects: projectsRoot = "${path.resolve(projectsRoot)}", dependencyRoot = "${path.resolve(dependencyRoot)}"`);

  const cfg = {
    dependencyRoot,
    projectsRoot,
    dbuxLanguage,
  };
  const externals = {
    editor: {
      async openFile(fpath) {
        return showTextDocument(fpath);
      },
      async openFolder(fpath) {
        // TODO: use vscode API to add to workspace instead?
        await Process.exec(`code --add "${fpath}"`, { silent: false }, logger);
      },
      showTextInNewFile
    },
    storage: {
      get: storageGet,
      set: storageSet,
    },
    async confirm(msg, modal = false) {
      // TOTRANSLATE
      const confirmText = 'Yes';
      const refuseText = 'No';
      const cancelText = 'Cancel';
      const result = await window.showInformationMessage(msg, { modal }, confirmText, refuseText, modal ? undefined : cancelText);
      if (result === undefined || result === 'Cancel') {
        return null;
      }
      else {
        return result === confirmText;
      }
    },
    async alert(msg, modal = false) {
      await window.showInformationMessage(msg, { modal });
    },
    TerminalWrapper,
    resources: {
      getResourcePath,
      getLogsDirectory
    },
    showMessage: {
      info: showInformationMessage,
      warning: showWarningMessage,
    },
    stopwatch: {
      start: stopwatch.start.bind(stopwatch),
      pause: stopwatch.pause.bind(stopwatch),
      set: stopwatch.set.bind(stopwatch),
      show: stopwatch.show.bind(stopwatch),
      hide: stopwatch.hide.bind(stopwatch)
    },
    WebviewWrapper,
    showBugIntroduction,
    interactiveGithubLogin,
    openWebsite(url) {
      return env.openExternal(Uri.parse(url));
    },
  };

  // ########################################
  //  init projectManager
  // ########################################
  projectManager = await initDbuxProjects(cfg, externals);

  initUserEvent(projectManager);

  return projectManager;
}