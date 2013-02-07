app        = require('express')()
LibroCache = require './lib/LibroCache'
path       = require 'path'
async      = require 'async'
dive       = require 'dive'
settings   = require './settings'

seeds = []
bookSource = './sources/'
bookCache = null

async.series([
    (complete) ->
        console.log 'Seeding sources...'
        dive bookSource,
            (err, file) ->
                seeds.push path.relative(bookSource, file)
            , complete
    (complete) ->
        bookCache = new LibroCache {
            rootDir: bookSource
            seeds: seeds
            keyLength: settings.keyLength
            cachePhraseWords: settings.cachePhraseWords
            cacheAmount: settings.cacheAmount
        }, (err) -> complete err
], ->
    console.log 'Ready for connections!'

    app.get '/:category/:text.:contenttype', (req, res) ->
        text = req.params.text.replace /[^\w]/g, ''
        words = Math.min settings.maxWords, req.query.words or LibroCache.defaults.cachePhraseWords
        paragraphs = Math.min settings.maxParagraphs, req.query.paragraphs or 1

        bookCache.get "#{req.params.category}/#{text}.txt", words, paragraphs, (err, genText) ->
            genText = err.toString() if err

            switch req.params.contenttype
                when 'json'
                    contentType = 'application/json'
                    content = JSON.stringify({ text: genText })
                when 'xml'
                    contentType = 'application/xml'
                    content = "<text>#{genText}</text>"
                else
                    contentType = 'text/plain'
                    content = genText

            res.header 'Content-Type', contentType
            res.send content

    unless module.parent
        app.listen settings.port
        console.log "Listening on port #{settings.port}"
)
