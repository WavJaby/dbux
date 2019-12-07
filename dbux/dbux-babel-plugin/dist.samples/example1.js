"use strict";

require("core-js/modules/es.array.iterator.js");

require("core-js/modules/es.map.js");

require("core-js/modules/es.object.to-string.js");

require("core-js/modules/es.set.js");

require("core-js/modules/es.string.iterator.js");

require("core-js/modules/web.dom-collections.iterator.js");

exports.__esModule = true;
exports.f1 = f1;
exports.f2 = exports.A = void 0;

function f1(x, y) {
  "before";
  "after";
}

var A =
/*#__PURE__*/
function () {
  function A() {
    "before";
    this.m = new Map();
    this.s = new Set();
    "after";
  }

  var _proto = A.prototype;

  _proto.getX = function getX() {
    "before";
    "after";
  };

  return A;
}();

exports.A = A;

var f2 = function f2(z, w) {
  "before";
  "after";
};

exports.f2 = f2;