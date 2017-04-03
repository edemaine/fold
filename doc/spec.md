# [FOLD](https://github.com/edemaine/fold/) Specification (version 1 DRAFT)

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
  (a number).  See the top of this spec for the current value.
  **Strongly recommended**, in case we ever have to make
  backward-incompatible changes.
* `file_creator`: The software that created the file (a string).
* `file_author`: The human author (a string).
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

* `frame_title`: A title for the frame (a string).
* `frame_description`: A description of the frame (a string).
* `frame_author`: The human author (a string).
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
  * `"manifold"`: the polyhedral complex is a manifold
    (has at most two faces incident to each edge)
  * `"nonManifold"`: the polyhedral complex is *not* a manifold
    (has more than two faces incident to an edge)
  * `"orientable"`: the polyhedral complex is orientable, meaning it can be
    assigned a consistent normal direction (and hence it is also manifold)
  * `"nonOrientable"`: the polyhedral complex is not orientable, meaning it
    cannot be assigned a consistent normal direction
  * `"selfTouching"`: the polyhedral complex has faces that touch in their
    relative interiors, so you probably want a face ordering
  * `"nonSelfTouching"`: the polyhedral complex has no touching faces,
    so face ordering isn't needed
  * `"selfIntersecting"`: the polyhedral complex has properly intersecting faces
  * `"nonSelfIntersecting"`: the polyhedral complex has no properly
    intersecting faces
  * Custom attributes should have a colon in them;
    see [Custom Properties](#custom-properties) below.

## Vertex information: `vertices_...`

The values of the following properties are zero-indexed arrays by vertex ID.

* `vertices_coords`: For each vertex, an array of coordinates,
  such as `[x, y, z]` or `[x, y]` (where `z` is implicitly zero).
  In higher dimensions, all unspecified coordinates are implicitly zero.
  **Recommended** except for frames with attribute `"abstract"`.
  <!--**Required** for frames with attribute `"concrete"`.-->
* `vertices_vertices`: For each vertex, an array of vertices (vertex IDs)
  that are adjacent along edges.  If the frame represents an orientable
  manifold or planar linkage, this list should be ordered counterclockwise
  around the vertex.  If the frame is a nonorientable manifold,
  this list should be cyclicly ordered around the vertex.
  Otherwise, the order is arbitrary.
  **Recommended** in any frame lacking `edges_vertices` property
  (otherwise `vertices_vertices` can easily be computed from
  `edges_vertices` as needed).
* `vertices_faces`: 

## Edge information: `edges_...`

The values of the following properties are zero-indexed arrays by edge ID.

* `edges_vertices`: For each edge, an array `[u, v]` of two vertex IDs for the
  two endpoints of the edge.  This effectively defines the *orientation*
  of the edge, from `u` to `v`.  (This orientation choice is arbitrary,
  but is used to define the ordering of `edges_faces`.)
  **Recommended** in frames having any `edges_...` property
  (e.g., to represent mountain-valley assignment).
* `edges_faces`: For each edge, an array of face IDs for the faces incident
  to the edge.  The faces should be listed in counterclockwise order around
  the edge.  For manifolds, this array has length 1 (for boundary edges)
  or 2 (for nonboundary edges).  When the array has length 2, the canonical
  ordering is to start with the face locally to the left of the edge
  (as defined by its orientation in `edges_vertices`).
* `edges_assignment`: For each edge, a string representing its fold
  direction assignment:
  * `"B"`: border/boundary edge (only one incident face)
  * `"M"`: mountain fold
  * `"V"`: valley fold
  * `"F"`: flat (unfolded) fold
  * `"U"`: unassigned/unknown

  For example, this property can be used to specify a full mountain-valley
  assignment (consisting of `"M"`, `"V"`, and `"B"`), or just to label
  which edges are boundary edges (consisting of `"U"` or `"B"`).

  For orientable manifolds, a valley fold points the two face normals into
  each other, while a mountain fold makes them point away from each other.
  For nonorientable manifolds, a valley fold is defined as bringing the normal
  of the face to the left of the edge (listed first in `edges_faces`) to point
  into the adjacent face (when fully folded), while a mountain fold has the
  same normal point away from the adjacent face.
* `edges_foldAngles`: For each edge, the fold angle (deviation from flatness)
  along each edge of the pattern.  The fold angle is a number in degrees
  lying in the range [&minus;180, 180].  The fold angle is positive for
  valley folds, negative for mountain folds, and zero for flat, unassigned,
  and border folds.  Accordingly, the sign of `edge_foldAngles` should match
  `edges_assignment` if both are specified.
* `edges_lengths`: For each edge, the length of the edge (a number).
  This is mainly useful for defining the intrinsic geometry of
  abstract complexes where `vertices_coords` are unspecified;
  otherwise, `edges_lengths` can be computed from `vertices_coords`.

## Face information: `faces_...`

The values of the following properties are zero-indexed arrays by face ID.

* `faces_vertices`: For each face, an array of vertex IDs for the vertices
  around the face *in counterclockwise order*.  This array can repeat the
  same vertex multiple times (e.g., if the face has a "slit" in it).
* `faces_edges`:

## Layer information: `faceOrders` and `edgeOrders`

* `faceOrders`
* `edgeOrders`

## Multiple Frames

Most properties described above (all but the `file_...` properties
which are about the entire file) can appear in the top-level dictionary
*or* within an individiaul frame.  Properties in the top-level dictionary
describes the **key frame** (frame 0).
If your file consists of just one frame, that's all you need to know.

If you want to store multiple frames in one file, use `file_frames`
to store all frames beyond the key frame.  The value of the
`file_frames` property is an array of dictonaries, where
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
