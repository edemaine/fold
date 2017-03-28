#!/usr/bin/coffee --bare
`#!/usr/bin/node
`

fs = require 'fs'
path = require 'path'
convert = require './convert'
convertFile = exports

convertFile.extensionOf = (filename) ->
  parsed = path.parse filename
  if parsed.ext
    parsed.ext
  else if parsed.base[0] == '.'
    parsed.base
  else if ".#{filename}" of convert.extensions
    ".#{filename}"
  else
    null

convertFile.toFile = (fold, output, converter = null) ->
  outFormat = convertFile.extensionOf output
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
    result = JSON.stringify result, null, 1
  fs.writeFileSync output, result, 'utf-8'

convertFile.fileToFile = (input, output, converter = null) ->
  inFormat = convertFile.extensionOf input
  outFormat = convertFile.extensionOf output
  unless inFormat
    console.warn "Could not detect extension of #{input}"
    return
  unless outFormat
    console.warn "Could not detect extension of #{output}"
    return
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
  if inFormat == outFormat or input == output
    console.warn "Attempt to convert #{input} to same extension"
  else
    console.log input, '->', output
    result = converter fs.readFileSync input, 'utf-8'
    if typeof result != 'string'
      result = JSON.stringify result, null, 1
    fs.writeFileSync output, result, 'utf-8'

convertFile.main = (args = process.argv[2..]) ->
  filenames = []
  output = '.fold'  ## Default behavior: convert to .fold
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
          else
            filenames.push arg
  for filename in filenames
    convertFile.fileToFile filename, output

convertFile.main() if require.main == module
