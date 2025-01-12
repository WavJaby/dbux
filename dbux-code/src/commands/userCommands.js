import { window } from 'vscode';
import path from 'path';
import fs from 'fs';
import open from 'open';
import isNaN from 'lodash/isNaN';
// import { stringify as jsonStringify } from 'comment-json';
import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { newLogger } from '@dbux/common/src/log/logger';
import { checkSystem } from '@dbux/projects/src/checkSystem';
import { registerCommand } from './commandUtil';
import { showTextDocument } from '../codeUtil/codeNav';
import { getSelectedApplicationInActiveEditorWithUserFeedback } from '../codeUtil/codeExport';
import { showGraphView, hideGraphView } from '../webViews/graphWebView';
import { showPathwaysView, hidePathwaysView } from '../webViews/pathwaysWebView';
import { setShowDeco } from '../codeDeco';
import { toggleNavButton } from '../toolbar';
import { toggleErrorLog } from '../logging';
import { runFile } from './runCommands';
import { getOrCreateProjectManager } from '../projectViews/projectControl';
import { showHelp } from '../help';
// import { installDbuxDependencies } from '../codeUtil/installUtil';
import { showOutputChannel } from '../projectViews/projectViewsController';
import { renderValueAsJsonInEditor } from '../traceDetailsView/valueRender';
import { getAllMemento, clearAll } from '../memento';
import { showInformationMessage } from '../codeUtil/codeModals';
import { translate } from '../lang';
import { getLogsDirectory } from '../resources';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('userCommands');


export function initUserCommands(extensionContext) {
  // ###########################################################################
  // exportApplicationData
  // ###########################################################################

  async function doExport(application) {
    const exportFolder = path.join(__dirname, '../../analysis/__data__/');
    const applicationName = application.getSafeFileName();
    // const folder = path.dirname(application.entryPointPath);
    // const fpath = path.join(folder, '_data.json');
    if (!fs.existsSync(exportFolder)) {
      fs.mkdirSync(exportFolder);
    }

    const exportFpath = path.join(exportFolder, `${applicationName || '(unknown)'}_data.json`);
    const data = application.dataProvider.serialize();
    fs.writeFileSync(exportFpath, data);

    const btns = {
      Open: async () => {
        await showTextDocument(exportFpath);
      }
    };
    const msg = translate('savedSuccessfully', { fileName: exportFpath });
    debug(msg);
    const clicked = await window.showInformationMessage(msg,
      ...Object.keys(btns));
    if (clicked) {
      btns[clicked]();
    }
  }

  registerCommand(extensionContext, 'dbux.exportApplicationData', async () => {
    const application = await getSelectedApplicationInActiveEditorWithUserFeedback();
    await doExport(application);
  });


  // ###########################################################################
  // show/hide graph view
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showGraphView', async () => {
    await showGraphView(extensionContext);
  });

  registerCommand(extensionContext, 'dbux.hideGraphView', async () => {
    hideGraphView();
  });

  // ###########################################################################
  // show/hide pathways view
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showPathwaysView', async () => {
    await showPathwaysView();
  });

  registerCommand(extensionContext, 'dbux.hidePathwaysView', async () => {
    hidePathwaysView();
  });

  // ###########################################################################
  // show/hide code decorations
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showDecorations', () => {
    setShowDeco(true);
  });

  registerCommand(extensionContext, 'dbux.hideDecorations', () => {
    setShowDeco(false);
  });

  // ###########################################################################
  // show/hide nav buttons
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.toggleNavButton',
    toggleNavButton
  );

  // ###########################################################################
  // show/hide error log
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.toggleErrorLog',
    toggleErrorLog
  );

  // ###########################################################################
  // show/hide error log
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.openPracticeLogFolder', () => {
    open(getLogsDirectory());
  });

  // ###########################################################################
  // select trace
  // ###########################################################################

  async function openSelectTraceUI() {
    // input application
    const applicationIdByLabel = new Map();
    const labels = [];
    const allSelectedApps = allApplications.selection.getAll();
    allSelectedApps.forEach(app => {
      // NOTE: label should be a unique key
      const label = `${app.getPreferredName()} (id: ${app.applicationId})`;
      labels.push(label);
      applicationIdByLabel.set(label, app.applicationId);
    });
    if (!allSelectedApps.length) {
      await window.showInformationMessage(translate('noApplication'));
      return;
    }
    // TOTRANSLATE
    const applicationName = await window.showQuickPick(labels, { placeHolder: 'Select an application' });
    if (!applicationName) {
      // user canceled selection
      return;
    }
    const applicationId = applicationIdByLabel.get(applicationName);

    // input traceId
    // TOTRANSLATE
    const userInput = await window.showInputBox({ placeHolder: 'input a traceId' });
    if (!userInput) {
      // user canceled selection
      return;
    }
    const traceId = parseInt(userInput, 10);
    if (isNaN(traceId)) {
      // TOTRANSLATE
      await window.showErrorMessage(`Can't convert ${userInput} into integer`);
      return;
    }

    // select trace
    const dp = allApplications.getById(applicationId).dataProvider;
    const trace = dp.collections.traces.getById(traceId);
    if (!trace) {
      // TOTRANSLATE
      await window.showErrorMessage(`Can't find trace of traceId ${traceId} & applicationId ${applicationId}`);
    }
    else {
      traceSelection.selectTrace(trace);
    }
  }

  registerCommand(extensionContext, 'dbux.selectTrace', openSelectTraceUI);


  // ###########################################################################
  // run + debug
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.runFile', () => runFile(extensionContext));
  registerCommand(extensionContext, 'dbux.debugFile', () => runFile(extensionContext, true));

  // ###########################################################################
  // practice backend
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.backendLogin', async () => {
    // if (process.env.NODE_ENV === 'production') {
    //   throw new Error('This command is currently disabled in Production mode.');
    // }
    const backend = await getOrCreateProjectManager().getAndInitBackend();
    await backend.login();
    // await installDbuxDependencies();
    // const backend = await getOrCreateProjectManager().getAndInitBackend();
    const data = { installId: 'testIdqwe', hi: 123 };
    // log('storeSurveyResult', data);
    return backend.containers.survey1.storeSurveyResult(data);
  });

  registerCommand(extensionContext, 'dbux.deleteUserEvents', async () => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('This command is currently disabled in Production mode.');
    }
    await getOrCreateProjectManager().deleteUserEvents();
  });

  // ###########################################################################
  // system check
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.systemCheck', async () => {
    let projectManager = getOrCreateProjectManager(extensionContext);
    await checkSystem(projectManager, true, true);
  });

  // ###########################################################################
  // open help website
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showHelp', async () => {
    return showHelp();
  });

  // ###########################################################################
  // show outputChannel
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showOutputChannel', async () => {
    return showOutputChannel();
  });

  registerCommand(extensionContext, 'dbux.showMemento', async () => {
    return await renderValueAsJsonInEditor(getAllMemento());
  });

  registerCommand(extensionContext, 'dbux.clearMemento', async () => {
    await clearAll();
    // TOTRANSLATE
    await showInformationMessage('Memento cleared, please reload the window');
  });
}