### BASIC GEOMETRY ###

geom = exports

geom.twiceSignedArea = (a, b, c) ->
  ## Returns twice the signed area of the triangle determined by a, b, and c.
  ## Positive if a,b,c are oriented counter-clockwise, and negative if clockwise.
  unless a.length == b.length == c.length == 2
    throw new Error "twiceSignedArea: Vertex coordinates not two dimensional"
  a[0]*b[1] - a[1]*b[0] + a[1]*c[0] - a[0]*c[1] + b[0]*c[1] - c[0]*b[1]

geom.triangleOrientation = (a, b, c) ->
  Math.sign geom.twiceSignedArea a, b, c

geom.twiceSignedAreaOfVectors = (b, c) ->
  ##return twice_signed_area [0,0], b, c
  unless b.length == c.length == 2
    throw "twiceSignedAreaOfVectors: Vertex coordinates not two dimensional"
  b[0]*c[1] - c[0]*b[1]

geom.polygonOrientation = (points) ->
  ## +1 for counterclockwise, -1 for clockwise
  ## via computing sum of signed areas of triangles formed with origin
  Math.sign sum(
    for v, i in points
      geom.twiceSignedAreaOfVectors v, points[(i+1) % points.length]
  )
  ## Another correct way, but using trig:
  #Math.sign sum(
  #  for p, i in points
  #    turnAngle p, points[(i+1) % points.length], points[(i+2) % points.length]
  #)

geom.sum = (list) ->
  s = 0
  for x in list
    s += x
  s

geom.vectorLength = (v) ->
  Math.sqrt geom.sum(x*x for x in v)

geom.angleOfVector = (v) ->
  ## Returns the angle of a vector relative to the standard east-is-0-degrees rule.
  unless v.length == 2
    throw "angleOfVector: Vertex coordinates not two dimensional"
  length = geom.vectorLength v
  Math.atan2 v[1], v[0]

geom.vectorFromTo = (a, b) ->
  (b[i] - x) for x, i in a

geom.distance = (a, b) ->
  geom.vectorLength geom.vectorFromTo a, b

geom.angleABC = (a, b, c) ->
  ## Computes the angle of three points that are, say, part of a triangle.
  ## Specify in counterclockwise order.
  ## 
  ##          a
  ##         /
  ##        /
  ##      b/_)__ c
  #console.log a, b, c, angleOfVector(vectorFromTo(b, a)), angleOfVector(vectorFromTo(b, c)), angleOfVector(vectorFromTo(b, a)) - angleOfVector(vectorFromTo(b, c)),
  ang = geom.angleOfVector(geom.vectorFromTo(b, a)) - geom.angleOfVector(geom.vectorFromTo(b, c))
  if ang < 0
    2*Math.PI + ang
  else
    ang

geom.turnAngle = (a, b, c) ->
  Math.PI - angleABC a, b, c

geom.sortByAngle = (points, origin = [0,0], mapping = (x) -> x) ->
  ## CLOCKWISE
  origin = mapping origin
  unless origin.length == mapping(points[0]).length == 2
    throw "sortByAngle: Vertex coordinates not two dimensional"
  #xaxis = [
  #  origin[0] + Math.abs(origin[0]) + 1
  #  origin[1]
  #]
  #pairs = [angleOfVector(vectorFromTo origin, p), p] for p in points
  #pairs.sort (p, q) -> p[0] - q[0]
  points.sort (p, q) ->
    #p = mapping p
    #q = mapping q
    #psign = Math.sign twiceSignedArea(p, origin, xaxis)
    #qsign = Math.sign twiceSignedArea(q, origin, xaxis)
    #if psign == 0
    #  psign = Math.sign p[0] - origin[0]
    #if qsign == 0
    #  qsign = Math.sign q[0] - origin[0]
    #if psign == qsign
    #  twiceSignedArea(p, origin, q)
    #else
    #  qsign - psign
    pa = geom.angleOfVector geom.vectorFromTo origin, mapping p
    qa = geom.angleOfVector geom.vectorFromTo origin, mapping q
    qa - pa

#points = [
#  [1,0]
#  [1,1]
#  [0,1]
#  [-1,1]
#  [-1,0]
#  [-1,-1]
#  [0,-1]
#  [1,-1]
#]
#sortByAngle points
#console.log points

geom.segmentsCross = (s0, s1) ->
  ## May not work if the segments are collinear.
  [p0, q0] = s0
  [p1, q1] = s1
  ## First do rough check based on x coordinates.  This helps with
  ## near-collinear segments.  (Inspired by oripa/geom/GeomUtil.java)
  return false if p1[0] < Math.min(p0[0], q0[0]) > q1[0] or
                  p1[0] > Math.max(p0[0], q0[0]) < q1[0]
  ## Ditto for y.
  return false if p1[1] < Math.min(p0[1], q0[1]) > q1[1] or
                  p1[1] > Math.max(p0[1], q0[1]) < q1[1]
  ## Now do orientation test.
  geom.triangleOrientation(p0, q0, p1) != geom.triangleOrientation(p0, q0, q1) and
  geom.triangleOrientation(p1, q1, p0) != geom.triangleOrientation(p1, q1, q0)

geom.parametricLineIntersect = (l1, l2) ->
  ## Returns the parameters s,t for the equations s*p1+(1-s)*p2 and
  ## t*q1+(1-t)*q2.  Used Maple's result of:
  ##    solve({s*p2x+(1-s)*p1x=t*q2x+(1-t)*q1x,
  ##           s*p2y+(1-s)*p1y=t*q2y+(1-t)*q1y}, {s,t});
  ## Returns null, null if the intersection couldn't be found
  ## because the lines are parallel.
  unless l1[0].length == l1[1].length == l2[0].length == l2[1].length == 2
    throw "parametricLineIntersect: Vertex coordinates are not two dimensional"
  [p1, p2] = l1
  [q1, q2] = l2
  denom = (q2[1]-q1[1])*(p2[0]-p1[0]) + (q1[0]-q2[0])*(p2[1]-p1[1])
  if denom == 0
    [null, null]
  else
    [(q2[0]*(p1[1]-q1[1]) + q2[1]*(q1[0]-p1[0]) +
      q1[1]*p1[0] - p1[1]*q1[0]) / denom,
     (q1[0]*(p2[1]-p1[1]) + q1[1]*(p1[0]-p2[0]) +
     p1[1]*p2[0] - p2[1]*p1[0]) / denom]

geom.linearInterpolate = (t, p, q) ->
  for x, i in p
    (1-t)*x + t*q[i]

geom.segmentIntersectSegment = (s1, s2) ->
  [s, t] = geom.parametricLineIntersect s1, s2
  if s?
    if 0 <= s <= 1 and 0 <= t <= 1
      geom.linearInterpolate s, s1[0], s1[1]
    else
      null
  else
    null

geom.lineIntersectLine = (l1, l2) ->
  [s, t] = geom.parametricLineIntersect l1, l2
  if s?
    geom.linearInterpolate s, l1[0], l1[1]
  else
    null
