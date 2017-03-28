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
**easy parsing**, **easy extensibility**, the ability to disambiguate
**overlapping faces** with stacking order, and the ability to define edges
and thus edge properties (such as mountain-valley assignments) and
**arbitrary polyhedral complexes**.
(Without edges, OBJ cannot distinguish between two faces sharing two
consecutive vertices from faces sharing an edge.)
In addition, FOLD can support **linkages** (with 1D edges but no 2D faces).

## Documentation

* [Draft specification](https://github.com/edemaine/fold/tree/master/spec.md)
* [2-page paper describing FOLD](http://erikdemaine.org/papers/FOLD_CGW2016/)
* [Examples of .fold files](https://github.com/edemaine/fold/tree/master/examples/)

## Authors

The FOLD format was invented by three people:
* [Erik Demaine](http://erikdemaine.org), M.I.T.
* [Jason Ku](http://jasonku.mit.edu), M.I.T.
* [Robert Lang](http://langorigami.com), langorigami.com

We welcome your feedback and suggestions!  The goal is for all software in
computational origami to support FOLD as a common interchange format.
