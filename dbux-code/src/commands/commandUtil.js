import {
  window,
  commands
} from 'vscode';

// command regist helper
export function registerCommand(context, commandName, func, pushToClient = false) {
  function _errWrap(f) {
    return (...args) => {
      try {
        return f(...args);
      }
      catch (err) {
        console.error(err);
        debugger;
        throw err;
      }
    };
  }

  const newCommand = commands.registerCommand(commandName, _errWrap(func));
  if (pushToClient) context.subscriptions.push(newCommand);

  return newCommand;
}