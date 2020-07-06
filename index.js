"use strict";

const request = require('request');

var Service, Characteristic, UserID, areaId;

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

    this.logInUser();
  }

  logInUser() {
    let temp;
    var options = {
      'method': 'POST',
      'url': 'http://121.200.28.54/api/v1/authentication/login',
      'headers': {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify({"Username":"apiuser","Password":"NeoSoft1!2"})
    };
    
    request(options, async (error, response) => {
      if (error) throw new Error(error);
  
      temp = JSON.parse(response.body);

      UserID = temp.UserID

      if(UserID) {
        this.getAllArea();
      }
    })

  }

  getAllArea() {
    var options = {
      'method': 'GET',
      'url': 'http://121.200.28.54/api/v1/control/area',
      'headers': {
        'Accept': 'application/json',
        'Cookie': 'LoginSessId=' + UserID
      }
    };

    request(options, (error, response) => {
      // areaId = response.body[0].ID;
      // let data = JSON.parse(response)
      // if(response.statusCode  == '')
      this.log('AREA', response)
    });

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
        
        this.logInUser();

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
    // this.log('Area ID =====> ', areaId)
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