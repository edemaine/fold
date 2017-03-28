# FOLD Specification (version 1)

## Design

The FOLD format seeks to balance **generality** and **simplicity**: it is
able to represent a wide variety of folded structures in different dimensions,
including general codimensional layering information, but is also able to
represent common folded structures simply (for example, most fields are
optional).

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

FOLD currently defines meaning for properties of the following form:

* `file_...`: Metadata about the file
* `frame_...`: Metadata about a frame (folding) in the file
* `vertices_...`: Data about the (0D) vertices, in a zero-indexed array by vertex ID
* `edges_...`: Data about the (1D) edges, in a zero-indexed array by edge ID
* `faces_...`: Data about the (2D) faces, in a zero-indexed array by face ID
* `faceOrders`: Ordering information between pairs of faces, in an array

## File Metadata (`file_...`)

Standard metadata properties in the FOLD format include

* `file_version`: The version of the FOLD spec that the file assumes
  (a number).  See the top of this document.
* `file_creator`: The software that created the file (string).
* `file_author`: The human author (string).
* `file_class`: A subjective interpretation about what the file represents.
  The class is a string.  Some standard classes are
  * `"creasePattern"`: a crease pattern (unfolded)
  * `"foldedForm"`: a folded form/state, e.g. flat folding or 3D folding
  * `"foldingMotion"`: a folding motion, e.g. specified as a sequence of frames

## Frame Metadata (`frame_...`)

Frame properties in the FOLD format include

* `frame_title`: A title for the frame (string).
* `frame_author`: The human author (string).
* `frame_attributes`: An array of attributes that objectively describe
  properties of the folded structure being represented.
  Some standard frame attributes include
  * `"2D"`: the coordinates lie in 2D (xy)
  * `"3D"`: the coordinates lie in 3D (xyz) and not 2D (xy)
  * `"manifold"`: the polyhedral complex is a manifold
    (has at most two faces incident to each edge)
  * `"nonManifold"`: the polyhedral complex is *not* a manifold
    (has more than two faces incident to an edge)
  * `"selfTouching"`: the polyhedral complex has faces that touch in their
    relative interiors, so you probably want a face ordering
  * `"nonSelfTouching"`: the polyhedral complex has no touching faces,
    so face ordering isn't needed
  * `"selfIntersecting"`: the polyhedral complex has properly intersecting faces
  * `"nonSelfIntersecting"`: the polyhedral complex has no properly
    intersecting faces

## Geometric Data

### `vertices_...`

* `vertices_coords`

### `edges_...`

* `edges_vertices`
* `edges_assignment`

### `faces_...`

* `faces_vertices`

### `faceOrders`

