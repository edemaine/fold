# FOLD
**FOLD** (Flexible Origami List Datastructure) is a file format (with extension
`.fold`) for describing **origami models**: crease patterns, mountain-valley
patterns, folded states, etc.  Mainly, a FOLD file can store a **mesh** with
**vertices**, **edges**, **faces**, and links between them, optionally embedded
in 2D or 3D, plus the topological **stacking order** of faces that overlap
geometrically.  The mesh can also easily store additional user-defined data.
One FOLD file can even store multiple such meshes in "**frames**"
(but this feature is not yet supported in any code).

This repository both **documents** the FOLD format (which is still in early
stages so its definition is evolving) and provides web **software tools**
and **JavaScript libraries** to aid in manipulation of FOLD files.
FOLD is built upon
**[JSON](http://www.json.org/)** (JavaScript Object Notation)
so [parsers](http://www.json.org/) are available in essentially all
programming languages.

FOLD is similar in spirit to the
[OBJ format](http://paulbourke.net/dataformats/obj/) (and other similar
formats) for storing 3D meshes; its main distinguishing features are
**easy parsing**, **easy extensibility**, the ability to define
**stacking orders**, and the ability to define edges and thus edge properties
(such as mountain-valley assignments) and **arbitrary polyhedral complexes**.
(Without edges, OBJ cannot distinguish between two faces sharing two
consecutive vertices from faces sharing an edge.)

## Documentation

* [2-page paper about FOLD](http://erikdemaine.org/papers/FOLD_CGW2016/)

## Authors

The FOLD format was invented by three main people:
* [Erik Demaine](http://erikdemaine.org), M.I.T.
* [Jason Ku](http://jasonku.mit.edu), M.I.T.
* [Robert Lang](http://langorigami.com), langorigami.com
