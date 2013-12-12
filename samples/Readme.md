#Apigee JavaScript SDK Sample Apps

The sample apps in this directory are intended to show basic usage of some of the major features of App Services using the Apigee JavaScript SDK. By default, all of the sample apps are set up to use the unsecured 'sandbox' application that was created for you when you created your Apigee account.

##Included Samples Apps
* messagee - A Twitter-like app that uses data store, social and user management features.
* push - An app that sends push notifications to mobile devices using APNS or GCM.
* booksSample - A 'list' app that lets the user create, retrieve and perform geolocation queries on a list of books. This sample also makes use of jQuery and jQuery mobile.
* collections - An app that shows you how to perform basic CRUD operations on collections in your account.
* entities - An app that shows you how to perform basic CRUD operations on entities in your account.
* geolocation - An app that shows you how to creates entities with location data, and perform geolocation queries to retrieve them.
* monitoringSample - An app that lets you test the App Monitoring feature by sending logging, crash and error reports to your account.
* readmeSample - Similar to the booksSample app. This app retrieves the 'books' collection from your account and displays all the title of each 'book' entity as a JavaScript alert.

##Running the sample apps

To run the sample apps, simply open its index.html file in a browser.

Before you do, however, each of the sample apps require you to do two things:

* Include the Apigee JavaScript SDK

If you downloaded the SDK and are running the apps from the /samples directory, we have already properly included apigee.js (the SDK) for you in the <head> of the app:

```html
<script src="../source/apigee.js"></script>
```

If you have moved any of the samples, you will need to update the relative path to apigee.js for the sample to run properly.

* Provide your Apigee organization name

Each of these apps are designed to use the default, unsecured 'sandbox' application that was included when you created your Apigee account. To access your data store, you will need to provide your organization name by updating the call to Apigee.Client in each sample app. Near the top of the code in each app, you should see something similar to this:

```html
var client = new Apigee.Client({
	orgName:'yourorgname', // Your Apigee.com username for App Services
	appName:'sandbox' // Your Apigee App Services app name
});
```

Simply change the value of the orgName property to your Apigee organization name.

##Running the sample apps from localhost

You can start a simple web server by running `grunt dev`. You can then access the samples at port 3000 on localhost. 

- [README Sample](http://localhost:3000/samples/readmeSample.html)
- [Entities](http://localhost:3000/samples/entities.html)
- [Collections](http://localhost:3000/samples/collections.html)
- [Monitoring](http://localhost:3000/samples/monitoringSample.html)
- [Geolocation](http://localhost:3000/samples/geolocation.html)
- [Books Sample](http://localhost:3000/samples/booksSample.html)
- [Messagee (a simple twitter clone)](http://localhost:3000/samples/messagee/messageeSample.html)