(function() {
  var SourceHelper, dive, fs, path;

  dive = require('dive');

  path = require('path');

  fs = require('fs');

  module.exports = SourceHelper = (function() {

    function SourceHelper(basePath) {
      this.basePath = basePath;
    }

    SourceHelper.prototype.getSources = function(complete) {
      var _this = this;
      if (complete == null) {
        complete = function() {};
      }
      if (this.sources != null) {
        complete(null, this.sources);
      }
      this.sources = {};
      try {
        return dive(this.basePath, function(err, file) {
          var fileBase, fileContents, fileDir, fileExt, fileRel;
          fileExt = path.extname(file);
          if (fileExt === '.json') {
            fileRel = path.relative(_this.basePath, file);
            fileDir = path.dirname(fileRel);
            fileBase = path.basename(fileRel, fileExt);
            fileContents = fs.readFileSync(file, 'utf-8');
            return _this.sources["" + fileDir + "/" + fileBase + ".txt"] = JSON.parse(fileContents);
          }
        }, function() {
          return complete(null, _this.sources);
        });
      } catch (err) {
        return complete(err, this.sources);
      }
    };

    return SourceHelper;

  })();

}).call(this);
