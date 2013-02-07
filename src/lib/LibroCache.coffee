LibroIpsum = require 'libroipsum'
fs         = require 'fs'
async      = require 'async'

module.exports = class LibroCache
    @defaults:
        keyLength: 6
        cachePhraseWords: 100
        cacheAmount: 5
        seeds: []
        rootDir: './'

    constructor: (options = {}, complete) ->
        @ipsums = {}
        @cached = {}

        # Set options
        @options = LibroCache.defaults
        @options[key] = val for key, val of options

        # Begin seed
        if @options.seeds.length
            async.series([
                (complete) => async.forEach @options.seeds, ((seed, next) => @addSource seed, next), complete
                (complete) => async.forEach @options.seeds, ((seed, next) => @cache seed, next), complete
            ], (err) => complete err, @)

    cache: (fileName, next = ->) ->
        @cached[fileName] = [] unless fileName of @cached
        while @cached[fileName].length < @options.cacheAmount
            @cached[fileName].push @getFresh(fileName)
        next null

    addSource: (fileName, next = ->) ->
        if fileName of @ipsums
            next null
        else
            fs.readFile @options.rootDir + fileName, 'utf-8', (err, fileText) =>
                @ipsums[fileName] = new LibroIpsum fileText
                next err

    getFresh: (fileName) ->
        @ipsums[fileName].generate(@options.cachePhraseWords, @options.keyLength)

    get: (fileName, numberOfWords = @cachePhraseWords, numberOfParagraphs = 1, complete) ->
        return complete new Error("Unable to generate text for missing source `#{fileName}`") unless fileName of @ipsums
        return complete new Error("Invalid number of words `#{numberOfWords}`") unless numberOfWords >= 0

        # Generate phrase
        phraseList = []
        for p in [1..numberOfParagraphs]
            phrase = ''
            for w in [0..numberOfWords] by @options.cachePhraseWords
                if @cached[fileName].length
                    # Pull from cache if available
                    phrase += @cached[fileName].shift()
                else
                    # Else, generate fresh
                    phrase += @getFresh fileName

            # Reduce phrase to numberOfWords words
            rCleanEnd = new RegExp("[\\\\#{LibroIpsum.clauseSeparators.join('\\\\')}\\s]*$")
            phraseList.push phrase.replace(rCleanEnd, '')
                .split(' ')
                .slice(0, numberOfWords)
                .join(' ') + '.'

        complete null, phraseList.join '\n\n'

        # Start refreshing cache
        @cache fileName
