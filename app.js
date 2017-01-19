/**
 * EasyRaceLapTimer - Copyright 2015-2017 by airbirds.de
 *
 * This file is part of EasyRaceLapTimer.
 *
 * EasyRaceLapTimer is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * EasyRaceLapTimer is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with Foobar. If not, see http://www.gnu.org/licenses/.
 **/

var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var peConnection = require('./modules/pocket_edition_connection.js');

server.listen(3000);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.use('/assets', express.static('assets'));

app.get('/vue_app.js', function (req, res) {
  res.sendfile(__dirname + '/vue_app.js');
});

app.get('/channels.js', function (req, res) {
  res.sendfile(__dirname + '/channels.js');
});

io.on('connection', function (socket) {
  
  // callback for sending incomming data from a pocket edition 
  peConnection.socketCallback = function(number,data){
    console.log("Device: " + number + " > " + data);

    var e_data = {};
    e_data['cmd'] = "INC_PE_DATA";
    e_data['data'] = data;
    e_data['number'] = number;
    e_data['data_splitted'] = data.split(" ");
    socket.emit("pe_driver",e_data);
  }

  socket.on('pe_driver', function (data) {
    console.log(data);

    
    if(data['cmd'] == "REFRESH_SAFETY_RSSI"){
      peConnection.sendCommand(data['number'],"GSRSSI");
    } // REFRESH_SAFETY_RSSI

    if(data['cmd'] == "REFRESH_SMART_SENSE_CUT_OFF"){
      peConnection.sendCommand(data['number'],"GSSCO");
    } // REFRESH_SMART_SENSE_CUT_OFF
    
    if(data['cmd'] == "REFRESH_MINIMUM_LAP_TIME"){
      peConnection.sendCommand(data['number'],"GMLT");
    } // REFRESH_MINIMUM_LAP_TIME

    if(data['cmd'] == "REFRESH_CHANNEL"){
      peConnection.sendCommand(data['number'],"GET_CURRENT_CHANNEL");
    } // REFRESH_CHANNEL

    if(data['cmd'] == "REFRESH_CURRENT_RSSI"){
      peConnection.sendCommand(data['number'],"GET_CURRENT_RSSI_SIGNAL_STRENGTH");
    } // REFRESH_CHANNEL

    if(data['cmd'] == "PE_CMD"){
      peConnection.sendCommand(data['number'],data['pe_cmd']);
    } // PE_CMD

    if(data['cmd'] == "SET_ERLT_HOST"){
      peConnection.erlt_host = data['host'];
    } // PE_CMD

    if(data['cmd'] == "GET_ERLT_HOST"){
      socket.emit('pe_driver',{cmd:"GET_ERLT_HOST", data: peConnection.erlt_host});
    } // PE_CMD
    
    
    

    if(data['cmd'] == "REFRESH_COM_PORTS"){
      console.log("refreshing ports");
      peConnection.listPorts(function(data){
        socket.emit('pe_driver',{cmd:"REFRESH_COM_PORTS", data: data});
      });
    } // REFRESH_COM_PORTS

    if(data['cmd'] == "IS_CONNECTED"){
      peConnection.isConnected(data['number'],function(number,port,connected){
        socket.emit("pe_driver",{cmd:"CONNECT_TO_PORT",number: number, connected: connected,port: port});
      });
    } // IS_CONNECTED

    if(data['cmd'] == "CONNECT_TO_PORT"){
      peConnection.connectToComPort(data['number'],data['port'],function(number,port,error){
        var t = true;
        if(error){
          t = false;
        }

        socket.emit("pe_driver",{cmd:"CONNECT_TO_PORT",number: number, connected: t,port: port});
      });
    } // CONNECT_TO_PORT

    if(data['cmd'] == "DISCONNECT_FROM_PORT"){
      peConnection.disconnectFromComPort(data['number'],function(number,error){
        var t = false;
        if(error){
          t = true;
        }

        socket.emit("pe_driver",{cmd:"DISCONNECT_FROM_PORT",number: number, connected: t});
      });
    } // CONNECT_TO_PORT
    
  });
});