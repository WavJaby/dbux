import path from 'path';
import { newLogger } from '@dbux/common/src/log/logger';
import { initDbuxProjects, ProjectsManager } from '@dbux/projects/src';
import Process from '@dbux/projects/src/util/Process';
import { showWarningMessage } from '../codeUtil/codeModals';
import { showTextDocument, showTextInNewFile } from '../codeUtil/codeNav';
import { execInTerminal } from '../terminal/TerminalWrapper';
import { set as storageSet, get as storageGet } from '../memento';
import { getResourcePath } from '../resources';

const logger = newLogger('projectControl');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

let projectManager;

/**
 * @return {ProjectsManager}
 */
export function getOrCreateProjectManager(extensionContext) {
  if (!projectManager) {
    projectManager = createProjectManager(extensionContext);
  }
  return projectManager;
}


function createProjectManager(extensionContext) {
  // ########################################
  // cfg + externals
  // ########################################
  
  // the folder that contains `node_modules` for installing cli etc.
  const nodeModulesParent = process.env.NODE_ENV === 'production' ?
    [] :            // extension_folder/
    ['..'];         // monoRoot/dbux-code/..

  // the folder that contains the sample projects for dbux-projects/dbux-practice
  const projectsParent = process.env.NODE_ENV === 'production' ?
    [] :            // extension_folder/
    ['..', '..'];   // monoRoot/dbux-code/../..

  const cfg = {
    dependencyRoot: extensionContext.asAbsolutePath(...nodeModulesParent),
    projectsRoot: extensionContext.asAbsolutePath(...projectsParent, 'dbux_projects')
  };
  const externals = {
    editor: {
      async openFile(fpath) {
        // await exec(`code ${fpath}`, logger, { silent: false }, true);
        return showTextDocument(fpath);
      },
      async openFolder(fpath) {
        // TODO: use vscode API to add to workspace instead?
        await Process.exec(`code --add ${fpath}`, { silent: false }, logger);
      },
      showTextInNewFile,
    },
    storage: {
      get: storageGet,
      set: storageSet,
    },
    execInTerminal,
    resources: {
      getResourcePath
    },
    showMessage: {
      showWarningMessage,
    },
  };

  // ########################################
  //  init projectManager
  // ########################################
  const manager = initDbuxProjects(cfg, externals);

  debug(`Initialized dbux-projects. Projects folder = "${path.resolve(cfg.projectsRoot)}"`);

  return manager;
}