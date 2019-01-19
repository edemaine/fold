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

convert.edges_vertices_to_vertices_vertices_sorted = (fold) ->
  convert.edges_vertices_to_vertices_vertices_unsorted fold
  convert.sort_vertices_vertices fold

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

convert.vertices_vertices_to_faces_vertices = (fold) ->
  next = {}
  for v, neighbors of fold.vertices_vertices
    v = parseInt v
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
        console.warn 'Confusion with face', face
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

convert.edges_vertices_to_faces_vertices = (fold) ->
  convert.edges_vertices_to_vertices_vertices_sorted fold
  convert.vertices_vertices_to_faces_vertices fold

convert.vertices_vertices_to_vertices_edges = (fold) ->
  edgeMap = {}
  for [v1, v2], edge in fold.edges_vertices
    edgeMap["#{v1},#{v2}"] = edge
    edgeMap["#{v2},#{v1}"] = edge
  fold.vertices_edges =
    for vertices, vertex in fold.vertices_vertices
      for i in [0...vertices.length]
        edgeMap["#{vertex},#{vertices[i]}"]

convert.edges_vertices_faces_vertices_to_faces_edges = (fold) ->
  edgeMap = {}
  for [v1, v2], edge in fold.edges_vertices
    edgeMap["#{v1},#{v2}"] = edge
    edgeMap["#{v2},#{v1}"] = edge
  fold.faces_edges =
    for vertices, face in fold.faces_vertices
      for i in [0...vertices.length]
        edgeMap["#{vertices[i]},#{vertices[(i+1) % vertices.length]}"]

convert.faces_vertices_to_edges = (mesh) ->
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
        else
          edge = edgeMap[key] = mesh.edges_vertices.length
          if v1 <= v2
            mesh.edges_vertices.push [v1, v2]
          else
            mesh.edges_vertices.push [v2, v1]
          mesh.edges_faces.push [null, null]
          mesh.edges_assignment.push 'B'
        if v1 <= v2
          mesh.edges_faces[edge][0] = face
        else
          mesh.edges_faces[edge][1] = face
        edge
    )
  mesh

convert.toJSON = (fold) ->
  ## Convert FOLD object into nicely formatted JSON
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
