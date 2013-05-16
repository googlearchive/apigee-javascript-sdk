##Apigee Mobile Analytics Javascript SDK

This is the first version of the mobile analytics javascript SDK it can help you monitor your HTML5 mobile apps with the following features.

1. Crash Reporting
2. Network Call Monitoring
3. Simple and Advanced Logging
4. Figuring out your device type

###Getting Started

To get started you simply need to add the analytics.js file to your apps html page and initialize the client like so:

    <script type="text/javascript" src="js/analytics.js"></script>

Then in your client code initialize a new instance of the Apigee.MobileAnalytics object.

        var options = {
            orgName:"",
            appName:"",
            crashReportingEnabled:true,
        }
        var max = new Apigee.MobileAnalytics(options);


####Crash Reporting

The mobile analytics SDK will monitor the window.onerror event to track if your app experiences javascript crashes. It will log all the proper debugging information in mobile analytics itself! To turn it on simply set the ```crashReportingEnabled``` property on the options object to ```true```.

####Network Call Monitoring

The SDK will also monitor your network calls to track errors and usage. To make sure we intercept your network calls and report them set the ```interceptNetworkCalls``` property to ```true```.

####Simple and Advanced Logging

You can log specific events in your SDK by using one of the many log methods.

####Figuring out your device type

The mobile analytics SDK will automatically detect the specific information about your device, analyze data that is collected by device type.
