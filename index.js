"use strict";

const request = require('request');
const dotenv = require("dotenv")
dotenv.config()

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
    var options = {
      'method': 'POST',
      'url': process.env.authAPI,
      'headers': {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({"Username": process.env.user,"Password": process.env.password})
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
      'url': process.env.controlArea,
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
        'url': process.env.controlArea + '/' + allArea[0].ID + '/activity',
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
        'url': process.env.controlArea + '/' + allArea[0].ID + '/activity',
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
          
          // this.log(`locking `+this.name, targetState)
          // this.log(this.lockState+" "+this.name);
        }
      }).catch((err) => {
          this.log('ERR IF ====>',err);
      });
    } else {
      this.disArmArea().then((val) => {
        if(val.Response.Result == 'Success' && val.Response.Message == 'OK') {
          this.lockState = targetState
          this.updateCurrentState(this.lockState);

          // this.log(`unlocking `+this.name, targetState)
          // this.log(this.lockState+" "+this.name);
        }
      }).catch((err) => {
        this.log('ERR ELSE ====>',err);
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