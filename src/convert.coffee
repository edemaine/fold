### FOLD FORMAT MANIPULATORS ###

geom = require './geom'
convert = exports
convert.oripa = require './oripa'

convert.edges_vertices_to_vertices_neighbors = (fold) ->
  ###
  Works for abstract structures, so NOT SORTED.
  Use sort_vertices_neighbors to sort in counterclockwise order.
  ###
  fold.vertices_neighbors = filter.edges_vertices_to_vertices_neighbors fold
  fold

convert.sort_vertices_neighbors = (fold) ->
  ###
  Sorts `fold.vertices_neighbords` in counterclockwise order using
  `fold.vertices_coordinates`.  2D only.
  Constructs `fold.vertices_neighbords` if absent, via
  `convert.edges_vertices_to_vertices_neighbors`.
  ###
  unless fold.vertices_coords?[0]?.length == 2
    throw "verticesEdges2vertices_neighbors: Vertex coordinates missing or not two dimensional"
  unless fold.vertices_neighbors?
    convert.edges_vertices_to_vertices_neighbors fold
  for v, neighbors of fold.vertices_neighbors
    sortByAngle neighbors, v, (x) -> fold.vertices_coords[x]

convert.verticesEdges_to_faces_vertices = (fold) ->
  next = {}
  for v, neighbors of fold.vertices_neighbors
    v = parseInt v
    for u, i in neighbors
      next["#{u},#{v}"] = neighbors[(i+1) % neighbors.length]
      #console.log u, v, neighbors[(i+1) % neighbors.length]
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
    if w? and polygonOrientation(fold.vertices_coords[x] for x in face) > 0
      #console.log face
      fold.faces_vertices.push face
    #else
    #  console.log face, 'clockwise'
  fold

convert.verticesFaces_to_edges = (mesh) ->
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

convertFile = require './convert_file'
if convertFile?
  for key, value of convertFile
    convert[key] = value
