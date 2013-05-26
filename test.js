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
        console.log('enableTemperatureSensor');
        blukii.enableTemperatureSensor(callback);
      },
      function(callback) {
        console.log('selectTemperatureSensor - internal');
        blukii.selectTemperatureSensor('internal', callback);
      },
      function(callback) {
        console.log('readTemperatureSensor');
        setTimeout(function() {
          blukii.readTemperatureSensor(function(temperature) {
            console.log('temperature = ' + temperature + ' °C');

            callback();
          });
        }, 1000);
      },
      function(callback) {
        console.log('selectTemperatureSensor - external');
        blukii.selectTemperatureSensor('external', callback);
      },
      function(callback) {
        setTimeout(function() {
          blukii.readTemperatureSensor(function(temperature) {
            console.log('temperature = ' + temperature + ' °C');

            callback();
          });
        }, 1000);
      },
      function(callback) {
        console.log('disableTemperatureSensor');
        blukii.disableTemperatureSensor(callback);
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
