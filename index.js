"use strict";

const request = require('request');
var Service, Characteristic, UserID, areaId, areaName, allArea;

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
      if (error) throw new Error(error);

      let temp = JSON.parse(response.body)

      allArea = temp
      // areaId = temp[0].ID
      // areaName = temp[0].Name
      this.armArea();
    });

  }

  armArea() {
    // for(var i = 0; i < allArea.length; i++) {
    //   this.log('ID =====>', allArea[i].ID)
    //   this.log('NAME =====>', allArea[i].Name)
    // }

    var options = {
      'method': 'POST',
      'url': 'http://121.200.28.54/api/v1/control/area/' + allArea[0].ID + '/activity',
      'headers': {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cookie': 'LoginSessId=' + UserID
      },
      body: JSON.stringify({"Type":"ControlArea","AreaControlType":"Arm"})
    };
    request(options, (error, response) => {
      // if (error) throw new Error(error);
      let temp = response.body 
      this.testResponse(temp)
    });
    
  }
  
  testResponse(data) {
    this.log('temp========>', data)

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