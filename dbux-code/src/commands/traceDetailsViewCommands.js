import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { registerCommand } from './commandUtil';
import { switchMode } from '../traceDetailsView/nodes/StaticTraceTDNodes';
import { NavigationMethods } from '../traceDetailsView/nodes/NavigationNode';
import { translate } from '../lang';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Commands');

export function initTraceDetailsViewCommands(context, traceDetailsViewController) {
  registerCommand(context,
    'dbuxTraceDetailsView.switchGroupingMode',
    (/* node */) => {
      switchMode();
      traceDetailsViewController.refresh();
    }
  );

  registerCommand(context,
    'dbuxTraceDetailsView.expandNode',
    async (node) => {
      await node.treeNodeProvider.treeView.reveal(node, { select: false, expand: 2 });
    }
  );

  registerCommand(context,
    'dbuxTraceDetailsView.selectObject',
    (node) => {
      node.selectObject();
    }
  );

  registerCommand(context,
    'dbuxTraceDetailsView.valueRender',
    (node) => {
      node.valueRender();
    }
  );

  for (let methodName of NavigationMethods) {
    registerCommand(context,
      `dbuxTraceDetailsView.navigation.${methodName}`,
      (navigationNode) => {
        navigationNode?.select(methodName);
      }
    );
  }

  registerCommand(context,
    'dbuxTraceDetailsView.selectTraceAtCursor',
    traceDetailsViewController.selectTraceAtCursor
  );

  registerCommand(context,
    'dbuxTraceDetailsView.selectTraceAtCursor.empty',
    () => window.showInformationMessage(translate('noTrace'))
  );
}