(function() {
  var LibroCache, app, async, bookCache, bookSource, dive, path, seeds, settings;

  app = require('express')();

  LibroCache = require('./lib/LibroCache');

  path = require('path');

  async = require('async');

  dive = require('dive');

  settings = require('./settings');

  seeds = [];

  bookSource = './sources/';

  bookCache = null;

  async.series([
    function(complete) {
      console.log('Seeding sources...');
      return dive(bookSource, function(err, file) {
        return seeds.push(path.relative(bookSource, file));
      }, complete);
    }, function(complete) {
      return bookCache = new LibroCache({
        rootDir: bookSource,
        seeds: seeds
      }, function(err) {
        return complete(err);
      });
    }
  ], function() {
    console.log('Ready for connections!');
    app.get('/:category/:text.:contenttype', function(req, res) {
      var paragraphs, text, words;
      text = req.params.text.replace(/[^\w]/g, '');
      words = Math.min(settings.maxWords, req.query.words || LibroCache.defaults.cachePhraseWords);
      paragraphs = Math.min(settings.maxParagraphs, req.query.paragraphs || 1);
      return bookCache.get("" + req.params.category + "/" + text + ".txt", words, paragraphs, function(err, genText) {
        var content, contentType;
        if (err) {
          genText = err.toString();
        }
        switch (req.params.contenttype) {
          case 'json':
            contentType = 'application/json';
            content = JSON.stringify({
              text: genText
            });
            break;
          case 'xml':
            contentType = 'application/xml';
            content = "<text>" + genText + "</text>";
            break;
          default:
            contentType = 'text/plain';
            content = genText;
        }
        res.header('Content-Type', contentType);
        return res.send(content);
      });
    });
    if (!module.parent) {
      app.listen(settings.port);
      return console.log("Listening on port " + settings.port);
    }
  });

}).call(this);
