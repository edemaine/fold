require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){

/* FOLD FORMAT MANIPULATORS */
var convert, filter, geom,
  modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

geom = require('./geom');

filter = require('./filter');

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
    results.push(geom.sortByAngle(neighbors, v, function(x) {
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
      next[u + "," + v] = neighbors[modulo(i - 1, neighbors.length)];
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
    if ((w != null) && geom.polygonOrientation((function() {
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

convert.convertFromTo = function(data, fromExt, toExt) {
  var converter;
  if (fromExt[0] !== '.') {
    fromExt = "." + fromExt;
  }
  if (toExt[0] !== '.') {
    toExt = "." + toExt;
  }
  converter = convert.getConverter(fromExt, toExt);
  if (converter == null) {
    if (fromExt === toExt) {
      return data;
    }
    throw new Error("No converter from " + fromExt + " to " + toExt);
  }
  return converter(data);
};

convert.convertFrom = function(data, fromExt) {
  return convert.convertFromTo(data, fromExt, '.fold');
};

convert.convertTo = function(data, toExt) {
  return convert.convertFromTo(data, '.fold', toExt);
};

convert.oripa = require('./oripa');


},{"./filter":3,"./geom":4,"./oripa":5}],3:[function(require,module,exports){
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

  /*
  old2new: null means throw away that object
   */
  var array, i, j, k, key, l, len, len1, len2, m, new2old, old, ref, ref1;
  new2old = [];
  for (i = k = 0, len = old2new.length; k < len; i = ++k) {
    j = old2new[i];
    if (j != null) {
      new2old[j] = i;
    }
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

filter.remapFieldSubset = function(fold, field, keep) {
  var id, old2new, value;
  id = 0;
  old2new = (function() {
    var k, len, results;
    results = [];
    for (k = 0, len = keep.length; k < len; k++) {
      value = keep[k];
      if (value) {
        results.push(id++);
      } else {
        results.push(null);
      }
    }
    return results;
  })();
  return filter.remapField(fold, field, old2new);
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
          if (this.epsilon > geom.dist(this.vertices_coords[v], coord)) {
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

filter.removeLoopEdges = function(fold) {

  /*
  Remove edges whose endpoints are identical.  After collapsing via
  `filter.collapseNearbyVertices`, this removes epsilon-length edges.
   */
  var edge;
  return filter.remapFieldSubset(fold, 'edges', (function() {
    var k, len, ref, results;
    ref = fold.edges_vertices;
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      edge = ref[k];
      results.push(edge[0] !== edge[1]);
    }
    return results;
  })());
};

filter.subdivideCrossingEdges_vertices = function(fold, epsilon) {

  /*
  Takes quadratic time.  xxx Should be O(n log n) via plane sweep.
   */
  var cross, crossI, e, e1, e2, i, i1, i2, k, l, len, len1, len2, len3, m, n, p, ref, ref1, ref2, ref3, s, s1, s2, u, v, vertices;
  ref = fold.vertices_coords;
  for (v = k = 0, len = ref.length; k < len; v = ++k) {
    p = ref[v];
    ref1 = fold.edges_vertices;
    for (i = l = 0, len1 = ref1.length; l < len1; i = ++l) {
      e = ref1[i];
      if (indexOf.call(e, v) >= 0) {
        continue;
      }
      s = (function() {
        var len2, m, results;
        results = [];
        for (m = 0, len2 = e.length; m < len2; m++) {
          u = e[m];
          results.push(fold.vertices_coords[u]);
        }
        return results;
      })();
      if (geom.pointStrictlyInSegment(p, s)) {
        fold.edges_vertices.push([v, e[1]]);
        e[1] = v;
      }
    }
  }
  filter.removeDuplicateEdges_vertices(fold);
  filter.removeLoopEdges(fold);
  vertices = new RepeatedPointsDS(fold.vertices_coords, epsilon);
  ref2 = fold.edges_vertices;
  for (i1 = m = 0, len2 = ref2.length; m < len2; i1 = ++m) {
    e1 = ref2[i1];
    s1 = (function() {
      var len3, n, results;
      results = [];
      for (n = 0, len3 = e1.length; n < len3; n++) {
        v = e1[n];
        results.push(fold.vertices_coords[v]);
      }
      return results;
    })();
    ref3 = fold.edges_vertices.slice(0, i1);
    for (i2 = n = 0, len3 = ref3.length; n < len3; i2 = ++n) {
      e2 = ref3[i2];
      s2 = (function() {
        var len4, o, results;
        results = [];
        for (o = 0, len4 = e2.length; o < len4; o++) {
          v = e2[o];
          results.push(fold.vertices_coords[v]);
        }
        return results;
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
            e2[1] = crossI;
          }
        }
      }
    }
  }
  return fold;
};

filter.edges_vertices_to_vertices_vertices = function(fold) {

  /*
  Works for abstract structures, so NOT SORTED.
  Use sort_vertices_vertices to sort in counterclockwise order.
   */
  var edge, k, len, ref, v, vertices_vertices, w;
  vertices_vertices = [];
  ref = fold.edges_vertices;
  for (k = 0, len = ref.length; k < len; k++) {
    edge = ref[k];
    v = edge[0], w = edge[1];
    while (v >= vertices_vertices.length) {
      vertices_vertices.push([]);
    }
    while (w >= vertices_vertices.length) {
      vertices_vertices.push([]);
    }
    vertices_vertices[v].push(w);
    vertices_vertices[w].push(v);
  }
  return vertices_vertices;
};


},{"./geom":4}],4:[function(require,module,exports){

/* BASIC GEOMETRY */
var EPS, geom,
  modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

geom = exports;


/*
    Utilities
 */

EPS = 0.000001;

geom.sum = function(a, b) {
  return a + b;
};

geom.min = function(a, b) {
  if (a < b) {
    return a;
  } else {
    return b;
  }
};

geom.max = function(a, b) {
  if (a > b) {
    return a;
  } else {
    return b;
  }
};

geom.all = function(a, b) {
  return a && b;
};

geom.next = function(start, n, i) {
  if (i == null) {
    i = 1;
  }

  /*
  Returns the ith cyclic ordered number after start in the range [0..n].
   */
  return modulo(start + i, n);
};

geom.rangesDisjoint = function(arg, arg1) {
  var a1, a2, b1, b2, ref, ref1;
  a1 = arg[0], a2 = arg[1];
  b1 = arg1[0], b2 = arg1[1];
  return ((b1 < (ref = Math.min(a1, a2)) && ref > b2)) || ((b1 > (ref1 = Math.max(a1, a2)) && ref1 < b2));
};

geom.topologicalSort = function(vs) {
  var k, l, len, len1, list, ref, v;
  for (k = 0, len = vs.length; k < len; k++) {
    v = vs[k];
    ref = [false, null], v.visited = ref[0], v.parent = ref[1];
  }
  list = [];
  for (l = 0, len1 = vs.length; l < len1; l++) {
    v = vs[l];
    if (!v.visited) {
      list = geom.visit(v, list);
    }
  }
  return list;
};

geom.visit = function(v, list) {
  var k, len, ref, u;
  v.visited = true;
  ref = v.children;
  for (k = 0, len = ref.length; k < len; k++) {
    u = ref[k];
    if (!(!u.visited)) {
      continue;
    }
    u.parent = v;
    list = geom.visit(u, list);
  }
  return list.concat([v.i]);
};

geom.magsq = function(a) {
  return geom.dot(a, a);
};

geom.mag = function(a) {
  return Math.sqrt(geom.magsq(a));
};

geom.unit = function(a, eps) {
  var length;
  if (eps == null) {
    eps = EPS;
  }
  length = geom.magsq(a);
  if (length < eps) {
    return null;
  }
  return geom.mul(a, 1 / geom.mag(a));
};

geom.ang2D = function(a, eps) {
  if (eps == null) {
    eps = EPS;
  }
  if (geom.magsq(a) < eps) {
    return null;
  }
  return Math.atan2(a[1], a[0]);
};

geom.mul = function(a, s) {
  var i, k, len, results;
  results = [];
  for (k = 0, len = a.length; k < len; k++) {
    i = a[k];
    results.push(i * s);
  }
  return results;
};

geom.linearInterpolate = function(t, a, b) {
  return geom.plus(geom.mul(a, 1 - t), geom.mul(b, t));
};

geom.plus = function(a, b) {
  var ai, i, k, len, results;
  results = [];
  for (i = k = 0, len = a.length; k < len; i = ++k) {
    ai = a[i];
    results.push(ai + b[i]);
  }
  return results;
};

geom.sub = function(a, b) {
  return geom.plus(a, geom.mul(b, -1));
};

geom.dot = function(a, b) {
  var ai, i;
  return ((function() {
    var k, len, results;
    results = [];
    for (i = k = 0, len = a.length; k < len; i = ++k) {
      ai = a[i];
      results.push(ai * b[i]);
    }
    return results;
  })()).reduce(geom.sum);
};

geom.distsq = function(a, b) {
  return geom.magsq(geom.sub(a, b));
};

geom.dist = function(a, b) {
  return Math.sqrt(geom.distsq(a, b));
};

geom.dir = function(a, b) {
  return geom.unit(geom.sub(b, a));
};

geom.ang = function(a, b) {
  var ref, ua, ub, v;
  ref = (function() {
    var k, len, ref, results;
    ref = [a, b];
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      v = ref[k];
      results.push(geom.unit(v));
    }
    return results;
  })(), ua = ref[0], ub = ref[1];
  if (!((ua != null) && (ub != null))) {
    return null;
  }
  return Math.acos(geom.dot(ua, ub));
};

geom.cross = function(a, b) {
  var i, j, k, len, next, next2, ref, ref1, results;
  ref = [0, 1, 2];
  results = [];
  for (k = 0, len = ref.length; k < len; k++) {
    i = ref[k];
    ref1 = (function() {
      var l, len1, ref1, results1;
      ref1 = [1, 2];
      results1 = [];
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        j = ref1[l];
        results1.push(geom.next(i, 3, j));
      }
      return results1;
    })(), next = ref1[0], next2 = ref1[1];
    results.push(a[next] * b[next2] - a[next2] * b[next]);
  }
  return results;
};

geom.parallel = function(a, b, eps) {
  var ref, ua, ub, v;
  if (eps == null) {
    eps = EPS;
  }
  ref = (function() {
    var k, len, ref, results;
    ref = [a, b];
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      v = ref[k];
      results.push(geom.unit(v));
    }
    return results;
  })(), ua = ref[0], ub = ref[1];
  if (!((ua != null) && (ub != null))) {
    return null;
  }
  return 1 - Math.abs(geom.dot(ua, ub)) < eps;
};

geom.rotate = function(a, u, t) {
  var ct, i, k, len, p, q, ref, ref1, results, st;
  u = geom.unit(u);
  if (u == null) {
    return null;
  }
  ref = [Math.cos(t), Math.sin(t)], ct = ref[0], st = ref[1];
  ref1 = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
  results = [];
  for (k = 0, len = ref1.length; k < len; k++) {
    p = ref1[k];
    results.push(((function() {
      var l, len1, ref2, results1;
      ref2 = [ct, -st * u[p[2]], st * u[p[1]]];
      results1 = [];
      for (i = l = 0, len1 = ref2.length; l < len1; i = ++l) {
        q = ref2[i];
        results1.push(a[p[i]] * (a[p[0]] * a[p[i]] * (1 - ct) + q));
      }
      return results1;
    })()).reduce(geom.sum));
  }
  return results;
};

geom.interiorAngle = function(a, b, c) {
  var ang;
  ang = geom.ang2D(geom.sub(a, b)) - geom.ang2D(geom.sub(c, b));
  return ang + (ang < 0 ? 2 * Math.PI : 0);
};

geom.turnAngle = function(a, b, c) {
  return Math.PI - geom.interiorAngle(a, b, c);
};

geom.triangleNormal = function(a, b, c) {
  return geom.unit(geom.cross(geom.sub(b, a), geom.sub(c, b)));
};

geom.twiceSignedArea = function(points) {
  var i, v0, v1;
  return ((function() {
    var k, len, results;
    results = [];
    for (i = k = 0, len = points.length; k < len; i = ++k) {
      v0 = points[i];
      v1 = points[geom.next(i, points.length)];
      results.push(v0[0] * v1[1] - v1[0] * v0[1]);
    }
    return results;
  })()).reduce(geom.sum);
};

geom.polygonOrientation = function(points) {
  return Math.sign(geom.twiceSignedArea(points));
};

geom.sortByAngle = function(points, origin, mapping) {
  if (origin == null) {
    origin = [0, 0];
  }
  if (mapping == null) {
    mapping = function(x) {
      return x;
    };
  }
  origin = mapping(origin);
  return points.sort(function(p, q) {
    var pa, qa;
    pa = geom.ang2D(geom.sub(mapping(p), origin));
    qa = geom.ang2D(geom.sub(mapping(q), origin));
    return pa - qa;
  });
};

geom.segmentsCross = function(arg, arg1) {
  var p0, p1, q0, q1;
  p0 = arg[0], q0 = arg[1];
  p1 = arg1[0], q1 = arg1[1];
  if (geom.rangesDisjoint([p0[0], q0[0]], [p1[0], q1[0]]) || geom.rangesDisjoint([p0[1], q0[1]], [p1[1], q1[1]])) {
    return false;
  }
  return geom.polygonOrientation([p0, q0, p1]) !== geom.polygonOrientation([p0, q0, q1]) && geom.polygonOrientation([p1, q1, p0]) !== geom.polygonOrientation([p1, q1, q0]);
};

geom.parametricLineIntersect = function(arg, arg1) {
  var denom, p1, p2, q1, q2;
  p1 = arg[0], p2 = arg[1];
  q1 = arg1[0], q2 = arg1[1];
  denom = (q2[1] - q1[1]) * (p2[0] - p1[0]) + (q1[0] - q2[0]) * (p2[1] - p1[1]);
  if (denom === 0) {
    return [null, null];
  } else {
    return [(q2[0] * (p1[1] - q1[1]) + q2[1] * (q1[0] - p1[0]) + q1[1] * p1[0] - p1[1] * q1[0]) / denom, (q1[0] * (p2[1] - p1[1]) + q1[1] * (p1[0] - p2[0]) + p1[1] * p2[0] - p2[1] * p1[0]) / denom];
  }
};

geom.segmentIntersectSegment = function(s1, s2) {
  var ref, s, t;
  ref = geom.parametricLineIntersect(s1, s2), s = ref[0], t = ref[1];
  if ((s != null) && ((0 <= s && s <= 1)) && ((0 <= t && t <= 1))) {
    return geom.linearInterpolate(s, s1[0], s1[1]);
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

geom.pointStrictlyInSegment = function(p, s, eps) {
  var v0, v1;
  if (eps == null) {
    eps = EPS;
  }
  v0 = geom.sub(p, s[0]);
  v1 = geom.sub(p, s[1]);
  return geom.parallel(v0, v1, eps) && geom.dot(v0, v1) < 0;
};

geom.centroid = function(points) {
  return geom.mul(points.reduce(geom.plus), 1.0 / points.length);
};

geom.dimension = function(ps, eps) {
  var d, ds, n, ns, p;
  if (eps == null) {
    eps = EPS;
  }
  ds = (function() {
    var k, len, results;
    results = [];
    for (k = 0, len = ps.length; k < len; k++) {
      p = ps[k];
      if (geom.distsq(p, ps[0]) > eps) {
        results.push(geom.dir(p, ps[0]));
      }
    }
    return results;
  })();
  if (ds.length === 0) {
    return [0, ps[0]];
  }
  if (((function() {
    var k, len, results;
    results = [];
    for (k = 0, len = ds.length; k < len; k++) {
      d = ds[k];
      results.push(geom.parallel(d, ds[0]));
    }
    return results;
  })()).reduce(geom.all)) {
    return [1, ds[0]];
  }
  ns = (function() {
    var k, len, results;
    results = [];
    for (k = 0, len = ds.length; k < len; k++) {
      d = ds[k];
      if (!geom.parallel(d, ds[0])) {
        results.push(geom.unit(geom.cross(d, ds[0])));
      }
    }
    return results;
  })();
  if (((function() {
    var k, len, results;
    results = [];
    for (k = 0, len = ns.length; k < len; k++) {
      n = ns[k];
      results.push(geom.parallel(n, ns[0]));
    }
    return results;
  })()).reduce(geom.all)) {
    return [2, ns[0]];
  }
  return [3, null];
};

geom.above = function(ps, qs, n, eps) {
  var pn, qn, ref, v, vs;
  if (eps == null) {
    eps = EPS;
  }
  ref = (function() {
    var k, len, ref, results;
    ref = [ps, qs];
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      vs = ref[k];
      results.push((function() {
        var l, len1, results1;
        results1 = [];
        for (l = 0, len1 = vs.length; l < len1; l++) {
          v = vs[l];
          results1.push(geom.dot(v, n));
        }
        return results1;
      })());
    }
    return results;
  })(), pn = ref[0], qn = ref[1];
  return qn.reduce(geom.max) - pn.reduce(geom.min) < eps;
};

geom.sepNormal = function(t1, t2, eps) {
  var d, e1, e2, i, k, l, len, len1, len2, len3, len4, m, n, o, p, q, r, ref, ref1, ref2, ref3, ref4, t, w, x1, x2;
  if (eps == null) {
    eps = EPS;
  }
  ref = geom.dimension(t1.concat(t2)), d = ref[0], n = ref[1];
  switch (d) {
    case 0:
      return [d, true, n];
    case 1:
      return [d, true, n];
    case 2:
      ref1 = [t1, t2];
      for (k = 0, len = ref1.length; k < len; k++) {
        t = ref1[k];
        for (i = l = 0, len1 = t.length; l < len1; i = ++l) {
          p = t[i];
          m = geom.unit(geom.cross(geom.unit(geom.sub(t[geom.next(i, 3)], p)), n));
          if (geom.above(t1, t2, m, eps)) {
            return [d, true, m];
          }
          if (geom.above(t2, t1, m, eps)) {
            return [d, true, geom.mul(m, -1)];
          }
        }
      }
      break;
    case 3:
      ref2 = [[t1, t2], [t2, t1]];
      for (o = 0, len2 = ref2.length; o < len2; o++) {
        ref3 = ref2[o], x1 = ref3[0], x2 = ref3[1];
        for (i = r = 0, len3 = x1.length; r < len3; i = ++r) {
          p = x1[i];
          for (w = 0, len4 = x2.length; w < len4; w++) {
            q = x2[w];
            ref4 = [geom.sub(x1[geom.next(i, 3)], p), geom.sub(q, p)], e1 = ref4[0], e2 = ref4[1];
            if (geom.magsq(e1) > eps && geom.magsq(e2) > eps && !geom.parallel(e1, e2)) {
              m = geom.unit(geom.cross(e1, e2));
              if (geom.above(t1, t2, m, eps)) {
                return [d, true, m];
              }
              if (geom.above(t2, t1, m, eps)) {
                return [d, true, geom.mul(m, -1)];
              }
            }
          }
        }
      }
  }
  return [d, false, n];
};

geom.circleCross = function(d, r1, r2) {
  var x, y;
  x = (d * d - r2 * r2 + r1 * r1) / d / 2;
  y = Math.sqrt(r1 * r1 - x * x);
  return [x, y];
};

geom.creaseDir = function(u1, u2, a, b, eps) {
  var b1, b2, x, y, z, zmag;
  if (eps == null) {
    eps = EPS;
  }
  b1 = Math.cos(a) + Math.cos(b);
  b2 = Math.cos(a) - Math.cos(b);
  x = geom.plus(u1, u2);
  y = geom.sub(u1, u2);
  z = geom.unit(geom.cross(y, x));
  x = geom.mul(x, b1 / geom.magsq(x));
  y = geom.mul(y, geom.magsq(y) < eps ? 0 : b2 / geom.magsq(y));
  zmag = Math.sqrt(1 - geom.magsq(x) - geom.magsq(y));
  z = geom.mul(z, zmag);
  return [x, y, z].reduce(geom.plus);
};

geom.quadSplit = function(u, p, d, t) {
  if (geom.magsq(p) > d * d) {
    throw new Error("STOP! Trying to split expansive quad.");
  }
  return geom.mul(u, (d * d - geom.magsq(p)) / 2 / (d * Math.cos(t) - geom.dot(u, p)));
};


},{}],5:[function(require,module,exports){
var DOMParser, convert, filter, oripa, ref, x, y;

if (typeof DOMParser === "undefined" || DOMParser === null) {
  DOMParser = require('xmldom').DOMParser;
}

convert = require('./convert');

filter = require('./filter');

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

oripa.toFold = function(oripaStr) {
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
  xml = new DOMParser().parseFromString(oripaStr, 'text/xml');
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
                    fold.edges_assignment.push(oripa.type2fold[type]);
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
  filter.collapseNearbyVertices(fold, oripa.POINT_EPS);
  filter.subdivideCrossingEdges_vertices(fold, oripa.POINT_EPS);
  convert.vertices_vertices_to_faces_vertices(fold);
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


},{"./convert":2,"./filter":3,"xmldom":1}],6:[function(require,module,exports){
var DEFAULTS, STYLES, SVGNS, geom, viewer;

geom = require('./geom');

viewer = exports;

STYLES = {
  vert: "fill: white; r: 0.03; stroke: black; stroke-width: 0.005;",
  face: "stroke: none; fill-opacity: 0.8;",
  top: "fill: cyan;",
  bot: "fill: yellow;",
  edge: "fill: none; stroke-width: 0.01; stroke-linecap: round;",
  axis: "fill: none; stroke-width: 0.01; stroke-linecap: round;",
  text: "fill: black; font-size: 0.04; text-anchor: middle; font-family: sans-serif;",
  B: "stroke: black;",
  V: "stroke: blue;",
  M: "stroke: red;",
  U: "stroke: white",
  ax: "stroke: blue;",
  ay: "stroke: red;",
  az: "stroke: green;"
};


/* UTILITIES */

viewer.processInput = function(text, view) {
  view.fold = JSON.parse(text);
  view.model = viewer.makeModel(view.fold);
  viewer.addRotation(view);
  viewer.draw(view);
  return viewer.update(view);
};

viewer.importURL = function(url, view) {
  var xhr;
  xhr = new XMLHttpRequest();
  xhr.onload = (function(_this) {
    return function(e) {
      return viewer.processInput(e.target.responseText, view);
    };
  })(this);
  xhr.open('GET', url);
  return xhr.send();
};

viewer.getId = function(id) {
  return document.getElementById(id);
};

viewer.importFile = function(file, view) {
  var file_reader;
  file_reader = new FileReader();
  file_reader.onload = (function(_this) {
    return function(e) {
      return viewer.processInput(e.target.result, view);
    };
  })(this);
  return file_reader.readAsText(file);
};

viewer.setAttrs = function(el, attrs) {
  var k, v;
  for (k in attrs) {
    v = attrs[k];
    el.setAttribute(k, v);
  }
  return el;
};

viewer.appendHTML = function(el, tag, attrs) {
  return el.appendChild(viewer.setAttrs(document.createElement(tag), attrs));
};

SVGNS = 'http://www.w3.org/2000/svg';

viewer.appendSVG = function(el, tag, attrs) {
  return el.appendChild(viewer.setAttrs(document.createElementNS(SVGNS, tag), attrs));
};

viewer.appendButton = function(el, value, callback) {
  return viewer.appendHTML(el, 'input', {
    type: 'button',
    value: value
  }).addEventListener('click', callback);
};

viewer.makePath = function(coords) {
  var c, i;
  return ((function() {
    var len, o, results;
    results = [];
    for (i = o = 0, len = coords.length; o < len; i = ++o) {
      c = coords[i];
      results.push((i === 0 ? 'M' : 'L') + " " + c[0] + " " + c[1] + " ");
    }
    return results;
  })()).reduce(geom.sum);
};


/* CAMERA FUNCTIONS */

viewer.initCam = function() {
  return {
    c: [0, 0, 0],
    x: [1, 0, 0],
    y: [0, 1, 0],
    z: [0, 0, 1],
    rad: 1,
    last: null,
    show: {
      faces: true,
      edges: true,
      vertices: false,
      faceText: false
    }
  };
};

viewer.proj = function(p, cam) {
  return [geom.dot(geom.sub(p, cam.c), cam.x), -geom.dot(geom.sub(p, cam.c), cam.y), 0];
};

viewer.setCamXY = function(cam, x, y) {
  var ref;
  return ref = [x, y, geom.cross(x, y)], cam.x = ref[0], cam.y = ref[1], cam.z = ref[2], ref;
};

viewer.addRotation = function(view) {
  var cam, len, o, ref, s, svg;
  svg = view.svg, cam = view.cam;
  ref = ['contextmenu', 'selectstart', 'dragstart'];
  for (o = 0, len = ref.length; o < len; o++) {
    s = ref[o];
    svg.addEventListener(s, function(e) {
      return e.preventDefault();
    });
  }
  svg.addEventListener('mousedown', (function(_this) {
    return function(e) {
      return cam.last = [e.clientX, e.clientY];
    };
  })(this));
  svg.addEventListener('mousemove', (function(_this) {
    return function(e) {
      return viewer.rotateCam([e.clientX, e.clientY], view);
    };
  })(this));
  return svg.addEventListener('mouseup', (function(_this) {
    return function(e) {
      viewer.rotateCam([e.clientX, e.clientY], view);
      return cam.last = null;
    };
  })(this));
};

viewer.rotateCam = function(p, view) {
  var c, cam, d, ref, u, x, y;
  cam = view.cam;
  if (cam.last == null) {
    return;
  }
  d = geom.sub(p, cam.last);
  if (!geom.mag(d) > 0) {
    return;
  }
  u = geom.unit(geom.plus(geom.mul(cam.x, -d[1]), geom.mul(cam.y, -d[0])));
  ref = (function() {
    var len, o, ref, results;
    ref = ['x', 'y'];
    results = [];
    for (o = 0, len = ref.length; o < len; o++) {
      c = ref[o];
      results.push(geom.rotate(cam[c], u, geom.mag(d) * 0.01));
    }
    return results;
  })(), x = ref[0], y = ref[1];
  viewer.setCamXY(cam, x, y);
  cam.last = p;
  return viewer.update(view);
};


/* VIEWER FUNCTIONS */

DEFAULTS = {
  viewButtons: true,
  axisButtons: true,
  attrViewer: true,
  examples: true,
  "import": true,
  "export": true
};

viewer.addViewer = function(div, fold, options) {
  var axes, inputDiv, len, len1, o, q, ref, ref1, select, toggleDiv, val, view;
  if (fold == null) {
    fold = null;
  }
  if (options == null) {
    options = {};
  }
  view = {
    cam: viewer.initCam(),
    fold: fold,
    options: DEFAULTS
  };
  viewer.setAttrs(view.options, options);
  if (view.options.viewButtons || view.options.axisButtons) {
    toggleDiv = viewer.appendHTML(div, 'div');
    toggleDiv.innerHtml = '';
    if (view.options.viewButtons) {
      toggleDiv.innerHtml += 'Toggle: ';
      ref = ['facesText', 'faces', 'edges', 'vertices'];
      for (o = 0, len = ref.length; o < len; o++) {
        val = ref[o];
        viewer.appendButton(toggleDiv, val, (function(_this) {
          return function(e) {
            view.cam.show[button] = !view.cam.show[button];
            return viewer.update(view);
          };
        })(this));
      }
    }
    if (view.options.axisButtons) {
      toggleDiv.innerHTML += 'View: ';
      axes = [[0, 1, 0], [0, 0, 1], [1, 0, 0]];
      ref1 = ['x', 'y', 'z'];
      for (q = 0, len1 = ref1.length; q < len1; q++) {
        val = ref1[q];
        viewer.appendButton(toggleDiv, val, (function(_this) {
          return function(e) {
            viewer.setCamXY(cam, axes[i], axes[geom.next(i, 3)]);
            return viewer.update(view);
          };
        })(this));
      }
    }
  }
  if (view.options.examples || view.options["import"]) {
    inputDiv = viewer.appendHTML(div, 'div');
    if (view.options.examples) {
      select = viewer.appendHTML(inputDiv, 'select');
      select.addEventListener('change', (function(_this) {
        return function(e) {
          return viewer.importURL(select.value, view);
        };
      })(this));
      viewer.appendHTML(select, 'option', {
        value: '../examples/simple.fold'
      }).innerHTML = 'Default';
      viewer.appendHTML(select, 'option', {
        value: '../examples/box.fold'
      }).innerHTML = 'Flexicube Unit';
    }
    if (view.options["import"]) {
      viewer.appendHTML(inputDiv, 'input', {
        type: 'file'
      }).addEventListener('change', (function(_this) {
        return function(e) {
          return viewer.importFile(e.target.files[0], view);
        };
      })(this));
    }
  }
  view.svg = viewer.appendSVG(div, 'svg', {
    xmlns: SVGNS
  });
  return viewer.importURL(select.value, view);
};

viewer.faceAbove = function(f1, f2, n) {
  var disjoint, dp, dv, f, np, nv, ord, p1, p2, ref, ref1, ref2, ref3, v, v1, v2;
  ref = (function() {
    var len, o, ref, results;
    ref = [f1, f2];
    results = [];
    for (o = 0, len = ref.length; o < len; o++) {
      f = ref[o];
      results.push((function() {
        var len1, q, ref1, results1;
        ref1 = f.vs;
        results1 = [];
        for (q = 0, len1 = ref1.length; q < len1; q++) {
          v = ref1[q];
          results1.push(v.ps);
        }
        return results1;
      })());
    }
    return results;
  })(), p1 = ref[0], p2 = ref[1];
  ref1 = geom.sepNormal(p1, p2), dp = ref1[0], disjoint = ref1[1], np = ref1[2];
  if (disjoint) {
    return null;
  }
  ref2 = (function() {
    var len, o, ref2, results;
    ref2 = [f1, f2];
    results = [];
    for (o = 0, len = ref2.length; o < len; o++) {
      f = ref2[o];
      results.push((function() {
        var len1, q, ref3, results1;
        ref3 = f.vs;
        results1 = [];
        for (q = 0, len1 = ref3.length; q < len1; q++) {
          v = ref3[q];
          results1.push(v.cs);
        }
        return results1;
      })());
    }
    return results;
  })(), v1 = ref2[0], v2 = ref2[1];
  ref3 = geom.sepNormal(v1, v2), dv = ref3[0], disjoint = ref3[1], nv = ref3[2];
  if ((dv === 3) && disjoint) {
    return 0 > geom.dot(nv, n);
  }
  ord = f1.ord["" + f2.i];
  if ((dv === 2) && (ord != null)) {
    return 0 < geom.dot(f1.n, n) * ord;
  }
  return null;
};

viewer.makeModel = function(fold) {
  var a, b, cs, f, i, i1, j, j1, l, len, len1, len2, len3, len4, len5, m, o, q, r, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, v, vs, w, z;
  m = {
    vs: null,
    fs: null,
    es: {}
  };
  m.vs = (function() {
    var len, o, ref, results;
    ref = fold.vertices_coords;
    results = [];
    for (i = o = 0, len = ref.length; o < len; i = ++o) {
      cs = ref[i];
      results.push({
        i: i,
        cs: cs
      });
    }
    return results;
  })();
  ref = m.vs;
  for (i = o = 0, len = ref.length; o < len; i = ++o) {
    v = ref[i];
    if (v.cs.length === 2) {
      m.vs[i].cs[2] = 0;
    }
  }
  m.fs = (function() {
    var len1, q, ref1, results;
    ref1 = fold.faces_vertices;
    results = [];
    for (i = q = 0, len1 = ref1.length; q < len1; i = ++q) {
      vs = ref1[i];
      results.push({
        i: i,
        vs: (function() {
          var len2, r, results1;
          results1 = [];
          for (r = 0, len2 = vs.length; r < len2; r++) {
            v = vs[r];
            results1.push(m.vs[v]);
          }
          return results1;
        })()
      });
    }
    return results;
  })();
  if (fold.edges_vertices != null) {
    ref1 = fold.edges_vertices;
    for (i = q = 0, len1 = ref1.length; q < len1; i = ++q) {
      v = ref1[i];
      ref2 = v[0] > v[1] ? [v[1], v[0]] : [v[0], v[1]], a = ref2[0], b = ref2[1];
      m.es["e" + a + "e" + b] = {
        v1: m.vs[a],
        v2: m.vs[b],
        as: fold.edges_assignment[i]
      };
    }
  } else {
    ref3 = m.fs;
    for (i = r = 0, len2 = ref3.length; r < len2; i = ++r) {
      f = ref3[i];
      ref4 = f.vs;
      for (j = z = 0, len3 = ref4.length; z < len3; j = ++z) {
        v = ref4[j];
        w = f.vs[geom.next(j, f.vs.length)];
        ref5 = v.i > w.i ? [w, v] : [v, w], a = ref5[0], b = ref5[1];
        m.es["e" + a.i + "e" + b.i] = {
          v1: a,
          v2: b,
          as: 'B'
        };
      }
    }
  }
  ref6 = m.fs;
  for (i = i1 = 0, len4 = ref6.length; i1 < len4; i = ++i1) {
    f = ref6[i];
    m.fs[i].n = geom.triangleNormal.apply(geom, (function() {
      var j1, len5, ref7, results;
      ref7 = f.vs;
      results = [];
      for (j1 = 0, len5 = ref7.length; j1 < len5; j1++) {
        v = ref7[j1];
        results.push(v.cs);
      }
      return results;
    })());
    m.fs[i].c = geom.centroid((function() {
      var j1, len5, ref7, results;
      ref7 = f.vs;
      results = [];
      for (j1 = 0, len5 = ref7.length; j1 < len5; j1++) {
        v = ref7[j1];
        results.push(v.cs);
      }
      return results;
    })());
    m.fs[i].es = {};
    m.fs[i].es = (function() {
      var j1, len5, ref7, ref8, results;
      ref7 = f.vs;
      results = [];
      for (j = j1 = 0, len5 = ref7.length; j1 < len5; j = ++j1) {
        v = ref7[j];
        w = f.vs[geom.next(j, f.vs.length)];
        ref8 = v.i > w.i ? [w, v] : [v, w], a = ref8[0], b = ref8[1];
        results.push(m.es["e" + a.i + "e" + b.i]);
      }
      return results;
    })();
    m.fs[i].ord = {};
  }
  if (fold.faceOrders != null) {
    ref7 = fold.faceOrders;
    for (j1 = 0, len5 = ref7.length; j1 < len5; j1++) {
      l = ref7[j1];
      if (l[2] !== 0) {
        m.fs[l[0]].ord["" + l[1]] = l[2];
      }
    }
  }
  return m;
};

viewer.orderFaces = function(faces, direction) {
  var c, f, f1, f1_above, f2, i, j, len, len1, len2, o, p, q, r, ref;
  for (o = 0, len = faces.length; o < len; o++) {
    f = faces[o];
    f.children = [];
  }
  for (i = q = 0, len1 = faces.length; q < len1; i = ++q) {
    f1 = faces[i];
    for (j = r = 0, len2 = faces.length; r < len2; j = ++r) {
      f2 = faces[j];
      if (!(j > i)) {
        continue;
      }
      f1_above = viewer.faceAbove(f1, f2, direction);
      if (f1_above != null) {
        ref = f1_above ? [f1, f2] : [f2, f1], p = ref[0], c = ref[1];
        p.children = p.children.concat([c]);
      }
    }
  }
  return geom.topologicalSort(faces);
};

viewer.draw = function(arg) {
  var c, cam, e, f, g, i, j, k, len, len1, len2, len3, max, min, model, o, pc, q, r, ref, ref1, ref2, ref3, results, style, svg, t, v, z;
  svg = arg.svg, cam = arg.cam, model = arg.model;
  svg.innerHTML = '';
  style = viewer.appendSVG(svg, 'style');
  for (k in STYLES) {
    v = STYLES[k];
    style.innerHTML += "." + k + "{" + v + "}\n";
  }
  min = (function() {
    var len, o, ref, results;
    ref = [0, 1, 2];
    results = [];
    for (o = 0, len = ref.length; o < len; o++) {
      i = ref[o];
      results.push(((function() {
        var len1, q, ref1, results1;
        ref1 = model.vs;
        results1 = [];
        for (q = 0, len1 = ref1.length; q < len1; q++) {
          v = ref1[q];
          results1.push(v.cs[i]);
        }
        return results1;
      })()).reduce(geom.min));
    }
    return results;
  })();
  max = (function() {
    var len, o, ref, results;
    ref = [0, 1, 2];
    results = [];
    for (o = 0, len = ref.length; o < len; o++) {
      i = ref[o];
      results.push(((function() {
        var len1, q, ref1, results1;
        ref1 = model.vs;
        results1 = [];
        for (q = 0, len1 = ref1.length; q < len1; q++) {
          v = ref1[q];
          results1.push(v.cs[i]);
        }
        return results1;
      })()).reduce(geom.max));
    }
    return results;
  })();
  cam.c = geom.mul(geom.plus(min, max), 0.5);
  cam.r = geom.mag(geom.sub(max, min)) / 2 * 1.05;
  pc = viewer.proj(cam.c, cam);
  viewer.setAttrs(svg, {
    viewBox: (pc[0] - cam.r) + "," + (pc[1] - cam.r) + "," + (2 * cam.r) + "," + (2 * cam.r)
  });
  t = "translate(0,0.01)";
  ref = model.fs;
  for (i = o = 0, len = ref.length; o < len; i = ++o) {
    f = ref[i];
    g = viewer.appendSVG(svg, 'g');
    f.path = viewer.appendSVG(g, 'path');
    f.text = viewer.appendSVG(g, 'text', {
      "class": 'text',
      transform: t
    });
    f.text.innerHTML = "f" + f.i;
    ref1 = f.es;
    for (j = q = 0, len1 = ref1.length; q < len1; j = ++q) {
      e = ref1[j];
      if (e.path == null) {
        e.path = viewer.appendSVG(g, 'path');
      }
    }
    ref2 = f.vs;
    for (j = r = 0, len2 = ref2.length; r < len2; j = ++r) {
      v = ref2[j];
      if (!(v.path == null)) {
        continue;
      }
      v.path = viewer.appendSVG(g, 'circle', {
        "class": 'vert'
      });
      v.text = viewer.appendSVG(g, 'text', {
        transform: 'translate(0, 0.01)',
        "class": 'text'
      });
      v.text.innerHTML = "" + v.i;
    }
    model.fs[i].svg = g;
  }
  g = viewer.appendSVG(svg, 'g', {
    transform: 'translate(-0.9,-0.9)'
  });
  ref3 = ['x', 'y', 'z'];
  results = [];
  for (z = 0, len3 = ref3.length; z < len3; z++) {
    c = ref3[z];
    results.push(viewer.appendSVG(g, 'path', {
      id: "a" + c,
      "class": "a" + c + " axis"
    }));
  }
  return results;
};

viewer.update = function(arg) {
  var attr, c, cam, e, end, f, i, i1, j, j1, len, len1, len2, len3, len4, len5, model, o, p, q, r, ref, ref1, ref2, ref3, ref4, ref5, ref6, results, show, svg, v, visibleSide, z;
  model = arg.model, cam = arg.cam, svg = arg.svg;
  ref = model.vs;
  for (i = o = 0, len = ref.length; o < len; i = ++o) {
    v = ref[i];
    model.vs[i].ps = viewer.proj(v.cs, cam);
  }
  ref1 = model.fs;
  for (i = q = 0, len1 = ref1.length; q < len1; i = ++q) {
    f = ref1[i];
    model.fs[i].c2 = viewer.proj(f.c, cam);
  }
  viewer.orderFaces(model.fs, cam.z);
  show = {};
  ref2 = ['faceText', 'faces', 'edges', 'vertices'];
  for (r = 0, len2 = ref2.length; r < len2; r++) {
    attr = ref2[r];
    show[attr] = cam.show[attr] ? 'visible' : 'hidden';
  }
  ref3 = model.fs;
  for (i = z = 0, len3 = ref3.length; z < len3; i = ++z) {
    f = ref3[i];
    if (!(f.path != null)) {
      continue;
    }
    visibleSide = geom.dot(f.n, cam.z) > 0 ? 'top' : 'bot';
    viewer.setAttrs(f.text, {
      x: f.c2[0],
      y: f.c2[1],
      visibility: show.faceText
    });
    viewer.setAttrs(f.path, {
      d: viewer.makePath((function() {
        var i1, len4, ref4, results;
        ref4 = f.vs;
        results = [];
        for (i1 = 0, len4 = ref4.length; i1 < len4; i1++) {
          v = ref4[i1];
          results.push(v.ps);
        }
        return results;
      })()) + 'Z',
      visibility: show.faces,
      "class": "face " + visibleSide
    });
    ref4 = f.es;
    for (j = i1 = 0, len4 = ref4.length; i1 < len4; j = ++i1) {
      e = ref4[j];
      viewer.setAttrs(e.path, {
        d: viewer.makePath([e.v1.ps, e.v2.ps]),
        visibility: show.edges,
        "class": "edge " + e.as
      });
    }
    ref5 = f.vs;
    for (j = j1 = 0, len5 = ref5.length; j1 < len5; j = ++j1) {
      v = ref5[j];
      viewer.setAttrs(v.path, {
        cx: v.ps[0],
        cy: v.ps[1],
        visibility: show.vertices
      });
      viewer.setAttrs(v.text, {
        x: v.ps[1],
        y: v.ps[1],
        visibility: show.vertices
      });
    }
  }
  ref6 = {
    x: [1, 0, 0],
    y: [0, 1, 0],
    z: [0, 0, 1]
  };
  results = [];
  for (c in ref6) {
    v = ref6[c];
    end = geom.plus(geom.mul(v, 0.05), cam.c);
    results.push(viewer.setAttrs(document.getElementById("a" + c), {
      d: viewer.makePath((function() {
        var k1, len6, ref7, results1;
        ref7 = [cam.c, end];
        results1 = [];
        for (k1 = 0, len6 = ref7.length; k1 < len6; k1++) {
          p = ref7[k1];
          results1.push(viewer.proj(p, cam));
        }
        return results1;
      })())
    }));
  }
  return results;
};


},{"./geom":4}],"fold":[function(require,module,exports){
module.exports = {
  geom: require('./geom'),
  viewer: require('./viewer'),
  filter: require('./filter'),
  convert: require('./convert'),
  file: require('./file')
};


},{"./convert":2,"./file":1,"./filter":3,"./geom":4,"./viewer":6}]},{},[]);
