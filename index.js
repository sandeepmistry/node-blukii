/*jshint loopfunc: true */

var events = require('events');
var util = require('util');

var noble = require('noble');

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

module.exports = Blukii;
