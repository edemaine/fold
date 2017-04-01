geom = require './geom'
viewer = exports

STYLES = {
  vert: "fill: white; r: 0.03; stroke: black; stroke-width: 0.005;"
  face: "stroke: none; fill-opacity: 0.8;"
  top: "fill: cyan;", bot: "fill: yellow;"
  edge: "fill: none; stroke-width: 0.01; stroke-linecap: round;"
  axis: "fill: none; stroke-width: 0.01; stroke-linecap: round;"
  text: "fill: black; font-size: 0.04; text-anchor: middle;
    font-family: sans-serif;"
  B: "stroke: black;", V: "stroke: blue;"
  M: "stroke: red;", U: "stroke: white"
  ax: "stroke: blue;", ay: "stroke: red;", az: "stroke: green;"
}

### UTILITIES ###

viewer.processInput = (text, view) ->
  view.fold = JSON.parse(text)
  view.model = viewer.makeModel(view.fold)
  viewer.addRotation(view)
  viewer.draw(view)
  viewer.update(view)

viewer.importURL = (url, view) ->
  xhr = new XMLHttpRequest()
  xhr.onload = (e) => viewer.processInput(e.target.responseText, view)
  xhr.open('GET', url); xhr.send()

viewer.getId = (id) ->
  document.getElementById(id)

viewer.importFile = (file, view) ->
  file_reader = new FileReader()
  file_reader.onload = (e) => viewer.processInput(e.target.result, view)
  file_reader.readAsText(file)

viewer.setAttrs = (el, attrs) ->
  (el.setAttribute(k, v) for k, v of attrs); el

viewer.appendHTML = (el, tag, attrs) ->
  el.appendChild(viewer.setAttrs(document.createElement(tag), attrs))

SVGNS = 'http://www.w3.org/2000/svg'
viewer.appendSVG = (el, tag, attrs) ->
  el.appendChild(viewer.setAttrs(document.createElementNS(SVGNS, tag), attrs))

viewer.appendButton = (el, value, callback) ->
  viewer.appendHTML(el, 'input', {type: 'button', value: value})
    .addEventListener('click', callback)

viewer.makePath = (coords) ->
  (for c, i in coords
    "#{if (i is 0) then 'M' else 'L'} #{c[0]} #{c[1]} "
  ).reduce geom.sum

### CAMERA FUNCTIONS ###

viewer.initCam = () -> {
  c: [0,0,0], x: [1,0,0], y: [0,1,0], z: [0,0,1], rad: 1, last: null
  show: {'Faces': true, 'Edges': true, 'Vertices': false, 'Face Text': false}}

viewer.proj = (p, cam) ->
  [geom.dot(geom.sub(p, cam.c), cam.x), -geom.dot(geom.sub(p, cam.c), cam.y), 0]

viewer.setCamXY = (cam, x, y) ->
  [cam.x, cam.y, cam.z] = [x, y, geom.cross(x, y)]

viewer.addRotation = (view) ->
  {svg: svg, cam: cam} = view
  for s in ['contextmenu','selectstart','dragstart']
    svg.addEventListener(s, (e) -> e.preventDefault())
  svg.addEventListener('mousedown', (e) =>
    cam.last = [e.clientX, e.clientY])
  svg.addEventListener('mousemove', (e) =>
    viewer.rotateCam([e.clientX, e.clientY], view))
  svg.addEventListener('mouseup', (e) =>
    viewer.rotateCam([e.clientX, e.clientY], view); cam.last = null)

viewer.rotateCam = (p, view) ->
  cam = view.cam
  return if not cam.last?
  d = geom.sub(p, cam.last)
  return if not geom.mag(d) > 0
  u = geom.unit(geom.plus(geom.mul(cam.x, -d[1]), geom.mul(cam.y, -d[0])))
  [x, y] = (geom.rotate(cam[c], u, geom.mag(d) * 0.01) for c in ['x','y'])
  viewer.setCamXY(cam, x, y)
  cam.last = p
  viewer.update(view)

### VIEWER FUNCTIONS ###

DEFAULTS = {
  viewButtons: true, axisButtons: true, attrViewer: true
  examples: true, import: true, export: true}

viewer.addViewer = (div, fold = null, options = {}) ->
  view = {cam: viewer.initCam(), fold: fold, options: DEFAULTS}
  viewer.setAttrs(view.options, options)
  document.addEventListener('click', (e) =>
    if e.target.type is 'checkbox'
      if e.target.hasAttribute('checked')
        e.target.removeAttribute('checked')
      else
        e.target.setAttribute('checked', '')
      view.cam.show[e.target.value] = e.target.hasAttribute('checked')
      viewer.update view
    if e.target.type is 'button'
      switch e.target.value
        when 'x' then viewer.setCamXY(view.cam, [0,1,0], [0,0,1])
        when 'y' then viewer.setCamXY(view.cam, [0,0,1], [1,0,0])
        when 'z' then viewer.setCamXY(view.cam, [1,0,0], [0,1,0])
      viewer.update view
  )
  if view.options.viewButtons
    toggleDiv = viewer.appendHTML(div, 'div')
    toggleDiv.innerHtml = ''
    toggleDiv.innerHtml += 'Toggle: '
    for k, v of view.cam.show
      t = viewer.appendHTML(toggleDiv, 'input', {type: 'checkbox', value: k})
      t.setAttribute('checked', '') if v
      toggleDiv.innerHTML += k + ' '
  if view.options.axisButtons
    buttonDiv = viewer.appendHTML(div, 'div')
    buttonDiv.innerHTML += 'View: '
    for val, i in ['x', 'y', 'z']
      viewer.appendHTML(buttonDiv, 'input', {type: 'button', value: val})
  if view.options.examples or view.options.import
    inputDiv = viewer.appendHTML(div, 'div')
    if view.options.examples
      select = viewer.appendHTML(inputDiv, 'select')
      select.addEventListener('change', (e) =>
        viewer.importURL(select.value, view))
      viewer.appendHTML(select, 'option', {value: '../examples/simple.fold'})
        .innerHTML = 'Default'
      viewer.appendHTML(select, 'option', {value: '../examples/box.fold'})
        .innerHTML = 'Flexicube Unit'
    if view.options.import
      viewer.appendHTML(inputDiv, 'input', {type: 'file'})
        .addEventListener('change', (e) =>
          viewer.importFile(e.target.files[0], view))
  view.svg = viewer.appendSVG(div, 'svg', {xmlns: SVGNS})
  viewer.importURL(select.value, view)

viewer.faceAbove = (f1, f2, n) ->
  [p1, p2] = ((v.ps for v in f.vs) for f in [f1,f2])
  [dp, disjoint, np] = geom.sepNormal(p1, p2)
  return null if disjoint # projections do not overlap
  [v1,v2] = ((v.cs for v in f.vs) for f in [f1,f2])
  [dv,disjoint,nv] = geom.sepNormal(v1,v2)
  return 0 > geom.dot(nv, n) if (dv is 3) and disjoint # triangles 3D disjoint
  ord = f1.ord["#{f2.i}"]
  return 0 < geom.dot(f1.n, n) * ord if (dv is 2) and ord? # triangles 2D overlap
  return null

viewer.makeModel = (fold) ->
  m = {vs: null, fs: null, es: {}}
  m.vs = ({i: i, cs: cs} for cs, i in fold.vertices_coords)
  (m.vs[i].cs[2] = 0 for v, i in m.vs when v.cs.length is 2)
  m.fs = ({i: i, vs: (m.vs[v] for v in vs)} for vs, i in fold.faces_vertices)
  if fold.edges_vertices?
    for v, i in fold.edges_vertices
      [a,b] = if v[0] > v[1] then [v[1],v[0]] else [v[0],v[1]]
      m.es["e#{a}e#{b}"] = {
        v1: m.vs[a], v2: m.vs[b], as: fold.edges_assignment[i]}
  else
    for f, i in m.fs
      for v, j in f.vs
        w = f.vs[geom.next(j,f.vs.length)]
        [a,b] = if v.i > w.i then [w,v] else [v,w]
        m.es["e#{a.i}e#{b.i}"] = {v1: a, v2: b, as: 'B'}
  for f, i in m.fs
    m.fs[i].n = geom.triangleNormal((v.cs for v in f.vs)...)
    m.fs[i].c = geom.centroid(v.cs for v in f.vs)
    m.fs[i].es = {}
    m.fs[i].es = (for v, j in f.vs
      w = f.vs[geom.next(j, f.vs.length)]
      [a,b] = if v.i > w.i then [w,v] else [v,w]
      m.es["e#{a.i}e#{b.i}"])
    m.fs[i].ord = {}
  if fold.faceOrders?
    m.fs[l[0]].ord["#{l[1]}"] = l[2] for l in fold.faceOrders when l[2] isnt 0
  return m

viewer.orderFaces = (faces, direction) ->
  (f.children = [] for f in faces)
  for f1, i in faces
    for f2, j in faces when j > i
      f1_above = viewer.faceAbove(f1, f2, geom.mul(direction, -1))
      if f1_above?
        ([p,c] = if f1_above then [f1,f2] else [f2,f1])
        p.children = p.children.concat([c])
  geom.topologicalSort(faces)

viewer.draw = ({svg: svg, cam: cam, model: model}) ->
  svg.innerHTML = ''
  style = viewer.appendSVG(svg, 'style')
  for k, v of STYLES
    style.innerHTML += ".#{k}{#{v}}\n"
  min = ((v.cs[i] for v in model.vs).reduce(geom.min) for i in [0,1,2])
  max = ((v.cs[i] for v in model.vs).reduce(geom.max) for i in [0,1,2])
  cam.c = geom.mul(geom.plus(min, max), 0.5)
  cam.r = geom.mag(geom.sub(max, min)) / 2 * 1.05
  pc = viewer.proj(cam.c, cam)
  viewer.setAttrs(svg, {
    viewBox: "#{pc[0]-cam.r},#{pc[1]-cam.r},#{2*cam.r},#{2*cam.r}"})
  t = "translate(0,0.01)"
  for f, i in model.fs
    f.g = viewer.appendSVG(svg, 'g')
    f.path = viewer.appendSVG(f.g, 'path')
    f.text = viewer.appendSVG(f.g, 'text', {class: 'text', transform: t})
    f.text.innerHTML = "f#{f.i}"
    for e, j in f.es when not e.path?
      e.path = viewer.appendSVG(f.g, 'path')
    for v, j in f.vs when not v.path?
      v.g = viewer.appendSVG(f.g, 'g')
      v.path = viewer.appendSVG(v.g, 'circle', {class: 'vert'})
      v.text = viewer.appendSVG(v.g, 'text',
        {transform: 'translate(0, 0.01)', class: 'text'})
      v.text.innerHTML = "#{v.i}"
  g = viewer.appendSVG(svg,'g',{transform: 'translate(-0.9,-0.9)'})
  for c in ['x','y','z']
    viewer.appendSVG(g,'path', {id: "a#{c}", class: "a#{c} axis"})

viewer.update = ({model: model, cam: cam, svg: svg}) ->
  (model.vs[i].ps = viewer.proj(v.cs, cam) for v, i in model.vs)
  (model.fs[i].c2 = viewer.proj(f.c, cam)  for f, i in model.fs)
  viewer.orderFaces(model.fs, cam.z)
  show = {}
  for k, v of cam.show
    show[k] = if v then 'visible' else 'hidden'
  for f, i in model.fs when f.path?
    visibleSide = if geom.dot(f.n, cam.z) > 0 then 'top' else 'bot'
    viewer.setAttrs(f.text, {
      x: f.c2[0], y: f.c2[1], visibility: show['Face Text']})
    viewer.setAttrs(f.path, {
      d: viewer.makePath(v.ps for v in f.vs) + 'Z'
      visibility: show['Faces'], class: "face #{visibleSide}"})
    for e, j in f.es
      viewer.setAttrs(e.path, {
        d: viewer.makePath([e.v1.ps, e.v2.ps])
        visibility: show['Edges'], class: "edge #{e.as}"})
    for v, j in f.vs
      viewer.setAttrs(v.g, {visibility: show['Vertices']})
      viewer.setAttrs(v.path, {cx: v.ps[0], cy: v.ps[1]})
      viewer.setAttrs(v.text, {x: v.ps[1], y: v.ps[1]})
  for c, v of {x: [1,0,0], y: [0,1,0], z: [0,0,1]}
    end = geom.plus(geom.mul(v, 0.05), cam.c)
    viewer.setAttrs(document.getElementById("a#{c}"), {
      d: viewer.makePath(viewer.proj(p, cam) for p in [cam.c, end])})
