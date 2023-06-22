### FOLD FORMAT MANIPULATORS ###

geom = require './geom'
filter = require './filter'
convert = exports

convert.edges_vertices_to_vertices_vertices_unsorted = (fold) ->
  ###
  Works for abstract structures, so NOT SORTED.
  Use sort_vertices_vertices to sort in counterclockwise order.
  ###
  fold.vertices_vertices = filter.edges_vertices_to_vertices_vertices fold
  fold

convert.edges_vertices_to_vertices_edges_unsorted = (fold) ->
  ###
  Invert edges_vertices into vertices_edges.
  Works for abstract structures, so NOT SORTED.
  ###
  fold.vertices_edges = filter.edges_vertices_to_vertices_edges fold
  fold

convert.edges_vertices_to_vertices_vertices_sorted = (fold) ->
  ###
  Given a FOLD object with 2D `vertices_coords` and `edges_vertices` property
  (defining edge endpoints), automatically computes the `vertices_vertices`
  property and sorts them counterclockwise by angle in the plane.
  ###
  convert.edges_vertices_to_vertices_vertices_unsorted fold
  convert.sort_vertices_vertices fold

convert.edges_vertices_to_vertices_edges_sorted = (fold) ->
  ###
  Given a FOLD object with 2D `vertices_coords` and `edges_vertices` property
  (defining edge endpoints), automatically computes the `vertices_edges`
  and `vertices_vertices` property and sorts them counterclockwise by angle
  in the plane.
  ###
  convert.edges_vertices_to_vertices_vertices_sorted fold
  convert.vertices_vertices_to_vertices_edges fold

convert.sort_vertices_vertices = (fold) ->
  ###
  Sorts `fold.vertices_neighbords` in counterclockwise order using
  `fold.vertices_coordinates`.  2D only.
  Constructs `fold.vertices_neighbords` if absent, via
  `convert.edges_vertices_to_vertices_vertices`.
  ###
  unless fold.vertices_coords?[0]?.length == 2
    throw new Error "sort_vertices_vertices: Vertex coordinates missing or not two dimensional"
  unless fold.vertices_vertices?
    convert.edges_vertices_to_vertices_vertices fold
  for v, neighbors of fold.vertices_vertices
    geom.sortByAngle neighbors, v, (x) -> fold.vertices_coords[x]
  fold

convert.vertices_vertices_to_faces_vertices = (fold) ->
  ###
  Given a FOLD object with counterclockwise-sorted `vertices_vertices`
  property, constructs the implicitly defined faces, setting `faces_vertices`
  property.
  ###
  next = {}
  for neighbors, v in fold.vertices_vertices
    for u, i in neighbors
      next["#{u},#{v}"] = neighbors[(i-1) %% neighbors.length]
      #console.log u, v, neighbors[(i-1) %% neighbors.length]
  fold.faces_vertices = []
  #for uv, w of next
  for uv in (key for key of next)
    w = next[uv]
    continue unless w?
    next[uv] = null
    [u, v] = uv.split ','
    u = parseInt u
    v = parseInt v
    face = [u, v]
    until w == face[0]
      unless w?
        console.warn "Confusion with face #{face}"
        break
      face.push w
      [u, v] = [v, w]
      w = next["#{u},#{v}"]
      next["#{u},#{v}"] = null
    next["#{face[face.length-1]},#{face[0]}"] = null
    ## Outside face is clockwise; exclude it.
    if w? and geom.polygonOrientation(fold.vertices_coords[x] for x in face) > 0
      #console.log face
      fold.faces_vertices.push face
    #else
    #  console.log face, 'clockwise'
  fold

convert.vertices_edges_to_faces_vertices_edges = (fold) ->
  ###
  Given a FOLD object with counterclockwise-sorted `vertices_edges` property,
  constructs the implicitly defined faces, setting both `faces_vertices`
  and `faces_edges` properties.  Handles multiple edges to the same vertex
  (unlike `FOLD.convert.vertices_vertices_to_faces_vertices`).
  ###
  next = []
  for neighbors, v in fold.vertices_edges
    next[v] = {}
    for e, i in neighbors
      next[v][e] = neighbors[(i-1) %% neighbors.length]
      #console.log e, neighbors[(i-1) %% neighbors.length]
  fold.faces_vertices = []
  fold.faces_edges = []
  for nexts, vertex in next
    for e1, e2 of nexts
      continue unless e2?
      e1 = parseInt e1
      nexts[e1] = null
      edges = [e1]
      vertices = [filter.edges_verticesIncident fold.edges_vertices[e1],
                                                fold.edges_vertices[e2]]
      unless vertices[0]?
        throw new Error "Confusion at edges #{e1} and #{e2}"
      until e2 == edges[0]
        unless e2?
          console.warn "Confusion with face containing edges #{edges}"
          break
        edges.push e2
        for v in fold.edges_vertices[e2]
          if v != vertices[vertices.length-1]
            vertices.push v
            break
        e1 = e2
        e2 = next[v][e1]
        next[v][e1] = null
      ## Move e1 to the end so that edges[0] connects vertices[0] to vertices[1]
      edges.push edges.shift()
      ## Outside face is clockwise; exclude it.
      if e2? and geom.polygonOrientation(fold.vertices_coords[x] for x in vertices) > 0
        #console.log vertices, edges
        fold.faces_vertices.push vertices
        fold.faces_edges.push edges
      #else
      #  console.log face, 'clockwise'
  fold

convert.edges_vertices_to_faces_vertices = (fold) ->
  ###
  Given a FOLD object with 2D `vertices_coords` and `edges_vertices`,
  computes a counterclockwise-sorted `vertices_vertices` property and
  constructs the implicitly defined faces, setting `faces_vertices` property.
  ###
  convert.edges_vertices_to_vertices_vertices_sorted fold
  convert.vertices_vertices_to_faces_vertices fold

convert.edges_vertices_to_faces_vertices_edges = (fold) ->
  ###
  Given a FOLD object with 2D `vertices_coords` and `edges_vertices`,
  computes counterclockwise-sorted `vertices_vertices` and `vertices_edges`
  properties and constructs the implicitly defined faces, setting
  both `faces_vertices` and `faces_edges` property.
  ###
  convert.edges_vertices_to_vertices_edges_sorted fold
  convert.vertices_edges_to_faces_vertices_edges fold

convert.vertices_vertices_to_vertices_edges = (fold) ->
  ###
  Given a FOLD object with `vertices_vertices` and `edges_vertices`,
  fills in the corresponding `vertices_edges` property (preserving order).
  ###
  edgeMap = {}
  for [v1, v2], edge in fold.edges_vertices
    edgeMap["#{v1},#{v2}"] = edge
    edgeMap["#{v2},#{v1}"] = edge
  fold.vertices_edges =
    for vertices, vertex in fold.vertices_vertices
      for i in [0...vertices.length]
        edgeMap["#{vertex},#{vertices[i]}"]

convert.faces_vertices_to_faces_edges = (fold) ->
  ###
  Given a FOLD object with `faces_vertices` and `edges_vertices`,
  fills in the corresponding `faces_edges` property (preserving order).
  ###
  edgeMap = {}
  for [v1, v2], edge in fold.edges_vertices
    edgeMap["#{v1},#{v2}"] = edge
    edgeMap["#{v2},#{v1}"] = edge
  fold.faces_edges =
    for vertices, face in fold.faces_vertices
      for i in [0...vertices.length]
        edgeMap["#{vertices[i]},#{vertices[(i+1) % vertices.length]}"]

convert.faces_vertices_to_edges = (mesh) ->
  ###
  Given a FOLD object with just `faces_vertices`, automatically fills in
  `edges_vertices`, `edges_faces`, `faces_edges`, and `edges_assignment`
  (indicating which edges are boundary with 'B').
  This code currently assumes an orientable manifold, and uses nulls to
  represent missing neighbor faces in `edges_faces` (for boundary edges).
  ###
  mesh.edges_vertices = []
  mesh.edges_faces = []
  mesh.faces_edges = []
  mesh.edges_assignment = []
  edgeMap = {}
  for face, vertices of mesh.faces_vertices
    face = parseInt face
    mesh.faces_edges.push(
      for v1, i in vertices
        v1 = parseInt v1
        v2 = vertices[(i+1) % vertices.length]
        if v1 <= v2
          key = "#{v1},#{v2}"
        else
          key = "#{v2},#{v1}"
        if key of edgeMap
          edge = edgeMap[key]
          # Second instance of edge means not on boundary
          mesh.edges_assignment[edge] = null
        else
          edge = edgeMap[key] = mesh.edges_vertices.length
          if v1 <= v2
            mesh.edges_vertices.push [v1, v2]
          else
            mesh.edges_vertices.push [v2, v1]
          mesh.edges_faces.push [null, null]
          # First instance of edge might be on boundary
          mesh.edges_assignment.push 'B'
        if v1 <= v2
          mesh.edges_faces[edge][0] = face
        else
          mesh.edges_faces[edge][1] = face
        edge
    )
  mesh

convert.edges_vertices_to_edges_faces_edges = (fold) ->
  ###
  Given a `fold` object with `edges_vertices` and `faces_vertices`,
  fills in `faces_edges` and `edges_vertices`.
  ###
  fold.edges_faces = ([null, null] for edge in [0...fold.edges_vertices.length])
  edgeMap = {}
  for edge, vertices of fold.edges_vertices when vertices?
    edge = parseInt edge
    edgeMap["#{vertices[0]},#{vertices[1]}"] = [edge, 0] # forward
    edgeMap["#{vertices[1]},#{vertices[0]}"] = [edge, 1] # backward
  for face, vertices of fold.faces_vertices
    face = parseInt face
    fold.faces_edges[face] =
      for v1, i in vertices
        v2 = vertices[(i+1) % vertices.length]
        [edge, orient] = edgeMap["#{v1},#{v2}"]
        fold.edges_faces[edge][orient] = face
        edge
  fold

convert.flatFoldedGeometry = (fold, rootFace = 0) ->
  ###
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
  ###
  if fold.vertices_coords? and fold.edges_vertices? and not
     (fold.edges_faces? and fold.faces_edges?)
    convert.edges_vertices_to_edges_faces_edges fold
  maxError = 0
  level = [rootFace]
  fold.faces_flatFoldTransform =
    (null for face in [0...fold.faces_edges.length])
  fold.faces_flatFoldTransform[rootFace] = [[1,0,0],[0,1,0]] # identity
  fold.faces_flatFoldOrientation =
    (null for face in [0...fold.faces_edges.length])
  fold.faces_flatFoldOrientation[rootFace] = +1
  fold.vertices_flatFoldCoords =
    (null for vertex in [0...fold.vertices_coords.length])
  # Use fold.faces_edges -> fold.edges_vertices, which are both needed below,
  # in case fold.faces_vertices isn't defined.
  for edge in fold.faces_edges[rootFace]
    for vertex in fold.edges_vertices[edge]
      fold.vertices_flatFoldCoords[vertex] ?= fold.vertices_coords[vertex][..]
  while level.length
    nextLevel = []
    for face in level
      orientation = -fold.faces_flatFoldOrientation[face]
      for edge in fold.faces_edges[face]
        for face2 in fold.edges_faces[edge] when face2? and face2 != face
          transform = geom.matrixMatrix fold.faces_flatFoldTransform[face],
            geom.matrixReflectLine ...(
              for vertex in fold.edges_vertices[edge]
                fold.vertices_coords[vertex]
            )
          if fold.faces_flatFoldTransform[face2]?
            for row, i in fold.faces_flatFoldTransform[face2]
              maxError = Math.max maxError, geom.dist row, transform[i]
            if orientation != fold.faces_flatFoldOrientation[face2]
              maxError = Math.max 1, maxError
          else
            fold.faces_flatFoldTransform[face2] = transform
            fold.faces_flatFoldOrientation[face2] = orientation
            for edge2 in fold.faces_edges[face2]
              for vertex2 in fold.edges_vertices[edge2]
                mapped = geom.matrixVector transform, fold.vertices_coords[vertex2]
                if fold.vertices_flatFoldCoords[vertex2]?
                  maxError = Math.max maxError,
                    geom.dist fold.vertices_flatFoldCoords[vertex2], mapped
                else
                  fold.vertices_flatFoldCoords[vertex2] = mapped
            nextLevel.push face2
    level = nextLevel
  maxError

convert.deepCopy = (fold) ->
  ## Given a FOLD object, make a copy that shares no pointers with the original.
  if typeof fold in ['number', 'string', 'boolean']
    fold
  else if Array.isArray fold
    for item in fold
      convert.deepCopy item
  else # Object
    copy = {}
    for own key, value of fold
      copy[key] = convert.deepCopy value
    copy

convert.toJSON = (fold) ->
  ## Convert FOLD object into a nicely formatted JSON string.
  "{\n" +
  (for key, value of fold
    "  #{JSON.stringify key}: " +
    if Array.isArray value
      "[\n" +
      ("    #{JSON.stringify(obj)}" for obj in value).join(',\n') +
      "\n  ]"
    else
      JSON.stringify value
  ).join(',\n') +
  "\n}\n"

convert.extensions = {}
convert.converters = {}
convert.getConverter = (fromExt, toExt) ->
  if fromExt == toExt
    (x) -> x
  else
    convert.converters["#{fromExt}#{toExt}"]
convert.setConverter = (fromExt, toExt, converter) ->
  convert.extensions[fromExt] = true
  convert.extensions[toExt] = true
  convert.converters["#{fromExt}#{toExt}"] = converter

convert.convertFromTo = (data, fromExt, toExt) ->
  fromExt = ".#{fromExt}" unless fromExt[0] == '.'
  toExt = ".#{toExt}" unless toExt[0] == '.'
  converter = convert.getConverter fromExt, toExt
  unless converter?
    if fromExt == toExt
      return data
    throw new Error "No converter from #{fromExt} to #{toExt}"
  converter data

convert.convertFrom = (data, fromExt) ->
  convert.convertFromTo data, fromExt, '.fold'

convert.convertTo = (data, toExt) ->
  convert.convertFromTo data, '.fold', toExt

convert.oripa = require './oripa'
