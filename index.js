(function() {
  var LibroCache, SourceHelper, analytics, app, bookSource, prepareRoutes, settings, sourceHelper;

  app = require('express')();

  LibroCache = require('./lib/LibroCache');

  SourceHelper = require('./lib/SourceHelper');

  settings = require('./settings');

  analytics = require('analytics-node');

  analytics.init({
    secret: require('./settings-secret').analyticsSecret
  });

  bookSource = './sources/';

  sourceHelper = new SourceHelper(bookSource);

  console.log('Seeding sources...');

  sourceHelper.getSources(function(err, sources) {
    var bookCache;
    return bookCache = new LibroCache({
      rootDir: bookSource,
      seeds: Object.keys(sources),
      keyLength: settings.keyLength,
      cachePhraseWords: settings.cachePhraseWords,
      cacheAmount: settings.cacheAmount
    }, function(err) {
      return prepareRoutes(sources, bookCache);
    });
  });

  prepareRoutes = function(sources, bookCache) {
    var listenPort;
    console.log('Ready for connections!');
    app.get('/', function(req, res) {
      return res.redirect('/sources.json');
    });
    app.get('/sources.:contenttype', function(req, res) {
      var content, contentType, path, src, _i, _len, _ref;
      contentType = req.params.contenttype;
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
          for (path in sources) {
            src = sources[path];
            content += "<source path=\"" + path + "\" author=\"" + src.author + "\" category=\"" + src.category + "\">" + src.name + "</source>";
          }
          content += '</sources>';
          break;
        default:
          contentType = 'text/plain';
          content = '';
          _ref = Object.keys(sources);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            path = _ref[_i];
            content += "" + path + ",";
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
  };

}).call(this);
