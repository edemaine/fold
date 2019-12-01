### BASIC GEOMETRY ###

geom = exports

###
    Utilities
###

geom.EPS = 0.000001

geom.sum = (a, b) -> a + b

geom.min = (a, b) -> if a < b then a else b

geom.max = (a, b) -> if a > b then a else b

geom.all = (a, b) -> a and b

geom.next = (start, n, i = 1) ->
  ###
  Returns the ith cyclic ordered number after start in the range [0..n].
  ###
  (start + i) %% n

geom.rangesDisjoint = ([a1, a2], [b1, b2]) ->
  ## Returns whether the scalar interval [a1, a2] is disjoint from the scalar
  ## interval [b1,b2].
  return (b1 < Math.min(a1, a2) > b2) or (b1 > Math.max(a1, a2) < b2)

geom.topologicalSort = (vs) ->
  ([v.visited, v.parent] = [false, null] for v in vs)
  list = []
  for v in vs when (not v.visited)
    list = geom.visit(v, list)
  return list

geom.visit = (v, list) ->
  v.visited = true
  for u in v.children when not u.visited
    u.parent = v
    list = geom.visit(u,list)
  return list.concat([v])

##
## Vector operations
##

geom.magsq = (a) ->
  ## Returns the squared magnitude of vector a having arbitrary dimension.
  geom.dot(a, a)

geom.mag = (a) ->
  ## Returns the magnitude of vector a having arbitrary dimension.
  Math.sqrt(geom.magsq(a))

geom.unit = (a, eps = geom.EPS) ->
  ## Returns the unit vector in the direction of vector a having arbitrary
  ## dimension. Returns null if magnitude of a is zero.
  length = geom.magsq(a)
  return null if length < eps
  geom.mul(a, 1 / geom.mag(a))

geom.ang2D = (a, eps = geom.EPS) ->
  ## Returns the angle of a 2D vector relative to the standard
  ## east-is-0-degrees rule.
  return null if geom.magsq(a) < eps
  Math.atan2(a[1], a[0])

geom.mul = (a, s) ->
  ## Returns the vector a multiplied by scaler factor s.
  (i * s for i in a)

geom.linearInterpolate = (t, a, b) ->
  ## Returns linear interpolation of vector a to vector b for 0 < t < 1
  geom.plus geom.mul(a, 1 - t), geom.mul(b, t)

geom.plus = (a, b) ->
  ## Returns the vector sum between of vectors a and b having the same
  ## dimension.
  (ai + b[i] for ai, i in a)

geom.sub = (a, b) ->
  ## Returns the vector difference of vectors a and b having the same dimension.
  geom.plus(a, geom.mul(b, -1))

geom.dot = (a, b) ->
  ## Returns the dot product between two vectors a and b having the same
  ## dimension.
  (ai * b[i] for ai, i in a).reduce(geom.sum)

geom.distsq = (a, b) ->
  ## Returns the squared Euclidean distance between two vectors a and b having 
  ## the same dimension.
  geom.magsq(geom.sub(a, b))

geom.dist = (a, b) ->
  ## Returns the Euclidean distance between general vectors a and b having the
  ## same dimension.
  Math.sqrt(geom.distsq(a, b))

geom.closestIndex = (a, bs) ->
  ## Finds the closest point to `a` among points in `bs`, and returns the
  ## index of that point in `bs`.  Returns `undefined` if `bs` is empty.
  minDist = Infinity
  for b, i in bs
    if minDist > dist = geom.dist a, b
      minDist = dist
      minI = i
  minI

geom.dir = (a, b) ->
  ## Returns a unit vector in the direction from vector a to vector b, in the
  ## same dimension as a and b.
  geom.unit(geom.sub(b, a))

geom.ang = (a, b) ->
  ## Returns the angle spanned by vectors a and b having the same dimension.
  [ua, ub] = (geom.unit(v) for v in [a,b])
  return null unless ua? and ub?
  Math.acos geom.dot(ua, ub)

geom.cross = (a, b) ->
  ## Returns the cross product of two 2D or 3D vectors a, b.
  if a.length == b.length == 2
    return (a[0] * b[1] - a[1] * b[0])
  if a.length == b.length == 3
    return (a[i] * b[j] - a[j] * b[i] for [i, j] in [[1, 2], [2, 0], [0, 1]])
  return null

geom.parallel = (a, b, eps = geom.EPS) ->
  ## Return if vectors are parallel, up to accuracy eps
  [ua, ub] = (geom.unit(v) for v in [a,b])
  return null unless ua? and ub?
  1 - Math.abs(geom.dot ua, ub) < eps

geom.rotate = (a, u, t) ->
  ## Returns the rotation of 3D vector a about 3D unit vector u by angle t.
  u = geom.unit(u)
  return null unless u?
  [ct, st] = [Math.cos(t), Math.sin(t)]
  (for p in [[0,1,2],[1,2,0],[2,0,1]]
    (for q, i in [ct, -st * u[p[2]], st * u[p[1]]]
      a[p[i]] * (u[p[0]] * u[p[i]] * (1 - ct) + q)).reduce(geom.sum))

geom.reflectPoint = (p, q) ->
  ## Reflect point p through the point q into the "symmetric point"
  geom.sub(geom.mul(q, 2), p)

geom.reflectLine = (p, a, b) ->
  ## Reflect point p through line through points a and b
  # [based on https://math.stackexchange.com/a/11532]
  # projection = a + (b - a) * [(b - a) dot (p - a)] / ||b - a||^2
  vec = geom.sub(b, a)
  lenSq = geom.magsq(vec)
  dot = geom.dot(vec, geom.sub(p, a))
  projection = geom.plus(a, geom.mul(vec, dot / lenSq))
  # reflection = 2*projection - p (symmetric point of p opposite projection)
  geom.sub(geom.mul(projection, 2), p)

###
Matrix transformations

2D transformation matrices are of the form (where last column is optional):
  [[a, b, c],
   [d, e, f]]

3D transformation matrices are of the form (where last column is optional):
  [[a, b, c, d],
   [e, f, g, h],
   [i, j, k, l]]

Transformation matrices are designed to be multiplied on the left of points,
i.e., T*x gives vector x transformed by matrix T, where x has an implicit 1
at the end (homogeneous coordinates) when T has the optional last column.
See `geom.matrixVector`.
###

geom.matrixVector = (matrix, vector, implicitLast = 1) ->
  ## Returns matrix-vector product, matrix * vector.
  ## Requires the number of matrix columns to be <= vector length.
  ## If the matrix has more columns than the vector length, then the vector
  ## is assumed to be padded with zeros at the end, EXCEPT when the matrix
  ## has more columns than rows (as in transformation matrices above),
  ## in which case the final vector padding is implicitLast,
  ## which defaults to 1 (point); set to 0 for treating like a vector.
  for row in matrix
    val = (row[j] * x for x, j in vector).reduce(geom.sum)
    if row.length > vector.length and row.length > matrix.length
      val += row[row.length-1] * implicitLast
    val

geom.matrixMatrix = (matrix1, matrix2) ->
  ## Returns matrix-matrix product, matrix1 * matrix2.
  ## Requires number of matrix1 columns equal to or 1 more than matrix2 rows.
  ## In the latter case, treats matrix2 as having an extra row [0,0,...,0,0,1],
  ## which may involve adding an implicit column to matrix2 as well.
  for row1 in matrix1
    if matrix2.length != row1.length != matrix2.length + 1
      throw new Error "Invalid matrix dimension #{row1.length} vs. matrix dimension #{matrix2.length}"
    product =
      for j in [0...matrix2[0].length]
        val = (row1[k] * row2[j] for row2, k in matrix2).reduce(geom.sum)
        if j == row1.length - 1 == matrix2.length
          val += row1[j]
        val
    if row1.length - 1 == matrix2.length == matrix2[0].length
      product.push row1[row1.length - 1]
    product

geom.matrixInverseRT = (matrix) ->
  ## Returns inverse of a matrix consisting of rotations and/or translations,
  ## where the inverse can be found by a transpose and dot products
  ## [http://www.graphics.stanford.edu/courses/cs248-98-fall/Final/q4.html].
  if matrix[0].length == matrix.length+1
    lastCol = (row[row.length-1] for row in matrix)
  else if matrix[0].length != matrix.length
    throw new Error "Invalid matrix dimensions #{matrix.length}x#{matrix[0].length}"
  for row, i in matrix
    invRow = (matrix[j][i] for j in [0...matrix.length]) # transpose
    if lastCol?
      invRow.push -geom.dot row[...matrix.length], lastCol
    invRow

geom.matrixInverse = (matrix) ->
  ## Returns inverse of a matrix computed via Gauss-Jordan elimination method.
  if matrix.length != matrix[0].length != matrix.length+1
    throw new Error "Invalid matrix dimensions #{matrix.length}x#{matrix[0].length}"
  matrix = (row[..] for row in matrix) # copy before elimination
  inverse =
    for row, i in matrix
      for j in [0...row.length]
        0 + (i == j)
  for j in [0...matrix.length]
    # Pivot to maximize absolute value in jth column
    bestRow = j
    for i in [j+1...matrix.length]
      if Math.abs(matrix[i][j]) > Math.abs(matrix[bestRow][j])
        bestRow = i
    if bestRow != j
      [matrix[bestRow], matrix[j]] = [matrix[j], matrix[bestRow]]
      [inverse[bestRow], inverse[j]] = [inverse[j], inverse[bestRow]]
    # Scale row to unity in jth column
    inverse[j] = geom.mul inverse[j], 1/matrix[j][j]
    matrix[j] = geom.mul matrix[j], 1/matrix[j][j]
    # Eliminate other rows in jth column
    for i in [0...matrix.length] when i != j
      inverse[i] = geom.plus inverse[i], geom.mul inverse[j], -matrix[i][j]
      matrix[i] = geom.plus matrix[i], geom.mul matrix[j], -matrix[i][j]
  if matrix[0].length == matrix.length+1
    for i in [0...matrix.length] when i != j
      inverse[i][inverse[i].length-1] -= matrix[i][matrix[i].length-1]
      matrix[i][matrix[i].length-1] -= matrix[i][matrix[i].length-1]
  inverse

geom.matrixTranslate = (v) ->
  ## Transformation matrix for translating by given vector v.
  ## Works in any dimension, assuming v.length is that dimension.
  for x, i in v
    row =
      for j in [0...v.length]
        0 + (i == j)
    row.push x
    row

geom.matrixRotate2D = (t, center) ->
  ## 2D rotation matrix around center, which defaults to origin,
  ## counterclockwise by t radians.
  [ct, st] = [Math.cos(t), Math.sin(t)]
  if center?
    [x, y] = center
    [[ct, -st, -x*ct + y*st + x]
     [st,  ct, -x*st - y*ct + y]]
  else
    [[ct, -st]
     [st,  ct]]

geom.matrixReflectAxis = (a, d, center) ->
  ## Matrix transformation negating dimension a out of d dimensions,
  ## or if center is specified, reflecting around that value of dimension a.
  for i in [0...d]
    row =
      for j in [0...d]
        if i == j
          if a == i
            -1
          else
            1
        else
          0
    if center?
      if a == i
        row.push 2*center
      else
        row.push 0
    row

geom.matrixReflectLine = (a, b) ->
  ## Matrix transformation implementing 2D geom.reflectLine(*, a, b)
  vec = geom.sub(b, a)
  lenSq = geom.magsq(vec)
  # dot = vec dot (p - a) = vec dot p - vec dot a
  dot2 = geom.dot(vec, a)
  #proj = (a[i] + vec[i] * dot / lenSq for i in [0...2])
  #[[vec[0] * vec[0] / lenSq,
  #  vec[0] * vec[1] / lenSq,
  #  a[0] - vec[0] * dot2 / lenSq]
  # [vec[1] * vec[0] / lenSq,
  #  vec[1] * vec[1] / lenSq,
  #  a[1] - vec[1] * dot2 / lenSq]]
  [[2*(vec[0] * vec[0] / lenSq) - 1,
    2*(vec[0] * vec[1] / lenSq),
    2*(a[0] - vec[0] * dot2 / lenSq)]
   [2*(vec[1] * vec[0] / lenSq),
    2*(vec[1] * vec[1] / lenSq) - 1,
    2*(a[1] - vec[1] * dot2 / lenSq)]]

##
## Polygon Operations
##

geom.interiorAngle = (a, b, c) ->
  ## Computes the angle of three points that are, say, part of a triangle.
  ## Specify in counterclockwise order.
  ##          a
  ##         /
  ##        /
  ##      b/_)__ c
  ang = geom.ang2D(geom.sub(a, b)) - geom.ang2D(geom.sub(c, b))
  ang + (if ang < 0 then 2*Math.PI else 0)

geom.turnAngle = (a, b, c) ->
  ## Returns the turn angle, the supplement of the interior angle
  Math.PI - geom.interiorAngle(a, b, c)

geom.triangleNormal = (a, b, c) ->
  ## Returns the right handed normal unit vector to triangle a, b, c in 3D. If
  ## the triangle is degenerate, returns null.
  geom.unit geom.cross(geom.sub(b, a), geom.sub(c, b))

geom.polygonNormal = (points, eps = geom.EPS) ->
  ## Returns the right handed normal unit vector to the polygon defined by
  ## points in 3D. Assumes the points are planar.
  return geom.unit((for p, i in points
    geom.cross(p, points[geom.next(i, points.length)])).reduce(geom.plus), eps)

geom.twiceSignedArea = (points) ->
  ## Returns twice signed area of polygon defined by input points.
  ## Calculates and sums twice signed area of triangles in a fan from the first
  ## vertex.
  (for v0, i in points
    v1 = points[geom.next(i, points.length)]
    v0[0] * v1[1] - v1[0] * v0[1]
  ).reduce(geom.sum)

geom.polygonOrientation = (points) ->
  ## Returns the orientation of the 2D polygon defined by the input points.
  ## +1 for counterclockwise, -1 for clockwise
  ## via computing sum of signed areas of triangles formed with origin
  Math.sign geom.twiceSignedArea points

geom.sortByAngle = (points, origin = [0,0], mapping = (x) -> x) ->
  ## Sort a set of 2D points in place counter clockwise about origin
  ## under the provided mapping.
  origin = mapping(origin)
  points.sort (p, q) ->
    pa = geom.ang2D geom.sub(mapping(p), origin)
    qa = geom.ang2D geom.sub(mapping(q), origin)
    pa - qa

geom.segmentsCross = ([p0, q0], [p1, q1]) ->
  ## May not work if the segments are collinear.
  ## First do rough overlap check in x and y.  This helps with
  ## near-collinear segments.  (Inspired by oripa/geom/GeomUtil.java)
  if geom.rangesDisjoint([p0[0], q0[0]], [p1[0], q1[0]]) or
     geom.rangesDisjoint([p0[1], q0[1]], [p1[1], q1[1]])
    return false
  ## Now do orientation test.
  geom.polygonOrientation([p0,q0,p1]) != geom.polygonOrientation([p0,q0,q1]) and
  geom.polygonOrientation([p1,q1,p0]) != geom.polygonOrientation([p1,q1,q0])

geom.parametricLineIntersect = ([p1, p2], [q1, q2]) ->
  ## Returns the parameters s,t for the equations s*p1+(1-s)*p2 and
  ## t*q1+(1-t)*q2.  Used Maple's result of:
  ##    solve({s*p2x+(1-s)*p1x=t*q2x+(1-t)*q1x,
  ##           s*p2y+(1-s)*p1y=t*q2y+(1-t)*q1y}, {s,t});
  ## Returns null, null if the intersection couldn't be found
  ## because the lines are parallel.
  ## Input points must be 2D.
  denom = (q2[1]-q1[1])*(p2[0]-p1[0]) + (q1[0]-q2[0])*(p2[1]-p1[1])
  if denom == 0
    [null, null]
  else
    [(q2[0]*(p1[1]-q1[1])+q2[1]*(q1[0]-p1[0])+q1[1]*p1[0]-p1[1]*q1[0])/denom,
     (q1[0]*(p2[1]-p1[1])+q1[1]*(p1[0]-p2[0])+p1[1]*p2[0]-p2[1]*p1[0])/denom]

geom.segmentIntersectSegment = (s1, s2) ->
  [s, t] = geom.parametricLineIntersect(s1, s2)
  if s? and (0 <= s <= 1) and (0 <= t <= 1)
    geom.linearInterpolate(s, s1[0], s1[1])
  else
    null

geom.lineIntersectLine = (l1, l2) ->
  [s, t] = geom.parametricLineIntersect(l1, l2)
  if s?
    geom.linearInterpolate(s, l1[0], l1[1])
  else
    null

geom.pointStrictlyInSegment = (p, s, eps = geom.EPS) ->
  v0 = geom.sub p, s[0]
  v1 = geom.sub p, s[1]
  geom.parallel(v0, v1, eps) and geom.dot(v0, v1) < 0

geom.centroid = (points) ->
  ## Returns the centroid of a set of points having the same dimension.
  geom.mul(points.reduce(geom.plus), 1.0 / points.length)

geom.basis = (ps, eps = geom.EPS) ->
  ## Returns a basis of a 3D point set.
  ##  - [] if the points are all the same point (0 dimensional)
  ##  - [x] if the points lie on a line with basis direction x
  ##  - [x,y] if the points lie in a plane with basis directions x and y
  ##  - [x,y,z] if the points span three dimensions
  return null if (p.length != 3 for p in ps).reduce(geom.all)
  ds = (geom.dir(p,ps[0]) for p in ps when geom.distsq(p,ps[0]) > eps)
  return [] if ds.length is 0
  x = ds[0]
  return [x] if (geom.parallel(d, x, eps) for d in ds).reduce(geom.all)
  ns = (geom.unit(geom.cross(d, x)) for d in ds)
  ns = (n for n in ns when n?)
  z = ns[0]
  y = geom.cross(z, x)
  return [x, y] if (geom.parallel(n, z, eps) for n in ns).reduce(geom.all)
  return [x, y, z]

geom.above = (ps, qs, n, eps = geom.EPS) ->
  [pn,qn] = ((geom.dot(v, n) for v in vs) for vs in [ps,qs])
  return  1 if qn.reduce(geom.max) - pn.reduce(geom.min) < eps
  return -1 if pn.reduce(geom.max) - qn.reduce(geom.min) < eps
  return 0

geom.separatingDirection2D = (t1, t2, n, eps = geom.EPS) ->
  ## If points are contained in a common plane with normal n and a separating 
  ## direction exists, a direction perpendicular to some pair of points from 
  ## the same set is also a separating direction.
  for t in [t1, t2]
    for p, i in t
      for q, j in t when i < j
        m = geom.unit(geom.cross(geom.sub(p, q), n))
        if m?
          sign = geom.above(t1, t2, m, eps)
          return geom.mul(m, sign) if sign isnt 0
  return null

geom.separatingDirection3D = (t1, t2, eps = geom.EPS) ->
  ## If points are not contained in a common plane and a separating direction
  ## exists, a plane spanning two points from one set and one point from the
  ## other set is a separating plane, with its normal a separating direction. 
  for [x1, x2] in [[t1, t2], [t2, t1]]
    for p in x1
      for q1, i in x2
        for q2, j in x2 when i < j
          m = geom.unit(geom.cross(geom.sub(p, q1), geom.sub(p, q2)))
          if m?
            sign = geom.above(t1, t2, m, eps)
            return geom.mul(m, sign) if sign isnt 0
  return null

##
## Hole Filling Methods
## 

geom.circleCross = (d, r1, r2) ->
  x = (d * d - r2 * r2 + r1 * r1) / d / 2
  y = Math.sqrt(r1 * r1 - x * x)
  return [x, y]

geom.creaseDir = (u1, u2, a, b, eps = geom.EPS) ->
  b1 = Math.cos(a) + Math.cos(b)
  b2 = Math.cos(a) - Math.cos(b)
  x = geom.plus(u1, u2)
  y = geom.sub(u1, u2)
  z = geom.unit(geom.cross(y, x))
  x = geom.mul(x, b1 / geom.magsq(x))
  y = geom.mul(y, if geom.magsq(y) < eps then 0 else b2 / geom.magsq(y))
  zmag = Math.sqrt(1 - geom.magsq(x) - geom.magsq(y))
  z = geom.mul(z, zmag)
  return [x, y, z].reduce(geom.plus)

geom.quadSplit = (u, p, d, t) ->
  # Split from origin in direction U subject to external point P whose
  # shortest path on the surface is distance D and projecting angle is T
  if geom.magsq(p) > d * d
    throw new Error "STOP! Trying to split expansive quad."
  return geom.mul(u, (d*d - geom.magsq(p))/2/(d*Math.cos(t) - geom.dot(u, p)))

