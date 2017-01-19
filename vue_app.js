/**
 * EasyRaceLapTimer - Copyright 2015-2017 by airbirds.de
 *
 * This file is part of EasyRaceLapTimer.
 *
 * EasyRaceLapTimer is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * EasyRaceLapTimer is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with Foobar. If not, see http://www.gnu.org/licenses/.
 **/

var socket = io.connect('http://localhost:3000');

/** logic */
Vue.component("pe_tracked_timings_container",{
  props: ['timingData'],
  template: "#pe_tracked_timings_template",
});

Vue.component('pe_driver_container', {
  props: ["com_ports","number","selectedComPort","peData","channels","showAdvanced"],
  template: "#pe_driver_container_template",
  methods: {
    refreshComPorts: function(){
       socket.emit('pe_driver',{cmd: "REFRESH_COM_PORTS"});
    },
    connectToComPort: function(){
      socket.emit('pe_driver',{cmd: "CONNECT_TO_PORT",number: this.number, port: this.peData.selectedComPort});
    },
    disconnectFromComPort: function(){
      socket.emit('pe_driver',{cmd: "DISCONNECT_FROM_PORT",number: this.number});
    },
    refreshSafetyRSSI: function(){
      socket.emit('pe_driver',{cmd: "REFRESH_SAFETY_RSSI",number: this.number});
    },
    refreshSmartSenseCutOff: function(){
      socket.emit('pe_driver',{cmd: "REFRESH_SMART_SENSE_CUT_OFF",number: this.number});
    },
    refreshMinimumLapTime: function(){
      socket.emit('pe_driver',{cmd: "REFRESH_MINIMUM_LAP_TIME",number: this.number});
    },
    refreshChannel: function(){
      socket.emit('pe_driver',{cmd: "REFRESH_CHANNEL",number: this.number});
    },
    refreshCurrentRSSI: function(){
      socket.emit('pe_driver',{cmd: "REFRESH_CURRENT_RSSI",number: this.number});
    },
    saveChannel: function(){
      socket.emit('pe_driver',{cmd: "PE_CMD",number: this.number, pe_cmd: "SET_CHANNEL " + this.peData.channel});
    },
    saveSmartSenseCutOff: function(){
      socket.emit('pe_driver',{cmd: "PE_CMD",number: this.number, pe_cmd: "SSSCO " + this.peData.smartSenseCutOff});
    },
    savehMinimumLapTime: function(){
      socket.emit('pe_driver',{cmd: "PE_CMD",number: this.number, pe_cmd: "SMLT " + this.peData.minLapTime});
    },
  }
})

var app = new Vue({
  el: '#app',
  mounted: function(){
    socket.emit('pe_driver',{cmd: "REFRESH_COM_PORTS"});
    socket.emit('pe_driver',{cmd: "GET_ERLT_HOST"});

    for(var i = 1; i <= 4; i++){
      socket.emit('pe_driver',{cmd: "IS_CONNECTED",number: i,});
    }
  },
  data: {
    erlt_host: "",
    showAdvanced: false,
    serialLog: "",
    channels: channel_data,
    com_ports: [],
    timingData: [],
    peDriver: [
      {
        selectedComPort: "",
        connected: false,
        safetyRssi: 0,
        smartSenseCutOff: 0,
        minLapTime: 0,
        channel: 0,
        currentRSSI: 0
      },
      {
        selectedComPort: "",
        connected: false,
        safetyRssi: 0,
        smartSenseCutOff: 0,
        minLapTime: 0,
        channel: 0,
        currentRSSI: 0
      },
      {
        selectedComPort: "",
        connected: false,
        safetyRssi: 0,
        smartSenseCutOff: 0,
        minLapTime: 0,
        channel: 0,
        currentRSSI: 0
      },
      {
        selectedComPort: "",
        connected: false,
        safetyRssi: 0,
        smartSenseCutOff: 0,
        minLapTime: 0,
        channel: 0,
        currentRSSI: 0
      }
    ]
  },
  methods: {
    resetBoxes: function(){
      for(var i = 0; i <= 4; i++){
        socket.emit('pe_driver',{cmd: "PE_CMD",number: i, pe_cmd: "RESET_TTIMES"});
      }
      this.timingData = [];
    },
    saveERLTHost: function(){
      socket.emit('pe_driver',{cmd: "SET_ERLT_HOST",host: this.erlt_host});
    }
  }
})



socket.on('pe_driver', function (data) {
  console.log(data);
  
  if(data['cmd'] == "REFRESH_COM_PORTS"){
    app.$data['com_ports'] = data['data'];
  }

  if(data['cmd'] == "CONNECT_TO_PORT"){
    app.$data['peDriver'][data['number']-1].connected = data['connected'];
    app.$data['peDriver'][data['number']-1].selectedComPort = data['port'];
  } 
  

  if(data['cmd'] == "DISCONNECT_FROM_PORT"){
    app.$data['peDriver'][data['number']-1].connected = data['connected'];
  }

  if(data['cmd'] == "GET_ERLT_HOST"){
    app.$data['erlt_host']= data['data'];
  }
  

  if(data['cmd'] == "INC_PE_DATA"){

    app.$data['serialLog'] = "Device "+ data['number'] + " > " + data['data'] + app.$data['serialLog'];

    if(data['data_splitted'][0] == "GSRSSI"){
      app.$data['peDriver'][data['number']-1].safetyRssi = data['data_splitted'][1];
    }
    
    if(data['data_splitted'][0] == "GSSCO"){
      app.$data['peDriver'][data['number']-1].smartSenseCutOff = data['data_splitted'][1];
    }

    if(data['data_splitted'][0] == "GMLT"){
      app.$data['peDriver'][data['number']-1].minLapTime = data['data_splitted'][1];
    }

    if(data['data_splitted'][0] == "CURRENT_CHANNEL"){
      app.$data['peDriver'][data['number']-1].channel = data['data_splitted'][1];
    }

    if(data['data_splitted'][0] == "C_RSSI_SIG_STR"){
      app.$data['peDriver'][data['number']-1].currentRSSI = data['data_splitted'][1];
    } 

    if(data['data_splitted'][0] == "T_TRACKED"){
      var t = {};
      t.number = data['number'];
      t.lap_time = data['data_splitted'][2];
      t.rssi = data['data_splitted'][3];

      app.$data['timingData'].push(t);
    }
    
  } 
});