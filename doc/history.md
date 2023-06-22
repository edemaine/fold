# History of FOLD Specifications

## Version 1 = 1.0
* Initial public draft

## Version 1.1
* Rename `edges_foldAngles` &rarr; `edges_foldAngle` and
  `edges_lengths` &rarr; `edges_length`
  for consistent pluralization with the rest of the spec.

## Version 1.2
* Add join edge (`"J"`) option to `edges_assignment`.
* Add cut/slit edge (`"C"`) option to `edges_assignment` (optional).
* Add `joins`/`noJoins` and `cuts`/`noCuts` to `frame_attributes`.
* Add `convexFaces`/`nonconvexFaces` to `frame_attributes`.
* Define `vertices_edges` and `faces_faces`.
* Extend definition of `vertices_faces`, `edges_faces`, and `faces_faces`
  to allow `null` values, allowing for consistent ordering of all arrays and
  consistent orientation.
* Specify correspondence between "faces" and "material", to clarify that the
  exterior (unbounded) face of a planar graph is not typically a face.
* Clarify that support for multiple frames is optional.
