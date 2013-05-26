/*jshint loopfunc: true */

var events = require('events');
var util = require('util');

var noble = require('noble');

/*

BLServiceAccelerometer =  0000FEB0-0000-1000-8000-00805F9B34FB

BLServiceMobileWarning =  0000E000-0000-1000-8000-00805F9B34FB
BLServiceMobileAlarm =    0000E100-0000-1000-8000-00805F9B34FB
BLServiceMobileFinder =   0000E200-0000-1000-8000-00805F9B34FB
BLServiceTemperature =    0000E300-0000-1000-8000-00805F9B34FB
BLServiceRecording =      0000E400-0000-1000-8000-00805F9B34FB
BLServiceBackgroundMode = 0000E500-0000-1000-8000-00805F9B34FB
BLServiceSwitch =         0000E700-0000-1000-8000-00805F9B34FB

BLServiceBattery =        180F


// BLServiceSwitch
// 0000e70100001000800000805f9b34fb: 0x01 enable, 0x00 disable
// 0000e70200001000800000805f9b34fb: notify 0x60 down, 0x50 up

// BLServiceMobileWarning
// 0000e00100001000800000805f9b34fb: 0x01 enable, 0x00 disable
// 0000e00200001000800000805f9b34fb: 0x01 enable, 0x00 disable motion detection
// 0000e00300001000800000805f9b34fb: motion threshold (16bit LE)
// 0000e00400001000800000805f9b34fb: notify

// BLServiceRecording
// 0000e40100001000800000805f9b34fb: 0x01 start recording, 0x00 stop recording
// 0000e40200001000800000805f9b34fb: input
// 0000e40300001000800000805f9b34fb: interval (32bit LE)
//
// 0000e40500001000800000805f9b34fb: method
// 
//
// 0000e40800001000800000805f9b34fb: threshold 1 (16bit LE)
//
// 0000e41100001000800000805f9b34fb: value
*/

var TEMPERATURE_ENABLE_UUID = '0000e30100001000800000805f9b34fb';
var TEMPERATURE_SENSOR_UUID = '0000e30200001000800000805f9b34fb';
var TEMPERATURE_VALUE_UUID  = '0000e30300001000800000805f9b34fb';

var SWITCH_ENABLE_UUID      = '0000e70100001000800000805f9b34fb';
var SWITCH_NOTIFY_UUID      = '0000e70200001000800000805f9b34fb';

function Blukii(peripheral) {
  this._peripheral = peripheral;
  this._services = {};
  this._characteristics = {};

  this.uuid = peripheral.uuid;
}

util.inherits(Blukii, events.EventEmitter);


Blukii.discover = function(callback) {
  noble.once('stateChange', function() {
    var onDiscover = function(peripheral) {
      var localName = peripheral.advertisement.localName;
      if (localName && localName.indexOf('blukii BTS1.0 ') === 0) {
        noble.removeListener('discover', onDiscover);
        noble.stopScanning();

        var blukii = new Blukii(peripheral);
        callback(blukii);
      }
    };

    noble.on('discover', onDiscover);
    noble.startScanning();
  });
};

Blukii.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid
  });
};

Blukii.prototype.connect = function(callback) {
  this._peripheral.connect(callback);
};

Blukii.prototype.disconnect = function(callback) {
  this._peripheral.disconnect(callback);
};

Blukii.prototype.discoverServices = function(callback) {
  this._peripheral.discoverServices([], function(error, services) {
    if (error === null) {
      for (var i in services) {
        var service = services[i];
        this._services[service.uuid] = service;
      }
    }

    callback();
  }.bind(this));
};

Blukii.prototype.discoverCharacteristics = function(callback) {
  var numDiscovered = 0;

  for (var i in this._services) {
    var service = this._services[i];

    service.discoverCharacteristics([], function(error, characteristics) {
      numDiscovered++;

      if (error === null) {
        for (var j in characteristics) {
          var characteristic = characteristics[j];

          this._characteristics[characteristic.uuid] = characteristic;
        }
      }

      if (numDiscovered === Object.keys(this._services).length) {
        callback();
      }
    }.bind(this));
  }
};

Blukii.prototype.writeCharacteristic = function(uuid, data, callback) {
  this._characteristics[uuid].write(data, false, callback);
};

Blukii.prototype.notifyCharacteristic = function(uuid, notify, listener, callback) {
  var characteristic = this._characteristics[uuid];

  characteristic.notify(notify, function(state) {
    if (notify) {
      characteristic.addListener('read', listener);
    } else {
      characteristic.removeListener('read', listener);
    }

    callback();
  });
};

Blukii.prototype.enableConfigCharacteristic = function(uuid, callback) {
  this.writeCharacteristic(uuid, new Buffer([0x01]), callback);
};

Blukii.prototype.disableConfigCharacteristic = function(uuid, callback) {
  this.writeCharacteristic(uuid, new Buffer([0x00]), callback);
};

Blukii.prototype.readDataCharacteristic = function(uuid, callback) {
  this._characteristics[uuid].read(function(error, data) {
    callback(data);
  });
};

Blukii.prototype.enableTemperatureSensor = function(callback) {
  this.enableConfigCharacteristic(TEMPERATURE_ENABLE_UUID, callback);
};

Blukii.prototype.disableTemperatureSensor = function(callback) {
  this.disableConfigCharacteristic(TEMPERATURE_ENABLE_UUID, callback);
};

Blukii.prototype.selectTemperatureSensor = function(sensor, callback) {
  if (sensor === 'internal') {
    this._temperatureSensor = 1;
  } else if (sensor === 'external') {
    this._temperatureSensor = 2;
  } else {
    this._temperatureSensor = 0;
  }

  this.writeCharacteristic(TEMPERATURE_SENSOR_UUID, new Buffer(this._temperatureSensor), callback);
};

Blukii.prototype.readTemperatureSensor = function(callback) {
  this.readDataCharacteristic(TEMPERATURE_VALUE_UUID, function(data) {
    var temperature = data.readInt8(0);

    if (this._temperatureSensor === 1) {
      temperature *= 1.8;
    }

    callback(temperature);
  }.bind(this));
};

Blukii.prototype.enableSwitchSensor = function(callback) {
  this.enableConfigCharacteristic(SWITCH_ENABLE_UUID, callback);
};

Blukii.prototype.disableSwitchSensor = function(callback) {
  this.disableConfigCharacteristic(SWITCH_ENABLE_UUID, callback);
};

Blukii.prototype.onSwitchChange = function(data) {
  var on = (data.readUInt8(0) & 0x50) ? true : false;

  this.emit('switchChange', on);
};

Blukii.prototype.notifySwitch = function(callback) {
  this.notifyCharacteristic(SWITCH_NOTIFY_UUID, true, this.onSwitchChange.bind(this), callback);
};

Blukii.prototype.unnotifySwitch = function(callback) {
  this.notifyCharacteristic(SWITCH_NOTIFY_UUID, false, this.onSwitchChange.bind(this), callback);
};

module.exports = Blukii;
