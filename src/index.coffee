app        = require('express')()
LibroCache = require './lib/LibroCache'
path       = require 'path'
async      = require 'async'
dive       = require 'dive'
settings   = require './settings'
analytics  = require 'analytics-node'

analytics.init secret: require('./settings-secret').analyticsSecret

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
        category = req.params.category
        text = req.params.text.replace /[^\w]/g, ''
        contentType = req.params.contenttype
        words = Math.min settings.maxWords, req.query.words or LibroCache.defaults.cachePhraseWords
        paragraphs = Math.min settings.maxParagraphs, req.query.paragraphs or 1

        # Generate text
        bookCache.get "#{category}/#{text}.txt", words, paragraphs, (err, genText) ->
            genText = err.toString() if err

            switch contentType
                when 'json'
                    contentType = 'application/json'
                    content = JSON.stringify text: genText
                when 'jsonp'
                    contentType = 'application/javascript'
                    content = "#{req.query.callback}(#{JSON.stringify text:genText})"
                when 'xml'
                    contentType = 'application/xml'
                    content = "<text>#{genText}</text>"
                else
                    contentType = 'text/plain'
                    content = genText

            res.header 'Content-Type', contentType
            res.send content

        # Track event
        analytics.track
            userId: req.connection.remoteAddress
            event: 'Generated text'
            properties:
                category: category
                text: text
                words: words
                paragraphs: paragraphs
                contentType: contentType
            context:
                userAgent: req.headers['user-agent']
                ip: req.connection.remoteAddress

    unless module.parent
        listenPort = process.env.PORT or settings.port
        app.listen listenPort
        console.log "Listening on port #{listenPort}"
)
