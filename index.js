"use strict";

// var Service, Characteristic;

// module.exports = function (homebridge) {
//     Service = homebridge.hap.Service;
//     Characteristic = homebridge.hap.Characteristic;
//     homebridge.registerAccessory("homebridge-customer", "Custumer", CustomerAccessory);
// };

// function CustomerAccessory(log, config) {
//   this.log(this.config)
// }

"use strict";

let Service, Characteristic, api;

const packageJSON = require("./package.json");

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    api = homebridge;

    homebridge.registerAccessory("homebridge-inception-panel", "INCEPTION-SENSOR", HTTP_INCEPTION);
};

function HTTP_INCEPTION(log, config) {
    this.log = log;
    // this.name = config.name;
    // this.debug = config.debug || false;

    config.getUrl = 'https//localhost:3000';
    config.statusCache = 0
    config.unit = 2;
    config.statusPattern = '/(-?[0-9]{1,3}(\.[0-9])?)/';
    config.notificationID = 1;
    config.notificationPassword = '1234'

    this.handleNotification.bind(config)
}

HTTP_INCEPTION.prototype = {

    identify: function (callback) {
        this.log("Identify requested!");
        callback();
    },

    getServices: function () {
        if (!this.homebridgeService)
            return [];

        const informationService = new Service.AccessoryInformation();

        informationService
            .setCharacteristic(Characteristic.Manufacturer, "Inner Range")
            .setCharacteristic(Characteristic.Model, "Inception Sensor")
            .setCharacteristic(Characteristic.SerialNumber, "IS01")
            .setCharacteristic(Characteristic.FirmwareRevision, packageJSON.version);

        return [informationService, this.homebridgeService];
    },
    
    handleNotification: function(body) {
        const characteristic = utils.getCharacteristic(this.homebridgeService, body.characteristic);
        this.log("characteristic" + characteristic);
    }
};