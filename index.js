(function() {
  var LibroCache, analytics, app, async, bookCache, bookSource, dive, path, seeds, settings;

  app = require('express')();

  LibroCache = require('./lib/LibroCache');

  path = require('path');

  async = require('async');

  dive = require('dive');

  settings = require('./settings');

  analytics = require('analytics-node');

  analytics.init({
    secret: require('./settings-secret').analyticsSecret
  });

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
        seeds: seeds,
        keyLength: settings.keyLength,
        cachePhraseWords: settings.cachePhraseWords,
        cacheAmount: settings.cacheAmount
      }, function(err) {
        return complete(err);
      });
    }
  ], function() {
    var listenPort;
    console.log('Ready for connections!');
    app.get('/sources.:contenttype', function(req, res) {
      var content, contentType, source, sources, _i, _j, _len, _len1;
      contentType = req.params.contenttype;
      sources = Object.keys(bookCache.ipsums);
      switch (contentType) {
        case 'json':
          contentType = 'application/json';
          content = JSON.stringify(sources);
          break;
        case 'jsonp':
          contentType = 'application/javascript';
          content = "" + req.query.callback + "(" + (JSON.stringify(sources)) + ")";
          break;
        case 'xml':
          contentType = 'application/xml';
          content = '<sources>';
          for (_i = 0, _len = sources.length; _i < _len; _i++) {
            source = sources[_i];
            content += "<source>" + source + "</source>";
          }
          content += '</sources>';
          break;
        default:
          contentType = 'text/plain';
          content = '';
          for (_j = 0, _len1 = sources.length; _j < _len1; _j++) {
            source = sources[_j];
            content += "" + source + ",";
          }
          content = content.replace(/,$/, '');
      }
      res.header('Content-Type', contentType);
      return res.send(content);
    });
    app.get('/:category/:text.:contenttype', function(req, res) {
      var category, contentType, paragraphs, text, words;
      category = req.params.category;
      text = req.params.text.replace(/[^\w]/g, '');
      contentType = req.params.contenttype;
      words = Math.min(settings.maxWords, req.query.words || LibroCache.defaults.cachePhraseWords);
      paragraphs = Math.min(settings.maxParagraphs, req.query.paragraphs || 1);
      bookCache.get("" + category + "/" + text + ".txt", words, paragraphs, function(err, genText) {
        var content;
        if (err) {
          genText = err.toString();
        }
        switch (contentType) {
          case 'json':
            contentType = 'application/json';
            content = JSON.stringify({
              text: genText
            });
            break;
          case 'jsonp':
            contentType = 'application/javascript';
            content = "" + req.query.callback + "(" + (JSON.stringify({
              text: genText
            })) + ")";
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
      return analytics.track({
        userId: req.connection.remoteAddress,
        event: 'Generated text',
        properties: {
          category: category,
          text: text,
          words: words,
          paragraphs: paragraphs,
          contentType: contentType
        },
        context: {
          userAgent: req.headers['user-agent'],
          ip: req.connection.remoteAddress
        }
      });
    });
    if (!module.parent) {
      listenPort = process.env.PORT || settings.port;
      app.listen(listenPort);
      return console.log("Listening on port " + listenPort);
    }
  });

}).call(this);
