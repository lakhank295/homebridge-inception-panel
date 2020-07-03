"use strict";

const request = require('request');

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
  this.UserID = '';
  
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

  authUser();
}

InceptionSwitch.prototype.getServices = function() {
  return [this._service];
}

function authUser () {
    var options = {
        'method': 'POST',
        'url': 'http://121.200.28.54/api/v1/authentication/login',
        'headers': {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({"Username":"apiuser","Password":"NeoSoft1!2"})
      
    };
    
    request(options, function (error, response) {
        if (error) throw new Error(error);
        
        let temp = response.body.Response;

        if(temp.Result == 'Success' && temp.Message == 'OK') {
            this.UserID = temp.UserID
        }

        this.log('UserId' + this.UserID)
    });
}

InceptionSwitch.prototype._setOn = function(on, callback) {

  this.log("Setting switch to " + on);
  
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
