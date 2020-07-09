"use strict";

const request = require('request');
var Service, Characteristic, UserID, areaId, areaName, allArea, armedRes;

var gUserID, gallArea;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-inception', 'InceptionSwitch', InceptionSwitch)
  homebridge.registerAccessory('homebridge-inception-garage', 'InceptionGarageDoor', InceptionGarageDoor)
}

class InceptionGarageDoor {
  constructor (log, config, accessories) {
    // get config values
    this.log = log;
    this.name = config['name'];
    this.lockService = new Service.LockMechanism(this.name);
    this.lockState = Characteristic.LockCurrentState.SECURED;
    this.accessories = accessories
    this.logInUser();
  }

  logInUser() {
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
      
      let temp;
      temp = JSON.parse(response.body);

      gUserID = temp.UserID

      if(gUserID) {
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

      gallArea = JSON.parse(response.body)      
    });

  }

  armArea() {
    // for(var i = 0; i < allArea.length; i++) {
    //   this.log('ID =====>', allArea[i].ID)
    //   this.log('NAME =====>', allArea[i].Name)
    // }
    
    return new Promise((resolve, reject) => {
      var options = {
        'method': 'POST',
        'url': 'http://121.200.28.54/api/v1/control/area/' + gallArea[0].ID + '/activity',
        'headers': {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cookie': 'LoginSessId=' + gUserID
        },
        body: JSON.stringify({"Type":"ControlArea","AreaControlType":"Arm"})
      };

      request(options, (error, response) => {
        if (error) return reject(error);
          
        try {
          resolve(JSON.parse(response.body))
        } catch(e) {
          reject(e);
        }
      });
    })    
  }

  
  disArmArea() {
    return new Promise((resolve, reject) => {

      var options = {
        'method': 'POST',
        'url': 'http://121.200.28.54/api/v1/control/area/' + gallArea[0].ID + '/activity',
        'headers': {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cookie': 'LoginSessId=' + gUserID
        },
        body: JSON.stringify({"Type":"ControlArea","AreaControlType":"Disarm"})
      }

      request(options, (error, response) => {
        if (error) return reject(error);
          
        try {
          resolve(JSON.parse(response.body))
        } catch(e) {
          reject(e);
        }
      });
    })
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
      this.armArea().then((val) => {
        if(val.Response.Result == 'Success' && val.Response.Message == 'OK') {
          this.lockState = targetState
          this.updateCurrentState(this.lockState);
          this.log('InceptionGarageDoor IF ====>');

          // this.log(`locking `+this.name, targetState)
          // this.log(this.lockState+" "+this.name);
        }
      }).catch((err) => {
          this.log('ERR ====>',err);
      });
    } else {
      this.disArmArea().then((val) => {
        if(val.Response.Result == 'Success' && val.Response.Message == 'OK') {
          this.lockState = targetState
          this.updateCurrentState(this.lockState);
          this.log('InceptionGarageDoor ELSE IF ====>');

          // this.log(`unlocking `+this.name, targetState)
          // this.log(this.lockState+" "+this.name);
        }
      }).catch((err) => {
        this.log('ERR ====>',err);
      })
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

class InceptionSwitch {
  constructor (log, config, accessories) {
    // get config values
    this.log = log;
    this.name = config['name'];
    this.lockService = new Service.LockMechanism(this.name);
    this.lockState = Characteristic.LockCurrentState.SECURED;
    this.accessories = accessories
    this.logInUser();
  }

  logInUser() {
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
      
      let temp;
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

      allArea = JSON.parse(response.body)      
    });

  }

  armArea() {
    // for(var i = 0; i < allArea.length; i++) {
    //   this.log('ID =====>', allArea[i].ID)
    //   this.log('NAME =====>', allArea[i].Name)
    // }
    
    return new Promise((resolve, reject) => {
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
        if (error) return reject(error);
          
        try {
          resolve(JSON.parse(response.body))
        } catch(e) {
          reject(e);
        }
      });
    })    
  }

  
  disArmArea() {
    return new Promise((resolve, reject) => {

      var options = {
        'method': 'POST',
        'url': 'http://121.200.28.54/api/v1/control/area/' + allArea[0].ID + '/activity',
        'headers': {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cookie': 'LoginSessId=' + UserID
        },
        body: JSON.stringify({"Type":"ControlArea","AreaControlType":"Disarm"})
      }

      request(options, (error, response) => {
        if (error) return reject(error);
          
        try {
          resolve(JSON.parse(response.body))
        } catch(e) {
          reject(e);
        }
      });
    })
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
      this.armArea().then((val) => {
        if(val.Response.Result == 'Success' && val.Response.Message == 'OK') {
          this.lockState = targetState
          this.updateCurrentState(this.lockState);
          this.log('InceptionSwitch  IF ====>');

          // this.log(`locking `+this.name, targetState)
          // this.log(this.lockState+" "+this.name);
        }
      }).catch((err) => {
          this.log('ERR ====>',err);
      });
    } else {
      this.disArmArea().then((val) => {
        if(val.Response.Result == 'Success' && val.Response.Message == 'OK') {
          this.lockState = targetState
          this.updateCurrentState(this.lockState);
          this.log('InceptionSwitch ELSE IF ====>');

          // this.log(`unlocking `+this.name, targetState)
          // this.log(this.lockState+" "+this.name);
        }
      }).catch((err) => {
        this.log('ERR ====>',err);
      })
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