FOLD = require '..'
{geom} = FOLD

{toBeDeepCloseTo,toMatchCloseTo} = require 'jest-matcher-deep-close-to';
expect.extend {toBeDeepCloseTo, toMatchCloseTo}

describe 'Utilities', ->
  array = [-3,-2,-1,0,1,2,3,14,-5,6,7]
  test 'Reducing with geom.sum', ->
    expect array.reduce geom.sum
    .toEqual 22
  test 'Reducing with geom.min', ->
    expect array.reduce geom.min
    .toEqual -5
  test 'Reducing with geom.max', ->
    expect array.reduce geom.max
    .toEqual 14

  test 'geom.next', ->
    expect geom.next(5,7)
    .toEqual 6
    expect geom.next(5,7,0)
    .toEqual 5
    expect geom.next(5,7,1)
    .toEqual 6
    expect geom.next(5,7,2)
    .toEqual 0
    expect geom.next(5,7,3)
    .toEqual 1
    expect geom.next(5,7,4)
    .toEqual 2

  test 'geom.rangesDisjoint', ->
    expect geom.rangesDisjoint([5,9],[2,7])
    .toEqual false
    expect geom.rangesDisjoint([3,1],[5,8])
    .toEqual true
    expect geom.rangesDisjoint([4.5,1],[4.5,8])
    .toEqual false

  #TODO: geom.topologicalSort

  undefined

describe 'Vector Operations', ->
  a = [1,0,0,0]
  b = [1,1,1,1]
  c = [0,3,2,4]
  d = [0,0,0,0]
  e = [0,1.5,1,2]

  test 'geom.magsq', ->
    expect geom.magsq a
    .toEqual 1
    expect geom.magsq b
    .toEqual 4
    expect geom.magsq c
    .toEqual 29
    expect geom.magsq d
    .toEqual 0
    expect geom.magsq e
    .toEqual 7.25

  test 'geom.mag', ->
    expect geom.mag a
    .toEqual 1
    expect geom.mag b
    .toEqual 2
    expect geom.mag c
    .toEqual Math.sqrt 29
    expect geom.mag d
    .toEqual 0
    expect geom.mag e
    .toEqual Math.sqrt 7.25

  test 'geom.unit', ->
    expect geom.unit a
    .toEqual [1,0,0,0]
    expect geom.unit b
    .toEqual [0.5,0.5,0.5,0.5]
    expect geom.unit c
    .toEqual [0, 3/Math.sqrt(29), 2/Math.sqrt(29), 4/Math.sqrt(29)]
    expect geom.unit d
    .toEqual null
    expect geom.unit e
    .toEqual [0, 3/Math.sqrt(29), 2/Math.sqrt(29), 4/Math.sqrt(29)]

  test 'geom.ang2D', ->
    expect geom.ang2D(a[0..1])
    .toEqual 0
    expect geom.ang2D(b[0..1])
    .toEqual 0.7853981633974483
    expect geom.ang2D(c[0..1])
    .toEqual 1.5707963267948966
    expect geom.ang2D(d[0..1])
    .toEqual null
    expect geom.ang2D(e[0..1])
    .toEqual 1.5707963267948966

  test 'geom.mul', ->
    expect geom.mul(c,-1)
    .toBeDeepCloseTo [0,-3,-2,-4]
    expect geom.mul(c,0)
    .toBeDeepCloseTo [0,0,0,0]
    expect geom.mul(c,1)
    .toBeDeepCloseTo [0,3,2,4]
    expect geom.mul(c,2)
    .toBeDeepCloseTo [0,6,4,8]
    expect geom.mul(c,2.5)
    .toBeDeepCloseTo [0,7.5,5,10]
    expect geom.mul(c,3)
    .toBeDeepCloseTo [0,9,6,12]

  test 'geom.linearInterpolate', ->
    expect geom.linearInterpolate(0.2,a,c)
    .toBeDeepCloseTo [0.8,0.6,0.4,0.8]
    expect geom.linearInterpolate(0.4,a,c)
    .toBeDeepCloseTo [0.6,1.2,0.8,1.6]
    expect geom.linearInterpolate(0.6,a,c)
    .toBeDeepCloseTo [0.4,1.8,1.2,2.4]
    expect geom.linearInterpolate(0.8,a,c)
    .toBeDeepCloseTo [0.2,2.4,1.6,3.2]

  describe 'Binary Vector Operators', ->
    test 'geom.plus', ->
      expect geom.plus(c,a)
      .toEqual [1,3,2,4]
      expect geom.plus(c,b)
      .toEqual [1,4,3,5]
      expect geom.plus(c,d)
      .toEqual [0,3,2,4]
      expect geom.plus(c,e)
      .toEqual [0,4.5,3,6]

    test 'geom.sub', ->
      expect geom.sub(c,a)
      .toEqual [-1,3,2,4]
      expect geom.sub(c,b)
      .toEqual [-1,2,1,3]
      expect geom.sub(c,d)
      .toEqual [0,3,2,4]
      expect geom.sub(c,e)
      .toEqual [0,1.5,1,2]

    test 'geom.dot', ->
      expect geom.dot(c,a)
      .toEqual 0
      expect geom.dot(c,b)
      .toEqual 9
      expect geom.dot(c,d)
      .toEqual 0
      expect geom.dot(c,e)
      .toEqual 14.5

    test 'geom.distsq', ->
      expect geom.distsq(c,a)
      .toEqual 30
      expect geom.distsq(c,b)
      .toEqual 15
      expect geom.distsq(c,d)
      .toEqual 29
      expect geom.distsq(c,e)
      .toEqual 7.25

    test 'geom.dist', ->
      expect geom.dist(c,a)
      .toBeDeepCloseTo 5.477225575051661
      expect geom.dist(c,b)
      .toBeDeepCloseTo 3.872983346207417
      expect geom.dist(c,d)
      .toBeDeepCloseTo 5.385164807134504
      expect geom.dist(c,e)
      .toBeDeepCloseTo 2.692582403567252

    test 'geom.dir', ->
      expect geom.dir(c,a)
      .toBeDeepCloseTo [0.18257418583505536,-0.5477225575051661,-0.3651483716701107,-0.7302967433402214]
      expect geom.dir(c,b)
      .toBeDeepCloseTo [0.2581988897471611,-0.5163977794943222,-0.2581988897471611,-0.7745966692414833]
      expect geom.dir(c,d)
      .toBeDeepCloseTo [0,-0.5570860145311556,-0.3713906763541037,-0.7427813527082074]
      expect geom.dir(c,e)
      .toBeDeepCloseTo [0,-0.5570860145311556,-0.3713906763541037,-0.7427813527082074]

    test 'geom.ang', ->
      expect geom.ang(c,a)
      .toBeDeepCloseTo 1.5707963267948966
      expect geom.ang(c,b)
      .toBeDeepCloseTo 0.581519391535515
      expect geom.ang(c,d)
      .toEqual null
      expect geom.ang(c,e)
      .toBeDeepCloseTo 0

    test 'geom.cross', ->
      expect geom.cross(c,a)
      .toEqual null
      expect geom.cross(c[0..1],a[0..1])
      .toEqual -3
      expect geom.cross(c[0..1],b[0..1])
      .toEqual -3
      expect geom.cross(c[0..1],d[0..1])
      .toEqual 0
      expect geom.cross(c[0..1],e[0..1])
      .toEqual 0
      expect geom.cross(c[0..2],a[0..2])
      .toEqual [0,2,-3]
      expect geom.cross(c[0..2],b[0..2])
      .toEqual [1,2,-3]
      expect geom.cross(c[0..2],d[0..2])
      .toEqual [0,0,0]
      expect geom.cross(c[0..2],e[0..2])
      .toEqual [0,0,0]

    test 'geom.parallel', ->
      expect geom.parallel(c,a)
      .toEqual false
      expect geom.parallel(c,b)
      .toEqual false
      expect geom.parallel(c,d)
      .toEqual null
      expect geom.parallel(c,e)
      .toEqual true

    undefined

  test 'geom.rotate', ->
    pi8 = Math.PI / 8
    pi3 = Math.PI / 3
    expect geom.rotate(a,c,0)
    .toBeDeepCloseTo [1,0,0]
    expect geom.rotate(a,c,pi8)
    .toBeDeepCloseTo [0.9238795325112867,0.1421250587755806,-0.2131875881633709]
    expect geom.rotate(a,c,pi3)
    .toBeDeepCloseTo [0.5000000000000001,0.3216337604513384,-0.48245064067700766]
    expect geom.rotate(b,c,0)
    .toBeDeepCloseTo [1,1,1]
    expect geom.rotate(b,c,pi8)
    .toBeDeepCloseTo [0.9949420618990771,1.1053772468844778,0.7369403814129893]
    expect geom.rotate(b,c,pi3)
    .toBeDeepCloseTo [0.6608168802256693,1.0802544501065108,0.18996315242644074]
    expect geom.rotate(d,c,0)
    .toBeDeepCloseTo [0,0,0]
    expect geom.rotate(d,c,pi8)
    .toBeDeepCloseTo [0,0,0]
    expect geom.rotate(d,c,pi3)
    .toBeDeepCloseTo [0,0,0]
    expect geom.rotate(e,c,0)
    .toBeDeepCloseTo [0,1.5,1]
    expect geom.rotate(e,c,pi8)
    .toBeDeepCloseTo [0,1.4370037510438236,0.9580025006958823]
    expect geom.rotate(e,c,pi3)
    .toBeDeepCloseTo [5.551115123125783e-17,1.0862068965517242,0.7241379310344829]
    expect geom.rotate(c,d,pi8)
    .toEqual null

  test 'geom.reflectPoint', ->
    expect geom.reflectPoint [0, 0], [1, 1]
    .toEqual [2, 2]
    expect geom.reflectPoint [-1, -2], [0, 0]
    .toEqual [1, 2]

  test 'geom.reflectLine', ->
    expect geom.reflectLine [0, 0], [-1, 0], [1, 2]
    .toEqual [-1, 1]
    expect geom.reflectLine [1, 0], [-1, 0], [1, 2]
    .toEqual [-1, 2]
    expect geom.reflectLine [1, -1], [-1, 0], [1, 2]
    .toEqual [-2, 2]
    expect geom.reflectLine([1, 2], [7, 12], [-13, 4])
    .toBeDeepCloseTo [-4.241379310344826, 15.103448275862071]
    expect geom.reflectLine(geom.reflectLine([1, 2], [7, 12], [-13, 4]),
                            [7, 12], [-13, 4])
    .toBeDeepCloseTo [1, 2]

  undefined

describe 'Matrix Transformations', ->

  test 'geom.matrixVector', ->
    expect geom.matrixVector [[1, 2], [4, 5]], [6] # implicit 0
    .toEqual [6, 24]
    expect geom.matrixVector [[1, 2], [4, 5]], [6, 7]
    .toEqual [20, 59]
    expect geom.matrixVector [[1, 2, 3], [4, 5, 6]], [6, 7], 0 # implicit 0
    .toEqual [20, 59]
    expect geom.matrixVector [[1, 2, 3], [4, 5, 6]], [6, 7]    # implicit 1
    .toEqual [23, 65]
    expect geom.matrixVector [[1, 2, 3], [4, 5, 6]], [6, 7], 1 # implicit 1
    .toEqual [23, 65]
    expect geom.matrixVector [[1, 2, 3], [4, 5, 6]], [6]       # implicit 0,1
    .toEqual [9, 30]

  test 'geom.matrixMatrix', ->
    expect geom.matrixMatrix [[2]], [[3]]
    .toEqual [[6]]
    expect geom.matrixMatrix [[1,0], [0,1]], [[1,0], [0,1]]
    .toEqual [[1,0], [0,1]]
    expect geom.matrixMatrix [[1,0], [0,1]], [[1,2], [3,4]]
    .toEqual [[1,2], [3,4]]
    expect geom.matrixMatrix [[1,2], [3,4]], [[1,2], [3,4]]
    .toEqual [[7,10], [15,22]]
    expect geom.matrixMatrix [[1,2,5], [3,4,6]], [[1,2], [3,4]]
    .toEqual [[7,10,5], [15,22,6]]               # implicit row 0,0,1
    expect geom.matrixMatrix [[1,2,5], [3,4,6]], [[1,2], [3,4], [1,1]]
    .toEqual [[12,15], [21,28]]
    expect geom.matrixMatrix [[1,2,5], [3,4,6]], [[1,2,5], [3,4,6]]
    .toEqual [[7,10,22], [15,22,45]]             # implicit row 0,0,1

  test 'geom.matrixMatrix equivalence to geom.matrixVector', ->
    m1 = geom.matrixRotate2D Math.PI/3  # 2x2
    m2 = geom.matrixTranslate [1,2]     # 2x3
    expect geom.matrixVector geom.matrixMatrix(m1, m2), [5,9]
    .toBeDeepCloseTo geom.matrixVector m1, geom.matrixVector m2, [5,9]
    expect geom.matrixVector geom.matrixMatrix(m2, m1), [5,9]
    .toBeDeepCloseTo geom.matrixVector m2, geom.matrixVector m1, [5,9]

  test 'geom.matrixInverseRT', ->
    expect geom.matrixInverseRT [[1,0], [0,1]]
    .toBeDeepCloseTo [[1,0], [0,1]]
    expect geom.matrixInverseRT [[1,0,0], [0,1,0]]
    .toBeDeepCloseTo [[1,0,0], [0,1,0]]
    expect geom.matrixInverseRT [[1,0,2], [0,1,3]]
    .toBeDeepCloseTo [[1,0,-2], [0,1,-3]]

  test 'geom.matrixInverse', ->
    expect geom.matrixInverse [[1,0], [0,1]]
    .toBeDeepCloseTo [[1,0], [0,1]]
    expect geom.matrixInverse [[1,0,0], [0,1,0]]
    .toBeDeepCloseTo [[1,0,0], [0,1,0]]
    expect geom.matrixInverse [[1,0,2], [0,1,3]]
    .toBeDeepCloseTo [[1,0,-2], [0,1,-3]]
    expect geom.matrixInverse [[0,-1,6], [1,0,2]]
    .toBeDeepCloseTo [[0,1,-2], [-1,0,6]]
    matrix = [[1,2,3],[7,8,9]]
    expect geom.matrixInverse matrix
    .toBeDeepCloseTo [[-4/3,1/3,1], [7/6,-1/6,-2]]
    expect geom.matrixMatrix matrix, geom.matrixInverse matrix
    .toBeDeepCloseTo [[1,0,0], [0,1,0]]

  test 'geom.matrixTranslate', ->
    expect geom.matrixTranslate [1,2]
    .toBeDeepCloseTo [[1,0,1], [0,1,2]]
    expect geom.matrixInverse geom.matrixTranslate [1,2]
    .toBeDeepCloseTo [[1,0,-1], [0,1,-2]]
    expect geom.matrixTranslate [1,2,3]
    .toBeDeepCloseTo [[1,0,0,1], [0,1,0,2], [0,0,1,3]]

  test 'geom.matrixRotate2D', ->
    expect geom.matrixRotate2D 2*Math.PI
    .toBeDeepCloseTo [[1,0], [0,1]]
    expect geom.matrixRotate2D 2*Math.PI, [1,2]
    .toBeDeepCloseTo [[1,0,0], [0,1,0]]
    expect geom.matrixRotate2D Math.PI
    .toBeDeepCloseTo [[-1,0], [0,-1]]
    expect geom.matrixRotate2D Math.PI, [1,2]
    .toBeDeepCloseTo [[-1,0,2], [0,-1,4]]
    rot180 = geom.matrixRotate2D Math.PI, [1,2]
    expect geom.matrixMatrix rot180, rot180
    .toBeDeepCloseTo [[1,0,0], [0,1,0]]
    expect geom.matrixRotate2D Math.PI/2
    .toBeDeepCloseTo [[0,-1], [1,0]]
    expect geom.matrixRotate2D Math.PI/2, [1,2]
    .toBeDeepCloseTo [[0,-1,3], [1,0,1]]
    rot90 = geom.matrixRotate2D Math.PI/2, [1,2]
    expect geom.matrixMatrix rot90, rot90
    .toBeDeepCloseTo rot180
    expect geom.matrixVector geom.matrixRotate2D(Math.PI/2), [1,0]
    .toBeDeepCloseTo [0,1] # counterclockwise test

  test 'geom.matrixReflectAxis', ->
    expect geom.matrixReflectAxis 0, 2
    .toBeDeepCloseTo [[-1,0],[0,1]]
    expect geom.matrixReflectAxis 1, 2
    .toBeDeepCloseTo [[1,0],[0,-1]]
    expect geom.matrixReflectAxis 0, 3
    .toBeDeepCloseTo [[-1,0,0],[0,1,0],[0,0,1]]
    expect geom.matrixReflectAxis 1, 3
    .toBeDeepCloseTo [[1,0,0],[0,-1,0],[0,0,1]]
    expect geom.matrixReflectAxis 2, 3
    .toBeDeepCloseTo [[1,0,0],[0,1,0],[0,0,-1]]
    expect geom.matrixReflectAxis 0, 2, 5
    .toBeDeepCloseTo [[-1,0,10],[0,1,0]]
    expect geom.matrixReflectAxis 1, 2, 5
    .toBeDeepCloseTo [[1,0,0],[0,-1,10]]
    expect geom.matrixVector geom.matrixReflectAxis(0, 2, 5), [4,2]
    .toBeDeepCloseTo [6,2]

  test 'geom.matrixReflectLine', ->
    expect geom.matrixVector geom.matrixReflectLine([-1, 0], [1, 2]), [0, 0]
    .toEqual [-1, 1]
    expect geom.matrixVector geom.matrixReflectLine([-1, 0], [1, 2]), [1, 0]
    .toEqual [-1, 2]
    expect geom.matrixVector geom.matrixReflectLine([-1, 0], [1, 2]), [1, -1]
    .toEqual [-2, 2]
    expect geom.matrixVector geom.matrixReflectLine([7, 12], [-13, 4]), [1, 2]
    .toBeDeepCloseTo [-4.241379310344826, 15.103448275862071]
    matrix = geom.matrixReflectLine([7, 12], [-13, 4])
    expect geom.matrixVector matrix, geom.matrixVector matrix, [1, 2]
    .toBeDeepCloseTo [1, 2]
    expect geom.matrixMatrix matrix, matrix
    .toBeDeepCloseTo [[1, 0, 0], [0, 1, 0]]
    expect geom.matrixInverseRT matrix
    .toBeDeepCloseTo matrix

  undefined

describe 'Polygon Operations', ->
  describe '2D Triangle Operations', ->
    test 'geom.interiorAngle', ->
      expect geom.interiorAngle([5,9],[2,7],[1,7])
      .toBeDeepCloseTo 3.7295952571373605
      expect geom.interiorAngle([3,1],[5,8],[0,3])
      .toBeDeepCloseTo 0.5070985043923368
      expect geom.interiorAngle([4.5,1],[4.5,8],[2,5])
      .toBeDeepCloseTo 0.6947382761967034

    test 'geom.turnAngle', ->
      expect geom.turnAngle([5,9],[2,7],[1,7])
      .toBeDeepCloseTo -0.5880026035475674
      expect geom.turnAngle([3,1],[5,8],[0,3])
      .toBeDeepCloseTo 2.6344941491974563
      expect geom.turnAngle([4.5,1],[4.5,8],[2,5])
      .toBeDeepCloseTo 2.4468543773930898

    undefined

  describe '3D Triangle Operations', ->
    ts = [
      [[1,0,0], [0,1,0], [0,0,1]]
      [[2,0,1], [1,1,1], [-1,-1,0]]
      [[3,4,0], [-1,2,-3], [0,3,2]]
      [[0,0,0], [1,0,0], [2,0,0]]
    ]

    test 'geom.triangleNormal', ->
      expect geom.triangleNormal ...ts[0]
      .toBeDeepCloseTo [0.5773502691896258,0.5773502691896258,0.5773502691896258]
      expect geom.triangleNormal ...ts[1]
      .toBeDeepCloseTo [-0.23570226039551587,-0.23570226039551587,0.9428090415820635]
      expect geom.triangleNormal ...ts[2]
      .toBeDeepCloseTo [-0.37851664930511264,0.9192547197409878,-0.10814761408717503]
      expect geom.triangleNormal ...ts[3]
      .toEqual null

    undefined

  describe '2D Polygon Operations', ->
    ts = [
      [[5,9],[2,7],[1,7]]
      [[0,3],[5,8],[3,1]]
      [[4.5,1],[4.5,8],[2,5]]
      [[1,7],[0,4],[5,9],[2,7]]
      [[0,3],[-1,5],[3,1],[5,8]]
      [[4.5,1],[4.5,8],[2,5],[3.5, 3]]
    ]

    test 'geom.twiceSignedArea', ->
      expect geom.twiceSignedArea(ts[0])
      .toEqual -2
      expect geom.twiceSignedArea(ts[1])
      .toEqual -25
      expect geom.twiceSignedArea(ts[2])
      .toEqual 17.5
      expect geom.twiceSignedArea(ts[3])
      .toEqual 8
      expect geom.twiceSignedArea(ts[4])
      .toEqual 21
      expect geom.twiceSignedArea(ts[5])
      .toEqual 16.5

    test 'geom.polygonOrientation', ->
      expect geom.polygonOrientation(ts[0])
      .toEqual -1
      expect geom.polygonOrientation(ts[1])
      .toEqual -1
      expect geom.polygonOrientation(ts[2])
      .toEqual 1
      expect geom.polygonOrientation(ts[3])
      .toEqual 1
      expect geom.polygonOrientation(ts[4])
      .toEqual 1
      expect geom.polygonOrientation(ts[5])
      .toEqual 1

    test 'geom.sortByAngle', ->
      expect geom.sortByAngle(ts[0])
      .toEqual [[5,9],[2,7],[1,7]]
      expect geom.sortByAngle(ts[1])
      .toEqual [[3,1],[5,8],[0,3]]
      expect geom.sortByAngle(ts[2])
      .toEqual [[4.5,1],[4.5,8],[2,5]]
      expect geom.sortByAngle(ts[3])
      .toEqual [[5,9],[2,7],[1,7],[0,4]]
      expect geom.sortByAngle(ts[4])
      .toEqual [[3,1],[5,8],[0,3],[-1,5]]
      expect geom.sortByAngle(ts[5])
      .toEqual [[4.5,1],[3.5,3],[4.5,8],[2,5]]

    undefined

  #TODO: segmentsCross(), parametricLineIntersect(), \
  #  segmentLineIntersect(), lineIntersectLine(), and pointStrictlyInSegment()

  describe 'General Dimension Point Operations', ->
    ps1 = [[0,0,0],[0,0,1],[1,0,0],[0,1,0],[1,1,0],[1,0,1],[0,1,1],[1,1,1]]
    ps2 = [[0,0,0],[1,1,0],[0,1,1]]

    test 'geom.centroid', ->
      expect geom.centroid(ps1)
      .toBeDeepCloseTo [0.5,0.5,0.5]
      expect geom.centroid(ps2)
      .toBeDeepCloseTo [0.3333333333333333,0.6666666666666666,0.3333333333333333]

    test 'geom.basis', ->
      expect geom.basis(ps1)
      .toBeDeepCloseTo [[0,0,-1],[1,0,0],[0,-1,0]]
      expect geom.basis(ps2)
      .toBeDeepCloseTo [[-0.7071067811865475,-0.7071067811865475,0],[-0.40824829046386296,0.40824829046386296,0.8164965809277259]]

    undefined

  undefined
