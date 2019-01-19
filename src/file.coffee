#!/usr/bin/coffee --bare
`#!/usr/bin/env node
`

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

file.fileToFile = (input, output, converter = null) ->
  inFormat = file.extensionOf input
  outFormat = file.extensionOf output
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
      result = convert.toJSON result
    fs.writeFileSync output, result, 'utf-8'

file.main = (args = process.argv[2..]) ->
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
    file.fileToFile filename, output

file.main() if require.main == module
