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
  M: "stroke: red;", U: "stroke: white;", F: "stroke: gray;"
  ax: "stroke: blue;", ay: "stroke: red;", az: "stroke: green;"
}

### UTILITIES ###

viewer.setAttrs = (el, attrs) ->
  (el.setAttribute(k, v) for k, v of attrs); el

viewer.appendHTML = (el, tag, attrs) ->
  el.appendChild(viewer.setAttrs(document.createElement(tag), attrs))

SVGNS = 'http://www.w3.org/2000/svg'
viewer.appendSVG = (el, tag, attrs) ->
  el.appendChild(viewer.setAttrs(document.createElementNS(SVGNS, tag), attrs))

viewer.makePath = (coords) ->
  (for c, i in coords
    "#{if (i is 0) then 'M' else 'L'} #{c[0]} #{c[1]} "
  ).reduce geom.sum

### INTERFACE ###

viewer.processInput = (input, view) ->
  if typeof input == 'string'
    view.fold = JSON.parse(input)
  else
    view.fold = input
  view.model = viewer.makeModel(view.fold)
  viewer.addRotation(view)
  viewer.draw(view)
  viewer.update(view)
  if view.opts.properties
    view.properties.innerHTML = ''
    for k of view.fold when view.opts.properties
      viewer.appendHTML(view.properties, 'option', {value: k})
        .innerHTML = k
    viewer.updateProperties(view)

viewer.updateProperties = (view) ->
  v = view.fold[view.properties.value]
  s = if v.length? then "#{v.length} elements: " else ''
  view.data.innerHTML = s + JSON.stringify(v)

viewer.importURL = (url, view) ->
  xhr = new XMLHttpRequest()
  xhr.onload = (e) => viewer.processInput(e.target.responseText, view)
  xhr.open('GET', url); xhr.send()

viewer.importFile = (file, view) ->
  file_reader = new FileReader()
  file_reader.onload = (e) => viewer.processInput(e.target.result, view)
  file_reader.readAsText(file)

DEFAULTS = {
  viewButtons: true, axisButtons: true, attrViewer: true
  examples: false, import: true, export: true, properties: true}

viewer.addViewer = (div, opts = {}) ->
  view = {cam: viewer.initCam(), opts: DEFAULTS}
  view.opts[k] = v for k, v of opts
  if view.opts.viewButtons
    toggleDiv = viewer.appendHTML(div, 'div')
    toggleDiv.innerHtml = ''
    toggleDiv.innerHtml += 'Toggle: '
    for k, v of view.cam.show
      t = viewer.appendHTML(toggleDiv, 'input', {type: 'checkbox', value: k})
      t.setAttribute('checked', '') if v
      toggleDiv.innerHTML += k + ' '
  if view.opts.axisButtons
    buttonDiv = viewer.appendHTML(div, 'div')
    buttonDiv.innerHTML += 'View: '
    for val, i in ['x', 'y', 'z']
      viewer.appendHTML(buttonDiv, 'input', {type: 'button', value: val})
  if view.opts.properties
    buttonDiv.innerHTML += ' Property:'
    view.properties = viewer.appendHTML(buttonDiv, 'select')
    view.data = viewer.appendHTML(buttonDiv, 'div', {
      style: 'width: 300; padding: 10px; overflow: auto; \
        border: 1px solid black; display: inline-block; white-space: nowrap;'})
  if view.opts.examples or view.opts.import
    inputDiv = viewer.appendHTML(div, 'div')
    if view.opts.examples
      inputDiv.innerHTML = 'Example: '
      select = viewer.appendHTML(inputDiv, 'select')
      for title, url of view.opts.examples
        viewer.appendHTML(select, 'option', {value: url}).innerHTML = title
      viewer.importURL(select.value, view)
    if view.opts.import
      inputDiv.innerHTML += ' Import: '
      viewer.appendHTML(inputDiv, 'input', {type: 'file'})
  div.onclick = (e) =>
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
  div.onchange = (e) =>
    if e.target.type is 'file'
      viewer.importFile(e.target.files[0], view)
    if e.target.type is 'select-one'
      if e.target is view.properties
        viewer.updateProperties(view)
      else
        viewer.importURL(e.target.value, view)
  view.svg = viewer.appendSVG(div, 'svg', {xmlns: SVGNS, width: 600})
  view

### CAMERA ###

viewer.initCam = () -> {
  c: [0,0,0], x: [1,0,0], y: [0,1,0], z: [0,0,1], r: 1, last: null
  show: {'Faces': true, 'Edges': true, 'Vertices': false, 'Face Text': false}}

viewer.proj = (p, cam) ->
  q = geom.mul(geom.sub(p, cam.c), 1/cam.r)
  [geom.dot(q, cam.x), -geom.dot(q, cam.y), 0]

viewer.setCamXY = (cam, x, y) ->
  [cam.x, cam.y, cam.z] = [x, y, geom.cross(x, y)]

viewer.addRotation = (view) ->
  {svg: svg, cam: cam} = view
  for s in ['contextmenu','selectstart','dragstart']
    svg["on#{s}"] = (e) -> e.preventDefault()
  svg.onmousedown = (e) => cam.last = [e.clientX, e.clientY]
  svg.onmousemove = (e) => viewer.rotateCam([e.clientX, e.clientY], view)
  svg.onmouseup = (e) =>
    viewer.rotateCam([e.clientX, e.clientY], view); cam.last = null

viewer.rotateCam = (p, view) ->
  cam = view.cam
  return if not cam.last?
  d = geom.sub(p, cam.last)
  return if not geom.mag(d) > 0
  u = geom.unit(geom.plus(geom.mul(cam.x, -d[1]), geom.mul(cam.y, -d[0])))
  [x, y] = (geom.rotate(cam[e], u, geom.mag(d) * 0.01) for e in ['x','y'])
  viewer.setCamXY(cam, x, y)
  cam.last = p
  viewer.update(view)

### RENDERING ###

viewer.makeModel = (fold) ->
  m = {vs: null, fs: null, es: {}}
  m.vs = ({i: i, cs: cs} for cs, i in fold.vertices_coords)
  (m.vs[i].cs[2] = 0 for v, i in m.vs when v.cs.length is 2)
  m.fs = ({i: i, vs: (m.vs[v] for v in vs)} for vs, i in fold.faces_vertices)
  if fold.edges_vertices?
    for v, i in fold.edges_vertices
      [a,b] = if v[0] > v[1] then [v[1],v[0]] else [v[0],v[1]]
      as = if fold.edges_assignment?[i]? then fold.edges_assignment[i] else 'U'
      m.es["e#{a}e#{b}"] = {
        v1: m.vs[a], v2: m.vs[b], as: as}
  else
    for f, i in m.fs
      for v, j in f.vs
        w = f.vs[geom.next(j,f.vs.length)]
        [a,b] = if v.i > w.i then [w,v] else [v,w]
        m.es["e#{a.i}e#{b.i}"] = {v1: a, v2: b, as: 'U'}
  for f, i in m.fs
    m.fs[i].n = geom.polygonNormal(v.cs for v in f.vs)
    m.fs[i].c = geom.centroid(v.cs for v in f.vs)
    m.fs[i].es = {}
    m.fs[i].es = (for v, j in f.vs
      w = f.vs[geom.next(j, f.vs.length)]
      [a,b] = if v.i > w.i then [w,v] else [v,w]
      edge = m.es["e#{a.i}e#{b.i}"]
      unless edge?
        edge = {v1: a, v2: b, as: 'U'}
      edge)
    m.fs[i].ord = {}
  if fold.faceOrders?
    for [f1, f2, o] in fold.faceOrders when o isnt 0
      if geom.parallel(m.fs[f1].n, m.fs[f2].n)
        normRel = if geom.dot(m.fs[f1].n, m.fs[f2].n) > 0 then 1 else -1
        if m.fs[f1].ord["f#{f2}"]?
          console.log "Warning: duplicate ordering input information for \
            faces #{f1} and #{f2}. Using first found in the faceOrder list."
          if m.fs[f1].ord["f#{f2}"] != o
            console.log "Error: duplicate ordering [#{f1},#{f2},#{o}] \
              is inconsistent with a previous entry."
        else
          m.fs[f1].ord["f#{f2}"] = o
          m.fs[f2].ord["f#{f1}"] = -o * normRel
      else
        console.log "Warning: order for non-parallel faces [#{f1},#{f2}]"
  return m

viewer.faceAbove = (f1, f2, n) ->
  [p1, p2] = ((v.ps for v in f.vs) for f in [f1,f2])
  sepDir = geom.separatingDirection2D(p1, p2, [0,0,1])
  if sepDir? # projections do not overlap
    return null
  [v1,v2] = ((v.cs for v in f.vs) for f in [f1,f2])
  basis = geom.basis(v1.concat(v2))
  if basis.length is 3
    dir = geom.separatingDirection3D(v1, v2)
    if dir?
      return 0 > geom.dot(n, dir) # faces are separable in 3D
    else
      console.log "Warning: faces #{f1.i} and #{f2.i} properly intersect. 
        Ordering is unresolved."
  if basis.length is 2
    ord = f1.ord["f#{f2.i}"]
    if ord?
      return 0 > geom.dot(f2.n, n) * ord # faces coplanar and have order
  return null

viewer.orderFaces = (view) ->
  faces = view.model.fs
  direction = geom.mul(view.cam.z, -1)
  (f.children = [] for f in faces)
  for f1, i in faces
    for f2, j in faces when i < j
      f1_above = viewer.faceAbove(f1, f2, direction)
      if f1_above?
        [p,c] = if f1_above then [f1,f2] else [f2,f1]
        p.children = p.children.concat([c])
  view.model.fs = geom.topologicalSort(faces)
  f.g.parentNode.removeChild(f.g) for f in view.model.fs
  view.svg.appendChild(f.g) for f in view.model.fs

viewer.draw = ({svg: svg, cam: cam, model: model}) ->
  svg.innerHTML = ''
  style = viewer.appendSVG(svg, 'style')
  for k, v of STYLES
    style.innerHTML += ".#{k}{#{v}}\n"
  min = ((v.cs[i] for v in model.vs).reduce(geom.min) for i in [0,1,2])
  max = ((v.cs[i] for v in model.vs).reduce(geom.max) for i in [0,1,2])
  cam.c = geom.mul(geom.plus(min, max), 0.5)
  cam.r = geom.mag(geom.sub(max, min)) / 2 * 1.05
  c = viewer.proj(cam.c, cam)
  viewer.setAttrs(svg, {viewBox: "-1,-1,2,2"})
  t = "translate(0,0.01)"
  for f, i in model.fs
    f.g = viewer.appendSVG(svg, 'g')
    f.path = viewer.appendSVG(f.g, 'path')
    f.text = viewer.appendSVG(f.g, 'text', {class: 'text', transform: t})
    f.text.innerHTML = "f#{f.i}"
    f.eg = []
    for e, j in f.es
      f.eg[j] = viewer.appendSVG(f.g, 'path')
    f.vg = []
    for v, j in f.vs
      f.vg[j] = viewer.appendSVG(f.g, 'g')
      f.vg[j].path = viewer.appendSVG(f.vg[j], 'circle', {class: 'vert'})
      f.vg[j].text = viewer.appendSVG(f.vg[j], 'text',
        {transform: 'translate(0, 0.01)', class: 'text'})
      f.vg[j].text.innerHTML = "#{v.i}"
  cam.axis = viewer.appendSVG(svg,'g',{transform: 'translate(-0.9,-0.9)'})
  for c in ['x','y','z']
    cam.axis[c] = viewer.appendSVG(cam.axis,'path', {
      id: "a#{c}", class: "a#{c} axis"})

viewer.update = (view) ->
  {model: model, cam: cam, svg: svg} = view
  (model.vs[i].ps = viewer.proj(v.cs, cam) for v, i in model.vs)
  (model.fs[i].c2 = viewer.proj(f.c, cam)  for f, i in model.fs)
  viewer.orderFaces(view)
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
      viewer.setAttrs(f.eg[j], {
        d: viewer.makePath([e.v1.ps, e.v2.ps])
        visibility: show['Edges'], class: "edge #{e.as}"})
    for v, j in f.vs
      viewer.setAttrs(f.vg[j], {visibility: show['Vertices']})
      viewer.setAttrs(f.vg[j].path, {cx: v.ps[0], cy: v.ps[1]})
      viewer.setAttrs(f.vg[j].text, {x: v.ps[0], y: v.ps[1]})
  for c, v of {x: [1,0,0], y: [0,1,0], z: [0,0,1]}
    end = geom.plus(geom.mul(v, 0.05 * cam.r), cam.c)
    viewer.setAttrs(cam.axis[c], {
      d: viewer.makePath(viewer.proj(p, cam) for p in [cam.c, end])})

