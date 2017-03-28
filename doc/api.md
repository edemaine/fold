# FOLD API

The FOLD API consists of several modules under the `fold` namespace:

* `fold.filter`: Select existing parts of, or compute new features of,
  a given FOLD object.
* `fold.convert`: Augment an existing FOLD object with additional fields,
  and convert between FOLD and other file formats.
* `fold.geom`: Basic geometry tools (manipulation of vectors, angles,
  lines, segments, etc.).  Basically whatever we needed to implement other
  features, but which you might find helpful too.

## fold.filter

See [source code](https://github.com/edemaine/fold/blob/master/src/filter.coffee)
for details.

## fold.convert

* `fold.convert.edges_vertices_to_vertices_vertices(foldObject)`:
  Given a FOLD object with `edges_vertices` property (defining edge
  endpoints), automatically computes the `vertices_vertices` property.
  However, note that the `vertices_vertices` arrays will *not* be sorted
  in counterclockwise order.  Use `sort_vertices_vertices` for that.
* `fold.convert.sort_vertices_vertices(foldObject)`:
  Given a FOLD object with 2D `vertices_coords` and `vertices_vertices`
  properties, sorts each `vertices_vertices` array in counterclockwise
  order around the vertex.  Given a FOLD object with `vertices_coords` and
  `edges_vertices` properties, automatically computes the `vertices_vertices`
  property and then sorts them.
* `fold.convert.vertices_vertices_to_faces_vertices(foldObject)`:
  Given a FOLD object with counterclockwise-sorted `vertices_vertices`
  property (or one where this property can be computed via
  `fold.convert.sort_vertices_vertices`),
  constructs the implicitly defined faces, setting `faces_vertices` property.
* `fold.convert.verticesFaces_to_edges(foldObject)`:
  Given a FOLD object with `faces_vertices` property, computes
  `edges_vertices`, `edges_faces`, `faces_edges`, and `edges_assignment`
  properties (where the assignment is "B" for boundary edges).
* `fold.convert.toFile(foldObject, filename)`: Save FOLD object to specified
  filename, which can end in `.fold` or a supported extension (`.opx`).
* `fold.convert.fileToFile(inFilename, outFilename)`: Convert one filename
  to another, using extensions to determine format (`.fold`, `.opx`).
  Alternatively, `outFilename` can be *just* an extension, in which case
  it will be combined with `inFilename` to form a full filename.
* `fold.convert.oripa.toFold(opxString)`: Parses a file in the
  [ORIPA `.opx` format](http://mitani.cs.tsukuba.ac.jp/oripa/) and
  returns a FOLD object.
* `fold.convert.oripa.fromFold(foldObject)`: Converts a given FOLD object
  (or JSON string) into a string in
  [ORIPA `.opx` format](http://mitani.cs.tsukuba.ac.jp/oripa/).

See [source code](https://github.com/edemaine/fold/blob/master/src/convert.coffee)
for details.

## fold.geom

See [source code](https://github.com/edemaine/fold/blob/master/src/geom.coffee)
for details.
