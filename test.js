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
        console.log('enableMobileWarning');
        blukii.enableMobileWarning(callback);
      },
      function(callback) {
        console.log('setMobileWarningThreshold');
        blukii.setMobileWarningThreshold(5000, callback);
      },
      function(callback) {
        blukii.on('mobileWarning', function(on) {
          console.log('mobileWarning on = ' + on);

          callback();
        });

        blukii.notifyMobileWarning(function() {
        });
      },
      function(callback) {
        console.log('disableMobileWarning');
        blukii.disableMobileWarning(callback);
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
        }, 250);
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
        }, 250);
      },
      function(callback) {
        console.log('disableTemperatureSensor');
        blukii.disableTemperatureSensor(callback);
      },
      function(callback) {
        console.log('enableSwitchSensor');
        blukii.enableSwitchSensor(callback);
      },
      function(callback) {
        blukii.on('switchChange', function(on) {
          console.log('switch on = ' + on);

          callback();
        });

        blukii.notifySwitch(function() {
        });
      },
      function(callback) {
        console.log('disableSwitchSensor');
        blukii.disableSwitchSensor(callback);
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
