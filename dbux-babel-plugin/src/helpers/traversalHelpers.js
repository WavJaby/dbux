/**
 * For reference, much of AST manipulation is based on babel-types:
 *   Source: https://github.com/babel/babel/tree/master/packages/babel-types
 *   Node classifications: https://github.com/babel/babel/tree/master/packages/babel-types/src/validators/generated/index.js
 *   Docs: https://babeljs.io/docs/en/babel-types
 *   ASTExplorer.net: https://astexplorer.net/
 */

import * as t from '@babel/types';


/**
 * Might return null if given node has no ids (e.g. anonymous function declaration)
 */
export function getAllIdsOfDeclaration(node) {
  if (node.declaration.declarations) {
    // special case: variable declarations
    //  see: https://babeljs.io/docs/en/babel-types#variabledeclaration
    return node.declaration.declarations.map(n => n.id);
  }
  return node.declaration.id && [node.declaration.id] || null;
}

/**
 * 
 */
export function getAllClassParents(path) {
  const classParents = [];
  let classParent = path;
  do {
    classParent = classParent.findParent(p => t.isClass(p.node));
    if (classParent) {
      classParents.push(classParent);
    }
  } while (classParent);
  return classParents;
}

export function getClassAncestryString(path) {
  const classParents = getAllClassParents(path);
  if (classParents.length) {
    return classParents.map(p => p.node.id.name).join('.');
  }
  return '';
}


function isContextPath(path) {
  return path.isFunction() || path.isProgram();
}

export function getContextPath(path) {
  return isContextPath(path) ? path : getContextPath(path.parentPath);
}