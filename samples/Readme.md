#Apigee JavaScript SDK Sample Apps

The sample apps in this directory are intended to show basic usage of some of the major features of App Services using the Apigee JavaScript SDK. By default, all of the sample apps are set up to use the unsecured 'sandbox' application that was created for you when you created your Apigee account.

##Included Samples Apps

* **messagee** - A Twitter-like app that uses data store, social and user management features.
* **push** - An app that sends push notifications to mobile devices using APNS or GCM.
* **booksSample** - A 'list' app that lets the user create, retrieve and perform geolocation queries on a list of books. This sample also makes use of jQuery and jQuery mobile.
* **collections** - An app that shows you how to perform basic CRUD operations on collections in your account.
* **entities** - An app that shows you how to perform basic CRUD operations on entities in your account.
* **geolocation** - An app that shows you how to creates entities with location data, and perform geolocation queries to retrieve them.
* **monitoringSample** - An app that lets you test the App Monitoring feature by sending logging, crash and error reports to your account.
* **readmeSample** - Similar to the booksSample app. This app retrieves the 'books' collection from your account and displays all the title of each 'book' entity as a JavaScript alert.

##Running the sample apps

To run the sample apps, you must first include the SDK in the project. To do this, put a copy of apigee.js (located in the /source directory) in the app's <code>/js</code> directory.
	
In the code, we have already properly included apigee.js in the &lt;head&gt; of the app:

	```html
<script src="js/apigee.js"></script>
```

Now simply open the project's index.html file in your brower!