##Apigee Push Notifications for Android using PhoneGap

This sample illustrates how you can add support for push notifications in an HTML5/JavaScript app run on an Android device. In the [Apigee documentation](http://apigee.com/docs/app-services/content/tutorial-push-notifications-sample-app), you'll find more information in a complete walkthrough on adding push notifications support.

The sample features the following:

- HTML5 for a simple UI and JavaScript for logic.
- The Apigee JavaScript SDK for access to app services.
- PhoneGap (based on Apache Cordova) for native mobile device support. 
- A PhoneGap plugin to support push notifications.

### Prerequisites

To use this sample, you should first:

- Create an app services account, organization, and application.
- Have an app services application that requires no authentication (such as your sandbox).
- Create a Google API account through which to send notifications.
- Create an app services notifier through which you can create notifications and target recipients.
- Have an Android device to test with or configure the Android emulator so that it supports push notifications.

### Configuring the app

When you open the sample in your IDE, do the following before running the project as an Android Application:

- In AndroidManifest.xml, be sure the proper Android permissions are included. This includes READ_PHONE_STATE and VIBRATE.
- In your project properties, go to Java Build Path > Libraries and add all the JAR files from the project's /libs directory.
- If you're using an emulator, configure the emulator to use the Google APIs Level 16 target or above. Be sure your emulator supports receiving push notifications, as described in Apigee documentation linked above.

Finally, edit the JavaScript code so that it will access your app services account:

- Make the following changes in assets/www/js/index.js:
    - orgName: Your Apigee organization.
    - appName: The app in your organization where you created the notifier (for example, "sandbox").
    - notifier: Name of the app services notifier you created.
    - senderID: Your API project number (the project must support Google Cloud Messaging for Android (GCM)).
