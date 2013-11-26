## Apigee Push Notifications for iOS with Phonegap!

This sample illustrates how you can add support for push notifications in an HTML5/JavaScript app run on an iOS device. In the [Apigee documentation](http://apigee.com/docs/app-services/content/tutorial-push-notifications-sample-app), you'll find more information in a complete walkthrough on adding push notifications support.

The sample features the following:

- HTML5 for a simple UI and JavaScript for logic.
- The Apigee JavaScript SDK for access to app services.
- PhoneGap (based on Apache Cordova) for native mobile device support. 
- A PhoneGap plugin to support push notifications.

### Prerequisites

To use this sample, you should first:

- Create an app services account, organization, and application.
- Have an app services application that requires no authentication (such as your sandbox).
- Create an Apple APNs account through which to send notifications.
- Create an app services notifier through which you can create notifications and target recipients.
- Have an iOS device to test with. Push notifications aren't supported in the Xcode emulator.

### Configuring the app

When you open the sample in Xcode, do the following to get things running:

- In Xcode, on the General tab, in the Bundle Identifer box, enter the App ID associated with your APNs provisioning profile.
- In the Build Settings tab, under Deployment, for the iOS Deployment Target select the iOS version on your connected device. The version is displayed in the Xcode Organizer.
- In the Build Settings tab, under Code Signing, under Code Signing Identity > Debug, select the Apple signing certificate corresponding to your developer identity.

Finally, edit the JavaScript code so that it will access your app services account:

- Make the following changes in /www/js/index.js:
    - orgName: Your Apigee organization.
    - appName: The app in your organization where you created the notifier (for example, "sandbox").
    - notifier: Name of the app services notifier you created.
