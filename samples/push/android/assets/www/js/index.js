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

var client = null;

function register(token) {
  console.log("registering device...");
  if(token) {
    var options = {
      notifier:"apigeepush2",
      deviceToken:token
    };

    client.registerDevice(options, function(error, result){
      if(error) {
          console.log(error);
      } else {
          console.log(result);
      }
    });
  }
}

//Handler function for APN notifications.
function onNotificationAPN(event) {
    console.log(JSON.stringify(event, undefined, 2));
    if (event.alert) {
        navigator.notification.alert(event.alert);
    }
    
    if (event.sound) {
        var snd = new Media(event.sound);
        snd.play();
    }
    
    if (event.badge) {
        pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);
    }
}


//Handler function for GCM Push notifications
function onNotificationGCM(e) {
  $("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');

  switch( e.event )
  {
      case 'registered':
      if ( e.regid.length > 0 )
      {
          $("#app-status-ul").append('<li>REGISTERED -> REGID:' + e.regid + "</li>");
          // Your GCM push server needs to know the regID before it can push to this device
          // here is where you might want to send it the regID for later use.
          console.log("regID = " + e.regid);
          register(e.regid);
      }
      break;

      case 'message':
          // if this flag is set, this notification happened while we were in the foreground.
          // you might want to play a sound to get the user's attention, throw up a dialog, etc.
          if (e.foreground)
          {
              $("#app-status-ul").append('<li>--INLINE NOTIFICATION--' + '</li>');

              // if the notification contains a soundname, play it.
              var my_media = new Media("/android_asset/www/"+e.soundname);
              my_media.play();
          }
          else
          {   // otherwise we were launched because the user touched a notification in the notification tray.
              if (e.coldstart)
                  $("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
              else
              $("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
          }

          $("#app-status-ul").append('<li>MESSAGE -> MSG: ' + e.payload.data + '</li>');
          alert("Your message:"+e.payload.data+" !");
      break;

      case 'error':
          $("#app-status-ul").append('<li>ERROR -> MSG:' + e.msg + '</li>');
      break;

      default:
          $("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
      break;
  }
}

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
},
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
onDeviceReady: function() {
    
    client = new Apigee.Client({
                                   orgName:"mdobson",
                                   appName:"instapic-dev",
                                   logging:true
                                   });
    var pushNotification = window.plugins.pushNotification;
    //Token handler for device registrations
    function tokenHandler(status) {
      register(status);
    }

    //Error handler
    function errorHandler(error){ console.log("error:"+error);}

    function successHandler(result) {console.log("whee");}
    if (device.platform == 'android' || device.platform == 'Android') {
        pushNotification.register(successHandler, errorHandler, {"senderID":"759022121439", "ecb":"onNotificationGCM"});
    } else {
        pushNotification.register(tokenHandler, errorHandler, {"badge":"true", "sound":"true", "alert":"true", "ecb":"onNotificationAPN"});
    }

    $("#push").on("click", function(e){
                  //push here
                  
                  var devicePath = "devices/"+client.getDeviceUUID()+"/notifications";
                  var options = {
                  notifier:"apigeepush",
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
