/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */



var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('push-notification', function(event) {
            console.log('push-notification!:'+JSON.stringify(event.notification));
            navigator.notification.alert(event.notification.aps.alert);
        });
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        var client = new Apigee.Client({
            orgName:"YOUR APIGEE.COM USERNAME",
            appName:"sandbox",
            logging:true
        });
        var pushNotification = window.plugins.pushNotification;
        pushNotification.registerDevice({alert:true, badge:true, sound:true}, function(status) {
            if(status.deviceToken) {
                var options = {
                    notifier:"YOUR NOTIFIER",
                    deviceToken:status.deviceToken
                };
                
                client.registerDevice(options, function(error, result){
                  if(error) {
                    console.log(error);
                  } else {
                    console.log(result);
                  }
                });
            }
        });
        
        $("#push").on("click", function(e){
            //push here
            
            var devicePath = "devices/"+client.getDeviceUUID()+"/notifications";
            var options = {
                notifier:"YOUR NOTIFIER",
                path:devicePath,
                message:"hello world from JS"
            };
            client.sendPushToDevice(options, function(error, data){
                if(error) {
                    console.log(data);
                } else {
                    console.log("push sent");
                }
            });
        });
        
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};
