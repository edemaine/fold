require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],3:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":4}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){

/* FOLD FORMAT MANIPULATORS */
var convert, convertFile, geom, key, value;

geom = require('./geom');

convert = exports;

convert.edges_vertices_to_vertices_vertices = function(fold) {

  /*
  Works for abstract structures, so NOT SORTED.
  Use sort_vertices_vertices to sort in counterclockwise order.
   */
  fold.vertices_vertices = filter.edges_vertices_to_vertices_vertices(fold);
  return fold;
};

convert.sort_vertices_vertices = function(fold) {

  /*
  Sorts `fold.vertices_neighbords` in counterclockwise order using
  `fold.vertices_coordinates`.  2D only.
  Constructs `fold.vertices_neighbords` if absent, via
  `convert.edges_vertices_to_vertices_vertices`.
   */
  var neighbors, ref, ref1, ref2, results, v;
  if (((ref = fold.vertices_coords) != null ? (ref1 = ref[0]) != null ? ref1.length : void 0 : void 0) !== 2) {
    throw new Error("sort_vertices_vertices: Vertex coordinates missing or not two dimensional");
  }
  if (fold.vertices_vertices == null) {
    convert.edges_vertices_to_vertices_vertices(fold);
  }
  ref2 = fold.vertices_vertices;
  results = [];
  for (v in ref2) {
    neighbors = ref2[v];
    results.push(sortByAngle(neighbors, v, function(x) {
      return fold.vertices_coords[x];
    }));
  }
  return results;
};

convert.vertices_vertices_to_faces_vertices = function(fold) {
  var face, i, j, k, key, len, len1, neighbors, next, ref, ref1, ref2, ref3, ref4, ref5, u, uv, v, w, x;
  if (((ref = fold.vertices_coords) != null ? (ref1 = ref[0]) != null ? ref1.length : void 0 : void 0) !== 2) {
    throw new Error("vertices_vertices_to_faces_vertices: Vertex coordinates missing or not two dimensional");
  }
  if (fold.vertices_vertices == null) {
    convert.sort_vertices_vertices(fold);
  }
  next = {};
  ref2 = fold.vertices_vertices;
  for (v in ref2) {
    neighbors = ref2[v];
    v = parseInt(v);
    for (i = j = 0, len = neighbors.length; j < len; i = ++j) {
      u = neighbors[i];
      next[u + "," + v] = neighbors[(i - 1) % neighbors.length];
    }
  }
  fold.faces_vertices = [];
  ref3 = (function() {
    var results;
    results = [];
    for (key in next) {
      results.push(key);
    }
    return results;
  })();
  for (k = 0, len1 = ref3.length; k < len1; k++) {
    uv = ref3[k];
    w = next[uv];
    if (w == null) {
      continue;
    }
    next[uv] = null;
    ref4 = uv.split(','), u = ref4[0], v = ref4[1];
    u = parseInt(u);
    v = parseInt(v);
    face = [u, v];
    while (w !== face[0]) {
      if (w == null) {
        console.warn('Confusion with face', face);
        break;
      }
      face.push(w);
      ref5 = [v, w], u = ref5[0], v = ref5[1];
      w = next[u + "," + v];
      next[u + "," + v] = null;
    }
    next[face[face.length - 1] + "," + face[0]] = null;
    if ((w != null) && polygonOrientation((function() {
      var l, len2, results;
      results = [];
      for (l = 0, len2 = face.length; l < len2; l++) {
        x = face[l];
        results.push(fold.vertices_coords[x]);
      }
      return results;
    })()) > 0) {
      fold.faces_vertices.push(face);
    }
  }
  return fold;
};

convert.faces_vertices_to_edges = function(mesh) {
  var edge, edgeMap, face, i, key, ref, v1, v2, vertices;
  mesh.edges_vertices = [];
  mesh.edges_faces = [];
  mesh.faces_edges = [];
  mesh.edges_assignment = [];
  edgeMap = {};
  ref = mesh.faces_vertices;
  for (face in ref) {
    vertices = ref[face];
    face = parseInt(face);
    mesh.faces_edges.push((function() {
      var j, len, results;
      results = [];
      for (i = j = 0, len = vertices.length; j < len; i = ++j) {
        v1 = vertices[i];
        v1 = parseInt(v1);
        v2 = vertices[(i + 1) % vertices.length];
        if (v1 <= v2) {
          key = v1 + "," + v2;
        } else {
          key = v2 + "," + v1;
        }
        if (key in edgeMap) {
          edge = edgeMap[key];
        } else {
          edge = edgeMap[key] = mesh.edges_vertices.length;
          if (v1 <= v2) {
            mesh.edges_vertices.push([v1, v2]);
          } else {
            mesh.edges_vertices.push([v2, v1]);
          }
          mesh.edges_faces.push([null, null]);
          mesh.edges_assignment.push('B');
        }
        if (v1 <= v2) {
          mesh.edges_faces[edge][0] = face;
        } else {
          mesh.edges_faces[edge][1] = face;
        }
        results.push(edge);
      }
      return results;
    })());
  }
  return mesh;
};

convert.extensions = {};

convert.converters = {};

convert.getConverter = function(fromExt, toExt) {
  if (fromExt === toExt) {
    return function(x) {
      return x;
    };
  } else {
    return convert.converters["" + fromExt + toExt];
  }
};

convert.setConverter = function(fromExt, toExt, converter) {
  convert.extensions[fromExt] = true;
  convert.extensions[toExt] = true;
  return convert.converters["" + fromExt + toExt] = converter;
};

convert.oripa = require('./oripa');

convertFile = require('./convert_file');

if (convertFile != null) {
  for (key in convertFile) {
    value = convertFile[key];
    convert[key] = value;
  }
}


},{"./convert_file":6,"./geom":8,"./oripa":9}],6:[function(require,module,exports){
(function (process){

;
var convert, convertFile, fs, path;

fs = require('fs');

path = require('path');

convert = require('./convert');

convertFile = exports;

convertFile.extensionOf = function(filename) {
  var parsed;
  parsed = path.parse(filename);
  if (parsed.ext) {
    return parsed.ext;
  } else if (parsed.base[0] === '.') {
    return parsed.base;
  } else if (("." + filename) in convert.extensions) {
    return "." + filename;
  } else {
    return null;
  }
};

convertFile.toFile = function(fold, output, converter) {
  var outFormat, result;
  if (converter == null) {
    converter = null;
  }
  outFormat = convertFile.extensionOf(output);
  if (!outFormat) {
    console.warn("Could not detect extension of " + output);
    return;
  }
  if (converter == null) {
    converter = convert.getConverter('.fold', outFormat);
    if (converter == null) {
      console.warn("No converter from .fold to " + outFormat);
      return;
    }
  }
  result = converter(fold);
  if (typeof result !== 'string') {
    result = JSON.stringify(result, null, 1);
  }
  return fs.writeFileSync(output, result, 'utf-8');
};

convertFile.fileToFile = function(input, output, converter) {
  var inFormat, outFormat, result;
  if (converter == null) {
    converter = null;
  }
  inFormat = convertFile.extensionOf(input);
  outFormat = convertFile.extensionOf(output);
  if (!inFormat) {
    console.warn("Could not detect extension of " + input);
    return;
  }
  if (!outFormat) {
    console.warn("Could not detect extension of " + output);
    return;
  }
  if (converter == null) {
    converter = convert.getConverter(inFormat, outFormat);
    if (converter == null) {
      console.warn("No converter from " + inFormat + " to " + outFormat);
      return;
    }
  }
  if (outFormat === output || outFormat === ("." + output)) {
    output = path.parse(input);
    output.ext = outFormat;
    output.base = output.name + output.ext;
    output = path.format(output);
  }
  if (inFormat === outFormat || input === output) {
    return console.warn("Attempt to convert " + input + " to same extension");
  } else {
    console.log(input, '->', output);
    result = converter(fs.readFileSync(input, 'utf-8'));
    if (typeof result !== 'string') {
      result = JSON.stringify(result, null, 1);
    }
    return fs.writeFileSync(output, result, 'utf-8');
  }
};

convertFile.main = function(args) {
  var arg, filename, filenames, i, j, len, len1, mode, output, results;
  if (args == null) {
    args = process.argv.slice(2);
  }
  filenames = [];
  output = '.fold';
  mode = null;
  for (i = 0, len = args.length; i < len; i++) {
    arg = args[i];
    switch (mode) {
      case 'output':
        output = arg;
        mode = null;
        break;
      default:
        switch (arg) {
          case '-o':
          case '--output':
            mode = 'output';
            break;
          default:
            filenames.push(arg);
        }
    }
  }
  results = [];
  for (j = 0, len1 = filenames.length; j < len1; j++) {
    filename = filenames[j];
    results.push(convertFile.fileToFile(filename, output));
  }
  return results;
};

if (require.main === module) {
  convertFile.main();
}


}).call(this,require('_process'))
},{"./convert":5,"_process":4,"fs":2,"path":3}],7:[function(require,module,exports){
var RepeatedPointsDS, filter, geom,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

geom = require('./geom');

filter = exports;

filter.edgesAssigned = function(fold, target) {
  var assignment, i, k, len, ref, results;
  ref = fold.edges_assignment;
  results = [];
  for (i = k = 0, len = ref.length; k < len; i = ++k) {
    assignment = ref[i];
    if (assignment === target) {
      results.push(i);
    }
  }
  return results;
};

filter.mountainEdges = function(fold) {
  return assignment.edgesAssigned(fold, 'M');
};

filter.valleyEdges = function(fold) {
  return assignment.edgesAssigned(fold, 'V');
};

filter.flatEdges = function(fold) {
  return assignment.edgesAssigned(fold, 'F');
};

filter.boundaryEdges = function(fold) {
  return assignment.edgesAssigned(fold, 'B');
};

filter.unassignedEdges = function(fold) {
  return assignment.edgesAssigned(fold, 'F');
};

filter.keysStartingWith = function(fold, prefix) {
  var key, results;
  results = [];
  for (key in fold) {
    if (key.slice(0, prefix.length) === prefix) {
      results.push(key);
    }
  }
  return results;
};

filter.keysEndingWith = function(fold, suffix) {
  var key, results;
  results = [];
  for (key in fold) {
    if (key.slice(-suffix.length) === suffix) {
      results.push(key);
    }
  }
  return results;
};

filter.remapField = function(fold, field, old2new) {
  var array, i, j, k, key, l, len, len1, len2, m, new2old, old, ref, ref1;
  new2old = [];
  for (i = k = 0, len = old2new.length; k < len; i = ++k) {
    j = old2new[i];
    new2old[j] = i;
  }
  ref = filter.keysStartingWith(fold, field + '_');
  for (l = 0, len1 = ref.length; l < len1; l++) {
    key = ref[l];
    fold[key] = (function() {
      var len2, m, results;
      results = [];
      for (m = 0, len2 = new2old.length; m < len2; m++) {
        old = new2old[m];
        results.push(fold[key][old]);
      }
      return results;
    })();
  }
  ref1 = filter.keysEndingWith(fold, '_' + field);
  for (m = 0, len2 = ref1.length; m < len2; m++) {
    key = ref1[m];
    fold[key] = (function() {
      var len3, n, ref2, results;
      ref2 = fold[key];
      results = [];
      for (n = 0, len3 = ref2.length; n < len3; n++) {
        array = ref2[n];
        results.push((function() {
          var len4, o, results1;
          results1 = [];
          for (o = 0, len4 = array.length; o < len4; o++) {
            old = array[o];
            results1.push(old2new[old]);
          }
          return results1;
        })());
      }
      return results;
    })();
  }
  return fold;
};

filter.removeDuplicateEdges_vertices = function(fold) {
  var edge, id, key, old2new, seen, v, w;
  seen = {};
  id = 0;
  old2new = (function() {
    var k, len, ref, results;
    ref = fold.edges_vertices;
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      edge = ref[k];
      v = edge[0], w = edge[1];
      if (v < w) {
        key = v + "," + w;
      } else {
        key = w + "," + v;
      }
      if (!(key in seen)) {
        seen[key] = id;
        id += 1;
      }
      results.push(seen[key]);
    }
    return results;
  })();
  return filter.remapField(fold, 'edges', old2new);
};

filter.edges_verticesIncident = function(e1, e2) {
  var k, len, v;
  for (k = 0, len = e1.length; k < len; k++) {
    v = e1[k];
    if (indexOf.call(e2, v) >= 0) {
      return true;
    }
  }
  return false;
};

RepeatedPointsDS = (function() {
  function RepeatedPointsDS(vertices_coords, epsilon1) {
    var coord, k, key, len, ref, v;
    this.vertices_coords = vertices_coords;
    this.epsilon = epsilon1;
    this.hash = {};
    ref = this.vertices_coords;
    for (v = k = 0, len = ref.length; k < len; v = ++k) {
      coord = ref[v];
      key = this.key(coord);
      if (!(key in this.hash)) {
        this.hash[key] = [];
      }
      this.hash[key].push(v);
    }
    null;
  }

  RepeatedPointsDS.prototype.lookup = function(coord) {
    var k, key, l, len, len1, len2, m, ref, ref1, ref2, ref3, v, x, xr, xt, y, yr, yt;
    x = coord[0], y = coord[1];
    xr = Math.round(x / this.epsilon);
    yr = Math.round(y / this.epsilon);
    ref = [xr, xr - 1, xr + 1];
    for (k = 0, len = ref.length; k < len; k++) {
      xt = ref[k];
      ref1 = [yr, yr - 1, yr + 1];
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        yt = ref1[l];
        key = xt + "," + yt;
        ref3 = (ref2 = this.hash[key]) != null ? ref2 : [];
        for (m = 0, len2 = ref3.length; m < len2; m++) {
          v = ref3[m];
          if (this.epsilon > geom.distance(this.vertices_coords[v], coord)) {
            return v;
          }
        }
      }
    }
    return null;
  };

  RepeatedPointsDS.prototype.key = function(coord) {
    var key, x, xr, y, yr;
    x = coord[0], y = coord[1];
    xr = Math.round(x * this.epsilon);
    yr = Math.round(y * this.epsilon);
    return key = xr + "," + yr;
  };

  RepeatedPointsDS.prototype.insert = function(coord) {
    var key, v;
    v = this.lookup(coord);
    if (v != null) {
      return v;
    }
    key = this.key(coord);
    if (!(key in this.hash)) {
      this.hash[key] = [];
    }
    this.hash[key].push(v = this.vertices_coords.length);
    this.vertices_coords.push(coord);
    return v;
  };

  return RepeatedPointsDS;

})();

filter.collapseNearbyVertices = function(fold, epsilon) {
  var coords, old2new, vertices;
  vertices = new RepeatedPointsDS([], epsilon);
  old2new = (function() {
    var k, len, ref, results;
    ref = fold.vertices_coords;
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      coords = ref[k];
      results.push(vertices.insert(coords));
    }
    return results;
  })();
  return filter.remapField(fold, 'vertices', old2new);
};

filter.subdivideCrossingEdges_vertices = function(fold, epsilon) {
  var cross, crossI, e1, e2, i1, i2, k, len, ref, results, s1, s2, v, vertices;
  filter.removeDuplicateEdges_vertices(fold);
  vertices = new RepeatedPointsDS(fold.vertices_coords, epsilon);
  ref = fold.edges_vertices;
  results = [];
  for (i1 = k = 0, len = ref.length; k < len; i1 = ++k) {
    e1 = ref[i1];
    s1 = (function() {
      var l, len1, results1;
      results1 = [];
      for (l = 0, len1 = e1.length; l < len1; l++) {
        v = e1[l];
        results1.push(fold.vertices_coords[v]);
      }
      return results1;
    })();
    results.push((function() {
      var l, len1, ref1, results1;
      ref1 = fold.edges_vertices.slice(0, i1);
      results1 = [];
      for (i2 = l = 0, len1 = ref1.length; l < len1; i2 = ++l) {
        e2 = ref1[i2];
        s2 = (function() {
          var len2, m, results2;
          results2 = [];
          for (m = 0, len2 = e2.length; m < len2; m++) {
            v = e2[m];
            results2.push(fold.vertices_coords[v]);
          }
          return results2;
        })();
        if (!filter.edges_verticesIncident(e1, e2) && geom.segmentsCross(s1, s2)) {
          cross = geom.lineIntersectLine(s1, s2);
          crossI = vertices.insert(cross);
          if (!(indexOf.call(e1, crossI) >= 0 && indexOf.call(e2, crossI) >= 0)) {
            if (indexOf.call(e1, crossI) < 0) {
              fold.edges_vertices.push([crossI, e1[1]]);
              e1[1] = crossI;
            }
            if (indexOf.call(e2, crossI) < 0) {
              fold.edges_vertices.push([crossI, e2[1]]);
              results1.push(e2[1] = crossI);
            } else {
              results1.push(void 0);
            }
          } else {
            results1.push(void 0);
          }
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    })());
  }
  return results;
};

filter.edges_vertices_to_vertices_neighbors = function(fold) {

  /*
  Works for abstract structures, so NOT SORTED.
  Use sort_vertices_neighbors to sort in counterclockwise order.
   */
  var edge, k, len, ref, v, vertices_neighbors, w;
  vertices_neighbors = [];
  ref = fold.edges_vertices;
  for (k = 0, len = ref.length; k < len; k++) {
    edge = ref[k];
    v = edge[0], w = edge[1];
    while (v >= vertices_neighbors.length) {
      vertices_neighbors.push([]);
    }
    while (w >= vertices_neighbors.length) {
      vertices_neighbors.push([]);
    }
    vertices_neighbors[v].push(w);
    vertices_neighbors[w].push(v);
  }
  return vertices_neighbors;
};


},{"./geom":8}],8:[function(require,module,exports){

/* BASIC GEOMETRY */
var geom;

geom = exports;

geom.twiceSignedArea = function(a, b, c) {
  var ref, ref1;
  if (((a.length !== (ref1 = b.length) || ref1 !== (ref = c.length)) || ref !== 2)) {
    throw new Error("twiceSignedArea: Vertex coordinates not two dimensional");
  }
  return a[0] * b[1] - a[1] * b[0] + a[1] * c[0] - a[0] * c[1] + b[0] * c[1] - c[0] * b[1];
};

geom.triangleOrientation = function(a, b, c) {
  return Math.sign(geom.twiceSignedArea(a, b, c));
};

geom.twiceSignedAreaOfVectors = function(b, c) {
  var ref;
  if ((b.length !== (ref = c.length) || ref !== 2)) {
    throw "twiceSignedAreaOfVectors: Vertex coordinates not two dimensional";
  }
  return b[0] * c[1] - c[0] * b[1];
};

geom.polygonOrientation = function(points) {
  var i, v;
  return Math.sign(sum((function() {
    var j, len, results;
    results = [];
    for (i = j = 0, len = points.length; j < len; i = ++j) {
      v = points[i];
      results.push(geom.twiceSignedAreaOfVectors(v, points[(i + 1) % points.length]));
    }
    return results;
  })()));
};

geom.sum = function(list) {
  var j, len, s, x;
  s = 0;
  for (j = 0, len = list.length; j < len; j++) {
    x = list[j];
    s += x;
  }
  return s;
};

geom.vectorLength = function(v) {
  var x;
  return Math.sqrt(geom.sum((function() {
    var j, len, results;
    results = [];
    for (j = 0, len = v.length; j < len; j++) {
      x = v[j];
      results.push(x * x);
    }
    return results;
  })()));
};

geom.angleOfVector = function(v) {
  var length;
  if (v.length !== 2) {
    throw "angleOfVector: Vertex coordinates not two dimensional";
  }
  length = geom.vectorLength(v);
  return Math.atan2(v[1], v[0]);
};

geom.vectorFromTo = function(a, b) {
  var i, j, len, results, x;
  results = [];
  for (i = j = 0, len = a.length; j < len; i = ++j) {
    x = a[i];
    results.push(b[i] - x);
  }
  return results;
};

geom.distance = function(a, b) {
  return geom.vectorLength(geom.vectorFromTo(a, b));
};

geom.angleABC = function(a, b, c) {
  var ang;
  ang = geom.angleOfVector(geom.vectorFromTo(b, a)) - geom.angleOfVector(geom.vectorFromTo(b, c));
  if (ang < 0) {
    return 2 * Math.PI + ang;
  } else {
    return ang;
  }
};

geom.turnAngle = function(a, b, c) {
  return Math.PI - angleABC(a, b, c);
};

geom.sortByAngle = function(points, origin, mapping) {
  var ref;
  if (origin == null) {
    origin = [0, 0];
  }
  if (mapping == null) {
    mapping = function(x) {
      return x;
    };
  }
  origin = mapping(origin);
  if ((origin.length !== (ref = mapping(points[0]).length) || ref !== 2)) {
    throw "sortByAngle: Vertex coordinates not two dimensional";
  }
  return points.sort(function(p, q) {
    var pa, qa;
    pa = geom.angleOfVector(geom.vectorFromTo(origin, mapping(p)));
    qa = geom.angleOfVector(geom.vectorFromTo(origin, mapping(q)));
    return qa - pa;
  });
};

geom.segmentsCross = function(s0, s1) {
  var p0, p1, q0, q1, ref, ref1, ref2, ref3;
  p0 = s0[0], q0 = s0[1];
  p1 = s1[0], q1 = s1[1];
  if ((p1[0] < (ref = Math.min(p0[0], q0[0])) && ref > q1[0]) || (p1[0] > (ref1 = Math.max(p0[0], q0[0])) && ref1 < q1[0])) {
    return false;
  }
  if ((p1[1] < (ref2 = Math.min(p0[1], q0[1])) && ref2 > q1[1]) || (p1[1] > (ref3 = Math.max(p0[1], q0[1])) && ref3 < q1[1])) {
    return false;
  }
  return geom.triangleOrientation(p0, q0, p1) !== geom.triangleOrientation(p0, q0, q1) && geom.triangleOrientation(p1, q1, p0) !== geom.triangleOrientation(p1, q1, q0);
};

geom.parametricLineIntersect = function(l1, l2) {
  var denom, p1, p2, q1, q2, ref, ref1, ref2;
  if ((((l1[0].length !== (ref2 = l1[1].length) || ref2 !== (ref1 = l2[0].length)) || ref1 !== (ref = l2[1].length)) || ref !== 2)) {
    throw "parametricLineIntersect: Vertex coordinates are not two dimensional";
  }
  p1 = l1[0], p2 = l1[1];
  q1 = l2[0], q2 = l2[1];
  denom = (q2[1] - q1[1]) * (p2[0] - p1[0]) + (q1[0] - q2[0]) * (p2[1] - p1[1]);
  if (denom === 0) {
    return [null, null];
  } else {
    return [(q2[0] * (p1[1] - q1[1]) + q2[1] * (q1[0] - p1[0]) + q1[1] * p1[0] - p1[1] * q1[0]) / denom, (q1[0] * (p2[1] - p1[1]) + q1[1] * (p1[0] - p2[0]) + p1[1] * p2[0] - p2[1] * p1[0]) / denom];
  }
};

geom.linearInterpolate = function(t, p, q) {
  var i, j, len, results, x;
  results = [];
  for (i = j = 0, len = p.length; j < len; i = ++j) {
    x = p[i];
    results.push((1 - t) * x + t * q[i]);
  }
  return results;
};

geom.segmentIntersectSegment = function(s1, s2) {
  var ref, s, t;
  ref = geom.parametricLineIntersect(s1, s2), s = ref[0], t = ref[1];
  if (s != null) {
    if ((0 <= s && s <= 1) && (0 <= t && t <= 1)) {
      return geom.linearInterpolate(s, s1[0], s1[1]);
    } else {
      return null;
    }
  } else {
    return null;
  }
};

geom.lineIntersectLine = function(l1, l2) {
  var ref, s, t;
  ref = geom.parametricLineIntersect(l1, l2), s = ref[0], t = ref[1];
  if (s != null) {
    return geom.linearInterpolate(s, l1[0], l1[1]);
  } else {
    return null;
  }
};


},{}],9:[function(require,module,exports){
var DOMParser, convert, oripa, ref, x, y;

if (typeof DOMParser === "undefined" || DOMParser === null) {
  DOMParser = require('xmldom').DOMParser;
}

convert = require('./convert');

oripa = exports;

oripa.type2fold = {
  0: 'F',
  1: 'B',
  2: 'M',
  3: 'V'
};

oripa.fold2type = {};

ref = oripa.type2fold;
for (x in ref) {
  y = ref[x];
  oripa.fold2type[y] = x;
}

oripa.fold2type_default = 0;

oripa.prop_xml2fold = {
  'editorName': 'frame_author',
  'originalAuthorName': 'frame_designer',
  'reference': 'frame_reference',
  'title': 'frame_title',
  'memo': 'frame_description',
  'paperSize': null,
  'mainVersion': null,
  'subVersion': null
};

oripa.POINT_EPS = 1.0;

oripa.toFold = function(oripa) {
  var children, fold, j, k, l, len, len1, len2, len3, len4, line, lines, m, n, nodeSpec, object, oneChildSpec, oneChildText, prop, property, ref1, ref2, ref3, ref4, ref5, subproperty, top, type, vertex, x0, x1, xml, y0, y1;
  fold = {
    vertices_coords: [],
    edges_vertices: [],
    edges_assignment: [],
    file_creator: 'oripa2fold'
  };
  vertex = function(x, y) {
    var v;
    v = fold.vertices_coords.length;
    fold.vertices_coords.push([parseFloat(x), parseFloat(y)]);
    return v;
  };
  nodeSpec = function(node, type, key, value) {
    if ((type != null) && node.tagName !== type) {
      console.warn("ORIPA file has " + node.tagName + " where " + type + " was expected");
      return null;
    } else if ((key != null) && (!node.hasAttribute(key) || ((value != null) && node.getAttribute(key) !== value))) {
      console.warn("ORIPA file has " + node.tagName + " with " + key + " = " + (node.getAttribute(key)) + " where " + value + " was expected");
      return null;
    } else {
      return node;
    }
  };
  children = function(node) {
    var child, j, len, ref1, results;
    if (node) {
      ref1 = node.childNodes;
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        child = ref1[j];
        if (child.nodeType === 1) {
          results.push(child);
        }
      }
      return results;
    } else {
      return [];
    }
  };
  oneChildSpec = function(node, type, key, value) {
    var sub;
    sub = children(node);
    if (sub.length !== 1) {
      console.warn("ORIPA file has " + node.tagName + " with " + node.childNodes.length + " children, not 1");
      return null;
    } else {
      return nodeSpec(sub[0], type, key, value);
    }
  };
  oneChildText = function(node) {
    var child;
    if (node.childNodes.length > 1) {
      console.warn("ORIPA file has " + node.tagName + " with " + node.childNodes.length + " children, not 0 or 1");
      return null;
    } else if (node.childNodes.length === 0) {
      return '';
    } else {
      child = node.childNodes[0];
      if (child.nodeType !== 3) {
        return console.warn("ORIPA file has nodeType " + child.nodeType + " where 3 (text) was expected");
      } else {
        return child.data;
      }
    }
  };
  xml = new DOMParser().parseFromString(oripa, 'text/xml');
  ref1 = children(xml.documentElement);
  for (j = 0, len = ref1.length; j < len; j++) {
    top = ref1[j];
    if (nodeSpec(top, 'object', 'class', 'oripa.DataSet')) {
      ref2 = children(top);
      for (k = 0, len1 = ref2.length; k < len1; k++) {
        property = ref2[k];
        if (property.getAttribute('property') === 'lines') {
          lines = oneChildSpec(property, 'array', 'class', 'oripa.OriLineProxy');
          ref3 = children(lines);
          for (l = 0, len2 = ref3.length; l < len2; l++) {
            line = ref3[l];
            if (nodeSpec(line, 'void', 'index')) {
              ref4 = children(line);
              for (m = 0, len3 = ref4.length; m < len3; m++) {
                object = ref4[m];
                if (nodeSpec(object, 'object', 'class', 'oripa.OriLineProxy')) {
                  x0 = x1 = y0 = y1 = type = 0;
                  ref5 = children(object);
                  for (n = 0, len4 = ref5.length; n < len4; n++) {
                    subproperty = ref5[n];
                    if (nodeSpec(subproperty, 'void', 'property')) {
                      switch (subproperty.getAttribute('property')) {
                        case 'x0':
                          x0 = oneChildText(oneChildSpec(subproperty, 'double'));
                          break;
                        case 'x1':
                          x1 = oneChildText(oneChildSpec(subproperty, 'double'));
                          break;
                        case 'y0':
                          y0 = oneChildText(oneChildSpec(subproperty, 'double'));
                          break;
                        case 'y1':
                          y1 = oneChildText(oneChildSpec(subproperty, 'double'));
                          break;
                        case 'type':
                          type = oneChildText(oneChildSpec(subproperty, 'int'));
                      }
                    }
                  }
                  if ((x0 != null) && (x1 != null) && (y0 != null) && (y1 != null)) {
                    fold.edges_vertices.push([vertex(x0, y0), vertex(x1, y1)]);
                    if (type != null) {
                      type = parseInt(type);
                    }
                    fold.edges_assignment.push(type2fold[type]);
                  } else {
                    console.warn("ORIPA line has missing data: " + x0 + " " + x1 + " " + y0 + " " + y1 + " " + type);
                  }
                }
              }
            }
          }
        } else if (property.getAttribute('property') in oripa.prop_xml2fold) {
          prop = oripa.prop_xml2fold[property.getAttribute('property')];
          if (prop != null) {
            fold[prop] = oneChildText(oneChildSpec(property, 'string'));
          }
        } else {
          console.warn("Ignoring " + property.tagName + " " + (top.getAttribute('property')) + " in ORIPA file");
        }
      }
    }
  }
  convert.collapseNearbyVertices(fold, POINT_EPS);
  convert.subdivideCrossingEdges_vertices(fold, POINT_EPS);
  convert.verticesEdges_to_faces_vertices(fold);
  return fold;
};

oripa.fromFold = function(fold) {
  var coord, edge, ei, fp, i, j, len, line, lines, ref1, s, vertex, vs, xp, z;
  if (typeof fold === 'string') {
    fold = JSON.parse(fold);
  }
  s = "<?xml version=\"1.0\" encoding=\"UTF-8\"?> \n<java version=\"1.5.0_05\" class=\"java.beans.XMLDecoder\"> \n <object class=\"oripa.DataSet\"> \n  <void property=\"mainVersion\"> \n   <int>1</int> \n  </void> \n  <void property=\"subVersion\"> \n   <int>1</int> \n  </void> \n  <void property=\"paperSize\"> \n   <double>400.0</double> \n  </void> \n";
  ref1 = oripa.prop_xml2fold;
  for (xp in ref1) {
    fp = ref1[xp];
    s += (".\n  <void property=\"" + xp + "\"> \n   <string>" + (fold[fp] || '') + "</string> \n  </void> \n").slice(2);
  }
  z = 0;
  lines = (function() {
    var j, len, ref2, results;
    ref2 = fold.edges_vertices;
    results = [];
    for (ei = j = 0, len = ref2.length; j < len; ei = ++j) {
      edge = ref2[ei];
      vs = (function() {
        var k, l, len1, len2, ref3, results1;
        results1 = [];
        for (k = 0, len1 = edge.length; k < len1; k++) {
          vertex = edge[k];
          ref3 = fold.vertices_coords[vertex].slice(2);
          for (l = 0, len2 = ref3.length; l < len2; l++) {
            coord = ref3[l];
            if (coord !== 0) {
              z += 1;
            }
          }
          results1.push(fold.vertices_coords[vertex]);
        }
        return results1;
      })();
      results.push({
        x0: vs[0][0],
        y0: vs[0][1],
        x1: vs[1][0],
        y1: vs[1][1],
        type: oripa.fold2type[fold.edges_assignment[ei]] || oripa.fold2type_default
      });
    }
    return results;
  })();
  s += (".\n  <void property=\"lines\"> \n   <array class=\"oripa.OriLineProxy\" length=\"" + lines.length + "\"> \n").slice(2);
  for (i = j = 0, len = lines.length; j < len; i = ++j) {
    line = lines[i];
    s += (".\n    <void index=\"" + i + "\"> \n     <object class=\"oripa.OriLineProxy\"> \n      <void property=\"type\"> \n       <int>" + line.type + "</int> \n      </void> \n      <void property=\"x0\"> \n       <double>" + line.x0 + "</double> \n      </void> \n      <void property=\"x1\"> \n       <double>" + line.x1 + "</double> \n      </void> \n      <void property=\"y0\"> \n       <double>" + line.y0 + "</double> \n      </void> \n      <void property=\"y1\"> \n       <double>" + line.y1 + "</double> \n      </void> \n     </object> \n    </void> \n").slice(2);
  }
  s += ".\n   </array> \n  </void> \n </object> \n</java> \n".slice(2);
  return s;
};

convert.setConverter('.fold', '.opx', oripa.fromFold);

convert.setConverter('.opx', '.fold', oripa.toFold);


},{"./convert":5,"xmldom":1}],"FOLD":[function(require,module,exports){
module.exports = {
  geom: require('./geom'),
  filter: require('./filter'),
  convert: require('./convert')
};


},{"./convert":5,"./filter":7,"./geom":8}]},{},[]);
