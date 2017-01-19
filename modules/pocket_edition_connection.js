/**
 * EasyRaceLapTimer - Copyright 2015-2017 by airbirds.de
 *
 * This file is part of EasyRaceLapTimer.
 *
 * EasyRaceLapTimer is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * EasyRaceLapTimer is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with Foobar. If not, see http://www.gnu.org/licenses/.
 **/
var SerialPort = require("serialport");
var request = require('request');
var util = require('util');

var pocketEditionConnection = {};

pocketEditionConnection.comPortConnections = [false,false,false,false];
pocketEditionConnection.comPorts = [false,false,false,false];
pocketEditionConnection.erlt_host = "http://localhost";

pocketEditionConnection.socketCallback = null;

pocketEditionConnection.connectToComPort = function(number,com_port,callback){
    var port = new SerialPort(com_port, {
            baudRate: 115200,
            parser: SerialPort.parsers.readline('\n')
        },
        function (err) {
            if (err) {
                console.log('SerialPort Error: ', err.message);
                callback(number,com_port,true);
            }else{
                callback(number,com_port,false);
            }
        }
    );

    this.comPortConnections[number-1] = port;
    if(number == 1){
        this.comPortConnections[number-1].on("data",pocketEditionConnection.onDataDeviceOne);
        this.comPorts[number-1] = com_port;
    }
    if(number == 2){
        this.comPortConnections[number-1].on("data",pocketEditionConnection.onDataDeviceTwo);
        this.comPorts[number-1] = com_port;
    }
    if(number == 3){
        this.comPortConnections[number-1].on("data",pocketEditionConnection.onDataDeviceThree);
        this.comPorts[number-1] = com_port;
    }
    if(number == 4){
        this.comPortConnections[number-1].on("data",pocketEditionConnection.onDataDeviceFour);
        this.comPorts[number-1] = com_port;
    }
}

pocketEditionConnection.onDataDeviceOne = function(data){
    pocketEditionConnection.socketCallback(1,data);
    
    var t = data.split(" ");
    if(t[0] == "T_TRACKED"){
        pocketEditionConnection.processNewLap("VTX_SENSOR_1",t[2]);
    }
}

pocketEditionConnection.onDataDeviceTwo = function(data){
    pocketEditionConnection.socketCallback(2,data);
    
    var t = data.split(" ");
    if(t[0] == "T_TRACKED"){
        pocketEditionConnection.processNewLap("VTX_SENSOR_2",t[2]);
    }
}

pocketEditionConnection.onDataDeviceThree = function(data){
    pocketEditionConnection.socketCallback(3,data);
    
    var t = data.split(" ");
    if(t[0] == "T_TRACKED"){
        pocketEditionConnection.processNewLap("VTX_SENSOR_3",t[2]);
    }
}

pocketEditionConnection.onDataDeviceFour = function(data){
    pocketEditionConnection.socketCallback(4,data);
    
    var t = data.split(" ");
    if(t[0] == "T_TRACKED"){
        pocketEditionConnection.processNewLap("VTX_SENSOR_4",t[2]);
    }
}

pocketEditionConnection.sendCommand = function(number,cmd){
    if(this.comPortConnections[number-1] != false && this.comPortConnections[number-1] !== undefined){
        this.comPortConnections[number-1].write(cmd+"\n");
    }
}

pocketEditionConnection.disconnectFromComPort = function(number,callback){
    this.comPortConnections[number-1].close(function(err){
        if (err) {
            console.log('SerialPort Error: ', err.message);
            callback(number,true);
        }else{
            callback(number,false);
        }
    });

    this.comPortConnections[number-1] = false;
    this.comPorts[number-1] = false;
}

pocketEditionConnection.isConnected = function(number,callback){
    if(this.comPortConnections[number-1]){
        callback(number,this.comPorts[number-1],true);
    }else{
        callback(number,false,false);
    }
}

pocketEditionConnection.listPorts = function(callback){
    SerialPort.list(function (err, ports) {
        var data = [];
        ports.forEach(function(port) {
            data.push(port.comName);
        });

        callback(data);
    });
}

pocketEditionConnection.processNewLap = function(sensor,time_in_ms){
    request({
        url: util.format("%s/api/v1/lap_track/create", pocketEditionConnection.erlt_host), //URL to hit
        qs: {transponder_token: sensor, lap_time_in_ms: time_in_ms}, //Query string data
        method: 'GET'
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
        }
    });			
}

module.exports = pocketEditionConnection;