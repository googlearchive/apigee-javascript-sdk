#Apigee Mobile Javascript SDK -- Beta


##App Services Getting Started

Detailed instructions follow but if you just want a quick example of how to get started with this SDK, here’s a minimal HTML5 file that shows you how to include & initialize the SDK, as well as how to read & write data from Apigee App Services with it.

```html
<!DOCTYPE html>
<html>
	<head>
		<!-- Don't forget to download and include the SDK -->
		<!-- It’s available at the root of github.com/apigee/mobileanalytics-javascript-sdk/js -->
		<script src="path/to/apigee.js"></script>

		<script type="text/javascript">
		
			// Initializing the SDK
			var client = new Apigee.Client({
				orgName:'yourorgname', // Your Apigee.com username for App Services
				appName:'sandbox' // Your Apigee App Services app name
			});

			// Reading data
			var books = new Apigee.Collection({ "client":client, "type":"books" });
			books.fetch(
				function(err, data) { // Success
					if (err) {
						alert("read failed");
					} else {
						while(books.hasNextEntity()) {
							var book = books.getNextEntity();
							alert(book.get("title")); // Output the title of the book
						}
					}
				});

			// Uncomment the next 4 lines if you want to write data
			
			// book = { "title": "the old man and the sea" };
			// books.addEntity(book, function (error, response) {
			// 	if (error) { alert("write failed");
			// 	} else { alert("write succeeded"); } });
		</script>
	</head>
	<body></body>
</html>
```

##Mobile Analytics Getting Started

**Note:** Please note that this functionality is Beta only.  

To start Apigee App Monitoring, pass 'monitoringEnabled:true' to Apigee.Client when it is instantiated. A new instance of Apigee.Monitoring client will automatically be created for you. You can then access App Monitoring methods using the 'monitor' member variable of the Apigee.Client object.

For example, you would modify the 'App Services Getting Started' code above as follows:

```html
// Initializing the SDK
var client = new Apigee.Client({
	orgName:'yourorgname', // Your Apigee.com username for App Services
	appName:'sandbox', // Your Apigee App Services app name
	monitoringEnabled:true
});
```
This will enable you to access the App Monitoring functions of the SDK using 'client.monitor'.

One additional argument called `syncOnClose` may be passed to Apigee.Client. if set to true then the SDK will sync on the closing of the web page, or of your respective native app. If set to false then it will sync on the interval specified in your config file.

##More documentation

Head over to the [Apigee Mobile SDK wiki](https://github.com/apigee/mobileanalytics-javascript-sdk/wiki) to learn more about how to use App Services in JavaScript!

##Crash Reporting

The mobile analytics SDK will monitor the window.onerror event to track if your app experiences javascript crashes.

##Network Call Monitoring

The SDK will also monitor your network calls to track errors and usage. This configuration is pulled from the rules that you configure on the Mobile Analytics dashboard.

##Simple and Advanced Logging

You can log specific events in your SDK by using one of the many log methods. You may also use the console logging methods to track messages. This is configured in the Mobile Analytics dashboard.

##Figuring out your device type

The mobile analytics SDK will automatically detect the specific information about your device, analyze data that is collected by device type. The level of granularity in detection is also controlled by the Mobile Analytics dashboard.

##Examples

There are two examples in the `/examples` folder. These are two small single page web apps that will demonstrate how to call the SDK logging, how crashes are tracked, and network calls are monitored.

##Tests 

Basic set of test cases can be found in the `/test` folder. Just open the tests.html file, and they will all run accordingly.

##Trigger.io configuration

The following plugins should be enabled:

1. is
2. event

Or the SDK will not function properly!

##Titanium Configuration

For the SDK to properly report device based metrics like OS and version name we need to add this snippet of code anywhere in your `app.js` file.

	Ti.App.addEventListener('analytics:attachReady', function(e){
		Ti.App.fireEvent('analytics:platformMetrics', 
		{
			name:Titanium.Platform.name, 
			osname:Titanium.Platform.getOsname(), 
			model:Titanium.Platform.getModel(), 
			networkType:Titanium.Network.getNetworkTypeName(), 
			uuid:Titanium.Platform.createUUID()
		});
	});

## Contributing
We welcome your enhancements!

Like [Usergrid](https://github.com/apigee/usergrid-node-module), the Usergrid Javascript SDK is open source and licensed under the Apache License, Version 2.0.

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push your changes to the upstream branch (`git push origin my-new-feature`)
5. Create new Pull Request (make sure you describe what you did and why your mod is needed)

##More information
For more information on Apigee App Services, visit <http://apigee.com/about/developers>.

## Copyright
Copyright 2013 Apigee Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
