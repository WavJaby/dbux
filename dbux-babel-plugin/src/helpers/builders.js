/**
 * Helpers to generate partial AST's.
 */

import { parse } from '@babel/parser';
import { codeFrameColumns } from "@babel/code-frame";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export function buildNamedExport(ids) {
  return t.exportNamedDeclaration(null, ids.map(id => t.exportSpecifier(id, id)))
}

export function buildTryFinally(tryNodes, finallyNodes) {
  if (tryNodes.length === 1 && t.isBlockStatement(tryNodes[0])) {
    tryNodes = tryNodes[0];
  }
  else {
    tryNodes = t.blockStatement(tryNodes);
  }
  return t.tryStatement(tryNodes, null, t.blockStatement(finallyNodes))
}

export function buildBlock(statements) {
  return t.blockStatement(Array.isArray(statements) ? statements : [statements]);
}

export function buildVarDecl(ids) {
  const kind = "let";
  const declarations = ids.map((id, i) => {
    return t.variableDeclarator(id, null);
  });
  return t.variableDeclaration(kind, declarations);
}

export function buildVarAssignments(ids, values) {
  const assignments = ids.map((id, i) => {
    return t.expressionStatement(t.assignmentExpression('=', id, values[i]));
  });
  return assignments;
}

/**
 * Wrap a block with a try/finally pair
 */
export function buildWrapTryFinally(tryNodes, endCalls) {
  tryNodes = Array.isArray(tryNodes) ? tryNodes : [tryNodes];
  const finallyBody = endCalls;
  return buildTryFinally(tryNodes, finallyBody);
}

export function buildProgram(origPathOrNode, bodyNodes) {
  const newProgramNode = t.cloneNode(origPathOrNode.node || origPathOrNode);
  newProgramNode.body = bodyNodes;
  return newProgramNode;
}

/**
 * Build AST from source through @babel/parser
 * @param {String} source 
 * @return {SourceNode[]}
 */
export function buildSource(source) {
  let ast;
  try {
    source = `${source}`;
    ast = parse(source);
  } catch (err) {
    const loc = err.loc;
    if (loc) {
      err.message +=
        "\n" +
        codeFrameColumns(source, {
          start: {
            line: loc.line,
            column: loc.column + 1,
          },
        });
    }
    throw err;
  }

  const nodes = ast.program.body;
  nodes.forEach(n => traverse.removeProperties(n));
  return nodes;
}

// https://stackoverflow.com/questions/35925798/how-to-add-an-import-to-the-file-with-babel