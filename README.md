#Apigee JavaScript SDK


##App Services Getting Started

Detailed instructions follow but if you just want a quick example of how to get started with this SDK, here’s a minimal HTML5 file that shows you how to include & initialize the SDK, as well as how to read & write data from Apigee App Services with it.

```html
<!DOCTYPE html>
<html>
	<head>
		<!-- Don't forget to download and include the SDK -->
		<!-- It’s available at https://raw.github.com/apigee/apigee-javascript-sdk/master/source/apigee.js -->
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
##Build

With v2.0.6, we're using the [Grunt](http://gruntjs.com/) task runner to build the Apigee library from modular components. You will need to have [NodeJS](http://nodejs.org/) installed on your system. The following steps will produce _apigee.js_ and _apigess.min.js_ files in the project's _source_ directory.

+ `npm install grunt-cli -g` _*may require elevated privileges_
+ `git clone https://github.com/apigee/apigee-javascript-sdk.git apigee-javascript-sdk`
+ `cd apigee-javascript-sdk`
+ `npm install`
+ `grunt`

##App Monitoring Getting Started

App monitoring is enabled by default by initializing the `Apigee.Client` object. You can also use the following methods for logging calls.

- `logVerbose()`
- `logDebug()`
- `logInfo()`
- `logWarn()`
- `logError()`
- `logAssert()`

##More documentation

Head over to the [Apigee Mobile SDK wiki](https://github.com/apigee/apigee-javascript-sdk/wiki) to learn more about how to use App Services in JavaScript!

##Crash Reporting

The app monitoring portion of the SDK will monitor the window.onerror event to track if your app experiences javascript crashes.

##Network Call Monitoring

The SDK will also monitor your network calls to track errors and usage. This configuration is pulled from the rules that you configure on the App Monitoring dashboard.

##Simple and Advanced Logging

You can log specific events in your SDK by using one of the many log methods. You may also use the console logging methods to track messages. This is configured in the App Monitoring dashboard.

##Figuring out your device type

App monitoring will automatically detect the specific information about your device, analyze data that is collected by device type. The level of granularity in detection is also controlled by the App Monitoring dashboard.

##Examples

You can start a simple web server by running `grunt dev`. You can then access the samples at port 3000 on localhost. 

+ [README Sample](http://localhost:3000/samples/readmeSample.html)
+ [Entities](http://localhost:3000/samples/entities.html)
+ [Collections](http://localhost:3000/samples/collections.html)
+ [Monitoring](http://localhost:3000/samples/monitoringSample.html)
+ [Geolocation](http://localhost:3000/samples/geolocation.html)
+ [Books Sample](http://localhost:3000/samples/booksSample.html)
+ [Messagee (a simple twitter clone)](http://localhost:3000/samples/messagee/messageeSample.html)

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

Like [Usergrid](https://github.com/apigee/usergrid-node-module), the Apigee JavaScript SDK is open source and licensed under the Apache License, Version 2.0.

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
