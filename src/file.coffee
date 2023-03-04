fs = require 'fs'
path = require 'path'
convert = require './convert'
file = exports

file.extensionOf = (filename) ->
  parsed = path.parse filename
  if parsed.ext
    parsed.ext
  else if parsed.base[0] == '.'
    parsed.base
  else if ".#{filename}" of convert.extensions
    ".#{filename}"
  else
    null

file.toFile = (fold, output, converter = null) ->
  outFormat = file.extensionOf output
  unless outFormat
    console.warn "Could not detect extension of #{output}"
    return
  unless converter?
    converter = convert.getConverter '.fold', outFormat
    unless converter?
      console.warn "No converter from .fold to #{outFormat}"
      return
  result = converter fold
  if typeof result != 'string'
    result = convert.toJSON result
  fs.writeFileSync output, result, 'utf-8'

file.fileToFile = (input, output, options) ->
  inFormat = file.extensionOf input
  outFormat = file.extensionOf output
  unless inFormat
    console.warn "Could not detect extension of #{input}"
    return
  unless outFormat
    console.warn "Could not detect extension of #{output}"
    return
  converter = options.converter
  unless converter?
    converter = convert.getConverter inFormat, outFormat
    unless converter?
      console.warn "No converter from #{inFormat} to #{outFormat}"
      return
  if outFormat == output or outFormat == ".#{output}"
    ## just extension => concatenate
    output = path.parse input
    output.ext = outFormat
    output.base = output.name + output.ext
    output = path.format output
  if input == output
    console.warn "Attempt to convert #{input} to same filename"
  else
    console.log input, '->', output
    result = fs.readFileSync input, 'utf-8'
    if inFormat == '.fold' != outFormat # avoid double mogrification
      result = file.mogrify result, options
    result = converter result
    if outFormat == '.fold'
      result = file.mogrify result, options
    if typeof result != 'string'
      result = convert.toJSON result
    fs.writeFileSync output, result, 'utf-8'

file.mogrify = (data, options) ->
  return unless options.flatFold # or any options set
  fold = JSON.parse data
  fold.file_creator = "fold-convert"
  if options.flatFold
    fold.file_creator += " --flat-fold"
    error = convert.flatFoldedGeometry fold
    console.log " -- Flat folding error: #{error}"
    fold.vertices_flatUnfoldCoords = fold.vertices_coords
    fold.vertices_coords = fold.vertices_flatFoldCoords
    fold.frame_classes = fold.frame_classes.filter (x) -> x != 'creasePattern'
    .concat 'foldedForm'
    delete fold.vertices_flatFoldCoords
  convert.toJSON fold

file.main = (args = process.argv[2..]) ->
  filenames = []
  output = '.fold'  ## Default behavior: convert to .fold
  options =
    flatFold: false
  mode = null
  for arg in args
    switch mode
      when 'output'
        output = arg
        mode = null
      else
        switch arg
          when '-o', '--output'
            mode = 'output'
          when '--flat-fold'
            options.flatFold = true
          else
            filenames.push arg
  for filename in filenames
    file.fileToFile filename, output, options

file.main() if require.main == module
