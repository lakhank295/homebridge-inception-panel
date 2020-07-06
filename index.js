"use strict";

var Service, Characteristic, UserID, areaId;

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

  // getAuthData () {
  //   var options = {
  //     'method': 'POST',
  //     'url': 'http://121.200.28.54/api/v1/authentication/login',
  //     'headers': {
  //     'Content-Type': 'application/json'
  //     },
  //     body: JSON.stringify({"Username":"apiuser","Password":"NeoSoft1!2"})
  //   };
    
  //   request(options, async function (error, response) {
  //       // if (error) throw new Error(error);
        
  //       try {
  //         await this.getUserId(JSON.parse(response.body))
  //       } catch(e) {
  //         // throw new Error(e);
  //       }
  //     })
    
  // }

  // getUserId(data) {
  //   if(data.Response.Result == 'Success' && data.Response.Message == 'OK') {
  //       // this.log('User ID => ',data.UserID)
  //     this.UserID = data.UserID
  //   }
  // }

  getAllVisibleArea() {
    var options = {
      'method': 'GET',
      'url': 'http://121.200.28.54/api/v1/control/area',
      'headers': {
        'Accept': 'application/json',
        'Cookie': 'LoginSessId=' + UserID
      }
    };

    request(options, function (error, response) {
      // if (error) throw new Error(error);
      // this.log(response.body);
      areaId = response.body[0].ID;
    });
  }

  armArea() {
    var options = {
      'method': 'POST',
      'url': 'http://121.200.28.54/api/v1/control/area/' + areaId + '/activity',
      'headers': {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cookie': 'LoginSessId=' + UserID
      },
      body: JSON.stringify({"Type":"ControlArea","AreaControlType":"Arm"})
      
    };
    request(options, function (error, response) {
      // if (error) throw new Error(error);
      // console.log(response.body);
      let temp = JSON.parse(response.body) 
      this.log('temp', temp)
      return temp
    });
    
  }

  disArmArea() {
    var options = {
      'method': 'POST',
      'url': 'http://121.200.28.54/api/v1/control/area/' + areaId + '/activity',
      'headers': {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cookie': 'LoginSessId=' + UserID
      },
      body: JSON.stringify({"Type":"ControlArea","AreaControlType":"Disarm"})
    
    };
    request(options, function (error, response) {
      // if (error) throw new Error(error);
      // console.log(response.body);
      let temp = JSON.parse(response.body) 
      return temp
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


      var options = {
        'method': 'POST',
        'url': 'http://121.200.28.54/api/v1/authentication/login',
        'headers': {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({"Username":"apiuser","Password":"NeoSoft1!2"})
      };
      
      request(options, function (error, response) {
          // if (error) throw new Error(error);
          
        let temp = JSON.parse(response.body);

        UserID = temp.UserID
      })

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
    this.log('hey',this.armArea())
    this.log('called =>', UserID)
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