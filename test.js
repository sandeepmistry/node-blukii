var util = require('util');

var async = require('async');

var Blukii = require('./index');

Blukii.discover(function(blukii) {
  async.series([
      function(callback) {
        console.log('connect');
        blukii.connect(callback);
      },
      function(callback) {
        console.log('discoverServices');
        blukii.discoverServices(callback);
      },
      function(callback) {
        console.log('discoverCharacteristics');
        blukii.discoverCharacteristics(callback);
      },
      function(callback) {
        console.log('disconnect');
        blukii.disconnect(callback);
      }
    ],
    function() {
      process.exit(0);
    }
  );
});
