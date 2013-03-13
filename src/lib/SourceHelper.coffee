dive = require 'dive'
path = require 'path'
fs   = require 'fs'

module.exports = class SourceHelper
    constructor: (@basePath) ->

    getSources: (complete) ->
        complete null, @sources if @sources?

        @sources = { }

        try
            dive @basePath,
                (err, file) =>
                    fileExt = path.extname file
                    if fileExt is '.json'
                        fileRel = path.relative @basePath, file
                        fileDir = path.dirname fileRel
                        fileBase = path.basename fileRel, fileExt
                        fileContents = fs.readFileSync file, 'utf-8'

                        @sources["#{fileDir}/#{fileBase}.txt"] = JSON.parse(fileContents)
                , => complete null, @sources
        catch err
            complete err, @sources
