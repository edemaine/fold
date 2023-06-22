# [FOLD](https://github.com/edemaine/fold/) Specification (version 1.2)

This specification is still considered a rough draft, with everything subject
to change.  But we will increment version numbers when breaking changes or
major new features are added.  See the [history of past versions](history.md).

## Design

The FOLD format seeks to balance generality and simplicity:

* **Generality:** FOLD can represent a wide variety of folded structures in
  different dimensions, including general codimensional layering information,
  general polyhedral complexes (even nonorientable nonmanifold complexes
  with holes, genus, etc.), and multiple foldings in the same file.
  It's also easy to add your own extra data, supporting use cases in existing
  (and hopefully future) computational origami software.
* **Simplicity:** FOLD can represent common folded structures simply:
  it's easy to ignore features you don't need.
  For example, **most fields are optional** and can be omitted.
  (Our library provides tools for automatically filling in optional fields
  where possible.)  Similarly, if you only store one "frame" in the file,
  then you can altogether ignore the idea of frames.

## [Examples](../examples)

Check out some [sample .fold files](../examples) to get a quick sense of
the format.

## Overview

A `.fold` file is a [JSON](http://www.json.org/) (JavaScript Object Notation)
file where some fields should be interpreted with special meanings
defined in this document.  JSON is a simple way of encoding numbers, strings,
arrays, and dictionaries with string keys into a text file.
A benefit of adopting this format is that [JSON parsers](http://www.json.org/)
are already available in essentially all programming languages.  For example,
JavaScript has the built-in
[`JSON` module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON),
and Python [2](https://docs.python.org/2/library/json.html) and
[3](https://docs.python.org/3/library/json.html) have
the built-in `json` library.

A `.fold` file represents one or more **frames**.
A frame can represent a crease pattern (unfolding),
a mountain-valley pattern, a folded state, a polyhedral complex,
or even an abstract polyhedral metric, linkage configuration, or linkage.
Each frame contains linked geometric information describing
folded and (optionally) layered geometry in flat arrays,
similar to information storage in the OBJ format.
At the top level of every `.fold` file is a dictionary
containing keys linking to either geometric
data for a folded structure (**frame properties**),
or metadata about the file itself (**metadata properties**).

Most properties (keys) have an `A_B` naming convention,
where `A` represents some implicit object or objects
and `B` represents some property of `A`. For example,
if `students` represents an arbitrarily ordered list
of students, then `students_name` might represent the
name of each student, while `students_age` might represent
each student's age. The value of the `students_name` property
would be a zero-indexed array of names, while
the value of the `students_age` property would be
an array of integers, where element *i* of `students_name`
represents the name of student *i*, and element *i*
of `students_age` represents the age of the same student *i*.
(Laying out data in this flat "parallel arrays" representation
decreases the depth of the object tree and makes it easy to add
custom data onto existing objects.)

FOLD currently defines meaning for properties of the following form,
which head the sections below.  All properties are optional,
but some are recommended.

* `file_...`: Metadata about the file
* `frame_...`: Metadata about a frame (folding) in the file
* `vertices_...`: Data about the (0D) vertices, in a zero-indexed array by vertex ID
* `edges_...`: Data about the (1D) edges, in a zero-indexed array by edge ID
* `faces_...`: Data about the (2D) faces, in a zero-indexed array by face ID
* `faceOrders`/`edgeOrders`: Ordering information between pairs of faces/edges, in an array

## File Metadata (`file_...`)

File-level (as opposed to [frame-level](#frame-metadata-frame_))
metadata properties can be included *only* in the top-level JSON dictionary.
They include:

* `file_spec`: The version of the FOLD spec that the file assumes
  (a number).  See the top of this spec for the current value,
  and [history](history.md) for differences between versions.
  **Strongly recommended**, in case we ever have to make
  backward-incompatible changes.
* `file_creator`: The software that created the file (a string).
  **Recommended** for files output by computer software;
  less important for files made by hand.
* `file_author`: The human author (a string).
* `file_title`: A title for the entire file (a string).
* `file_description`: A description of the entire file (a string).
* `file_classes`: A subjective interpretation about what the entire file
  represents (array of strings).  Some standard file classes include
  * `"singleModel"`: A single origami model, possibly still in multiple frames
                     to represent crease pattern, folded form, etc.
  * `"multiModel"`: Multiple origami models collected together into one file
  * `"animation"`: Animation of sequence of frames,
                   e.g., illustrating a continuous folding motion
  * `"diagrams"`: A sequence of frames representing folding steps,
                  as in origami diagrams
  * Custom classes should have a colon in them;
    see [Custom Properties](#custom-properties) below.
* `file_frames`: Array of frame dictionaries.
  See [Multiple Frames](#multiple-frames) below.

## Frame Metadata (`frame_...`)

Frame-level (as opposed to [file-level](#file-metadata-file_))
metadata properties in the FOLD format include

* `frame_author`: The human author (a string).
* `frame_title`: A title for the frame (a string).
* `frame_description`: A description of the frame (a string).
* `frame_classes`: A subjective interpretation about what the frame represents
  (array of strings).  Some standard frame classes:
  * `"creasePattern"`: a crease pattern (unfolded)
  * `"foldedForm"`: a folded form/state, e.g. flat folding or 3D folding
  * `"graph"`: vertices and edges, but no lengths or faces
  * `"linkage"`: vertices and edges and edge lengths, but no faces
  * Custom classes should have a colon in them;
    see [Custom Properties](#custom-properties) below.
* `frame_attributes`: Attributes that objectively describe properties of the
  folded structure being represented (array of strings).
  Some standard frame attributes include
  * `"2D"`: the coordinates lie in 2D (xy); z coordinates are all implicitly
    or explicitly 0
  * `"3D"`: the coordinates lie in 3D (xyz) and not 2D (xy)
  * `"abstract"`: the polyhedral complex is not embedded in Euclidean space,
    so there are no vertex coordinates (but there might be edge lengths
    defining intrinsic geometry)
  <!--
  * `"concrete"`: the polyhedral complex is embedded in Euclidean space,
    so there should be vertex coordinates
  -->
  * `"manifold"` / `"nonManifold"`:
    whether the polyhedral complex is a manifold
    (has at most two faces incident to each edge)
  * `"orientable"` / `"nonOrientable"`:
    whether the polyhedral complex is orientable, meaning it can be
    assigned a consistent normal direction (and hence it is also manifold)
  * `"selfTouching"` / `"nonSelfTouching"`:
    whether the polyhedral complex has faces that touch in their
    relative interiors, in which case you probably want a face ordering
  * `"selfIntersecting"` / `"nonSelfIntersecting"`:
    whether the polyhedral complex has properly intersecting faces
  * `"cuts"` / `"noCuts"`:
    whether any edges have an assignment of `"C"`
    (cut/slit representing multiple `"B"` edges)
  * `"joins"` / `"noJoins"`:
    whether any edges have an assignment of `"J"` (join)
  * `"convexFaces"` / `"nonConvexFaces"`:
    whether all faces are convex polygons, or some are nonconvex
  * Custom attributes should have a colon in them;
    see [Custom Properties](#custom-properties) below.
* `frame_unit`: Physical or logical unit that all coordinates are
  relative to (a string).  Standard defined values are as follows.
  You can also use a custom string, but it will probably not be
  understood by software.
  * `"unit"` (equivalent to not specifying a unit): no physical meaning
  * `"in"`: inches (25.4 mm)
  * `"pt"`: desktop publishing/PostScript [points](https://en.wikipedia.org/wiki/Point_(typography)) (1/72 in)
  * `"m"`: meters (1/299,792,458 light seconds)
  * `"cm"`: centimeters (1/100 meters)
  * `"mm"`: millimeters (1/1000 meters)
  * `"um"`: microns (1/1,000,000 meters)
  * `"nm"`: nanometers (1/1,000,000,000 meters)

## Vertex information: `vertices_...`

The values of the following properties are zero-indexed arrays by vertex ID.

* `vertices_coords`: For each vertex, an array of coordinates,
  such as `[x, y, z]` or `[x, y]` (where `z` is implicitly zero).
  In higher dimensions, all trailing unspecified coordinates are implicitly zero.
  **Recommended** except for frames with attribute `"abstract"`.
  <!--**Required** for frames with attribute `"concrete"`.-->
* `vertices_vertices`: For each vertex, an array of vertices (vertex IDs)
  that are adjacent along edges.  If the frame represents an orientable
  manifold or planar linkage, this list should be ordered counterclockwise
  around the vertex (possibly repeating a vertex more than once).
  If the frame is a nonorientable manifold, this list should be cyclically
  ordered around the vertex (possibly repeating a vertex).
  Otherwise, the order is arbitrary.
  **Recommended** in any frame lacking `edges_vertices` property
  (otherwise `vertices_vertices` can easily be computed from
  `edges_vertices` as needed).
* `vertices_edges`: For each vertex, an array of edge IDs for the edges
  incident to the vertex.  If the frame represents an orientable manifold,
  this list should be ordered counterclockwise around the vertex.
  If the frame is a nonorientable manifold, this list should be cyclically
  ordered around the vertex.
  In all cases, the linear order should match `vertices_vertices` if both
  are specified: `vertices_edges[v][i]` should be an edge connecting vertices
  `v` and `vertices_vertices[v][i]`.
* `vertices_faces`: For each vertex, an array of face IDs for the faces
  incident to the vertex, possibly including `null`s.
  If the frame represents a manifold, `vertices_faces` should align with
  `vertices_vertices` and/or `vertices_edges`:
  `vertices_faces[v][i]` should be either

  * the face containing vertices
    `vertices_vertices[v][i]` and `vertices_vertices[v][(i+1)%d]` and
    containing edges `vertices_edges[v][i]` and `vertices_edges[v][(i+1)%d]`,
    where `d` is the degree of vertex `v`; or
  * `null` if such a face doesn't exist.

  If the frame represents an orientable manifold,
  this list should be ordered counterclockwise around the vertex
  (possibly repeating a face more than once).  If the frame is a nonorientable
  manifold, this list should be cyclically ordered around the vertex
  (possibly repeating a vertex), and matching the cyclic order of
  `vertices_vertices` and/or `vertices_edges` (if either is specified).

## Edge information: `edges_...`

The values of the following properties are zero-indexed arrays by edge ID.

* `edges_vertices`: For each edge, an array `[u, v]` of two vertex IDs for the
  two endpoints of the edge.  This effectively defines the *orientation*
  of the edge, from `u` to `v`.  (This orientation choice is arbitrary,
  but is used to define the ordering of `edges_faces`.)
  **Recommended** in frames having any `edges_...` property
  (e.g., to represent mountain-valley assignment).
<!--
* `edges_edges`: For each edge, an array of edge IDs for the edges incident
  to (either endpoint of) the edge.  If the frame is a manifold,
  the edges should be listed in cyclic order around the edge (concatenating
  some cyclic shift of `vertices_edges` for the two endpoints); and if the
  frame is an oriented manifold, the order should be counterclockwise.
  (This property is defined for completeness, but may not be particularly useful.)
-->
* `edges_faces`: For each edge, an array of face IDs for the faces incident
  to the edge, possibly including `null`s.
  For nonmanifolds in particular, the (nonnull) faces should be listed in
  counterclockwise order around the edge,
  relative to the orientation of the edge.
  For manifolds, the array for each edge should be an array of length 2,
  where the first entry is the face locally to the "left" of
  the edge (or `null` if there is no such face) and the second entry is the
  face locally to the "right" of the edge (or `null` if there is no such face);
  for orientable manifolds, "left" and "right" must be consistent with the
  manifold orientation given by the counterclockwise orientation of faces.
  However, a boundary edge may also be represented by a length-1 array, with
  the `null` omitted, to be consistent with the nonmanifold representation.
* `edges_assignment`: For each edge, a string representing its fold
  direction assignment:
  * `"B"`: border/boundary edge (only one incident face)
  * `"M"`: mountain crease
  * `"V"`: valley crease
  * `"F"`: flat (unfolded) crease
  * `"U"`: unassigned/unknown crease
  * `"C"`: cut/slit edge (should be treated as multiple `"B"` edges)
  * `"J"`: join edge (incident faces should be treated as a single face)

  For example, this property can be used to specify a full mountain-valley
  assignment (consisting of `"M"`, `"V"`, and `"B"`), or just to label
  which edges are boundary edges (consisting of `"U"` or `"B"`).

  * **Folded edges**
    * For orientable manifolds, a valley crease (`"V"`) points the two
      face normals into each other,
      while a mountain crease (`"M"`) makes them point away from each other.
      For nonorientable manifolds, a valley fold is defined as bringing the
      normal of the face to the left of the edge
      (listed first in `edges_faces`)
      to point into the adjacent face (when fully folded),
      while a mountain fold has the
      same normal point away from the adjacent face.
    * An unassigned/unknown crease (`"U"`) is a crease that could be mountain
      or valley or (in some cases) flat, but it is unknown which.
  * **Unfolded edges**
    * Flat creases (`"F"`) represent creases that are present but not folded
      (not mountain or valley).
    * Join edges (`"J"`) represent edges that are present only for modeling
      purposes, and are insignificant from an origami perspective:
      the incident faces should in fact be treated as a single effective face.
      Join edges enable the modeling of one effective face that is both above
      and below another effective face, and effective faces with holes.
      Join edges are also appropriate for triangulation edges used in
      simulation but which are not meaningful otherwise.
      If you use join edges, we recommend including
      `"joins"` in [`frame_attributes`](#frame-metadata-frame_).
      *Added in version 1.2.*
  * **Boundary edges**
    * A boundary edge (`"B"`) has only one incident face.
    * A cut/slit edge (`"C"`) is shorthand for two (or more for nonmanifold)
      boundary edges at the same location.
      This is useful for e.g. drawing programs to enable
      simple toggling of slits in a crease pattern without having to
      convert back and forth from a multiple-`"B"`-edge representation.
      Mechanical modeling should treat such edges as separate boundary (`"B"`)
      edges, one per face, with incident `"C"` edges connecting together into
      larger slits/holes.
      Support for `"C"` edges is **optional**, so is not expected to be
      implemented by all software supporting the FOLD format.
      Implement only for applications where it is useful,
      limited to locally nonoverlapping, locally manifold surfaces.
      If you use cut edges, we recommend including
      `"cuts"` in [`frame_attributes`](#frame-metadata-frame_).
      *Added in version 1.2.*
* `edges_foldAngle`: For each edge, the fold angle (deviation from flatness)
  along each edge of the pattern.  The fold angle is a number in degrees
  lying in the range [&minus;180, 180].  The fold angle is positive for
  valley folds, negative for mountain folds, and zero for flat, unassigned,
  and border folds.  Accordingly, the sign of `edge_foldAngle` should match
  `edges_assignment` if both are specified.
  *Renamed from `edges_foldAngles` in version 1.1.*
* `edges_length`: For each edge, the length of the edge (a number).
  This is mainly useful for defining the intrinsic geometry of
  abstract complexes where `vertices_coords` are unspecified;
  otherwise, `edges_length` can be computed from `vertices_coords`.
  *Renamed from `edges_lengths` in version 1.1.*

## Face information: `faces_...`

Faces in a FOLD file should correspond to the "material" being folded.
In particular, they do not typically include the exterior (unbounded) face
of a planar graph such as a crease pattern.

The values of the following properties are zero-indexed arrays by face ID.

* `faces_vertices`: For each face, an array of vertex IDs for the vertices
  around the face *in counterclockwise order*.  This array can repeat the
  same vertex multiple times (e.g., if the face has a "slit" in it).
  **Recommended** in any frame having faces.
* `faces_edges`: For each face, an array of edge IDs for the edges around
  the face *in counterclockwise order*.  In addition to the matching cyclic
  order, `faces_vertices` and `faces_edges` should align in start so that
  `faces_edges[f][i]` is the edge connecting `faces_vertices[f][i]` and
  `faces_vertices[f][(i+1)%d]` where `d` is the degree of face `f`.
* `faces_faces`: For each face, an array of face IDs for the faces *sharing
  edges* around the face, possibly including `null`s.
  If the frame is a manifold, the faces should be listed in counterclockwise
  order and in the same linear order as `faces_edges` (if it is specified):
  `f` and `faces_faces[f][i]` should be the faces incident to the edge
  `faces_edges[f][i]`, unless that edge has no face on the other side,
  in which case `faces_faces[f][i]` should be `null`.

The counterclockwise ordering of each face defines the side/sign of its
**normal vector**.

## Layer information: `faceOrders` and `edgeOrders`

The layer ordering of a folded state is normally defined pointwise
(&lambda;(*p*, *q*) for two noncrease points *p* and *q* of paper
that fold to the same point).  FOLD does not directly represent such points,
and instead works with entire faces (or edges for the case of linkages).
Two faces have a consistent "above" or "below" relationship only if
they overlap in a single connected region.  For example, this property
is guaranteed by convex faces.  If your faces overlap in multiple regions,
you should subdivide them (via `"J"` join edges) so that they do not.
We recommend specifying either `"convexFaces"` or `"nonConvexFaces"`
in [`frame_attributes`](#frame-metadata-frame_).

* `faceOrders`: An array of triples `[f, g, s]` where `f` and `g` are face IDs
  and `s` is an integer between &minus;1 and 1:
  * +1 indicates that face `f` lies *above* face `g`,
    i.e., on the side pointed to by `g`'s normal vector in the folded state.
  * &minus;1 indicates that face `f` lies *below* face `g`,
    i.e., on the side opposite `g`'s normal vector in the folded state.
  * 0 indicates that `f` and `g` have unknown stacking order
    (e.g., they do not overlap in their interiors).

  Omitting a triple `[f, g, s]` for two faces `f` and `g` is the same as
  specifying `s = 0`, so generally triples will have `s` either +1 or &minus;1.
  If triple `[f, g, s]` appears in `faceOrders`, the corresponding triple
  `[g, f, t]` may or may not appear; if it does, `t` should be `-s` if
  `f` and `g` have the same normal direction in the folded state,
  and `t` should be `s` if `f` and `g` have opposite normal directions
  in the folded state.
  If faces `f`, `g`, and `h` all share a common point, then triples
  `[f, g, s]` and `[g, h, t]` suffice; the ordering between `f` and `h`
  can be derived, or explicitly specified.

  Note that the specified ordering on faces may have cycles (e.g.,
  in a square twist).  For visualization purposes, you may want to
  subdivide faces (e.g., at overlapping face boundaries)
  so that the face ordering is a partial order.

  **Recommended** for frames with interior-overlapping faces.

* `edgeOrders`: An array of triples `[e, f, s]` where `e` and `f` are edge IDs
  and `s` is an integer between &minus;1 and 1:
  * +1 indicates that edge `e` lies locally on the *left* side of edge `f`
    (relative to edge `f`'s orientation given by `edges_vertices`)
  * &minus;1 indicates that edge `e` lies locally on the *right* side of edge
    `f` (relative to edge `f`'s orientation given by `edges_vertices`)
  * 0 indicates that `e` and `f` have unknown stacking order
    (e.g., they do not overlap in their interiors).

  This property makes sense only in 2D.
  **Recommended** for linkage configurations with interior-overlapping edges.

## Multiple Frames

Most properties described above (all but the `file_...` properties
which are about the entire file) can appear in the top-level dictionary
*or* within an individual frame.  Properties in the top-level dictionary
describes the **key frame** (frame 0).
If your file consists of just one frame, that's all you need to know.

If you want to store multiple frames in one file, use `file_frames`
to store all frames beyond the key frame.  The value of the
`file_frames` property is an array of dictionaries, where
`file_frames[i]` represents frame `i+1` (because frame 0 is the key frame).
Each frame dictionary can have any of the properties described above
(again, except for `file_...` properties).
In addition, frames (other than the key frame)
can have the following properties:

* `frame_parent`: Parent frame ID.  Intuitively, this frame (the child)
  is a modification (or, in general, is related to) the parent frame.
  This property is optional, but enables organizing frames into a tree
  structure.
* `frame_inherit`: Boolean.  If true, any properties in the parent frame
  (or recursively inherited from an ancestor) that is not overridden in
  this frame are automatically inherited, allowing you to avoid duplicated
  data in many cases.  For example, the frame can change the vertex coordinates
  (`vertices_coords`) while inheriting the structure of the parent's mesh.

Support for multiple frames is **optional**, so is not expected to be
implemented by all software supporting the FOLD format.
Software not implementing support for multiple frames should ignore all
`frames` properties and use only the key frame.

## Custom Properties

To add custom data to the FOLD format specific to your software, include
a colon (`:`) in the property key, where the part before the colon
identifies your software.  For example, TreeMaker will use the `tm:`
namespace, and a property mapping edges to TreeMaker structural types
will use key `"edges_tm:structuralType"`.
(All property keys without colons are reserved for possible use in
future versions of the FOLD specification.  If you think your custom
property would be broadly useful, feel free to send us your use cases
for consideration.)

Similarly, custom [classes and attributes](#frame-metadata-frame_)
can be specified by prefixing them with a namespace and a colon.
For example, TreeMaker will use the frame class `"tm:tree"` to denote
that the frame stores the metric tree of the uniaxial base.
(Again, if you think your custom class or attribute would be broadly useful,
feel free to send us your use cases for consideration.)
