"use strict";

var request = require('sync-request');

var Service, Characteristic, HomebridgeAPI, url;

module.exports = function(homebridge) {

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  HomebridgeAPI = homebridge;
  homebridge.registerAccessory("homebridge-inception", "InceptionSwitch", InceptionSwitch);
}

function InceptionSwitch(log, config) {
  this.log = log;
  this.name = config.name;
  this.stateful = config.stateful;
  this.reverse = config.reverse;
  this.time = config.time ? config.time : 1000;		
  this._service = new Service.Switch(this.name);

  this.url = "http://dummy.restapiexample.com/api/v1/employees";
  this.http_method = "GET";
  this.sendimmediately = "";
  this.default_state_off = true;
  this.name = "Living Room Button";
  
  this.cacheDirectory = HomebridgeAPI.user.persistPath();
  this.storage = require('node-persist');
  this.storage.initSync({dir:this.cacheDirectory, forgiveParseErrors: true});
  
  this._service.getCharacteristic(Characteristic.On)
    .on('set', this._setOn.bind(this));

  if (this.reverse) this._service.setCharacteristic(Characteristic.On, true);

  if (this.stateful) {
	var cachedState = this.storage.getItemSync(this.name);
	if((cachedState === undefined) || (cachedState === false)) {
		this._service.setCharacteristic(Characteristic.On, false);
	} else {
		this._service.setCharacteristic(Characteristic.On, true);
	}
  }
}

// InceptionSwitch.prototype.getData = function () {
//     var res = request(this.http_method, this.url, {});
 
//     if(res.status == 'success') {
//         this.log(res.data)
//     }
// }

InceptionSwitch.prototype.getServices = function() {
  return [this._service];
}

InceptionSwitch.prototype._setOn = function(on, callback) {

  this.log("Setting switch to " + on);

    var res = request(this.http_method, this.url, {});
 
    if(res.status == 'success') {
        this.log(res.data)
    }

  if (on && !this.reverse && !this.stateful) {
    setTimeout(function() {
      this._service.setCharacteristic(Characteristic.On, false);
    }.bind(this), this.time);
  } else if (!on && this.reverse && !this.stateful) {
    setTimeout(function() {
      this._service.setCharacteristic(Characteristic.On, true);
    }.bind(this), this.time);
  }
  
  if (this.stateful) {
	this.storage.setItemSync(this.name, on);
  }
  
  callback();
}
