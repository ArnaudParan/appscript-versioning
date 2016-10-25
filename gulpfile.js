var gulp = require('gulp');
var request = require('request');
var fs = require('fs');
var glob = require('glob');
var _ = require('lodash');

gulp.task('deploy', function() {
  readConfig(function(configs) {
    getAppscriptList(configs, function(appscriptList) {
      /* When we have all the scripts metadata, and the files, we replace the contents
       * and push them to the drive
       */
      glob('src/*.gs', function(err, files) {
        var uploadedFiles = {files: []};
        for (var scriptId = 0; scriptId < appscriptList.files.length; scriptId++) {
          var script = appscriptList.files[scriptId];
          var scriptName = 'src/' + script.name + '.gs';

          // if the file exists in src, we add the modifications in what we're going to push
          if (files.indexOf(scriptName) !== -1) {
            //TODO update data
            var metadata = _.cloneDeep(script);
            var file = fs.readFileSync(scriptName, 'utf8')
            metadata.source = file;
            uploadedFiles.files.push(metadata);
          }
        }
        pushUpdates(uploadedFiles, configs);
      });
    });
  });
});

/* Reads the config.json file and parses the result as a json dict, then
 * calls callback with that json dict
 */
function readConfig(callback) {
  fs.readFile('config.json', 'utf8', function(error, file) {
    if (error) {
      if (error.code === 'ENOENT') {
        throw 'Error, file "config.json" does not exist';
      }
      else {
        throw error;
      }
    }
    var configs = JSON.parse(file);
    callback(configs);
  });
}

/* sends the file updates to google drive
 */
function pushUpdates(updates, configs) {
  var options = {
    url: 'https://www.googleapis.com/upload/drive/v2/files/' + configs.appscriptID,
    headers: {
      'Authorization': 'Bearer ' + configs.accessToken,
      'Content-Type': 'application/vnd.google-apps.script+json'
    },
    method: 'PUT',
    body: JSON.stringify(updates)
  };
  request(options, function(error, response, body) {
    if (error) {
      throw error;
    }
    else if (response.statusCode !== 200) {
      throw 'Wrong response code ' + response.statusCode + '\n' + body;
    }
  });
}

function getAppscriptList(configs, callback) {
  var options = {
    url: 'https://script.google.com/feeds/download/export?id=' + configs.appscriptID + '&format=json',
    headers: {
      'Authorization': 'Bearer ' + configs.accessToken
    }
  };
  request(options, function(error, response, body) {
    if (error) {
      throw error;
    }
    else if (response.statusCode !== 200) {
      throw 'Wrong response code ' + response.statusCode + '\n' + body;
    }
    else if (!error && response.statusCode == 200) {
      var appscriptList = JSON.parse(body);
      if (callback) {
        callback(appscriptList);
      }
    }
  });
}
