##TODO: match spec (no frame_designer, no frame_reference, fix cw -> ccw)
##TODO: oripa folded state format

DOMParser = require('@xmldom/xmldom').DOMParser unless DOMParser?
#XMLSerializer = require('@xmldom/xmldom').XMLSerializer unless XMLSerializer?
#DOMImplementation = require('@xmldom/xmldom').DOMImplementation unless DOMImplementation?
convert = require './convert'
filter = require './filter'
oripa = exports

## Based on src/oripa/geom/OriLine.java
oripa.type2fold =
  0: 'F'     ## TYPE_NONE = flat
  1: 'B'     ## TYPE_CUT = boundary 
  2: 'M'     ## TYPE_RIDGE = mountain
  3: 'V'     ## TYPE_VALLEY = valley
oripa.fold2type = {}
for x, y of oripa.type2fold
  oripa.fold2type[y] = x
oripa.fold2type_default = 0

oripa.prop_xml2fold =
  'editorName': 'frame_author'
  'originalAuthorName': 'frame_designer'
  'reference': 'frame_reference'
  'title': 'frame_title'
  'memo': 'frame_description'
  'paperSize': null
  'mainVersion': null
  'subVersion': null
#oripa.prop_fold2xml = {}
#for x, y of oripa.prop_xml2fold
#  oripa.prop_fold2xml[y] = x if y?

oripa.POINT_EPS = 1.0
oripa.toFold = (oripaStr) ->
  fold =
    vertices_coords: []
    edges_vertices: []
    edges_assignment: []
    file_creator: 'oripa2fold'
  vertex = (x,y) ->
    v = fold.vertices_coords.length
    fold.vertices_coords.push [
      parseFloat x
      parseFloat y
    ]
    v

  nodeSpec = (node, type, key, value) ->
    if type? and node.tagName != type
      console.warn "ORIPA file has #{node.tagName} where #{type} was expected"
      null
    else if key? and (not node.hasAttribute(key) or (value? and node.getAttribute(key) != value))
      console.warn "ORIPA file has #{node.tagName} with #{key} = #{node.getAttribute key} where #{value} was expected"
      null
    else
      node
  children = (node) ->
    if node
      child for child in node.childNodes when child.nodeType == 1  ## element
    else
      []
  oneChildSpec = (node, type, key, value) ->
    sub = children node
    if sub.length != 1
      console.warn "ORIPA file has #{node.tagName} with #{node.childNodes.length} children, not 1"
      null
    else
      nodeSpec sub[0], type, key, value
  oneChildText = (node) ->
    if node.childNodes.length > 1
      console.warn "ORIPA file has #{node.tagName} with #{node.childNodes.length} children, not 0 or 1"
      null
    else if node.childNodes.length == 0
      ''
    else
      child = node.childNodes[0]
      if child.nodeType != 3
        console.warn "ORIPA file has nodeType #{child.nodeType} where 3 (text) was expected"
      else
        child.data

  xml = new DOMParser().parseFromString oripaStr, 'text/xml'
  for top in children xml.documentElement
    if nodeSpec top, 'object', 'class', 'oripa.DataSet'
      for property in children top
        if property.getAttribute('property') == 'lines'
          lines = oneChildSpec property, 'array', 'class', 'oripa.OriLineProxy'
          for line in children lines
            if nodeSpec line, 'void', 'index'
              for object in children line
                if nodeSpec object, 'object', 'class', 'oripa.OriLineProxy'
                  ## Java doesn't encode the default value, 0
                  x0 = x1 = y0 = y1 = type = 0
                  for subproperty in children object
                    if nodeSpec subproperty, 'void', 'property'
                      switch subproperty.getAttribute 'property'
                        when 'x0'
                          x0 = oneChildText oneChildSpec(subproperty, 'double')
                        when 'x1'
                          x1 = oneChildText oneChildSpec(subproperty, 'double')
                        when 'y0'
                          y0 = oneChildText oneChildSpec(subproperty, 'double')
                        when 'y1'
                          y1 = oneChildText oneChildSpec(subproperty, 'double')
                        when 'type'
                          type = oneChildText oneChildSpec(subproperty, 'int')
                  if x0? and x1? and y0? and y1?
                    fold.edges_vertices.push [
                      vertex x0, y0
                      vertex x1, y1
                    ]
                    type = parseInt type if type?
                    fold.edges_assignment.push oripa.type2fold[type]
                  else
                    console.warn "ORIPA line has missing data: #{x0} #{x1} #{y0} #{y1} #{type}"
        else if property.getAttribute('property') of oripa.prop_xml2fold
          prop = oripa.prop_xml2fold[property.getAttribute 'property']
          if prop?
            fold[prop] = oneChildText oneChildSpec(property, 'string')
        else
          console.warn "Ignoring #{property.tagName} #{top.getAttribute 'property'} in ORIPA file"

  ## src/oripa/Doc.java uses absolute distance POINT_EPS = 1.0 to detect
  ## points being the same.
  filter.collapseNearbyVertices fold, oripa.POINT_EPS
  filter.subdivideCrossingEdges_vertices fold, oripa.POINT_EPS
  ## In particular, convert.removeLoopEdges fold
  convert.edges_vertices_to_faces_vertices fold
  fold

oripa.fromFold = (fold) ->
  if typeof fold == 'string'
    fold = JSON.parse fold
  s = """
<?xml version="1.0" encoding="UTF-8"?> 
<java version="1.5.0_05" class="java.beans.XMLDecoder"> 
 <object class="oripa.DataSet"> 
  <void property="mainVersion"> 
   <int>1</int> 
  </void> 
  <void property="subVersion"> 
   <int>1</int> 
  </void> 
  <void property="paperSize"> 
   <double>400.0</double> 
  </void> 

"""
  for xp, fp of oripa.prop_xml2fold
    #if fp of fold
    s += """
.
  <void property="#{xp}"> 
   <string>#{fold[fp] or ''}</string> 
  </void> 

"""[2..]
  z = 0
  lines =
    for edge, ei in fold.edges_vertices
      vs = for vertex in edge
        for coord in fold.vertices_coords[vertex][2..]
          if coord != 0
            z += 1
        fold.vertices_coords[vertex]
      x0: vs[0][0]
      y0: vs[0][1]
      x1: vs[1][0]
      y1: vs[1][1]
      type: oripa.fold2type[fold.edges_assignment[ei]] or oripa.fold2type_default
  s += """
.
  <void property="lines"> 
   <array class="oripa.OriLineProxy" length="#{lines.length}"> 

"""[2..]
  for line, i in lines
    s += """
.
    <void index="#{i}"> 
     <object class="oripa.OriLineProxy"> 
      <void property="type"> 
       <int>#{line.type}</int> 
      </void> 
      <void property="x0"> 
       <double>#{line.x0}</double> 
      </void> 
      <void property="x1"> 
       <double>#{line.x1}</double> 
      </void> 
      <void property="y0"> 
       <double>#{line.y0}</double> 
      </void> 
      <void property="y1"> 
       <double>#{line.y1}</double> 
      </void> 
     </object> 
    </void> 

"""[2..]
  s += """
.
   </array> 
  </void> 
 </object> 
</java> 

"""[2..]
  s

convert.setConverter '.fold', '.opx', oripa.fromFold
convert.setConverter '.opx', '.fold', oripa.toFold
