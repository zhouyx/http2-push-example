"use strict";

(function() {

var NAME = 'bundle3';
var BASE = document.currentScript && document.currentScript.src;

function mark(name) {
  console.log(NAME + '-' + name, performance.now());
  performance.mark(NAME + '-' + name);
}

mark('0');




mark('Z');
})();
