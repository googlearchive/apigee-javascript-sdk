## Apigee App Services Push Notifications with Phonegap!

This is a Apache Cordova based example that harnesses App Services push notifications. This app assumes you have already configured your bundle identifier with Apple to recieve push notifications, and that you've already setup a notifier on Apigee App Services.

 You'll need to edit a few things to get started with receiving push notifications:

1. In your project settings change the Bundle Identifier property to that of the bundle identifier you used to setup push notifications
2. In index.js you'll need to replace the values orgName on lines 49 and 67 with your Apigee.com username.

