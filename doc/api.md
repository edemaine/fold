# FOLD API

The FOLD API consists of several modules under the `FOLD` namespace:

* `FOLD.viewer`: Visualize FOLD format in browser in SVG
* `FOLD.filter`: Select existing parts of, or compute new features of,
  a given FOLD object.
* `FOLD.convert`: Augment an existing FOLD object with additional fields,
  and convert between FOLD and other file formats.
* `FOLD.file`: Load/save/convert files on file system (Node only, not browser)
* `FOLD.geom`: Basic geometry tools (manipulation of vectors, angles,
  lines, segments, etc.).  Basically whatever we needed to implement other
  features, but which you might find helpful too.

## FOLD.viewer

See [source code](https://github.com/edemaine/fold/blob/master/src/viewer.coffee)
for details.

## FOLD.filter

These operations all modify a FOLD object in-place.
See [source code](https://github.com/edemaine/fold/blob/master/src/filter.coffee)
for details.

* `FOLD.filter.subdivideCrossingEdges_vertices(fold, epsilon)`:
  Given a FOLD object with 2D `vertices_coords` and `edges_vertices`,
  subdivides all crossing/touching edges to form a planar graph.
  All duplicate and loop edges are also removed.
* `FOLD.filter.maybeAddVertex(fold, coords, epsilon)`:
  Given a FOLD object with `vertices_coords`, adds a new vertex with
  coordinates `coords` and returns its (last) index, unless there is already
  such a vertex within distance `epsilon`, in which case return the closest
  such vertex's index.  The new vertex has no new properties except
  `vertex_coords`.
* `FOLD.filter.addEdgeAndSubdivide(fold, v1, v2, epsilon)`:
  Given a FOLD object with `vertices_coords` and `edges_vertices`,
  adds an edge between vertex indices or points `v1` and `v2`
  (calling `FOLD.filter.maybeAddVertex` when they are points),
  subdividing if necessary (via an efficient use of
  `FOLD.filter.subdivideCrossingEdges_vertices`),
  and returns an array of all the subdivided parts of the added edge.
  If the edge is a loop or a duplicate, the returned array is empty.
  The new edge(s) have no properties except `edges_vertices`.

## FOLD.convert

See [source code](https://github.com/edemaine/fold/blob/master/src/convert.coffee)
for details.

* `FOLD.convert.edges_vertices_to_vertices_vertices_unsorted(fold)`:
  Given a FOLD object with `edges_vertices` property (defining edge
  endpoints), automatically computes the `vertices_vertices` property.
  However, note that the `vertices_vertices` arrays will *not* be sorted
  in counterclockwise order.
* `FOLD.convert.edges_vertices_to_vertices_vertices_sorted(fold)`:
  Given a FOLD object with 2D `vertices_coords` and `edges_vertices` property
  (defining edge endpoints), automatically computes the `vertices_vertices`
  property and sorts them counterclockwise by angle in the plane.
* `FOLD.convert.sort_vertices_vertices(fold)`:
  Given a FOLD object with 2D `vertices_coords` and `vertices_vertices`
  properties, sorts each `vertices_vertices` array in counterclockwise
  order around the vertex in the plane.
* `FOLD.convert.vertices_vertices_to_faces_vertices(fold)`:
  Given a FOLD object with counterclockwise-sorted `vertices_vertices`
  property, constructs the implicitly defined faces, setting `faces_vertices`
  property.
* `FOLD.convert.edges_vertices_to_faces_vertices(fold)`:
  Given a FOLD object with 2D `vertices_coords` and `edges_vertices`,
  computes a counterclockwise-sorted `vertices_vertices` property and
  constructs the implicitly defined faces, setting `faces_vertices` property.
* `FOLD.convert.verticesFaces_to_edges(fold)`:
  Given a FOLD object with `faces_vertices` property, computes
  `edges_vertices`, `edges_faces`, `faces_edges`, and `edges_assignment`
  properties (where the assignment is "B" for boundary edges).

File format conversion (supported formats are `"fold"` and `"opx"`):

* `FOLD.convert.toJSON(fold)`:
  Given a FOLD object, convert into a nicely formatted JSON string.
* `FOLD.convert.convertFromTo(data, fromFormat, toFormat)`: Convert the
  specified data from one format to another.
* `FOLD.convert.convertFrom(data, fromFormat)`: Convert the specified data
  from one format to FOLD.
* `FOLD.convert.convertTo(data, toFormat)`: Convert the specified data
  from FOLD to another format.
* The `FOLD.convert.oripa` submodule implements the conversion between FOLD and
  [ORIPA `.opx` format](http://mitani.cs.tsukuba.ac.jp/oripa/).  See
  [source code](https://github.com/edemaine/fold/blob/master/src/oripa.coffee)
  for details.


See [source code](https://github.com/edemaine/fold/blob/master/src/convert.coffee)
for details.

## FOLD.file

The following functions are available in Node only, not in the browser
(where filenames don't really make sense).

* `FOLD.file.toFile(fold, filename)`: Save FOLD object to specified
  filename, which can end in a supported extension (`.fold` or `.opx`).
* `FOLD.file.fileToFile(inFilename, outFilename)`: Convert one filename
  to another, using extensions to determine format.
  Alternatively, `outFilename` can be *just* an extension, in which case
  it will be combined with `inFilename` to form a full filename.

See [source code](https://github.com/edemaine/fold/blob/master/src/file.coffee)
for details.

## FOLD.geom

See [source code](https://github.com/edemaine/fold/blob/master/src/geom.coffee)
for details.
