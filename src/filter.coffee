geom = require './geom'
filter = exports

filter.edgesAssigned = (fold, target) ->
  i for assignment, i in fold.edges_assignment when assignment == target
filter.mountainEdges = (fold) ->
  assignment.edgesAssigned fold, 'M'
filter.valleyEdges = (fold) ->
  assignment.edgesAssigned fold, 'V'
filter.flatEdges = (fold) ->
  assignment.edgesAssigned fold, 'F'
filter.boundaryEdges = (fold) ->
  assignment.edgesAssigned fold, 'B'
filter.unassignedEdges = (fold) ->
  assignment.edgesAssigned fold, 'F'

filter.keysStartingWith = (fold, prefix) ->
  key for key of fold when key[...prefix.length] == prefix

filter.keysEndingWith = (fold, suffix) ->
  key for key of fold when key[-suffix.length..] == suffix

filter.remapField = (fold, field, old2new) ->
  ###
  old2new: null means throw away that object
  ###
  new2old = []
  for j, i in old2new  ## later overwrites earlier
    new2old[j] = i if j?
  for key in filter.keysStartingWith fold, field + '_'
    fold[key] = (fold[key][old] for old in new2old)
  for key in filter.keysEndingWith fold, '_' + field
    fold[key] = (old2new[old] for old in array for array in fold[key])
  fold

filter.remapFieldSubset = (fold, field, keep) ->
  id = 0
  old2new =
    for value in keep
      if value
        id++
      else
        null  ## remove
  filter.remapField fold, field, old2new

filter.removeDuplicateEdges_vertices = (fold) ->
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
  filter.remapField fold, 'edges', old2new

filter.edges_verticesIncident = (e1, e2) ->
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
          if @epsilon > geom.dist @vertices_coords[v], coord
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

filter.collapseNearbyVertices = (fold, epsilon) ->
  vertices = new RepeatedPointsDS [], epsilon
  old2new =
    for coords in fold.vertices_coords
      vertices.insert coords
  filter.remapField fold, 'vertices', old2new
  ## In particular: fold.vertices_coords = vertices.vertices_coords

filter.removeLoopEdges = (fold) ->
  ###
  Remove edges whose endpoints are identical.  After collapsing via
  `filter.collapseNearbyVertices`, this removes epsilon-length edges.
  ###
  filter.remapFieldSubset fold, 'edges',
    for edge in fold.edges_vertices
      edge[0] != edge[1]

filter.subdivideCrossingEdges_vertices = (fold, epsilon) ->
  ## Takes quadratic time.  xxx Should be O(n log n) via plane sweep.
  #filter.removeDuplicateEdges_vertices fold
  vertices = new RepeatedPointsDS fold.vertices_coords, epsilon
  for e1, i1 in fold.edges_vertices
    continue if e1[0] == e1[1]
    s1 = (fold.vertices_coords[v] for v in e1)
    for e2, i2 in fold.edges_vertices[...i1]
      ## Skip over edges that have (since) contracted to a point
      continue if e1[0] == e1[1] or e2[0] == e2[1]
      s2 = (fold.vertices_coords[v] for v in e2)
      #console.log s1, s2, filter.edges_verticesIncident(e1, e2), geom.segmentsCross s1, s2
      if filter.edges_verticesIncident e1, e2
        if e1[0] == e2[0] or e1[1] == e2[1]
          vec1 = geom.sub s1...
          vec2 = geom.sub s2...
        else
          vec1 = geom.sub s1...
          vec2 = geom.sub s2[1], s2[0]
        if geom.parallel(vec1, vec2) and geom.dot(vec1, vec2) > 0
          if geom.mag(vec1) < geom.mag(vec2)
            ## e1 is correct, and e2 needs to be clipped to end at the
            ## other endpoint of e1 than it currently matches
            if e2[0] == e1[0]
              e2[0] = e1[1]
            else if e2[0] == e1[1]
              e2[0] = e1[0]
            else if e2[1] == e1[0]
              e2[1] = e1[1]
            else if e2[1] == e1[1]
              e2[1] = e1[0]
          else
            ## e2 is correct, and e1 needs to be clipped to end at the
            ## other endpoint of e2 than it currently matches
            if e1[0] == e2[0]
              e1[0] = e2[1]
            else if e1[0] == e2[1]
              e1[0] = e2[0]
            else if e1[1] == e2[0]
              e1[1] = e2[1]
            else if e1[1] == e2[1]
              e1[1] = e2[0]
      else if geom.segmentsCross s1, s2
        ## segment intersection is too sensitive a test;
        ## segmentsCross more reliable
        #cross = segmentIntersectSegment s1, s2
        cross = geom.lineIntersectLine s1, s2
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
  filter.removeLoopEdges fold

filter.edges_vertices_to_vertices_vertices = (fold) ->
  ###
  Works for abstract structures, so NOT SORTED.
  Use sort_vertices_vertices to sort in counterclockwise order.
  ###
  vertices_vertices = []
  for edge in fold.edges_vertices
    [v, w] = edge
    while v >= vertices_vertices.length
      vertices_vertices.push []
    while w >= vertices_vertices.length
      vertices_vertices.push []
    vertices_vertices[v].push w
    vertices_vertices[w].push v
  vertices_vertices
