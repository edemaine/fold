require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
  /* FOLD FORMAT MANIPULATORS */
var convert, filter, geom,
  modulo = function(a, b) { return (+a % (b = +b) + b) % b; },
  hasProp = {}.hasOwnProperty;

geom = require('./geom');

filter = require('./filter');

convert = exports;

convert.edges_vertices_to_vertices_vertices_unsorted = function(fold) {
  /*
  Works for abstract structures, so NOT SORTED.
  Use sort_vertices_vertices to sort in counterclockwise order.
  */
  fold.vertices_vertices = filter.edges_vertices_to_vertices_vertices(fold);
  return fold;
};

convert.edges_vertices_to_vertices_edges_unsorted = function(fold) {
  /*
  Invert edges_vertices into vertices_edges.
  Works for abstract structures, so NOT SORTED.
  */
  fold.vertices_edges = filter.edges_vertices_to_vertices_edges(fold);
  return fold;
};

convert.edges_vertices_to_vertices_vertices_sorted = function(fold) {
  /*
  Given a FOLD object with 2D `vertices_coords` and `edges_vertices` property
  (defining edge endpoints), automatically computes the `vertices_vertices`
  property and sorts them counterclockwise by angle in the plane.
  */
  convert.edges_vertices_to_vertices_vertices_unsorted(fold);
  return convert.sort_vertices_vertices(fold);
};

convert.edges_vertices_to_vertices_edges_sorted = function(fold) {
  /*
  Given a FOLD object with 2D `vertices_coords` and `edges_vertices` property
  (defining edge endpoints), automatically computes the `vertices_edges`
  and `vertices_vertices` property and sorts them counterclockwise by angle
  in the plane.
  */
  convert.edges_vertices_to_vertices_vertices_sorted(fold);
  return convert.vertices_vertices_to_vertices_edges(fold);
};

convert.sort_vertices_vertices = function(fold) {
  var neighbors, ref, ref1, ref2, v;
  /*
  Sorts `fold.vertices_neighbords` in counterclockwise order using
  `fold.vertices_coordinates`.  2D only.
  Constructs `fold.vertices_neighbords` if absent, via
  `convert.edges_vertices_to_vertices_vertices`.
  */
  if (((ref = fold.vertices_coords) != null ? (ref1 = ref[0]) != null ? ref1.length : void 0 : void 0) !== 2) {
    throw new Error("sort_vertices_vertices: Vertex coordinates missing or not two dimensional");
  }
  if (fold.vertices_vertices == null) {
    convert.edges_vertices_to_vertices_vertices(fold);
  }
  ref2 = fold.vertices_vertices;
  for (v in ref2) {
    neighbors = ref2[v];
    geom.sortByAngle(neighbors, v, function(x) {
      return fold.vertices_coords[x];
    });
  }
  return fold;
};

convert.vertices_vertices_to_faces_vertices = function(fold) {
  /*
  Given a FOLD object with counterclockwise-sorted `vertices_vertices`
  property, constructs the implicitly defined faces, setting `faces_vertices`
  property.
  */
  var face, i, j, k, key, l, len, len1, len2, neighbors, next, ref, ref1, u, uv, v, w, x;
  next = {};
  ref = fold.vertices_vertices;
  for (v = j = 0, len = ref.length; j < len; v = ++j) {
    neighbors = ref[v];
    for (i = k = 0, len1 = neighbors.length; k < len1; i = ++k) {
      u = neighbors[i];
      next[`${u},${v}`] = neighbors[modulo(i - 1, neighbors.length)];
    }
  }
  //console.log u, v, neighbors[(i-1) %% neighbors.length]
  fold.faces_vertices = [];
  ref1 = (function() {
    var results;
    results = [];
    for (key in next) {
      results.push(key);
    }
    return results;
  })();
  //for uv, w of next
  for (l = 0, len2 = ref1.length; l < len2; l++) {
    uv = ref1[l];
    w = next[uv];
    if (w == null) {
      continue;
    }
    next[uv] = null;
    [u, v] = uv.split(',');
    u = parseInt(u);
    v = parseInt(v);
    face = [u, v];
    while (w !== face[0]) {
      if (w == null) {
        console.warn(`Confusion with face ${face}`);
        break;
      }
      face.push(w);
      [u, v] = [v, w];
      w = next[`${u},${v}`];
      next[`${u},${v}`] = null;
    }
    next[`${face[face.length - 1]},${face[0]}`] = null;
    //# Outside face is clockwise; exclude it.
    if ((w != null) && geom.polygonOrientation((function() {
      var len3, m, results;
      results = [];
      for (m = 0, len3 = face.length; m < len3; m++) {
        x = face[m];
        results.push(fold.vertices_coords[x]);
      }
      return results;
    })()) > 0) {
      //console.log face
      fold.faces_vertices.push(face);
    }
  }
  //else
  //  console.log face, 'clockwise'
  return fold;
};

convert.vertices_edges_to_faces_vertices_edges = function(fold) {
  /*
  Given a FOLD object with counterclockwise-sorted `vertices_edges` property,
  constructs the implicitly defined faces, setting both `faces_vertices`
  and `faces_edges` properties.  Handles multiple edges to the same vertex
  (unlike `FOLD.convert.vertices_vertices_to_faces_vertices`).
  */
  var e, e1, e2, edges, i, j, k, l, len, len1, len2, len3, m, neighbors, next, nexts, ref, ref1, v, vertex, vertices, x;
  next = [];
  ref = fold.vertices_edges;
  for (v = j = 0, len = ref.length; j < len; v = ++j) {
    neighbors = ref[v];
    next[v] = {};
    for (i = k = 0, len1 = neighbors.length; k < len1; i = ++k) {
      e = neighbors[i];
      next[v][e] = neighbors[modulo(i - 1, neighbors.length)];
    }
  }
  //console.log e, neighbors[(i-1) %% neighbors.length]
  fold.faces_vertices = [];
  fold.faces_edges = [];
  for (vertex = l = 0, len2 = next.length; l < len2; vertex = ++l) {
    nexts = next[vertex];
    for (e1 in nexts) {
      e2 = nexts[e1];
      if (e2 == null) {
        continue;
      }
      e1 = parseInt(e1);
      nexts[e1] = null;
      edges = [e1];
      vertices = [filter.edges_verticesIncident(fold.edges_vertices[e1], fold.edges_vertices[e2])];
      if (vertices[0] == null) {
        throw new Error(`Confusion at edges ${e1} and ${e2}`);
      }
      while (e2 !== edges[0]) {
        if (e2 == null) {
          console.warn(`Confusion with face containing edges ${edges}`);
          break;
        }
        edges.push(e2);
        ref1 = fold.edges_vertices[e2];
        for (m = 0, len3 = ref1.length; m < len3; m++) {
          v = ref1[m];
          if (v !== vertices[vertices.length - 1]) {
            vertices.push(v);
            break;
          }
        }
        e1 = e2;
        e2 = next[v][e1];
        next[v][e1] = null;
      }
      //# Move e1 to the end so that edges[0] connects vertices[0] to vertices[1]
      edges.push(edges.shift());
      //# Outside face is clockwise; exclude it.
      if ((e2 != null) && geom.polygonOrientation((function() {
        var len4, n, results;
        results = [];
        for (n = 0, len4 = vertices.length; n < len4; n++) {
          x = vertices[n];
          results.push(fold.vertices_coords[x]);
        }
        return results;
      })()) > 0) {
        //console.log vertices, edges
        fold.faces_vertices.push(vertices);
        fold.faces_edges.push(edges);
      }
    }
  }
  //else
  //  console.log face, 'clockwise'
  return fold;
};

convert.edges_vertices_to_faces_vertices = function(fold) {
  /*
  Given a FOLD object with 2D `vertices_coords` and `edges_vertices`,
  computes a counterclockwise-sorted `vertices_vertices` property and
  constructs the implicitly defined faces, setting `faces_vertices` property.
  */
  convert.edges_vertices_to_vertices_vertices_sorted(fold);
  return convert.vertices_vertices_to_faces_vertices(fold);
};

convert.edges_vertices_to_faces_vertices_edges = function(fold) {
  /*
  Given a FOLD object with 2D `vertices_coords` and `edges_vertices`,
  computes counterclockwise-sorted `vertices_vertices` and `vertices_edges`
  properties and constructs the implicitly defined faces, setting
  both `faces_vertices` and `faces_edges` property.
  */
  convert.edges_vertices_to_vertices_edges_sorted(fold);
  return convert.vertices_edges_to_faces_vertices_edges(fold);
};

convert.vertices_vertices_to_vertices_edges = function(fold) {
  /*
  Given a FOLD object with `vertices_vertices` and `edges_vertices`,
  fills in the corresponding `vertices_edges` property (preserving order).
  */
  var edge, edgeMap, i, j, len, ref, v1, v2, vertex, vertices;
  edgeMap = {};
  ref = fold.edges_vertices;
  for (edge = j = 0, len = ref.length; j < len; edge = ++j) {
    [v1, v2] = ref[edge];
    edgeMap[`${v1},${v2}`] = edge;
    edgeMap[`${v2},${v1}`] = edge;
  }
  return fold.vertices_edges = (function() {
    var k, len1, ref1, results;
    ref1 = fold.vertices_vertices;
    results = [];
    for (vertex = k = 0, len1 = ref1.length; k < len1; vertex = ++k) {
      vertices = ref1[vertex];
      results.push((function() {
        var l, ref2, results1;
        results1 = [];
        for (i = l = 0, ref2 = vertices.length; (0 <= ref2 ? l < ref2 : l > ref2); i = 0 <= ref2 ? ++l : --l) {
          results1.push(edgeMap[`${vertex},${vertices[i]}`]);
        }
        return results1;
      })());
    }
    return results;
  })();
};

convert.faces_vertices_to_faces_edges = function(fold) {
  /*
  Given a FOLD object with `faces_vertices` and `edges_vertices`,
  fills in the corresponding `faces_edges` property (preserving order).
  */
  var edge, edgeMap, face, i, j, len, ref, v1, v2, vertices;
  edgeMap = {};
  ref = fold.edges_vertices;
  for (edge = j = 0, len = ref.length; j < len; edge = ++j) {
    [v1, v2] = ref[edge];
    edgeMap[`${v1},${v2}`] = edge;
    edgeMap[`${v2},${v1}`] = edge;
  }
  return fold.faces_edges = (function() {
    var k, len1, ref1, results;
    ref1 = fold.faces_vertices;
    results = [];
    for (face = k = 0, len1 = ref1.length; k < len1; face = ++k) {
      vertices = ref1[face];
      results.push((function() {
        var l, ref2, results1;
        results1 = [];
        for (i = l = 0, ref2 = vertices.length; (0 <= ref2 ? l < ref2 : l > ref2); i = 0 <= ref2 ? ++l : --l) {
          results1.push(edgeMap[`${vertices[i]},${vertices[(i + 1) % vertices.length]}`]);
        }
        return results1;
      })());
    }
    return results;
  })();
};

convert.faces_vertices_to_edges = function(mesh) {
  var edge, edgeMap, face, i, key, ref, v1, v2, vertices;
  /*
  Given a FOLD object with just `faces_vertices`, automatically fills in
  `edges_vertices`, `edges_faces`, `faces_edges`, and `edges_assignment`
  (indicating which edges are boundary with 'B').
  This code currently assumes an orientable manifold, and uses nulls to
  represent missing neighbor faces in `edges_faces` (for boundary edges).
  */
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
          key = `${v1},${v2}`;
        } else {
          key = `${v2},${v1}`;
        }
        if (key in edgeMap) {
          edge = edgeMap[key];
          // Second instance of edge means not on boundary
          mesh.edges_assignment[edge] = null;
        } else {
          edge = edgeMap[key] = mesh.edges_vertices.length;
          if (v1 <= v2) {
            mesh.edges_vertices.push([v1, v2]);
          } else {
            mesh.edges_vertices.push([v2, v1]);
          }
          mesh.edges_faces.push([null, null]);
          // First instance of edge might be on boundary
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

convert.edges_vertices_to_edges_faces_edges = function(fold) {
  var edge, edgeMap, face, i, orient, ref, ref1, v1, v2, vertices;
  /*
  Given a `fold` object with `edges_vertices` and `faces_vertices`,
  fills in `faces_edges` and `edges_vertices`.
  */
  fold.edges_faces = (function() {
    var j, ref, results;
    results = [];
    for (edge = j = 0, ref = fold.edges_vertices.length; (0 <= ref ? j < ref : j > ref); edge = 0 <= ref ? ++j : --j) {
      results.push([null, null]);
    }
    return results;
  })();
  edgeMap = {};
  ref = fold.edges_vertices;
  for (edge in ref) {
    vertices = ref[edge];
    if (!(vertices != null)) {
      continue;
    }
    edge = parseInt(edge);
    edgeMap[`${vertices[0]},${vertices[1]}`] = [
      edge,
      0 // forward
    ];
    edgeMap[`${vertices[1]},${vertices[0]}`] = [
      edge,
      1 // backward
    ];
  }
  ref1 = fold.faces_vertices;
  for (face in ref1) {
    vertices = ref1[face];
    face = parseInt(face);
    fold.faces_edges[face] = (function() {
      var j, len, results;
      results = [];
      for (i = j = 0, len = vertices.length; j < len; i = ++j) {
        v1 = vertices[i];
        v2 = vertices[(i + 1) % vertices.length];
        [edge, orient] = edgeMap[`${v1},${v2}`];
        fold.edges_faces[edge][orient] = face;
        results.push(edge);
      }
      return results;
    })();
  }
  return fold;
};

convert.flatFoldedGeometry = function(fold, rootFace = 0) {
  var base, edge, edge2, face, face2, i, j, k, l, len, len1, len2, len3, len4, len5, len6, len7, level, m, mapped, maxError, n, nextLevel, o, orientation, p, q, ref, ref1, ref2, ref3, ref4, ref5, ref6, row, transform, vertex, vertex2;
  /*
  Assuming `fold` is a locally flat foldable crease pattern in the xy plane,
  sets `fold.vertices_flatFoldCoords` to give the flat-folded geometry
  as determined by repeated reflection relative to `rootFace`; sets
  `fold.faces_flatFoldTransform` transformation matrix mapping each face's
  unfolded --> folded geometry; and sets `fold.faces_flatFoldOrientation` to
  +1 or -1 to indicate whether each folded face matches its original
  orientation or is upside-down (so is oriented clockwise in 2D).

  Requires `fold` to have `vertices_coords` and `edges_vertices`;
  `edges_faces` and `faces_edges` will be created if they do not exist.

  Returns the maximum displacement error from closure constraints (multiple
  mappings of the same vertices, or multiple transformations of the same face).
  */
  if ((fold.vertices_coords != null) && (fold.edges_vertices != null) && !((fold.edges_faces != null) && (fold.faces_edges != null))) {
    convert.edges_vertices_to_edges_faces_edges(fold);
  }
  maxError = 0;
  level = [rootFace];
  fold.faces_flatFoldTransform = (function() {
    var j, ref, results;
    results = [];
    for (face = j = 0, ref = fold.faces_edges.length; (0 <= ref ? j < ref : j > ref); face = 0 <= ref ? ++j : --j) {
      results.push(null);
    }
    return results;
  })();
  fold.faces_flatFoldTransform[rootFace] = [
    [1,
    0,
    0],
    [
      0,
      1,
      0 // identity
    ]
  ];
  fold.faces_flatFoldOrientation = (function() {
    var j, ref, results;
    results = [];
    for (face = j = 0, ref = fold.faces_edges.length; (0 <= ref ? j < ref : j > ref); face = 0 <= ref ? ++j : --j) {
      results.push(null);
    }
    return results;
  })();
  fold.faces_flatFoldOrientation[rootFace] = +1;
  fold.vertices_flatFoldCoords = (function() {
    var j, ref, results;
    results = [];
    for (vertex = j = 0, ref = fold.vertices_coords.length; (0 <= ref ? j < ref : j > ref); vertex = 0 <= ref ? ++j : --j) {
      results.push(null);
    }
    return results;
  })();
  ref = fold.faces_edges[rootFace];
  // Use fold.faces_edges -> fold.edges_vertices, which are both needed below,
  // in case fold.faces_vertices isn't defined.
  for (j = 0, len = ref.length; j < len; j++) {
    edge = ref[j];
    ref1 = fold.edges_vertices[edge];
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      vertex = ref1[k];
      if ((base = fold.vertices_flatFoldCoords)[vertex] == null) {
        base[vertex] = fold.vertices_coords[vertex].slice(0);
      }
    }
  }
  while (level.length) {
    nextLevel = [];
    for (l = 0, len2 = level.length; l < len2; l++) {
      face = level[l];
      orientation = -fold.faces_flatFoldOrientation[face];
      ref2 = fold.faces_edges[face];
      for (m = 0, len3 = ref2.length; m < len3; m++) {
        edge = ref2[m];
        ref3 = fold.edges_faces[edge];
        for (n = 0, len4 = ref3.length; n < len4; n++) {
          face2 = ref3[n];
          if (!((face2 != null) && face2 !== face)) {
            continue;
          }
          transform = geom.matrixMatrix(fold.faces_flatFoldTransform[face], geom.matrixReflectLine(...((function() {
            var len5, o, ref4, results;
            ref4 = fold.edges_vertices[edge];
            results = [];
            for (o = 0, len5 = ref4.length; o < len5; o++) {
              vertex = ref4[o];
              results.push(fold.vertices_coords[vertex]);
            }
            return results;
          })())));
          if (fold.faces_flatFoldTransform[face2] != null) {
            ref4 = fold.faces_flatFoldTransform[face2];
            for (i = o = 0, len5 = ref4.length; o < len5; i = ++o) {
              row = ref4[i];
              maxError = Math.max(maxError, geom.dist(row, transform[i]));
            }
            if (orientation !== fold.faces_flatFoldOrientation[face2]) {
              maxError = Math.max(1, maxError);
            }
          } else {
            fold.faces_flatFoldTransform[face2] = transform;
            fold.faces_flatFoldOrientation[face2] = orientation;
            ref5 = fold.faces_edges[face2];
            for (p = 0, len6 = ref5.length; p < len6; p++) {
              edge2 = ref5[p];
              ref6 = fold.edges_vertices[edge2];
              for (q = 0, len7 = ref6.length; q < len7; q++) {
                vertex2 = ref6[q];
                mapped = geom.matrixVector(transform, fold.vertices_coords[vertex2]);
                if (fold.vertices_flatFoldCoords[vertex2] != null) {
                  maxError = Math.max(maxError, geom.dist(fold.vertices_flatFoldCoords[vertex2], mapped));
                } else {
                  fold.vertices_flatFoldCoords[vertex2] = mapped;
                }
              }
            }
            nextLevel.push(face2);
          }
        }
      }
    }
    level = nextLevel;
  }
  return maxError;
};

convert.deepCopy = function(fold) {
  var copy, item, j, key, len, ref, results, value;
  //# Given a FOLD object, make a copy that shares no pointers with the original.
  if ((ref = typeof fold) === 'number' || ref === 'string' || ref === 'boolean') {
    return fold;
  } else if (Array.isArray(fold)) {
    results = [];
    for (j = 0, len = fold.length; j < len; j++) {
      item = fold[j];
      results.push(convert.deepCopy(item)); // Object
    }
    return results;
  } else {
    copy = {};
    for (key in fold) {
      if (!hasProp.call(fold, key)) continue;
      value = fold[key];
      copy[key] = convert.deepCopy(value);
    }
    return copy;
  }
};

convert.toJSON = function(fold) {
  var key, obj, value;
  //# Convert FOLD object into a nicely formatted JSON string.
  return "{\n" + ((function() {
    var results;
    results = [];
    for (key in fold) {
      value = fold[key];
      results.push(`  ${JSON.stringify(key)}: ` + (Array.isArray(value) ? "[\n" + ((function() {
        var j, len, results1;
        results1 = [];
        for (j = 0, len = value.length; j < len; j++) {
          obj = value[j];
          results1.push(`    ${JSON.stringify(obj)}`);
        }
        return results1;
      })()).join(',\n') + "\n  ]" : JSON.stringify(value)));
    }
    return results;
  })()).join(',\n') + "\n}\n";
};

convert.extensions = {};

convert.converters = {};

convert.getConverter = function(fromExt, toExt) {
  if (fromExt === toExt) {
    return function(x) {
      return x;
    };
  } else {
    return convert.converters[`${fromExt}${toExt}`];
  }
};

convert.setConverter = function(fromExt, toExt, converter) {
  convert.extensions[fromExt] = true;
  convert.extensions[toExt] = true;
  return convert.converters[`${fromExt}${toExt}`] = converter;
};

convert.convertFromTo = function(data, fromExt, toExt) {
  var converter;
  if (fromExt[0] !== '.') {
    fromExt = `.${fromExt}`;
  }
  if (toExt[0] !== '.') {
    toExt = `.${toExt}`;
  }
  converter = convert.getConverter(fromExt, toExt);
  if (converter == null) {
    if (fromExt === toExt) {
      return data;
    }
    throw new Error(`No converter from ${fromExt} to ${toExt}`);
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
  indexOf = [].indexOf;

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
  return filter.edgesAssigned(fold, 'M');
};

filter.valleyEdges = function(fold) {
  return filter.edgesAssigned(fold, 'V');
};

filter.flatEdges = function(fold) {
  return filter.edgesAssigned(fold, 'F');
};

filter.boundaryEdges = function(fold) {
  return filter.edgesAssigned(fold, 'B');
};

filter.unassignedEdges = function(fold) {
  return filter.edgesAssigned(fold, 'U');
};

filter.cutEdges = function(fold) {
  return filter.edgesAssigned(fold, 'C');
};

filter.joinEdges = function(fold) {
  return filter.edgesAssigned(fold, 'J');
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
//# later overwrites earlier
  for (i = k = 0, len = old2new.length; k < len; i = ++k) {
    j = old2new[i];
    if (j != null) {
      new2old[j] = i;
    }
  }
  ref = filter.keysStartingWith(fold, `${field}_`);
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
  ref1 = filter.keysEndingWith(fold, `_${field}`);
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
        results.push(null); //# remove
      }
    }
    return results;
  })();
  filter.remapField(fold, field, old2new);
  return old2new;
};

filter.remove = function(fold, field, index) {
  var i;
  /*
  Remove given index from given field ('vertices', 'edges', 'faces'), in place.
  */
  return filter.remapFieldSubset(fold, field, (function() {
    var k, ref, results;
    results = [];
    for (i = k = 0, ref = filter.numType(fold, field); (0 <= ref ? k < ref : k > ref); i = 0 <= ref ? ++k : --k) {
      results.push(i !== index);
    }
    return results;
  })());
};

filter.removeVertex = function(fold, index) {
  return filter.remove(fold, 'vertices', index);
};

filter.removeEdge = function(fold, index) {
  return filter.remove(fold, 'edges', index);
};

filter.removeFace = function(fold, index) {
  return filter.remove(fold, 'faces', index);
};

filter.transform = function(fold, matrix) {
  var coords, k, key, l, len, len1, ref, ref1, transform;
  ref = filter.keysEndingWith(fold, "_coords");
  /*
  Transforms all fields ending in _coords (in particular, vertices_coords)
  and all fields ending in FoldTransform (in particular,
  faces_flatFoldTransform generated by convert.flat_folded_geometry)
  according to the given transformation matrix.
  */
  for (k = 0, len = ref.length; k < len; k++) {
    key = ref[k];
    fold[key] = (function() {
      var l, len1, ref1, results;
      ref1 = fold[key];
      results = [];
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        coords = ref1[l];
        results.push(geom.matrixVector(matrix, coords));
      }
      return results;
    })();
  }
  ref1 = filter.keysEndingWith(fold, "FoldTransform");
  for (l = 0, len1 = ref1.length; l < len1; l++) {
    key = ref1[l];
    if (indexOf.call(key, '_') >= 0) {
      fold[key] = (function() {
        var len2, m, ref2, results;
        ref2 = fold[key];
        results = [];
        for (m = 0, len2 = ref2.length; m < len2; m++) {
          transform = ref2[m];
          results.push(geom.matrixMatrix(matrix, transform));
        }
        return results;
      })();
    }
  }
  return fold;
};

filter.numType = function(fold, type) {
  /*
  Count the maximum number of objects of a given type, by looking at all
  fields with key of the form `type_...`, and if that fails, looking at all
  fields with key of the form `..._type`.  Returns `0` if nothing found.
  */
  var counts, key, value;
  counts = (function() {
    var k, len, ref, results;
    ref = filter.keysStartingWith(fold, `${type}_`);
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      key = ref[k];
      value = fold[key];
      if (value.length == null) {
        continue;
      }
      results.push(value.length);
    }
    return results;
  })();
  if (!counts.length) {
    counts = (function() {
      var k, len, ref, results;
      ref = filter.keysEndingWith(fold, `_${type}`);
      results = [];
      for (k = 0, len = ref.length; k < len; k++) {
        key = ref[k];
        results.push(1 + Math.max(...fold[key]));
      }
      return results;
    })();
  }
  if (counts.length) {
    return Math.max(...counts);
  } else {
    return 0; //# nothing of this type
  }
};

filter.numVertices = function(fold) {
  return filter.numType(fold, 'vertices');
};

filter.numEdges = function(fold) {
  return filter.numType(fold, 'edges');
};

filter.numFaces = function(fold) {
  return filter.numType(fold, 'faces');
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
      [v, w] = edge;
      if (v < w) {
        key = `${v},${w}`;
      } else {
        key = `${w},${v}`;
      }
      if (!(key in seen)) {
        seen[key] = id;
        id += 1;
      }
      results.push(seen[key]);
    }
    return results;
  })();
  filter.remapField(fold, 'edges', old2new);
  return old2new;
};

filter.edges_verticesIncident = function(e1, e2) {
  var k, len, v;
  for (k = 0, len = e1.length; k < len; k++) {
    v = e1[k];
    if (indexOf.call(e2, v) >= 0) {
      return v;
    }
  }
  return null;
};

//# Use hashing to find points within an epsilon > 0 distance from each other.
//# Each integer cell will have O(1) distinct points before matching
//# (number of disjoint half-unit disks that fit in a unit square).
RepeatedPointsDS = class RepeatedPointsDS {
  constructor(vertices_coords, epsilon1) {
    var base, coord, k, len, name, ref, v;
    this.vertices_coords = vertices_coords;
    this.epsilon = epsilon1;
    //# Note: if vertices_coords has some duplicates in the initial state,
    //# then we will detect them but won't remove them here.  Rather,
    //# future duplicate inserts will return the higher-index vertex.
    this.hash = {};
    ref = this.vertices_coords;
    for (v = k = 0, len = ref.length; k < len; v = ++k) {
      coord = ref[v];
      ((base = this.hash)[name = this.key(coord)] != null ? base[name] : base[name] = []).push(v);
    }
    null;
  }

  lookup(coord) {
    var k, key, l, len, len1, len2, m, ref, ref1, ref2, ref3, v, x, xr, xt, y, yr, yt;
    [x, y] = coord;
    xr = Math.round(x / this.epsilon);
    yr = Math.round(y / this.epsilon);
    ref = [xr, xr - 1, xr + 1];
    for (k = 0, len = ref.length; k < len; k++) {
      xt = ref[k];
      ref1 = [yr, yr - 1, yr + 1];
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        yt = ref1[l];
        key = `${xt},${yt}`;
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
  }

  key(coord) {
    var key, x, xr, y, yr;
    [x, y] = coord;
    xr = Math.round(x / this.epsilon);
    yr = Math.round(y / this.epsilon);
    return key = `${xr},${yr}`;
  }

  insert(coord) {
    var base, name, v;
    v = this.lookup(coord);
    if (v != null) {
      return v;
    }
    ((base = this.hash)[name = this.key(coord)] != null ? base[name] : base[name] = []).push(v = this.vertices_coords.length);
    this.vertices_coords.push(coord);
    return v;
  }

};

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

//# In particular: fold.vertices_coords = vertices.vertices_coords
filter.maybeAddVertex = function(fold, coords, epsilon) {
  /*
  Add a new vertex at coordinates `coords` and return its (last) index,
  unless there is already such a vertex within distance `epsilon`,
  in which case return the closest such vertex's index.
  */
  var i;
  i = geom.closestIndex(coords, fold.vertices_coords);
  if ((i != null) && epsilon >= geom.dist(coords, fold.vertices_coords[i])) {
    return i; //# Closest point is close enough
  } else {
    return fold.vertices_coords.push(coords) - 1;
  }
};

filter.addVertexLike = function(fold, oldVertexIndex) {
  var k, key, len, ref, vNew;
  //# Add a vertex and copy data from old vertex.
  vNew = filter.numVertices(fold);
  ref = filter.keysStartingWith(fold, 'vertices_');
  for (k = 0, len = ref.length; k < len; k++) {
    key = ref[k];
    switch (key.slice(6)) {
      case 'vertices':
        break;
      default:
        //# Leaving these broken
        fold[key][vNew] = fold[key][oldVertexIndex];
    }
  }
  return vNew;
};

filter.addEdgeLike = function(fold, oldEdgeIndex, v1, v2) {
  var eNew, k, key, len, ref;
  //# Add an edge between v1 and v2, and copy data from old edge.
  //# If v1 or v2 are unspecified, defaults to the vertices of the old edge.
  //# Must have `edges_vertices` property.
  eNew = fold.edges_vertices.length;
  ref = filter.keysStartingWith(fold, 'edges_');
  for (k = 0, len = ref.length; k < len; k++) {
    key = ref[k];
    switch (key.slice(6)) {
      case 'vertices':
        fold.edges_vertices.push([v1 != null ? v1 : fold.edges_vertices[oldEdgeIndex][0], v2 != null ? v2 : fold.edges_vertices[oldEdgeIndex][1]]);
        break;
      case 'edges':
        break;
      default:
        //# Leaving these broken
        fold[key][eNew] = fold[key][oldEdgeIndex];
    }
  }
  return eNew;
};

filter.addVertexAndSubdivide = function(fold, coords, epsilon) {
  var changedEdges, e, i, iNew, k, len, ref, s, u, v;
  v = filter.maybeAddVertex(fold, coords, epsilon);
  changedEdges = [];
  if (v === fold.vertices_coords.length - 1) {
    ref = fold.edges_vertices;
    //# Similar to "Handle overlapping edges" case:
    for (i = k = 0, len = ref.length; k < len; i = ++k) {
      e = ref[i];
      if (indexOf.call(e, v) >= 0) { // shouldn't happen
        continue;
      }
      s = (function() {
        var l, len1, results;
        results = [];
        for (l = 0, len1 = e.length; l < len1; l++) {
          u = e[l];
          results.push(fold.vertices_coords[u]);
        }
        return results;
      })();
      if (geom.pointStrictlyInSegment(coords, s)) { //# implicit epsilon
        //console.log coords, 'in', s
        iNew = filter.addEdgeLike(fold, i, v, e[1]);
        changedEdges.push(i, iNew);
        e[1] = v;
      }
    }
  }
  return [v, changedEdges];
};

filter.removeLoopEdges = function(fold) {
  var edge;
  /*
  Remove edges whose endpoints are identical.  After collapsing via
  `filter.collapseNearbyVertices`, this removes epsilon-length edges.
  */
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

filter.subdivideCrossingEdges_vertices = function(fold, epsilon, involvingEdgesFrom) {
  /*
  Using just `vertices_coords` and `edges_vertices` and assuming all in 2D,
  subdivides all crossing/touching edges to form a planar graph.
  In particular, all duplicate and loop edges are also removed.

  If called without `involvingEdgesFrom`, does all subdivision in quadratic
  time.  xxx Should be O(n log n) via plane sweep.
  In this case, returns an array of indices of all edges that were subdivided
  (both modified old edges and new edges).

  If called with `involvingEdgesFrom`, does all subdivision involving an
  edge numbered `involvingEdgesFrom` or higher.  For example, after adding an
  edge with largest number, call with `involvingEdgesFrom =
  edges_vertices.length - 1`; then this will run in linear time.
  In this case, returns two arrays of edges: the first array are all subdivided
  from the "involved" edges, while the second array is the remaining subdivided
  edges.
  */
  var addEdge, changedEdges, cross, crossI, e, e1, e2, i, i1, i2, k, l, len, len1, len2, len3, m, n, old2new, p, ref, ref1, ref2, ref3, s, s1, s2, u, v, vertices;
  changedEdges = [[], []];
  addEdge = function(v1, v2, oldEdgeIndex, which) {
    var eNew;
    //console.log 'adding', oldEdgeIndex, fold.edges_vertices.length, 'to', which
    eNew = filter.addEdgeLike(fold, oldEdgeIndex, v1, v2);
    return changedEdges[which].push(oldEdgeIndex, eNew);
  };
  //# Handle overlapping edges by subdividing edges at any vertices on them.
  //# We use a while loop instead of a for loop to process newly added edges.
  i = involvingEdgesFrom != null ? involvingEdgesFrom : 0;
  while (i < fold.edges_vertices.length) {
    e = fold.edges_vertices[i];
    s = (function() {
      var k, len, results;
      results = [];
      for (k = 0, len = e.length; k < len; k++) {
        u = e[k];
        results.push(fold.vertices_coords[u]);
      }
      return results;
    })();
    ref = fold.vertices_coords;
    for (v = k = 0, len = ref.length; k < len; v = ++k) {
      p = ref[v];
      if (indexOf.call(e, v) >= 0) {
        continue;
      }
      if (geom.pointStrictlyInSegment(p, s)) { //# implicit epsilon
        //console.log p, 'in', s
        addEdge(v, e[1], i, 0);
        e[1] = v;
      }
    }
    i++;
  }
  //# Handle crossing edges
  //# We use a while loop instead of a for loop to process newly added edges.
  vertices = new RepeatedPointsDS(fold.vertices_coords, epsilon);
  i1 = involvingEdgesFrom != null ? involvingEdgesFrom : 0;
  while (i1 < fold.edges_vertices.length) {
    e1 = fold.edges_vertices[i1];
    s1 = (function() {
      var l, len1, results;
      results = [];
      for (l = 0, len1 = e1.length; l < len1; l++) {
        v = e1[l];
        results.push(fold.vertices_coords[v]);
      }
      return results;
    })();
    ref1 = fold.edges_vertices.slice(0, i1);
    for (i2 = l = 0, len1 = ref1.length; l < len1; i2 = ++l) {
      e2 = ref1[i2];
      s2 = (function() {
        var len2, m, results;
        results = [];
        for (m = 0, len2 = e2.length; m < len2; m++) {
          v = e2[m];
          results.push(fold.vertices_coords[v]);
        }
        return results;
      })();
      if (!filter.edges_verticesIncident(e1, e2) && geom.segmentsCross(s1, s2)) {
        //# segment intersection is too sensitive a test;
        //# segmentsCross more reliable
        //cross = segmentIntersectSegment s1, s2
        cross = geom.lineIntersectLine(s1, s2);
        if (cross == null) {
          continue;
        }
        crossI = vertices.insert(cross);
        //console.log e1, s1, 'intersects', e2, s2, 'at', cross, crossI
        if (!(indexOf.call(e1, crossI) >= 0 && indexOf.call(e2, crossI) >= 0)) { //# don't add endpoint again
          //console.log e1, e2, '->'
          if (indexOf.call(e1, crossI) < 0) {
            addEdge(crossI, e1[1], i1, 0);
            e1[1] = crossI;
            s1[1] = fold.vertices_coords[crossI];
          }
          //console.log '->', e1, fold.edges_vertices[fold.edges_vertices.length-1]
          if (indexOf.call(e2, crossI) < 0) {
            addEdge(crossI, e2[1], i2, 1);
            e2[1] = crossI;
          }
        }
      }
    }
    //console.log '->', e2, fold.edges_vertices[fold.edges_vertices.length-1]
    i1++;
  }
  old2new = filter.removeDuplicateEdges_vertices(fold);
  ref2 = [0, 1];
  for (m = 0, len2 = ref2.length; m < len2; m++) {
    i = ref2[m];
    changedEdges[i] = (function() {
      var len3, n, ref3, results;
      ref3 = changedEdges[i];
      results = [];
      for (n = 0, len3 = ref3.length; n < len3; n++) {
        e = ref3[n];
        results.push(old2new[e]);
      }
      return results;
    })();
  }
  old2new = filter.removeLoopEdges(fold);
  ref3 = [0, 1];
  for (n = 0, len3 = ref3.length; n < len3; n++) {
    i = ref3[n];
    changedEdges[i] = (function() {
      var len4, o, ref4, results;
      ref4 = changedEdges[i];
      results = [];
      for (o = 0, len4 = ref4.length; o < len4; o++) {
        e = ref4[o];
        results.push(old2new[e]);
      }
      return results;
    })();
  }
  //fold
  if (involvingEdgesFrom != null) {
    return changedEdges;
  } else {
    return changedEdges[0].concat(changedEdges[1]);
  }
};

filter.addEdgeAndSubdivide = function(fold, v1, v2, epsilon) {
  var changedEdges, changedEdges1, changedEdges2, e, i, iNew, k, len, ref;
  /*
  Add an edge between vertex indices or points `v1` and `v2`, subdivide
  as necessary, and return two arrays: all the subdivided parts of this edge,
  and all the other edges that change.
  If the edge is a loop or a duplicate, both arrays will be empty.
  */
  if (v1.length != null) {
    [v1, changedEdges1] = filter.addVertexAndSubdivide(fold, v1, epsilon);
  }
  if (v2.length != null) {
    [v2, changedEdges2] = filter.addVertexAndSubdivide(fold, v2, epsilon);
  }
  if (v1 === v2) { //# Ignore loop edges
    return [[], []];
  }
  ref = fold.edges_vertices;
  for (i = k = 0, len = ref.length; k < len; i = ++k) {
    e = ref[i];
    if ((e[0] === v1 && e[1] === v2) || (e[0] === v2 && e[1] === v1)) {
      return [[i], []]; //# Ignore duplicate edges
    }
  }
  iNew = fold.edges_vertices.push([v1, v2]) - 1;
  if (iNew) {
    changedEdges = filter.subdivideCrossingEdges_vertices(fold, epsilon, iNew);
    if (indexOf.call(changedEdges[0], iNew) < 0) {
      changedEdges[0].push(iNew);
    }
  } else {
    changedEdges = [[iNew], []];
  }
  if (changedEdges1 != null) {
    changedEdges[1].push(...changedEdges1);
  }
  if (changedEdges2 != null) {
    changedEdges[1].push(...changedEdges2);
  }
  return changedEdges;
};

filter.splitCuts = function(fold, es = filter.cutEdges(fold)) {
  var b, b1, b2, boundaries, e, e1, e2, ev, i, i1, i2, ie, ie1, ie2, k, l, len, len1, len2, len3, len4, len5, len6, len7, len8, m, n, neighbor, neighbors, o, q, r, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, t, u1, u2, v, v1, v2, ve, vertices_boundaries, z;
  if (!es.length) {
    /*
    Given a FOLD object with `edges_vertices`, `edges_assignment`, and
    counterclockwise-sorted `vertices_edges`
    (see `FOLD.convert.edges_vertices_to_vertices_edges_sorted`),
    cuts apart ("unwelds") all edges in `es` into pairs of boundary edges.
    When an endpoint of a cut edge ends up on n boundaries,
    it splits into n vertices.
    Preserves above-mentioned properties (so you can then compute faces via
    `FOLD.convert.edges_vertices_to_faces_vertices_edges`),
    and recomputes `vertices_vertices` if present,
    but ignores face properties.
    `es` is unspecified, cuts all edges with an assignment of `"C"`,
    effectively switching from FOLD 1.2's `"C"` assignments to
    FOLD 1.1's `"B"` assignments.
    */
    return fold;
  }
  //# Maintain map from every vertex to array of incident boundary edges
  vertices_boundaries = [];
  ref = filter.boundaryEdges(fold);
  for (k = 0, len = ref.length; k < len; k++) {
    e = ref[k];
    ref1 = fold.edges_vertices[e];
    for (l = 0, len1 = ref1.length; l < len1; l++) {
      v = ref1[l];
      (vertices_boundaries[v] != null ? vertices_boundaries[v] : vertices_boundaries[v] = []).push(e);
    }
  }
  for (m = 0, len2 = es.length; m < len2; m++) {
    e1 = es[m];
    //# Split e1 into two edges {e1, e2}
    e2 = filter.addEdgeLike(fold, e1);
    ref2 = fold.edges_vertices[e1];
    for (i = n = 0, len3 = ref2.length; n < len3; i = ++n) {
      v = ref2[i];
      ve = fold.vertices_edges[v];
      //# Insert e2 before e1 in first vertex and after e1 in second vertex
      //# to represent valid counterclockwise ordering
      ve.splice(ve.indexOf(e1) + i, 0, e2);
    }
    ref3 = fold.edges_vertices[e1];
    //# Check for endpoints of {e1, e2} to split, when they're on the boundary
    for (i = o = 0, len4 = ref3.length; o < len4; i = ++o) {
      v1 = ref3[i];
      u1 = fold.edges_vertices[e1][1 - i];
      u2 = fold.edges_vertices[e2][1 - i];
      boundaries = (ref4 = vertices_boundaries[v1]) != null ? ref4.length : void 0;
      if (boundaries >= 2) { //# vertex already on boundary
        if (boundaries > 2) {
          throw new Error(`${vertices_boundaries[v1].length} boundary edges at vertex ${v1}`);
        }
        [b1, b2] = vertices_boundaries[v1];
        neighbors = fold.vertices_edges[v1];
        i1 = neighbors.indexOf(b1);
        i2 = neighbors.indexOf(b2);
        if (i2 === (i1 + 1) % neighbors.length) {
          if (i2 !== 0) {
            neighbors = neighbors.slice(i2).concat(neighbors.slice(0, +i1 + 1 || 9e9));
          }
        } else if (i1 === (i2 + 1) % neighbors.length) {
          if (i1 !== 0) {
            neighbors = neighbors.slice(i1).concat(neighbors.slice(0, +i2 + 1 || 9e9));
          }
        } else {
          throw new Error(`Nonadjacent boundary edges at vertex ${v1}`);
        }
        //# Find first vertex among e1, e2 among neighbors, so other is next
        ie1 = neighbors.indexOf(e1);
        ie2 = neighbors.indexOf(e2);
        ie = Math.min(ie1, ie2);
        fold.vertices_edges[v1] = neighbors.slice(0, +ie + 1 || 9e9);
        v2 = filter.addVertexLike(fold, v1);
        fold.vertices_edges[v2] = neighbors.slice(1 + ie);
        ref5 = fold.vertices_edges[v2];
        //console.log "Split #{neighbors} into #{fold.vertices_edges[v1]} for #{v1} and #{fold.vertices_edges[v2]} for #{v2}"
        //# Update relevant incident edges to use v2 instead of v1
        for (q = 0, len5 = ref5.length; q < len5; q++) {
          neighbor = ref5[q];
          ev = fold.edges_vertices[neighbor];
          ev[ev.indexOf(v1)] = v2;
        }
        //# Partition boundary edges incident to v1
        vertices_boundaries[v1] = [];
        vertices_boundaries[v2] = [];
        ref6 = [b1, b2];
        for (r = 0, len6 = ref6.length; r < len6; r++) {
          b = ref6[r];
          if (indexOf.call(fold.vertices_edges[v1], b) >= 0) {
            vertices_boundaries[v1].push(b); //if b in fold.vertices_edges[v2]
          } else {
            vertices_boundaries[v2].push(b);
          }
        }
      }
    }
    //# e1 and e2 are new boundary edges
    if ((ref7 = fold.edges_assignment) != null) {
      ref7[e1] = 'B';
    }
    if ((ref8 = fold.edges_assignment) != null) {
      ref8[e2] = 'B';
    }
    ref9 = fold.edges_vertices[e1];
    for (i = t = 0, len7 = ref9.length; t < len7; i = ++t) {
      v = ref9[i];
      (vertices_boundaries[v] != null ? vertices_boundaries[v] : vertices_boundaries[v] = []).push(e1);
    }
    ref10 = fold.edges_vertices[e2];
    for (i = z = 0, len8 = ref10.length; z < len8; i = ++z) {
      v = ref10[i];
      (vertices_boundaries[v] != null ? vertices_boundaries[v] : vertices_boundaries[v] = []).push(e2);
    }
  }
  if (fold.vertices_vertices != null) {
    fold.vertices_vertices = filter.edges_vertices_to_vertices_vertices(fold); // would be out-of-date
  }
  return fold;
};

filter.edges_vertices_to_vertices_vertices = function(fold) {
  /*
  Works for abstract structures, so NOT SORTED.
  Use sort_vertices_vertices to sort in counterclockwise order.
  */
  var k, len, numVertices, ref, v, vertices_vertices, w;
  numVertices = filter.numVertices(fold);
  vertices_vertices = (function() {
    var k, ref, results;
    results = [];
    for (v = k = 0, ref = numVertices; (0 <= ref ? k < ref : k > ref); v = 0 <= ref ? ++k : --k) {
      results.push([]);
    }
    return results;
  })();
  ref = fold.edges_vertices;
  for (k = 0, len = ref.length; k < len; k++) {
    [v, w] = ref[k];
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

filter.edges_vertices_to_vertices_edges = function(fold) {
  /*
  Invert edges_vertices into vertices_edges.
  Works for abstract structures, so NOT SORTED in any sense.
  */
  var edge, k, l, len, len1, numVertices, ref, v, vertex, vertices, vertices_edges;
  numVertices = filter.numVertices(fold);
  vertices_edges = (function() {
    var k, ref, results;
    results = [];
    for (v = k = 0, ref = numVertices; (0 <= ref ? k < ref : k > ref); v = 0 <= ref ? ++k : --k) {
      results.push([]);
    }
    return results;
  })();
  ref = fold.edges_vertices;
  for (edge = k = 0, len = ref.length; k < len; edge = ++k) {
    vertices = ref[edge];
    for (l = 0, len1 = vertices.length; l < len1; l++) {
      vertex = vertices[l];
      vertices_edges[vertex].push(edge);
    }
  }
  return vertices_edges;
};


},{"./geom":4}],4:[function(require,module,exports){
  /* BASIC GEOMETRY */
var geom,
  modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

geom = exports;

/*
    Utilities
*/
geom.EPS = 0.000001;

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

geom.next = function(start, n, i = 1) {
  /*
  Returns the ith cyclic ordered number after start in the range [0..n].
  */
  return modulo(start + i, n);
};

geom.rangesDisjoint = function([a1, a2], [b1, b2]) {
  var ref, ref1;
  //# Returns whether the scalar interval [a1, a2] is disjoint from the scalar
  //# interval [b1,b2].
  return ((b1 < (ref = Math.min(a1, a2)) && ref > b2)) || ((b1 > (ref1 = Math.max(a1, a2)) && ref1 < b2));
};

geom.topologicalSort = function(vs) {
  var l, len, list, v;
  (function() {
    var l, len, results;
    results = [];
    for (l = 0, len = vs.length; l < len; l++) {
      v = vs[l];
      results.push([v.visited, v.parent] = [false, null]);
    }
    return results;
  })();
  list = [];
  for (l = 0, len = vs.length; l < len; l++) {
    v = vs[l];
    if (!v.visited) {
      list = geom.visit(v, list);
    }
  }
  return list;
};

geom.visit = function(v, list) {
  var l, len, ref, u;
  v.visited = true;
  ref = v.children;
  for (l = 0, len = ref.length; l < len; l++) {
    u = ref[l];
    if (!(!u.visited)) {
      continue;
    }
    u.parent = v;
    list = geom.visit(u, list);
  }
  return list.concat([v]);
};

//#
//# Vector operations
//#
geom.magsq = function(a) {
  //# Returns the squared magnitude of vector a having arbitrary dimension.
  return geom.dot(a, a);
};

geom.mag = function(a) {
  //# Returns the magnitude of vector a having arbitrary dimension.
  return Math.sqrt(geom.magsq(a));
};

geom.unit = function(a, eps = geom.EPS) {
  var length;
  //# Returns the unit vector in the direction of vector a having arbitrary
  //# dimension. Returns null if magnitude of a is zero.
  length = geom.magsq(a);
  if (length < eps) {
    return null;
  }
  return geom.mul(a, 1 / geom.mag(a));
};

geom.ang2D = function(a, eps = geom.EPS) {
  if (geom.magsq(a) < eps) {
    //# Returns the angle of a 2D vector relative to the standard
    //# east-is-0-degrees rule.
    return null;
  }
  return Math.atan2(a[1], a[0]);
};

geom.mul = function(a, s) {
  var i, l, len, results;
  results = [];
  for (l = 0, len = a.length; l < len; l++) {
    i = a[l];
    //# Returns the vector a multiplied by scaler factor s.
    results.push(i * s);
  }
  return results;
};

geom.linearInterpolate = function(t, a, b) {
  //# Returns linear interpolation of vector a to vector b for 0 < t < 1
  return geom.plus(geom.mul(a, 1 - t), geom.mul(b, t));
};

geom.plus = function(a, b) {
  var ai, i, l, len, results;
  results = [];
  for (i = l = 0, len = a.length; l < len; i = ++l) {
    ai = a[i];
    //# Returns the vector sum between of vectors a and b having the same
    //# dimension.
    results.push(ai + b[i]);
  }
  return results;
};

geom.sub = function(a, b) {
  //# Returns the vector difference of vectors a and b having the same dimension.
  return geom.plus(a, geom.mul(b, -1));
};

geom.dot = function(a, b) {
  var ai, i;
  return ((function() {
    var l, len, results;
    results = [];
    for (i = l = 0, len = a.length; l < len; i = ++l) {
      ai = a[i];
      //# Returns the dot product between two vectors a and b having the same
      //# dimension.
      results.push(ai * b[i]);
    }
    return results;
  })()).reduce(geom.sum);
};

geom.distsq = function(a, b) {
  //# Returns the squared Euclidean distance between two vectors a and b having 
  //# the same dimension.
  return geom.magsq(geom.sub(a, b));
};

geom.dist = function(a, b) {
  //# Returns the Euclidean distance between general vectors a and b having the
  //# same dimension.
  return Math.sqrt(geom.distsq(a, b));
};

geom.closestIndex = function(a, bs) {
  var b, dist, i, l, len, minDist, minI;
  //# Finds the closest point to `a` among points in `bs`, and returns the
  //# index of that point in `bs`.  Returns `undefined` if `bs` is empty.
  minDist = 2e308;
  for (i = l = 0, len = bs.length; l < len; i = ++l) {
    b = bs[i];
    if (minDist > (dist = geom.dist(a, b))) {
      minDist = dist;
      minI = i;
    }
  }
  return minI;
};

geom.dir = function(a, b) {
  //# Returns a unit vector in the direction from vector a to vector b, in the
  //# same dimension as a and b.
  return geom.unit(geom.sub(b, a));
};

geom.ang = function(a, b) {
  var ua, ub, v;
  //# Returns the angle spanned by vectors a and b having the same dimension.
  [ua, ub] = (function() {
    var l, len, ref, results;
    ref = [a, b];
    results = [];
    for (l = 0, len = ref.length; l < len; l++) {
      v = ref[l];
      results.push(geom.unit(v));
    }
    return results;
  })();
  if (!((ua != null) && (ub != null))) {
    return null;
  }
  return Math.acos(geom.dot(ua, ub));
};

geom.cross = function(a, b) {
  var i, j, ref, ref1;
  //# Returns the cross product of two 2D or 3D vectors a, b.
  if ((a.length === (ref = b.length) && ref === 2)) {
    return a[0] * b[1] - a[1] * b[0];
  }
  if ((a.length === (ref1 = b.length) && ref1 === 3)) {
    return (function() {
      var l, len, ref2, results;
      ref2 = [[1, 2], [2, 0], [0, 1]];
      results = [];
      for (l = 0, len = ref2.length; l < len; l++) {
        [i, j] = ref2[l];
        results.push(a[i] * b[j] - a[j] * b[i]);
      }
      return results;
    })();
  }
  return null;
};

geom.parallel = function(a, b, eps = geom.EPS) {
  var ua, ub, v;
  //# Return if vectors are parallel, up to accuracy eps
  [ua, ub] = (function() {
    var l, len, ref, results;
    ref = [a, b];
    results = [];
    for (l = 0, len = ref.length; l < len; l++) {
      v = ref[l];
      results.push(geom.unit(v));
    }
    return results;
  })();
  if (!((ua != null) && (ub != null))) {
    return null;
  }
  return 1 - Math.abs(geom.dot(ua, ub)) < eps;
};

geom.rotate = function(a, u, t) {
  var ct, i, l, len, p, q, ref, results, st;
  //# Returns the rotation of 3D vector a about 3D unit vector u by angle t.
  u = geom.unit(u);
  if (u == null) {
    return null;
  }
  [ct, st] = [Math.cos(t), Math.sin(t)];
  ref = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
  results = [];
  for (l = 0, len = ref.length; l < len; l++) {
    p = ref[l];
    results.push(((function() {
      var len1, o, ref1, results1;
      ref1 = [ct, -st * u[p[2]], st * u[p[1]]];
      results1 = [];
      for (i = o = 0, len1 = ref1.length; o < len1; i = ++o) {
        q = ref1[i];
        results1.push(a[p[i]] * (u[p[0]] * u[p[i]] * (1 - ct) + q));
      }
      return results1;
    })()).reduce(geom.sum));
  }
  return results;
};

geom.reflectPoint = function(p, q) {
  //# Reflect point p through the point q into the "symmetric point"
  return geom.sub(geom.mul(q, 2), p);
};

geom.reflectLine = function(p, a, b) {
  var dot, lenSq, projection, vec;
  //# Reflect point p through line through points a and b
  // [based on https://math.stackexchange.com/a/11532]
  // projection = a + (b - a) * [(b - a) dot (p - a)] / ||b - a||^2
  vec = geom.sub(b, a);
  lenSq = geom.magsq(vec);
  dot = geom.dot(vec, geom.sub(p, a));
  projection = geom.plus(a, geom.mul(vec, dot / lenSq));
  // reflection = 2*projection - p (symmetric point of p opposite projection)
  return geom.sub(geom.mul(projection, 2), p);
};

/*
Matrix transformations

2D transformation matrices are of the form (where last column is optional):
  [[a, b, c],
   [d, e, f]]

3D transformation matrices are of the form (where last column is optional):
  [[a, b, c, d],
   [e, f, g, h],
   [i, j, k, l]]

Transformation matrices are designed to be multiplied on the left of points,
i.e., T*x gives vector x transformed by matrix T, where x has an implicit 1
at the end (homogeneous coordinates) when T has the optional last column.
See `geom.matrixVector`.
*/
geom.matrixVector = function(matrix, vector, implicitLast = 1) {
  var j, l, len, results, row, val, x;
//# Returns matrix-vector product, matrix * vector.
//# Requires the number of matrix columns to be <= vector length.
//# If the matrix has more columns than the vector length, then the vector
//# is assumed to be padded with zeros at the end, EXCEPT when the matrix
//# has more columns than rows (as in transformation matrices above),
//# in which case the final vector padding is implicitLast,
//# which defaults to 1 (point); set to 0 for treating like a vector.
  results = [];
  for (l = 0, len = matrix.length; l < len; l++) {
    row = matrix[l];
    val = ((function() {
      var len1, o, results1;
      results1 = [];
      for (j = o = 0, len1 = vector.length; o < len1; j = ++o) {
        x = vector[j];
        results1.push(row[j] * x);
      }
      return results1;
    })()).reduce(geom.sum);
    if (row.length > vector.length && row.length > matrix.length) {
      val += row[row.length - 1] * implicitLast;
    }
    results.push(val);
  }
  return results;
};

geom.matrixMatrix = function(matrix1, matrix2) {
  var j, k, l, len, product, ref, ref1, results, row1, row2, val;
//# Returns matrix-matrix product, matrix1 * matrix2.
//# Requires number of matrix1 columns equal to or 1 more than matrix2 rows.
//# In the latter case, treats matrix2 as having an extra row [0,0,...,0,0,1],
//# which may involve adding an implicit column to matrix2 as well.
  results = [];
  for (l = 0, len = matrix1.length; l < len; l++) {
    row1 = matrix1[l];
    if ((matrix2.length !== (ref = row1.length) && ref !== matrix2.length + 1)) {
      throw new Error(`Invalid matrix dimension ${row1.length} vs. matrix dimension ${matrix2.length}`);
    }
    product = (function() {
      var o, ref1, ref2, results1;
      results1 = [];
      for (j = o = 0, ref1 = matrix2[0].length; (0 <= ref1 ? o < ref1 : o > ref1); j = 0 <= ref1 ? ++o : --o) {
        val = ((function() {
          var len1, r, results2;
          results2 = [];
          for (k = r = 0, len1 = matrix2.length; r < len1; k = ++r) {
            row2 = matrix2[k];
            results2.push(row1[k] * row2[j]);
          }
          return results2;
        })()).reduce(geom.sum);
        if ((j === (ref2 = row1.length - 1) && ref2 === matrix2.length)) {
          val += row1[j];
        }
        results1.push(val);
      }
      return results1;
    })();
    if ((row1.length - 1 === (ref1 = matrix2.length) && ref1 === matrix2[0].length)) {
      product.push(row1[row1.length - 1]);
    }
    results.push(product);
  }
  return results;
};

geom.matrixInverseRT = function(matrix) {
  var i, invRow, j, l, lastCol, len, results, row;
  //# Returns inverse of a matrix consisting of rotations and/or translations,
  //# where the inverse can be found by a transpose and dot products
  //# [http://www.graphics.stanford.edu/courses/cs248-98-fall/Final/q4.html].
  if (matrix[0].length === matrix.length + 1) {
    lastCol = (function() {
      var l, len, results;
      results = [];
      for (l = 0, len = matrix.length; l < len; l++) {
        row = matrix[l];
        results.push(row[row.length - 1]);
      }
      return results;
    })();
  } else if (matrix[0].length !== matrix.length) {
    throw new Error(`Invalid matrix dimensions ${matrix.length}x${matrix[0].length}`);
  }
  results = [];
  for (i = l = 0, len = matrix.length; l < len; i = ++l) {
    row = matrix[i];
    invRow = (function() {
      var o, ref, results1;
// transpose
      results1 = [];
      for (j = o = 0, ref = matrix.length; (0 <= ref ? o < ref : o > ref); j = 0 <= ref ? ++o : --o) {
        results1.push(matrix[j][i]);
      }
      return results1;
    })();
    if (lastCol != null) {
      invRow.push(-geom.dot(row.slice(0, matrix.length), lastCol));
    }
    results.push(invRow);
  }
  return results;
};

geom.matrixInverse = function(matrix) {
  var bestRow, i, inverse, j, l, o, r, ref, ref1, ref2, ref3, ref4, ref5, row, w;
  //# Returns inverse of a matrix computed via Gauss-Jordan elimination method.
  if ((matrix.length !== (ref = matrix[0].length) && ref !== matrix.length + 1)) {
    throw new Error(`Invalid matrix dimensions ${matrix.length}x${matrix[0].length}`);
  }
  matrix = (function() {
    var l, len, results;
// copy before elimination
    results = [];
    for (l = 0, len = matrix.length; l < len; l++) {
      row = matrix[l];
      results.push(row.slice(0));
    }
    return results;
  })();
  inverse = (function() {
    var l, len, results;
    results = [];
    for (i = l = 0, len = matrix.length; l < len; i = ++l) {
      row = matrix[i];
      results.push((function() {
        var o, ref1, results1;
        results1 = [];
        for (j = o = 0, ref1 = row.length; (0 <= ref1 ? o < ref1 : o > ref1); j = 0 <= ref1 ? ++o : --o) {
          results1.push(0 + (i === j));
        }
        return results1;
      })());
    }
    return results;
  })();
  for (j = l = 0, ref1 = matrix.length; (0 <= ref1 ? l < ref1 : l > ref1); j = 0 <= ref1 ? ++l : --l) {
    // Pivot to maximize absolute value in jth column
    bestRow = j;
    for (i = o = ref2 = j + 1, ref3 = matrix.length; (ref2 <= ref3 ? o < ref3 : o > ref3); i = ref2 <= ref3 ? ++o : --o) {
      if (Math.abs(matrix[i][j]) > Math.abs(matrix[bestRow][j])) {
        bestRow = i;
      }
    }
    if (bestRow !== j) {
      [matrix[bestRow], matrix[j]] = [matrix[j], matrix[bestRow]];
      [inverse[bestRow], inverse[j]] = [inverse[j], inverse[bestRow]];
    }
    // Scale row to unity in jth column
    inverse[j] = geom.mul(inverse[j], 1 / matrix[j][j]);
    matrix[j] = geom.mul(matrix[j], 1 / matrix[j][j]);
// Eliminate other rows in jth column
    for (i = r = 0, ref4 = matrix.length; (0 <= ref4 ? r < ref4 : r > ref4); i = 0 <= ref4 ? ++r : --r) {
      if (!(i !== j)) {
        continue;
      }
      inverse[i] = geom.plus(inverse[i], geom.mul(inverse[j], -matrix[i][j]));
      matrix[i] = geom.plus(matrix[i], geom.mul(matrix[j], -matrix[i][j]));
    }
  }
  if (matrix[0].length === matrix.length + 1) {
    for (i = w = 0, ref5 = matrix.length; (0 <= ref5 ? w < ref5 : w > ref5); i = 0 <= ref5 ? ++w : --w) {
      if (!(i !== j)) {
        continue;
      }
      inverse[i][inverse[i].length - 1] -= matrix[i][matrix[i].length - 1];
      matrix[i][matrix[i].length - 1] -= matrix[i][matrix[i].length - 1];
    }
  }
  return inverse;
};

geom.matrixTranslate = function(v) {
  var i, j, l, len, results, row, x;
//# Transformation matrix for translating by given vector v.
//# Works in any dimension, assuming v.length is that dimension.
  results = [];
  for (i = l = 0, len = v.length; l < len; i = ++l) {
    x = v[i];
    row = (function() {
      var o, ref, results1;
      results1 = [];
      for (j = o = 0, ref = v.length; (0 <= ref ? o < ref : o > ref); j = 0 <= ref ? ++o : --o) {
        results1.push(0 + (i === j));
      }
      return results1;
    })();
    row.push(x);
    results.push(row);
  }
  return results;
};

geom.matrixRotate2D = function(t, center) {
  var ct, st, x, y;
  //# 2D rotation matrix around center, which defaults to origin,
  //# counterclockwise by t radians.
  [ct, st] = [Math.cos(t), Math.sin(t)];
  if (center != null) {
    [x, y] = center;
    return [[ct, -st, -x * ct + y * st + x], [st, ct, -x * st - y * ct + y]];
  } else {
    return [[ct, -st], [st, ct]];
  }
};

geom.matrixReflectAxis = function(a, d, center) {
  var i, j, l, ref, results, row;
//# Matrix transformation negating dimension a out of d dimensions,
//# or if center is specified, reflecting around that value of dimension a.
  results = [];
  for (i = l = 0, ref = d; (0 <= ref ? l < ref : l > ref); i = 0 <= ref ? ++l : --l) {
    row = (function() {
      var o, ref1, results1;
      results1 = [];
      for (j = o = 0, ref1 = d; (0 <= ref1 ? o < ref1 : o > ref1); j = 0 <= ref1 ? ++o : --o) {
        if (i === j) {
          if (a === i) {
            results1.push(-1);
          } else {
            results1.push(1);
          }
        } else {
          results1.push(0);
        }
      }
      return results1;
    })();
    if (center != null) {
      if (a === i) {
        row.push(2 * center);
      } else {
        row.push(0);
      }
    }
    results.push(row);
  }
  return results;
};

geom.matrixReflectLine = function(a, b) {
  var dot2, lenSq, vec;
  //# Matrix transformation implementing 2D geom.reflectLine(*, a, b)
  vec = geom.sub(b, a);
  lenSq = geom.magsq(vec);
  // dot = vec dot (p - a) = vec dot p - vec dot a
  dot2 = geom.dot(vec, a);
  //proj = (a[i] + vec[i] * dot / lenSq for i in [0...2])
  //[[vec[0] * vec[0] / lenSq,
  //  vec[0] * vec[1] / lenSq,
  //  a[0] - vec[0] * dot2 / lenSq]
  // [vec[1] * vec[0] / lenSq,
  //  vec[1] * vec[1] / lenSq,
  //  a[1] - vec[1] * dot2 / lenSq]]
  return [[2 * (vec[0] * vec[0] / lenSq) - 1, 2 * (vec[0] * vec[1] / lenSq), 2 * (a[0] - vec[0] * dot2 / lenSq)], [2 * (vec[1] * vec[0] / lenSq), 2 * (vec[1] * vec[1] / lenSq) - 1, 2 * (a[1] - vec[1] * dot2 / lenSq)]];
};

//#
//# Polygon Operations
//#
geom.interiorAngle = function(a, b, c) {
  var ang;
  //# Computes the angle of three points that are, say, part of a triangle.
  //# Specify in counterclockwise order.
  //#          a
  //#         /
  //#        /
  //#      b/_)__ c
  ang = geom.ang2D(geom.sub(a, b)) - geom.ang2D(geom.sub(c, b));
  return ang + (ang < 0 ? 2 * Math.PI : 0);
};

geom.turnAngle = function(a, b, c) {
  //# Returns the turn angle, the supplement of the interior angle
  return Math.PI - geom.interiorAngle(a, b, c);
};

geom.triangleNormal = function(a, b, c) {
  //# Returns the right handed normal unit vector to triangle a, b, c in 3D. If
  //# the triangle is degenerate, returns null.
  return geom.unit(geom.cross(geom.sub(b, a), geom.sub(c, b)));
};

geom.polygonNormal = function(points, eps = geom.EPS) {
  var i, p;
  //# Returns the right handed normal unit vector to the polygon defined by
  //# points in 3D. Assumes the points are planar.
  return geom.unit(((function() {
    var l, len, results;
    results = [];
    for (i = l = 0, len = points.length; l < len; i = ++l) {
      p = points[i];
      results.push(geom.cross(p, points[geom.next(i, points.length)]));
    }
    return results;
  })()).reduce(geom.plus), eps);
};

geom.twiceSignedArea = function(points) {
  var i, v0, v1;
  return ((function() {
    var l, len, results;
//# Returns twice signed area of polygon defined by input points.
//# Calculates and sums twice signed area of triangles in a fan from the first
//# vertex.
    results = [];
    for (i = l = 0, len = points.length; l < len; i = ++l) {
      v0 = points[i];
      v1 = points[geom.next(i, points.length)];
      results.push(v0[0] * v1[1] - v1[0] * v0[1]);
    }
    return results;
  })()).reduce(geom.sum);
};

geom.polygonOrientation = function(points) {
  //# Returns the orientation of the 2D polygon defined by the input points.
  //# +1 for counterclockwise, -1 for clockwise
  //# via computing sum of signed areas of triangles formed with origin
  return Math.sign(geom.twiceSignedArea(points));
};

geom.sortByAngle = function(points, origin = [0, 0], mapping = function(x) {
    return x;
  }) {
  //# Sort a set of 2D points in place counter clockwise about origin
  //# under the provided mapping.
  origin = mapping(origin);
  return points.sort(function(p, q) {
    var pa, qa;
    pa = geom.ang2D(geom.sub(mapping(p), origin));
    qa = geom.ang2D(geom.sub(mapping(q), origin));
    return pa - qa;
  });
};

geom.segmentsCross = function([p0, q0], [p1, q1]) {
  //# May not work if the segments are collinear.
  //# First do rough overlap check in x and y.  This helps with
  //# near-collinear segments.  (Inspired by oripa/geom/GeomUtil.java)
  if (geom.rangesDisjoint([p0[0], q0[0]], [p1[0], q1[0]]) || geom.rangesDisjoint([p0[1], q0[1]], [p1[1], q1[1]])) {
    return false;
  }
  //# Now do orientation test.
  return geom.polygonOrientation([p0, q0, p1]) !== geom.polygonOrientation([p0, q0, q1]) && geom.polygonOrientation([p1, q1, p0]) !== geom.polygonOrientation([p1, q1, q0]);
};

geom.parametricLineIntersect = function([p1, p2], [q1, q2]) {
  var denom;
  //# Returns the parameters s,t for the equations s*p1+(1-s)*p2 and
  //# t*q1+(1-t)*q2.  Used Maple's result of:
  //#    solve({s*p2x+(1-s)*p1x=t*q2x+(1-t)*q1x,
  //#           s*p2y+(1-s)*p1y=t*q2y+(1-t)*q1y}, {s,t});
  //# Returns null, null if the intersection couldn't be found
  //# because the lines are parallel.
  //# Input points must be 2D.
  denom = (q2[1] - q1[1]) * (p2[0] - p1[0]) + (q1[0] - q2[0]) * (p2[1] - p1[1]);
  if (denom === 0) {
    return [null, null];
  } else {
    return [(q2[0] * (p1[1] - q1[1]) + q2[1] * (q1[0] - p1[0]) + q1[1] * p1[0] - p1[1] * q1[0]) / denom, (q1[0] * (p2[1] - p1[1]) + q1[1] * (p1[0] - p2[0]) + p1[1] * p2[0] - p2[1] * p1[0]) / denom];
  }
};

geom.segmentIntersectSegment = function(s1, s2) {
  var s, t;
  [s, t] = geom.parametricLineIntersect(s1, s2);
  if ((s != null) && ((0 <= s && s <= 1)) && ((0 <= t && t <= 1))) {
    return geom.linearInterpolate(s, s1[0], s1[1]);
  } else {
    return null;
  }
};

geom.lineIntersectLine = function(l1, l2) {
  var s, t;
  [s, t] = geom.parametricLineIntersect(l1, l2);
  if (s != null) {
    return geom.linearInterpolate(s, l1[0], l1[1]);
  } else {
    return null;
  }
};

geom.pointStrictlyInSegment = function(p, s, eps = geom.EPS) {
  var v0, v1;
  v0 = geom.sub(p, s[0]);
  v1 = geom.sub(p, s[1]);
  return geom.parallel(v0, v1, eps) && geom.dot(v0, v1) < 0;
};

geom.centroid = function(points) {
  //# Returns the centroid of a set of points having the same dimension.
  return geom.mul(points.reduce(geom.plus), 1.0 / points.length);
};

geom.basis = function(ps, eps = geom.EPS) {
  var d, ds, n, ns, p, x, y, z;
  if (((function() {
    var l, len, results;
    results = [];
    for (l = 0, len = ps.length; l < len; l++) {
      p = ps[l];
      results.push(p.length !== 3);
    }
    return results;
  })()).reduce(geom.all)) {
    //# Returns a basis of a 3D point set.
    //#  - [] if the points are all the same point (0 dimensional)
    //#  - [x] if the points lie on a line with basis direction x
    //#  - [x,y] if the points lie in a plane with basis directions x and y
    //#  - [x,y,z] if the points span three dimensions
    return null;
  }
  ds = (function() {
    var l, len, results;
    results = [];
    for (l = 0, len = ps.length; l < len; l++) {
      p = ps[l];
      if (geom.distsq(p, ps[0]) > eps) {
        results.push(geom.dir(p, ps[0]));
      }
    }
    return results;
  })();
  if (ds.length === 0) {
    return [];
  }
  x = ds[0];
  if (((function() {
    var l, len, results;
    results = [];
    for (l = 0, len = ds.length; l < len; l++) {
      d = ds[l];
      results.push(geom.parallel(d, x, eps));
    }
    return results;
  })()).reduce(geom.all)) {
    return [x];
  }
  ns = (function() {
    var l, len, results;
    results = [];
    for (l = 0, len = ds.length; l < len; l++) {
      d = ds[l];
      results.push(geom.unit(geom.cross(d, x)));
    }
    return results;
  })();
  ns = (function() {
    var l, len, results;
    results = [];
    for (l = 0, len = ns.length; l < len; l++) {
      n = ns[l];
      if (n != null) {
        results.push(n);
      }
    }
    return results;
  })();
  z = ns[0];
  y = geom.cross(z, x);
  if (((function() {
    var l, len, results;
    results = [];
    for (l = 0, len = ns.length; l < len; l++) {
      n = ns[l];
      results.push(geom.parallel(n, z, eps));
    }
    return results;
  })()).reduce(geom.all)) {
    return [x, y];
  }
  return [x, y, z];
};

geom.above = function(ps, qs, n, eps = geom.EPS) {
  var pn, qn, v, vs;
  [pn, qn] = (function() {
    var l, len, ref, results;
    ref = [ps, qs];
    results = [];
    for (l = 0, len = ref.length; l < len; l++) {
      vs = ref[l];
      results.push((function() {
        var len1, o, results1;
        results1 = [];
        for (o = 0, len1 = vs.length; o < len1; o++) {
          v = vs[o];
          results1.push(geom.dot(v, n));
        }
        return results1;
      })());
    }
    return results;
  })();
  if (qn.reduce(geom.max) - pn.reduce(geom.min) < eps) {
    return 1;
  }
  if (pn.reduce(geom.max) - qn.reduce(geom.min) < eps) {
    return -1;
  }
  return 0;
};

geom.separatingDirection2D = function(t1, t2, n, eps = geom.EPS) {
  var i, j, l, len, len1, len2, m, o, p, q, r, ref, sign, t;
  ref = [t1, t2];
  //# If points are contained in a common plane with normal n and a separating 
  //# direction exists, a direction perpendicular to some pair of points from 
  //# the same set is also a separating direction.
  for (l = 0, len = ref.length; l < len; l++) {
    t = ref[l];
    for (i = o = 0, len1 = t.length; o < len1; i = ++o) {
      p = t[i];
      for (j = r = 0, len2 = t.length; r < len2; j = ++r) {
        q = t[j];
        if (!(i < j)) {
          continue;
        }
        m = geom.unit(geom.cross(geom.sub(p, q), n));
        if (m != null) {
          sign = geom.above(t1, t2, m, eps);
          if (sign !== 0) {
            return geom.mul(m, sign);
          }
        }
      }
    }
  }
  return null;
};

geom.separatingDirection3D = function(t1, t2, eps = geom.EPS) {
  var i, j, l, len, len1, len2, len3, m, o, p, q1, q2, r, ref, sign, w, x1, x2;
  ref = [[t1, t2], [t2, t1]];
  //# If points are not contained in a common plane and a separating direction
  //# exists, a plane spanning two points from one set and one point from the
  //# other set is a separating plane, with its normal a separating direction. 
  for (l = 0, len = ref.length; l < len; l++) {
    [x1, x2] = ref[l];
    for (o = 0, len1 = x1.length; o < len1; o++) {
      p = x1[o];
      for (i = r = 0, len2 = x2.length; r < len2; i = ++r) {
        q1 = x2[i];
        for (j = w = 0, len3 = x2.length; w < len3; j = ++w) {
          q2 = x2[j];
          if (!(i < j)) {
            continue;
          }
          m = geom.unit(geom.cross(geom.sub(p, q1), geom.sub(p, q2)));
          if (m != null) {
            sign = geom.above(t1, t2, m, eps);
            if (sign !== 0) {
              return geom.mul(m, sign);
            }
          }
        }
      }
    }
  }
  return null;
};

//#
//# Hole Filling Methods
//# 
geom.circleCross = function(d, r1, r2) {
  var x, y;
  x = (d * d - r2 * r2 + r1 * r1) / d / 2;
  y = Math.sqrt(r1 * r1 - x * x);
  return [x, y];
};

geom.creaseDir = function(u1, u2, a, b, eps = geom.EPS) {
  var b1, b2, x, y, z, zmag;
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
  // Split from origin in direction U subject to external point P whose
  // shortest path on the surface is distance D and projecting angle is T
  if (geom.magsq(p) > d * d) {
    throw new Error("STOP! Trying to split expansive quad.");
  }
  return geom.mul(u, (d * d - geom.magsq(p)) / 2 / (d * Math.cos(t) - geom.dot(u, p)));
};


},{}],5:[function(require,module,exports){
//#TODO: match spec (no frame_designer, no frame_reference, fix cw -> ccw)
//#TODO: oripa folded state format
var DOMParser, convert, filter, oripa, ref, x, y;

if (typeof DOMParser === "undefined" || DOMParser === null) {
  DOMParser = require('@xmldom/xmldom').DOMParser;
}

//XMLSerializer = require('@xmldom/xmldom').XMLSerializer unless XMLSerializer?
//DOMImplementation = require('@xmldom/xmldom').DOMImplementation unless DOMImplementation?
convert = require('./convert');

filter = require('./filter');

oripa = exports;

//# Based on src/oripa/geom/OriLine.java
oripa.type2fold = {
  0: 'F', //# TYPE_NONE = flat
  1: 'B', //# TYPE_CUT = boundary 
  2: 'M', //# TYPE_RIDGE = mountain
  3: 'V' //# TYPE_VALLEY = valley
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

//oripa.prop_fold2xml = {}
//for x, y of oripa.prop_xml2fold
//  oripa.prop_fold2xml[y] = x if y?
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
      console.warn(`ORIPA file has ${node.tagName} where ${type} was expected`);
      return null;
    } else if ((key != null) && (!node.hasAttribute(key) || ((value != null) && node.getAttribute(key) !== value))) {
      console.warn(`ORIPA file has ${node.tagName} with ${key} = ${node.getAttribute(key)} where ${value} was expected`);
      return null;
    } else {
      return node;
    }
  };
  children = function(node) {
    var child, j, len, ref1, results;
    if (node) {
      ref1 = node.childNodes;
      //# element
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
      console.warn(`ORIPA file has ${node.tagName} with ${node.childNodes.length} children, not 1`);
      return null;
    } else {
      return nodeSpec(sub[0], type, key, value);
    }
  };
  oneChildText = function(node) {
    var child;
    if (node.childNodes.length > 1) {
      console.warn(`ORIPA file has ${node.tagName} with ${node.childNodes.length} children, not 0 or 1`);
      return null;
    } else if (node.childNodes.length === 0) {
      return '';
    } else {
      child = node.childNodes[0];
      if (child.nodeType !== 3) {
        return console.warn(`ORIPA file has nodeType ${child.nodeType} where 3 (text) was expected`);
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
                  //# Java doesn't encode the default value, 0
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
                    console.warn(`ORIPA line has missing data: ${x0} ${x1} ${y0} ${y1} ${type}`);
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
          console.warn(`Ignoring ${property.tagName} ${top.getAttribute('property')} in ORIPA file`);
        }
      }
    }
  }
  //# src/oripa/Doc.java uses absolute distance POINT_EPS = 1.0 to detect
  //# points being the same.
  filter.collapseNearbyVertices(fold, oripa.POINT_EPS);
  filter.subdivideCrossingEdges_vertices(fold, oripa.POINT_EPS);
  //# In particular, convert.removeLoopEdges fold
  convert.edges_vertices_to_faces_vertices(fold);
  return fold;
};

oripa.fromFold = function(fold) {
  var coord, edge, ei, fp, i, j, len, line, lines, ref1, s, vertex, vs, xp, z;
  if (typeof fold === 'string') {
    fold = JSON.parse(fold);
  }
  s = `<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.5.0_05" class="java.beans.XMLDecoder"> 
 <object class="oripa.DataSet"> 
  <void property="mainVersion"> 
   <int>1</int> 
  </void> 
  <void property="subVersion"> 
   <int>1</int> 
  </void> 
  <void property="paperSize"> 
   <double>400.0</double> 
  </void> 
`;
  ref1 = oripa.prop_xml2fold;
  for (xp in ref1) {
    fp = ref1[xp];
    //if fp of fold
    s += `.
  <void property="${xp}"> 
   <string>${fold[fp] || ''}</string> 
  </void> 
`.slice(2);
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
  s += `.
  <void property="lines"> 
   <array class="oripa.OriLineProxy" length="${lines.length}"> 
`.slice(2);
  for (i = j = 0, len = lines.length; j < len; i = ++j) {
    line = lines[i];
    s += `.
    <void index="${i}"> 
     <object class="oripa.OriLineProxy"> 
      <void property="type"> 
       <int>${line.type}</int> 
      </void> 
      <void property="x0"> 
       <double>${line.x0}</double> 
      </void> 
      <void property="x1"> 
       <double>${line.x1}</double> 
      </void> 
      <void property="y0"> 
       <double>${line.y0}</double> 
      </void> 
      <void property="y1"> 
       <double>${line.y1}</double> 
      </void> 
     </object> 
    </void> 
`.slice(2);
  }
  s += `.
   </array> 
  </void> 
 </object> 
</java> 
`.slice(2);
  return s;
};

convert.setConverter('.fold', '.opx', oripa.fromFold);

convert.setConverter('.opx', '.fold', oripa.toFold);


},{"./convert":2,"./filter":3,"@xmldom/xmldom":1}],6:[function(require,module,exports){
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
  U: "stroke: white;",
  F: "stroke: gray;",
  ax: "stroke: blue;",
  ay: "stroke: red;",
  az: "stroke: green;"
};

/* UTILITIES */
viewer.setAttrs = function(el, attrs) {
  var k, v;
  (function() {
    var results;
    results = [];
    for (k in attrs) {
      v = attrs[k];
      results.push(el.setAttribute(k, v));
    }
    return results;
  })();
  return el;
};

viewer.appendHTML = function(el, tag, attrs) {
  return el.appendChild(viewer.setAttrs(document.createElement(tag), attrs));
};

SVGNS = 'http://www.w3.org/2000/svg';

viewer.appendSVG = function(el, tag, attrs) {
  return el.appendChild(viewer.setAttrs(document.createElementNS(SVGNS, tag), attrs));
};

viewer.makePath = function(coords) {
  var c, i;
  return ((function() {
    var l, len, results;
    results = [];
    for (i = l = 0, len = coords.length; l < len; i = ++l) {
      c = coords[i];
      results.push(`${i === 0 ? 'M' : 'L'} ${c[0]} ${c[1]} `);
    }
    return results;
  })()).reduce(geom.sum);
};

/* INTERFACE */
viewer.processInput = function(input, view) {
  var k;
  if (typeof input === 'string') {
    view.fold = JSON.parse(input);
  } else {
    view.fold = input;
  }
  view.model = viewer.makeModel(view.fold);
  viewer.addRotation(view);
  viewer.draw(view);
  viewer.update(view);
  if (view.opts.properties) {
    view.properties.innerHTML = '';
    for (k in view.fold) {
      if (view.opts.properties) {
        viewer.appendHTML(view.properties, 'option', {
          value: k
        }).innerHTML = k;
      }
    }
    return viewer.updateProperties(view);
  }
};

viewer.updateProperties = function(view) {
  var s, v;
  v = view.fold[view.properties.value];
  s = v.length != null ? `${v.length} elements: ` : '';
  return view.data.innerHTML = s + JSON.stringify(v);
};

viewer.importURL = function(url, view) {
  var xhr;
  xhr = new XMLHttpRequest();
  xhr.onload = (e) => {
    return viewer.processInput(e.target.responseText, view);
  };
  xhr.open('GET', url);
  return xhr.send();
};

viewer.importFile = function(file, view) {
  var file_reader;
  file_reader = new FileReader();
  file_reader.onload = (e) => {
    return viewer.processInput(e.target.result, view);
  };
  return file_reader.readAsText(file);
};

DEFAULTS = {
  viewButtons: true,
  axisButtons: true,
  attrViewer: true,
  examples: false,
  import: true,
  export: true,
  properties: true
};

viewer.addViewer = function(div, opts = {}) {
  var buttonDiv, i, inputDiv, k, l, len, ref, ref1, ref2, select, t, title, toggleDiv, url, v, val, view;
  view = {
    cam: viewer.initCam(),
    opts: DEFAULTS
  };
  for (k in opts) {
    v = opts[k];
    view.opts[k] = v;
  }
  if (view.opts.viewButtons) {
    toggleDiv = viewer.appendHTML(div, 'div');
    toggleDiv.innerHtml = '';
    toggleDiv.innerHtml += 'Toggle: ';
    ref = view.cam.show;
    for (k in ref) {
      v = ref[k];
      t = viewer.appendHTML(toggleDiv, 'input', {
        type: 'checkbox',
        value: k
      });
      if (v) {
        t.setAttribute('checked', '');
      }
      toggleDiv.innerHTML += k + ' ';
    }
  }
  if (view.opts.axisButtons) {
    buttonDiv = viewer.appendHTML(div, 'div');
    buttonDiv.innerHTML += 'View: ';
    ref1 = ['x', 'y', 'z'];
    for (i = l = 0, len = ref1.length; l < len; i = ++l) {
      val = ref1[i];
      viewer.appendHTML(buttonDiv, 'input', {
        type: 'button',
        value: val
      });
    }
  }
  if (view.opts.properties) {
    buttonDiv.innerHTML += ' Property:';
    view.properties = viewer.appendHTML(buttonDiv, 'select');
    view.data = viewer.appendHTML(buttonDiv, 'div', {
      style: 'width: 300; padding: 10px; overflow: auto; border: 1px solid black; display: inline-block; white-space: nowrap;'
    });
  }
  if (view.opts.examples || view.opts.import) {
    inputDiv = viewer.appendHTML(div, 'div');
    if (view.opts.examples) {
      inputDiv.innerHTML = 'Example: ';
      select = viewer.appendHTML(inputDiv, 'select');
      ref2 = view.opts.examples;
      for (title in ref2) {
        url = ref2[title];
        viewer.appendHTML(select, 'option', {
          value: url
        }).innerHTML = title;
      }
      viewer.importURL(select.value, view);
    }
    if (view.opts.import) {
      inputDiv.innerHTML += ' Import: ';
      viewer.appendHTML(inputDiv, 'input', {
        type: 'file'
      });
    }
  }
  div.onclick = (e) => {
    if (e.target.type === 'checkbox') {
      if (e.target.hasAttribute('checked')) {
        e.target.removeAttribute('checked');
      } else {
        e.target.setAttribute('checked', '');
      }
      view.cam.show[e.target.value] = e.target.hasAttribute('checked');
      viewer.update(view);
    }
    if (e.target.type === 'button') {
      switch (e.target.value) {
        case 'x':
          viewer.setCamXY(view.cam, [0, 1, 0], [0, 0, 1]);
          break;
        case 'y':
          viewer.setCamXY(view.cam, [0, 0, 1], [1, 0, 0]);
          break;
        case 'z':
          viewer.setCamXY(view.cam, [1, 0, 0], [0, 1, 0]);
      }
      return viewer.update(view);
    }
  };
  div.onchange = (e) => {
    if (e.target.type === 'file') {
      viewer.importFile(e.target.files[0], view);
    }
    if (e.target.type === 'select-one') {
      if (e.target === view.properties) {
        return viewer.updateProperties(view);
      } else {
        return viewer.importURL(e.target.value, view);
      }
    }
  };
  view.svg = viewer.appendSVG(div, 'svg', {
    xmlns: SVGNS,
    width: 600
  });
  return view;
};

/* CAMERA */
viewer.initCam = function() {
  return {
    c: [0, 0, 0],
    x: [1, 0, 0],
    y: [0, 1, 0],
    z: [0, 0, 1],
    r: 1,
    last: null,
    show: {
      'Faces': true,
      'Edges': true,
      'Vertices': false,
      'Face Text': false
    }
  };
};

viewer.proj = function(p, cam) {
  var q;
  q = geom.mul(geom.sub(p, cam.c), 1 / cam.r);
  return [geom.dot(q, cam.x), -geom.dot(q, cam.y), 0];
};

viewer.setCamXY = function(cam, x, y) {
  return [cam.x, cam.y, cam.z] = [x, y, geom.cross(x, y)];
};

viewer.addRotation = function(view) {
  var cam, l, len, ref, s, svg;
  ({
    svg: svg,
    cam: cam
  } = view);
  ref = ['contextmenu', 'selectstart', 'dragstart'];
  for (l = 0, len = ref.length; l < len; l++) {
    s = ref[l];
    svg[`on${s}`] = function(e) {
      return e.preventDefault();
    };
  }
  svg.onmousedown = (e) => {
    return cam.last = [e.clientX, e.clientY];
  };
  svg.onmousemove = (e) => {
    return viewer.rotateCam([e.clientX, e.clientY], view);
  };
  return svg.onmouseup = (e) => {
    viewer.rotateCam([e.clientX, e.clientY], view);
    return cam.last = null;
  };
};

viewer.rotateCam = function(p, view) {
  var cam, d, e, u, x, y;
  cam = view.cam;
  if (cam.last == null) {
    return;
  }
  d = geom.sub(p, cam.last);
  if (!geom.mag(d) > 0) {
    return;
  }
  u = geom.unit(geom.plus(geom.mul(cam.x, -d[1]), geom.mul(cam.y, -d[0])));
  [x, y] = (function() {
    var l, len, ref, results;
    ref = ['x', 'y'];
    results = [];
    for (l = 0, len = ref.length; l < len; l++) {
      e = ref[l];
      results.push(geom.rotate(cam[e], u, geom.mag(d) * 0.01));
    }
    return results;
  })();
  viewer.setCamXY(cam, x, y);
  cam.last = p;
  return viewer.update(view);
};

/* RENDERING */
viewer.makeModel = function(fold) {
  var a, as, b, cs, edge, f, f1, f2, i, i1, j, j1, l, len, len1, len2, len3, len4, m, normRel, o, r, ref, ref1, ref2, ref3, ref4, ref5, v, vs, w, z;
  m = {
    vs: null,
    fs: null,
    es: {}
  };
  m.vs = (function() {
    var l, len, ref, results;
    ref = fold.vertices_coords;
    results = [];
    for (i = l = 0, len = ref.length; l < len; i = ++l) {
      cs = ref[i];
      results.push({
        i: i,
        cs: cs
      });
    }
    return results;
  })();
  (function() {
    var l, len, ref, results;
    ref = m.vs;
    results = [];
    for (i = l = 0, len = ref.length; l < len; i = ++l) {
      v = ref[i];
      if (v.cs.length === 2) {
        results.push(m.vs[i].cs[2] = 0);
      }
    }
    return results;
  })();
  m.fs = (function() {
    var l, len, ref, results;
    ref = fold.faces_vertices;
    results = [];
    for (i = l = 0, len = ref.length; l < len; i = ++l) {
      vs = ref[i];
      results.push({
        i: i,
        vs: (function() {
          var len1, r, results1;
          results1 = [];
          for (r = 0, len1 = vs.length; r < len1; r++) {
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
    ref = fold.edges_vertices;
    for (i = l = 0, len = ref.length; l < len; i = ++l) {
      v = ref[i];
      [a, b] = v[0] > v[1] ? [v[1], v[0]] : [v[0], v[1]];
      as = ((ref1 = fold.edges_assignment) != null ? ref1[i] : void 0) != null ? fold.edges_assignment[i] : 'U';
      m.es[`e${a}e${b}`] = {
        v1: m.vs[a],
        v2: m.vs[b],
        as: as
      };
    }
  } else {
    ref2 = m.fs;
    for (i = r = 0, len1 = ref2.length; r < len1; i = ++r) {
      f = ref2[i];
      ref3 = f.vs;
      for (j = z = 0, len2 = ref3.length; z < len2; j = ++z) {
        v = ref3[j];
        w = f.vs[geom.next(j, f.vs.length)];
        [a, b] = v.i > w.i ? [w, v] : [v, w];
        m.es[`e${a.i}e${b.i}`] = {
          v1: a,
          v2: b,
          as: 'U'
        };
      }
    }
  }
  ref4 = m.fs;
  for (i = i1 = 0, len3 = ref4.length; i1 < len3; i = ++i1) {
    f = ref4[i];
    m.fs[i].n = geom.polygonNormal((function() {
      var j1, len4, ref5, results;
      ref5 = f.vs;
      results = [];
      for (j1 = 0, len4 = ref5.length; j1 < len4; j1++) {
        v = ref5[j1];
        results.push(v.cs);
      }
      return results;
    })());
    m.fs[i].c = geom.centroid((function() {
      var j1, len4, ref5, results;
      ref5 = f.vs;
      results = [];
      for (j1 = 0, len4 = ref5.length; j1 < len4; j1++) {
        v = ref5[j1];
        results.push(v.cs);
      }
      return results;
    })());
    m.fs[i].es = {};
    m.fs[i].es = (function() {
      var j1, len4, ref5, results;
      ref5 = f.vs;
      results = [];
      for (j = j1 = 0, len4 = ref5.length; j1 < len4; j = ++j1) {
        v = ref5[j];
        w = f.vs[geom.next(j, f.vs.length)];
        [a, b] = v.i > w.i ? [w, v] : [v, w];
        edge = m.es[`e${a.i}e${b.i}`];
        if (edge == null) {
          edge = {
            v1: a,
            v2: b,
            as: 'U'
          };
        }
        results.push(edge);
      }
      return results;
    })();
    m.fs[i].ord = {};
  }
  if (fold.faceOrders != null) {
    ref5 = fold.faceOrders;
    for (j1 = 0, len4 = ref5.length; j1 < len4; j1++) {
      [f1, f2, o] = ref5[j1];
      if (o !== 0) {
        if (geom.parallel(m.fs[f1].n, m.fs[f2].n)) {
          normRel = geom.dot(m.fs[f1].n, m.fs[f2].n) > 0 ? 1 : -1;
          if (m.fs[f1].ord[`f${f2}`] != null) {
            console.log(`Warning: duplicate ordering input information for faces ${f1} and ${f2}. Using first found in the faceOrder list.`);
            if (m.fs[f1].ord[`f${f2}`] !== o) {
              console.log(`Error: duplicate ordering [${f1},${f2},${o}] is inconsistent with a previous entry.`);
            }
          } else {
            m.fs[f1].ord[`f${f2}`] = o;
            m.fs[f2].ord[`f${f1}`] = -o * normRel;
          }
        } else {
          console.log(`Warning: order for non-parallel faces [${f1},${f2}]`);
        }
      }
    }
  }
  return m;
};

viewer.faceAbove = function(f1, f2, n) {
  var basis, dir, f, ord, p1, p2, sepDir, v, v1, v2;
  [p1, p2] = (function() {
    var l, len, ref, results;
    ref = [f1, f2];
    results = [];
    for (l = 0, len = ref.length; l < len; l++) {
      f = ref[l];
      results.push((function() {
        var len1, r, ref1, results1;
        ref1 = f.vs;
        results1 = [];
        for (r = 0, len1 = ref1.length; r < len1; r++) {
          v = ref1[r];
          results1.push(v.ps);
        }
        return results1;
      })());
    }
    return results;
  })();
  sepDir = geom.separatingDirection2D(p1, p2, [0, 0, 1]);
  if (sepDir != null) {
    return null; // projections do not overlap
  }
  [v1, v2] = (function() {
    var l, len, ref, results;
    ref = [f1, f2];
    results = [];
    for (l = 0, len = ref.length; l < len; l++) {
      f = ref[l];
      results.push((function() {
        var len1, r, ref1, results1;
        ref1 = f.vs;
        results1 = [];
        for (r = 0, len1 = ref1.length; r < len1; r++) {
          v = ref1[r];
          results1.push(v.cs);
        }
        return results1;
      })());
    }
    return results;
  })();
  basis = geom.basis(v1.concat(v2));
  if (basis.length === 3) {
    dir = geom.separatingDirection3D(v1, v2);
    if (dir != null) {
      return 0 > geom.dot(n, dir); // faces are separable in 3D
    } else {
      console.log(`Warning: faces ${f1.i} and ${f2.i} properly intersect. Ordering is unresolved.`);
    }
  }
  if (basis.length === 2) {
    ord = f1.ord[`f${f2.i}`];
    if (ord != null) {
      return 0 > geom.dot(f2.n, n) * ord; // faces coplanar and have order
    }
  }
  return null;
};

viewer.orderFaces = function(view) {
  var c, direction, f, f1, f1_above, f2, faces, i, i1, j, l, len, len1, len2, len3, p, r, ref, ref1, results, z;
  faces = view.model.fs;
  direction = geom.mul(view.cam.z, -1);
  (function() {
    var l, len, results;
    results = [];
    for (l = 0, len = faces.length; l < len; l++) {
      f = faces[l];
      results.push(f.children = []);
    }
    return results;
  })();
  for (i = l = 0, len = faces.length; l < len; i = ++l) {
    f1 = faces[i];
    for (j = r = 0, len1 = faces.length; r < len1; j = ++r) {
      f2 = faces[j];
      if (!(i < j)) {
        continue;
      }
      f1_above = viewer.faceAbove(f1, f2, direction);
      if (f1_above != null) {
        [p, c] = f1_above ? [f1, f2] : [f2, f1];
        p.children = p.children.concat([c]);
      }
    }
  }
  view.model.fs = geom.topologicalSort(faces);
  ref = view.model.fs;
  for (z = 0, len2 = ref.length; z < len2; z++) {
    f = ref[z];
    f.g.parentNode.removeChild(f.g);
  }
  ref1 = view.model.fs;
  results = [];
  for (i1 = 0, len3 = ref1.length; i1 < len3; i1++) {
    f = ref1[i1];
    results.push(view.svg.appendChild(f.g));
  }
  return results;
};

viewer.draw = function({
    svg: svg,
    cam: cam,
    model: model
  }) {
  var c, e, f, i, i1, j, k, l, len, len1, len2, len3, max, min, r, ref, ref1, ref2, ref3, results, style, t, v, z;
  svg.innerHTML = '';
  style = viewer.appendSVG(svg, 'style');
  for (k in STYLES) {
    v = STYLES[k];
    style.innerHTML += `.${k}{${v}}\n`;
  }
  min = (function() {
    var l, len, ref, results;
    ref = [0, 1, 2];
    results = [];
    for (l = 0, len = ref.length; l < len; l++) {
      i = ref[l];
      results.push(((function() {
        var len1, r, ref1, results1;
        ref1 = model.vs;
        results1 = [];
        for (r = 0, len1 = ref1.length; r < len1; r++) {
          v = ref1[r];
          results1.push(v.cs[i]);
        }
        return results1;
      })()).reduce(geom.min));
    }
    return results;
  })();
  max = (function() {
    var l, len, ref, results;
    ref = [0, 1, 2];
    results = [];
    for (l = 0, len = ref.length; l < len; l++) {
      i = ref[l];
      results.push(((function() {
        var len1, r, ref1, results1;
        ref1 = model.vs;
        results1 = [];
        for (r = 0, len1 = ref1.length; r < len1; r++) {
          v = ref1[r];
          results1.push(v.cs[i]);
        }
        return results1;
      })()).reduce(geom.max));
    }
    return results;
  })();
  cam.c = geom.mul(geom.plus(min, max), 0.5);
  cam.r = geom.mag(geom.sub(max, min)) / 2 * 1.05;
  c = viewer.proj(cam.c, cam);
  viewer.setAttrs(svg, {
    viewBox: "-1,-1,2,2"
  });
  t = "translate(0,0.01)";
  ref = model.fs;
  for (i = l = 0, len = ref.length; l < len; i = ++l) {
    f = ref[i];
    f.g = viewer.appendSVG(svg, 'g');
    f.path = viewer.appendSVG(f.g, 'path');
    f.text = viewer.appendSVG(f.g, 'text', {
      class: 'text',
      transform: t
    });
    f.text.innerHTML = `f${f.i}`;
    f.eg = [];
    ref1 = f.es;
    for (j = r = 0, len1 = ref1.length; r < len1; j = ++r) {
      e = ref1[j];
      f.eg[j] = viewer.appendSVG(f.g, 'path');
    }
    f.vg = [];
    ref2 = f.vs;
    for (j = z = 0, len2 = ref2.length; z < len2; j = ++z) {
      v = ref2[j];
      f.vg[j] = viewer.appendSVG(f.g, 'g');
      f.vg[j].path = viewer.appendSVG(f.vg[j], 'circle', {
        class: 'vert'
      });
      f.vg[j].text = viewer.appendSVG(f.vg[j], 'text', {
        transform: 'translate(0, 0.01)',
        class: 'text'
      });
      f.vg[j].text.innerHTML = `${v.i}`;
    }
  }
  cam.axis = viewer.appendSVG(svg, 'g', {
    transform: 'translate(-0.9,-0.9)'
  });
  ref3 = ['x', 'y', 'z'];
  results = [];
  for (i1 = 0, len3 = ref3.length; i1 < len3; i1++) {
    c = ref3[i1];
    results.push(cam.axis[c] = viewer.appendSVG(cam.axis, 'path', {
      id: `a${c}`,
      class: `a${c} axis`
    }));
  }
  return results;
};

viewer.update = function(view) {
  var c, cam, e, end, f, i, j, k, l, len, len1, len2, model, p, r, ref, ref1, ref2, ref3, ref4, results, show, svg, v, visibleSide, z;
  ({
    model: model,
    cam: cam,
    svg: svg
  } = view);
  (function() {
    var l, len, ref, results;
    ref = model.vs;
    results = [];
    for (i = l = 0, len = ref.length; l < len; i = ++l) {
      v = ref[i];
      results.push(model.vs[i].ps = viewer.proj(v.cs, cam));
    }
    return results;
  })();
  (function() {
    var l, len, ref, results;
    ref = model.fs;
    results = [];
    for (i = l = 0, len = ref.length; l < len; i = ++l) {
      f = ref[i];
      results.push(model.fs[i].c2 = viewer.proj(f.c, cam));
    }
    return results;
  })();
  viewer.orderFaces(view);
  show = {};
  ref = cam.show;
  for (k in ref) {
    v = ref[k];
    show[k] = v ? 'visible' : 'hidden';
  }
  ref1 = model.fs;
  for (i = l = 0, len = ref1.length; l < len; i = ++l) {
    f = ref1[i];
    if (!(f.path != null)) {
      continue;
    }
    visibleSide = geom.dot(f.n, cam.z) > 0 ? 'top' : 'bot';
    viewer.setAttrs(f.text, {
      x: f.c2[0],
      y: f.c2[1],
      visibility: show['Face Text']
    });
    viewer.setAttrs(f.path, {
      d: viewer.makePath((function() {
        var len1, r, ref2, results;
        ref2 = f.vs;
        results = [];
        for (r = 0, len1 = ref2.length; r < len1; r++) {
          v = ref2[r];
          results.push(v.ps);
        }
        return results;
      })()) + 'Z',
      visibility: show['Faces'],
      class: `face ${visibleSide}`
    });
    ref2 = f.es;
    for (j = r = 0, len1 = ref2.length; r < len1; j = ++r) {
      e = ref2[j];
      viewer.setAttrs(f.eg[j], {
        d: viewer.makePath([e.v1.ps, e.v2.ps]),
        visibility: show['Edges'],
        class: `edge ${e.as}`
      });
    }
    ref3 = f.vs;
    for (j = z = 0, len2 = ref3.length; z < len2; j = ++z) {
      v = ref3[j];
      viewer.setAttrs(f.vg[j], {
        visibility: show['Vertices']
      });
      viewer.setAttrs(f.vg[j].path, {
        cx: v.ps[0],
        cy: v.ps[1]
      });
      viewer.setAttrs(f.vg[j].text, {
        x: v.ps[0],
        y: v.ps[1]
      });
    }
  }
  ref4 = {
    x: [1, 0, 0],
    y: [0, 1, 0],
    z: [0, 0, 1]
  };
  results = [];
  for (c in ref4) {
    v = ref4[c];
    end = geom.plus(geom.mul(v, 0.05 * cam.r), cam.c);
    results.push(viewer.setAttrs(cam.axis[c], {
      d: viewer.makePath((function() {
        var i1, len3, ref5, results1;
        ref5 = [cam.c, end];
        results1 = [];
        for (i1 = 0, len3 = ref5.length; i1 < len3; i1++) {
          p = ref5[i1];
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
