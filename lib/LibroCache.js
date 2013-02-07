(function() {
  var LibroCache, LibroIpsum, async, fs;

  LibroIpsum = require('libroipsum');

  fs = require('fs');

  async = require('async');

  module.exports = LibroCache = (function() {

    LibroCache.defaults = {
      keyLength: 6,
      cachePhraseWords: 100,
      cacheAmount: 5,
      seeds: [],
      rootDir: './'
    };

    function LibroCache(options, complete) {
      var key, val,
        _this = this;
      if (options == null) {
        options = {};
      }
      this.ipsums = {};
      this.cached = {};
      this.options = LibroCache.defaults;
      for (key in options) {
        val = options[key];
        this.options[key] = val;
      }
      if (this.options.seeds.length) {
        async.series([
          function(complete) {
            return async.forEach(_this.options.seeds, (function(seed, next) {
              return _this.addSource(seed, next);
            }), complete);
          }, function(complete) {
            return async.forEach(_this.options.seeds, (function(seed, next) {
              return _this.cache(seed, next);
            }), complete);
          }
        ], function(err) {
          return complete(err, _this);
        });
      }
    }

    LibroCache.prototype.cache = function(fileName, next) {
      if (next == null) {
        next = function() {};
      }
      if (!(fileName in this.cached)) {
        this.cached[fileName] = [];
      }
      while (this.cached[fileName].length < this.options.cacheAmount) {
        this.cached[fileName].push(this.getFresh(fileName));
      }
      return next(null);
    };

    LibroCache.prototype.addSource = function(fileName, next) {
      var _this = this;
      if (next == null) {
        next = function() {};
      }
      if (fileName in this.ipsums) {
        return next(null);
      } else {
        return fs.readFile(this.options.rootDir + fileName, 'utf-8', function(err, fileText) {
          _this.ipsums[fileName] = new LibroIpsum(fileText);
          return next(err);
        });
      }
    };

    LibroCache.prototype.getFresh = function(fileName) {
      return this.ipsums[fileName].generate(this.options.cachePhraseWords, this.options.keyLength);
    };

    LibroCache.prototype.get = function(fileName, numberOfWords, numberOfParagraphs, complete) {
      var p, phrase, phraseList, rCleanEnd, w, _i, _j, _ref;
      if (numberOfWords == null) {
        numberOfWords = this.cachePhraseWords;
      }
      if (numberOfParagraphs == null) {
        numberOfParagraphs = 1;
      }
      if (!(fileName in this.ipsums)) {
        return complete(new Error("Unable to generate text for missing source `" + fileName + "`"));
      }
      if (!(numberOfWords >= 0)) {
        return complete(new Error("Invalid number of words `" + numberOfWords + "`"));
      }
      phraseList = [];
      for (p = _i = 1; 1 <= numberOfParagraphs ? _i <= numberOfParagraphs : _i >= numberOfParagraphs; p = 1 <= numberOfParagraphs ? ++_i : --_i) {
        phrase = '';
        for (w = _j = 0, _ref = this.options.cachePhraseWords; 0 <= numberOfWords ? _j <= numberOfWords : _j >= numberOfWords; w = _j += _ref) {
          if (this.cached[fileName].length) {
            phrase += this.cached[fileName].shift();
          } else {
            phrase += this.getFresh(fileName);
          }
        }
        rCleanEnd = new RegExp("[\\\\" + (LibroIpsum.clauseSeparators.join('\\\\')) + "\\s]*$");
        phraseList.push(phrase.replace(rCleanEnd, '').split(' ').slice(0, numberOfWords).join(' ') + '.');
      }
      complete(null, phraseList.join('\n\n'));
      return this.cache(fileName);
    };

    return LibroCache;

  })();

}).call(this);
