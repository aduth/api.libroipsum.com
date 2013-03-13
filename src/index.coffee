app          = require('express')()
LibroCache   = require './lib/LibroCache'
SourceHelper = require './lib/SourceHelper'
settings     = require './settings'
analytics    = require 'analytics-node'

analytics.init secret: require('./settings-secret').analyticsSecret

bookSource = './sources/'
sourceHelper = new SourceHelper bookSource

console.log 'Seeding sources...'
sourceHelper.getSources (err, sources) ->
    bookCache = new LibroCache {
        rootDir: bookSource
        seeds: Object.keys(sources)
        keyLength: settings.keyLength
        cachePhraseWords: settings.cachePhraseWords
        cacheAmount: settings.cacheAmount
    }, (err) -> prepareRoutes(sources, bookCache)

prepareRoutes = (sources, bookCache) ->
    console.log 'Ready for connections!'

    app.get '/sources.:contenttype', (req, res) ->
        contentType = req.params.contenttype

        switch contentType
            when 'json'
                contentType = 'application/json'
                content = JSON.stringify sources
            when 'jsonp'
                contentType = 'application/javascript'
                content = "#{req.query.callback}(#{JSON.stringify sources})"
            when 'xml'
                contentType = 'application/xml'
                content = '<sources>'
                for path, src of sources
                    content += "<source path=\"#{path}\" author=\"#{src.author}\" category=\"#{src.category}\">#{src.name}</source>"
                content += '</sources>'
            else
                contentType = 'text/plain'
                content = ''
                content += "#{path}," for path in Object.keys(sources)
                content = content.replace /,$/, ''

        res.header 'Content-Type', contentType
        res.send content

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
