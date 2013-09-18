## Apigee Push Notification Samples Featuring PhoneGap 2.X

<br/>
This sample is meant to illustrate of how to integrate push into your PhoneGap based applications for PhoneGap 2.X.

###Instructions

1. First download this repo as a `.zip`  file.
2. Next locate the PhoneGap push plugin for your specific version of PhoneGap.
	1. A good place to start would be [here](https://github.com/phonegap/phonegap-plugins)
3. Install the plugin into your PhoneGap app
	1. If you are having trouble doing this consult the [PhoneGap documentation](http://docs.phonegap.com/en/2.8.0/guide_plugin-development_index.md.html#Plugin%20Development%20Guide)

4. Look in the `www/js/index.js` file for the PhoneGap specific implementation:

```

    //Listening for a push notification
    document.addEventListener('push-notification', function(event) {
        console.log('push-notification!:'+JSON.stringify(event.notification));
        navigator.notification.alert(event.notification.aps.alert);
    });

    //push registration
	var pushNotification = window.plugins.pushNotification;
    pushNotification.registerDevice({alert:true, badge:true, sound:true}, function(status) {
        //Device has been registered with push service (GCM, APNS)
    });
```

5. Fill out your Apigee credentials for push notifications in their specific code.

```

		//Create an Apigee Client
        var client = new Apigee.Client({
            orgName:"YOUR APIGEE.COM USERNAME",
            appName:"sandbox",
            logging:true
        });
        
        //Attach PhoneGap push plugin to Window
        var pushNotification = window.plugins.pushNotification;
        //Register the device with the APNS and/or GCM
        pushNotification.registerDevice({alert:true, badge:true, sound:true}, function(status) {
        	//If a token was returned
            if(status.deviceToken) {
                //Setup device registration with Apigee
                var options = {
                	 //Alter to have your notifier name
                    notifier:"YOUR NOTIFIER",
                    deviceToken:status.deviceToken
                };
                
                //Register the actual device
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
            
            //Get the devices UUID that was assigned to it from Apigee
            var devicePath = "devices/"+client.getDeviceUUID()+"/notifications";
            //Setup a push notification object
            var options = {
                //Alter to have your Notifier name
                notifier:"YOUR NOTIFIER",
                path:devicePath,
                message:"hello world from JS"
            };
            //Send the push notification to the device.
            client.sendPushToDevice(options, function(error, data){
                if(error) {
                    console.log(data);
                } else {
                    console.log("push sent");
                }
            });
        });
        
```
6. Run on device or simulator. A single screen with one button should appear, and upon pressing the button a push notification should appear.