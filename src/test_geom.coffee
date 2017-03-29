geom = require './geom'

print = (str) -> console.log str
print "Running tests on Geom Library:\n"
print "\n---- Running tests on Utilities ----"

print "\nTesting reducers..."
array = [-3,-2,-1,0,1,2,3,14,-5,6,7]
print "Testing array = [#{array}]"
for f in ['sum','min','max']
  print "array.reduce(geom.#{f}) = #{array.reduce geom[f]}"

print "\nTesting geom.Next..."
print "geom.next(5, 7) = #{geom.next(5,7)}"
for i in [0..4]
  print "geom.next(5, 7, #{i}) = #{geom.next(5,7,i)}"

print "\nTesting geom.rangesDisjoint..."
rs = [
  {a: [5,9], b: [2,7]}
  {a: [3,1], b: [5,8]}
  {a: [4.5,1], b: [4.5,8]}
]
for r in rs
  print "geom.rangesDisjoint([#{r.a}],[#{r.b}]) = #{geom.rangesDisjoint(r.a,r.b)}"

print "\nExample for geom.topologicalSort pending."

print "\n---- Running tests on Vector Operations ----"
vs = {
  a: [1,0,0,0]
  b: [1,1,1,1]
  c: [0,3,2,4]
  d: [0,0,0,0]
  e: [0,1.5,1,2]
}
for k, v of vs
  print "Test vector #{k} = [#{v}]"

for f in ['magsq', 'mag', 'unit']
  print "\nTesting geom.#{f}..."
  for k, v of vs
    print "geom.#{f}(#{k}) = #{geom[f](v)}"

print "\nTesting geom.ang2D..."
for k, v of vs
  print "geom.ang2D([#{v[0..1]}]) = #{geom.ang2D(v[0..1])}"

print "\nTesting geom.mul..."
for t in [-1,0,1,2,2.5,3]
  print "geom.mul(c,#{t}) = [#{geom.mul(vs.c,t)}]"

print "\nTesting geom.linearInterpolate..."
for t in [0.2..0.8] by 0.2
  print "geom.linearInterpolate(#{t},a,c) = [#{geom.linearInterpolate(t,vs.a,vs.c)}]"

print "\nTesting Binary Vector Operators"
for f in ['plus','sub','dot','distsq','dist','dir','ang','cross', 'parallel']
  print "\nTesting geom.#{f}..."
  for k, v of vs when k isnt 'c'
    result = geom[f](vs.c, v)
    if result? and result.length > 1
      print "geom.#{f}(c,#{k}) = [#{result}]"
    else
      print "geom.#{f}(c,#{k}) = #{result}"

print "\nTesting geom.rotate..."
ang = [0, Math.PI / 8, Math.PI / 3]
for k, v of vs when k isnt 'c'
  for a in ang
    print "geom.rotate(#{k},c,#{a}) = [#{geom.rotate(v, vs.c, a)}]"
print "geom.rotate(c,d,#{ang[1]}) = [#{geom.rotate(vs.c, vs.d, ang[1])}]"

print "\n---- Running tests on Polygon Operations ----"

print "\nTesting 2D Triangle Operations"
ts = [
  {a: [5,9], b: [2,7], c: [1,7]}
  {a: [3,1], b: [5,8], c: [0,3]}
  {a: [4.5,1], b: [4.5,8], c: [2,5]}
]
for f in ['interiorAngle', 'turnAngle']
  print "\nTesting geom.#{f}..."
  for t in ts
    result = geom[f](t.a, t.b, t.c)
    if result? and result.length > 1
      print "geom.#{f}([#{t.a}],[#{t.b}],[#{t.c}]) = [#{result}]"
    else
      print "geom.#{f}([#{t.a}],[#{t.b}],[#{t.c}]) = #{result}"

print "\nTesting 3D Triangle Operations"
ts = [
  {a: [1,0,0], b: [0,1,0], c: [0,0,1]}
  {a: [2,0,1], b: [1,1,1], c: [-1,-1,0]}
  {a: [3,4,0], b: [-1,2,-3], c: [0,3,2]}
  {a: [0,0,0], b: [1,0,0], c: [2,0,0]}
]
print "\nTesting geom.triangleNormal..."
for t in ts
  print "geom.triangleNormal([#{t.a}],[#{t.b}],[#{t.c}]) = [#{geom.triangleNormal(t.a,t.b,t.c)}]"

print "\nTesting 2D Polygon Operations"
ts = [
  [[5,9],[2,7],[1,7]]
  [[3,1],[5,8],[0,3]]
  [[4.5,1],[4.5,8],[2,5]]
  [[5,9],[2,7],[1,7],[0,4]]
  [[3,1],[5,8],[0,3],[-1,5]]
  [[4.5,1],[4.5,8],[2,5],[3.5, 3]]
]
for f in ['twiceSignedArea', 'polygonOrientation', 'sortByAngle']
  print "\nTesting geom.#{f}..."
  for t in ts
    print "geom.#{f}([#{"[#{c}]" for c in t}]) \
      = #{geom[f](t)}"

 
