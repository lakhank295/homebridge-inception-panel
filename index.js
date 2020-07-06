"use strict";

var Service, Characteristic, UserId;
const request = require('request');

module.exports = (homebridge) => {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-inception', 'InceptionSwitch', InceptionSwitch)
}

class InceptionSwitch {
  constructor (log, config) {
    // get config values
    this.log = log;
    this.name = config['name'];
    this.lockService = new Service.LockMechanism(this.name);
    this.lockState = Characteristic.LockCurrentState.SECURED;
  }

  getAuthData () {
    var options = {
      'method': 'POST',
      'url': 'http://121.200.28.54/api/v1/authentication/login',
      'headers': {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify({"Username":"apiuser","Password":"NeoSoft1!2"})
    };
    
    request(options, async function (error, response) {
        // if (error) throw new Error(error);
        
        try {
          await this.getUserId(JSON.parse(response.body))
        } catch(e) {
          // throw new Error(e);
        }
      })
    
  }

  getUserId(data) {
    if(data.Response.Result == 'Success' && data.Response.Message == 'OK') {
        this.log('User ID => ',data.UserID)
    }
  }

  getServices () {
    const informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'Inner Range')
        .setCharacteristic(Characteristic.Model, 'Inception Lock 1.0')
        .setCharacteristic(Characteristic.SerialNumber, '1234');

    this.lockService.getCharacteristic(Characteristic.LockCurrentState)
      .on('get', this.getLockCharacteristicHandler.bind(this));

    this.lockService.getCharacteristic(Characteristic.LockTargetState)
      .on('get', this.getLockCharacteristicHandler.bind(this))
      .on('set', this.setLockCharacteristicHandler.bind(this));

    this.getAuthData();

    return [informationService, this.lockService]
  }


  actionCallback(err, result) {
    if(err) {
      this.updateCurrentState(Characteristic.LockCurrentState.JAMMED);
      return console.error(err);
    }
  }

  // Lock Handler
  setLockCharacteristicHandler (targetState, callback) {
    // var lockh = this;

    if (targetState == Characteristic.LockCurrentState.SECURED) {
      this.log(`locking `+this.name, targetState)
      this.lockState = targetState
      this.updateCurrentState(this.lockState);
      this.log(this.lockState+" "+this.name);
    } else {
      this.log(`unlocking `+this.name, targetState)
      this.lockState = targetState
      this.updateCurrentState(this.lockState);
      this.log(this.lockState+" "+this.name);
    }
    callback();
  }

  updateCurrentState(toState) {
    this.lockService
      .getCharacteristic(Characteristic.LockCurrentState)
      .updateValue(toState);
  }

  getLockCharacteristicHandler (callback) {
    callback(null, this.lockState);
  }
}