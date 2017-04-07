# FOLD Tutorial

In this tutorial, we'll walk through the steps of defining a `.fold` file
that encodes a preliminary base, both its crease pattern and the self-touching
3D folded form shown below:

xxx figures

## JSON and Metadata

A FOLD file is a special type of [JSON](http://json.org/).  Basically,
a JSON value is of one of the following forms:

* Number: `123`, `123.456`, `123e-9`
* String: `"crease pattern"`, `"\"crease\" pattern"`,
  `"Éric"` or equivalently `"\u00c9ric"`
* Array of JSON values: `[1, 2, 3]`, `["crease", "pattern"]`,
  `[[1, 2], [3, 4]]`
* Object mapping string keys to JSON values:
  `{"crease": "pattern", "coords": [[1, 2], [3, 4]]"}`

The cool thing is how you can nest larger structures (arrays and objects)
within each other to make complex hierarchical structures.  This is the
foundation of FOLD.

At the top level, a FOLD file should be an object (meaning it starts and
ends with curly braces).  Different keys of this object describe different
features of the encoded folding.  For starters, let's fill in some keys
that define some "metadata" describing the folding we'd like to build:

```json
{
  "file_spec": 1,
  "file_creator": "text editor",
  "file_author": "Erik Demaine",
  "file_title": "Preliminary Base",
  "file_classes": ["singleModel"],
  "frame_title": "Preliminary Base Crease Pattern",
  "frame_classes": ["creasePattern"],
}
```

These are all optional, but here is their meaning:

* `"file_spec": 1` says that we're using version one of the
  [FOLD spec](https://github.com/edemaine/fold/blob/master/doc/spec.md)
* `"file_creator": "text editor"` says that we used a text editor
  to write this file by hand.  This metadata is more interesting when
  computer software generates the file.
* `"file_author": "Erik Demaine"` names the person/people who authored
  this file.  In general, this is just a string meant to be read by humans.
* `"file_title": "Preliminary Base"` titles the overall file.
  This is just a string meant to be read by humans.
* `"file_classes": ["singleModel"]` says that this `.fold` file describes
  a single origami model, though we'll end up including two instances of
  that model (unfolded and folded).  Classes are special values meant
  to aid computer software to understand the intended meaning of a file.
* `"frame_title": "Preliminary Base Crease Pattern"` titles the first
  instance of the model within the file, which will be the crease pattern.
  This is again just a string meant to be read by humans.
* `"frame_classes": ["creasePattern"]` says that this first instance
  of the model is a crease pattern.  Again, this is a special value to
  help computer software understand the meaning (without understanding
  the free-text `frame_title`).

There are more types of metadata you can specify, both
[at the file level](https://github.com/edemaine/fold/blob/master/doc/spec.md#file-metadata-file_)
and
[at the frame level](https://github.com/edemaine/fold/blob/master/doc/spec.md#frame-metadata-frame_),
but this is plenty for this example.

## Vertices, Edges, and Faces

Folded structures are defined by vertices, edges, and faces.  **Faces** are
the polygons (here, triangles) that make up the structure/material.
**Edges** are the segments/hinges/creases that connect these faces.
**Vertices** are the points where edges end/come together.

### Vertex Coordinates

In the case of the unfolded preliminary base crease pattern, the vertices
form a 3 &times; 3 grid of points in the square.  Let's start by defining
their coordinates:

```json
{
  "file_spec": 1,
  "file_creator": "text editor",
  "file_author": "Erik Demaine",
  "file_title": "Preliminary Base",
  "file_classes": ["singleModel"],
  "frame_title": "Preliminary Base Crease Pattern",
  "frame_classes": ["creasePattern"],
  "vertices_coords": [
    [-1,-1], [0,-1], [1,-1],
    [-1, 0], [0, 0], [1, 0],
    [-1, 1], [0, 1], [1, 1]
  ]
}
```

The only difference here is the last key, `"vertices_coords"`.
This property describes a mapping from vertex IDs to coordinates.
IDs always start at zero, so the vertex IDs here are 0, 1, 2, ..., 8.
In this example, each coordinate is specified by an array of two numbers,
because we're working in 2D; later we'll use three numbers to specify 3D
coordinates.
So vertex 0 is at coordinates (&minus;1, &minus;1); vertex 1 is at
coordinates (0, &minus; 1), etc.

xxx figure

### Edges

Next let's define the creases in the crease pattern, as well as the
boundary edges of the square.  Together, these are the **edges** of the
crease pattern.  We specify each edge by the two vertices it connects,
or rather, by their two vertex IDs.  For example, the outer square connects
vertex 0 to vertex 1 to vertex 2 to vertex 5 to vertex 8 to vertex 7 to
vertex 6 to vertex 3 back to vertex 0.  So there is an edge connecting
vertices 0 and 1, an edge connecting vertices 1 and 2, an edge connecting
vertices 2 and 5, etc.  The complete edge list is given by the following
FOLD file:

```json
{
  "file_spec": 1,
  "file_creator": "text editor",
  "file_author": "Erik Demaine",
  "file_title": "Preliminary Base",
  "file_classes": ["singleModel"],
  "frame_title": "Preliminary Base Crease Pattern",
  "frame_classes": ["creasePattern"],
  "vertices_coords": [
    [-1,-1], [0,-1], [1,-1],
    [-1, 0], [0, 0], [1, 0],
    [-1, 1], [0, 1], [1, 1]
  ],
  "edges_vertices": [
    [0, 1], [1, 2], [2, 5], [5, 8], [8, 7], [7, 6], [6, 3], [3, 0],
    [4, 0], [4, 1], [4, 2], [4, 3], [4, 5], [4, 6], [4, 7], [4, 8]
  ]
}
```

The new property here is `"edges_vertices"`, which defines a mapping from
edges to pairs of vertices.  (The naming of the key should make this clear:
most keys consist of two sets of things (like vertices, edges, faces) with
an underscore in between.)  The property consists of an array defining the
edges in order by ID, starting at zero, so here we have 16 edges with IDs
0, 1, ..., 15.  The first edge connects vertices 0 and 1; the second edge
connects vertices 1 and 2, etc.  In this example, the first line consists
of all the boundary edges, and the second line consists of all the creases
(conveniently ordered cyclicly around the central vertex 4).  In general,
the edges can be listed in any order you want.

xxx figure

### Faces

xxx manual listing

xxx automatic approach

xxx figure

## Frames

## 3D Geometry

## Face Ordering
