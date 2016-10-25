var gulp = require('gulp');
var request = require('request');
var fs = require('fs');

gulp.task('default', function() {
  readConfig(function(configs) {
    getAppscriptList(configs, function(appscriptList) {
      console.log(appscriptList);
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
