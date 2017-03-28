### FOLD FORMAT MANIPULATORS ###

geom = require './geom'
convert = exports
convert.oripa = require './oripa'

convert.keysStartingWith = (fold, prefix) ->
  key for key of fold when key[...prefix.length] == prefix

convert.keysEndingWith = (fold, suffix) ->
  key for key of fold when key[-suffix.length..] == suffix

convert.remapField = (fold, field, old2new) ->
  new2old = []
  for j, i in old2new  ## later overwrites earlier
    new2old[j] = i
  for key in convert.keysStartingWith fold, field + '_'
    fold[key] = (fold[key][old] for old in new2old)
  for key in convert.keysEndingWith fold, '_' + field
    fold[key] = (old2new[old] for old in array for array in fold[key])
  fold

convert.removeDuplicateEdges_vertices = (fold) ->
  seen = {}
  id = 0
  old2new =
    for edge in fold.edges_vertices
      [v, w] = edge
      if v < w
        key = "#{v},#{w}"
      else
        key = "#{w},#{v}"
      unless key of seen
        seen[key] = id
        id += 1
      seen[key]
  convert.remapField fold, 'edges', old2new

convert.edges_verticesIncident = (e1, e2) ->
  for v in e1
    if v in e2
      return true
  false

## Use hashing to find points within an epsilon > 0 distance from each other.
## Each integer cell will have O(1) distinct points before matching
## (number of disjoint half-unit disks that fit in a unit square).

class RepeatedPointsDS
  constructor: (@vertices_coords, @epsilon) ->
    ## Note: if vertices_coords has some duplicates in the initial state,
    ## then we will detect them but won't remove them here.  Rather,
    ## future duplicate inserts will return the higher-index vertex.
    @hash = {}
    for coord, v in @vertices_coords
      key = @key coord
      @hash[key] = [] unless key of @hash
      @hash[key].push v
    null

  lookup: (coord) ->
    [x, y] = coord
    xr = Math.round(x / @epsilon)
    yr = Math.round(y / @epsilon)
    for xt in [xr, xr-1, xr+1]
      for yt in [yr, yr-1, yr+1]
        key = "#{xt},#{yt}"
        for v in @hash[key] ? []
          if @epsilon > geom.distance @vertices_coords[v], coord
            return v
    null

  key: (coord) ->
    [x, y] = coord
    xr = Math.round(x * @epsilon)
    yr = Math.round(y * @epsilon)
    key = "#{xr},#{yr}"

  insert: (coord) ->
    v = @lookup coord
    return v if v?
    key = @key coord
    @hash[key] = [] unless key of @hash
    @hash[key].push v = @vertices_coords.length
    @vertices_coords.push coord
    v

convert.collapseNearbyVertices = (fold, epsilon) ->
  vertices = new RepeatedPointsDS [], epsilon
  old2new =
    for coords in fold.vertices_coords
      vertices.insert coords
  convert.remapField fold, 'vertices', old2new
  ## In particular: fold.vertices_coords = vertices.vertices_coords

convert.subdivideCrossingEdges_vertices = (fold, epsilon) ->
  ## Takes quadratic time.  xxx Should be O(n log n) via plane sweep.
  convert.removeDuplicateEdges_vertices fold
  vertices = new RepeatedPointsDS fold.vertices_coords, epsilon
  for e1, i1 in fold.edges_vertices
    s1 = (fold.vertices_coords[v] for v in e1)
    for e2, i2 in fold.edges_vertices[...i1]
      s2 = (fold.vertices_coords[v] for v in e2)
      if not convert.edges_verticesIncident(e1, e2) and
         segmentsCross s1, s2
        ## segment intersection is too sensitive a test;
        ## segmentsCross more reliable
        #cross = segmentIntersectSegment s1, s2
        cross = lineIntersectLine s1, s2
        crossI = vertices.insert cross
        #console.log e1, s1, 'intersects', e2, s2, 'at', cross, crossI
        unless crossI in e1 and crossI in e2  ## don't add endpoint again
          #console.log e1, e2, '->'
          unless crossI in e1
            fold.edges_vertices.push [crossI, e1[1]]
            e1[1] = crossI
            #console.log '->', e1, fold.edges_vertices[fold.edges_vertices.length-1]
          unless crossI in e2
            fold.edges_vertices.push [crossI, e2[1]]
            e2[1] = crossI
            #console.log '->', e2, fold.edges_vertices[fold.edges_vertices.length-1]
  # xxx should renumber other edges arrays?

convert.edges_vertices2vertices_neighbors = (fold) ->
  ## Works for abstract structures, so NOT SORTED.
  fold.vertices_neighbors = []
  for edge in fold.edges_vertices
    [v, w] = edge
    while v >= fold.vertices_neighbors.length
      fold.vertices_neighbors.push []
    while w >= fold.vertices_neighbors.length
      fold.vertices_neighbors.push []
    fold.vertices_neighbors[v].push w
    fold.vertices_neighbors[w].push v
  fold

convert.verticesEdges2vertices_neighbors = (fold) ->
  ## 2D only, SORTED in clockwise order
  unless fold.vertices_coords?[0]?.length == 2
    throw "verticesEdges2vertices_neighbors: Vertex coordinates missing or not two dimensional"
  fold.vertices_neighbors =
    for vertex in fold.vertices_coords
      []
  for edge in fold.edges_vertices
    [v, w] = edge
    fold.vertices_neighbors[v].push w
    fold.vertices_neighbors[w].push v
  for v, neighbors of fold.vertices_neighbors
    sortByAngle neighbors, v, (x) -> fold.vertices_coords[x]
  fold

convert.verticesEdges2faces_vertices = (fold) ->
  convert.verticesEdges2vertices_neighbors fold
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

convert.verticesFaces2edges = (mesh) ->
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
