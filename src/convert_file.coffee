`#!/usr/bin/node
`

fs = require 'fs'
path = require 'path'
convert = require './convert'
convertFile = exports

convertFile.file = (input, extension, converter) ->
  output = path.parse input
  output.ext = extension
  output.base = output.name + output.ext
  output = path.format output
  console.log input, '->', output
  if input == output
    console.warn "#{input} already has extension #{extension}"
  else
    result = converter(fs.readFileSync input, 'utf-8')
    if typeof result != 'string'
      result = JSON.stringify result, null, 1
    fs.writeFileSync output, result, 'utf-8'

convertFile.main = (args = process.argv[2..]) ->
  path = require 'path'
  for filename in args
    switch path.parse(filename).ext
      when '.fold'
        convert.file filename, '.fold.opx', convert.oripa.fold2oripa
      when '.opx'
        convert.file filename, '.fold', convert.oripa.oripa2fold

convertFile.main() if require.main == module
