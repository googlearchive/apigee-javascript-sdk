#Apigee JavaScript SDK


##Getting Started

Detailed instructions are available in our [Apigee JavaScript SDK install guide](http://apigee.com/docs/app-services/content/installing-apigee-sdk-javascript) but if you just want a quick example of how to get started with this SDK, here’s a minimal HTML5 file that shows you how to include & initialize the SDK, as well as how to read & write data from Apigee App Services with it.

Be sure to see the [full SDK documentation](http://apigee.com/docs/content/build-apps-home) at Apigee.

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

##App Monitoring

App monitoring is enabled by default by initializing the `Apigee.Client` object. 

###Network Call & App Usage Monitoring

The SDK will monitor app usage statistics, as well as network calls to track errors and usage. This configuration is pulled from the rules that you configure on the App Monitoring dashboard of the [admin console](https://apigee.com/appservices).

For more information, see [Monitoring app usage data](http://apigee.com/docs/app-services/content/monitoring-app-usage-data) and [Monitoring network performance](http://apigee.com/docs/app-services/content/monitoring-network-performance) in the Apigee docs.

###Simple and Advanced Logging

You can log specific events in your SDK by using one of the many log methods. You may also use the console logging methods to track messages. This is configured in the App Monitoring dashboard of the [admin console](https://apigee.com/appservices).

You can use the following methods for logging calls.

- `logVerbose()`
- `logDebug()`
- `logInfo()`
- `logWarn()`
- `logError()`
- `logAssert()`

For more information, see [Monitor app errors and crashes](http://apigee.com/docs/app-services/content/monitoring-app-errors-and-crashes) in the Apigee docs.

###Crash Reporting

The app monitoring portion of the SDK will monitor the window.onerror event to track if your app experiences javascript crashes.

For more information, see [Monitor app errors and crashes](http://apigee.com/docs/app-services/content/monitoring-app-errors-and-crashes) in the Apigee docs.

###Figuring out your device type

App monitoring will automatically detect the specific information about your device, analyze data that is collected by device type. The level of granularity in detection is also controlled by the App Monitoring dashboard of the [admin console](https://apigee.com/appservices).

For more information, see [Customizing app monitoring](http://apigee.com/docs/app-services/content/customizing-app-monitoring) in the Apigee docs.

##Mobile app development

###PhoneGap

No additional configuration is needed to use the Apigee JavaScript SDK in PhoneGap apps.

###Trigger.io configuration

The following plugins should be enabled:

1. is
2. event

Or the SDK will not function properly!

###Titanium Configuration

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

##Node.js Module and Other SDKs
Want to use Node.js? No problem - use the Usergrid Node Module. You can get it from [npm](https://npmjs.org/package/usergrid) and [GitHub](https://github.com/apigee/usergrid-node-module)

The syntax for this JavaScript SDK and the Usergrid Node module are almost exactly the same so you can easily transition between them.

We also have SDKs available for many other platforms, including Android, iOS, Ruby, .NET. Visit our [SDK download page](http://apigee.com/docs/app-services/content/app-services-sdks) for a full list.

##Tests 

Basic set of test cases can be found in the `/test` folder. Just open the tests.html file, and they will all run accordingly.

##More documentation

Head over to the [App Services documentation](http://apigee.com/docs/app-services) to learn more about how to use App Services in JavaScript!

##Comments / Questions
Please feel free to send comments or questions to the Usergrid Google group:

usergrid@googlegroups.com

Or just open github issues.  We want to know what you think, and will address all suggestions / comments / concerns.

Thank you!