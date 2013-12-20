#Building the SDK from source

If you have downloaded the Apigee JavaScript SDK from GitHub, you will need to build the full SDK (apigee.js) from source. As of v2.0.6, we're using the [Grunt](http://gruntjs.com/) task runner to build the Apigee library from modular components.

##Procedure

You will need to have [NodeJS](http://nodejs.org/) installed on your system. The following steps will produce _apigee.js_ and _apigess.min.js_ files in the project's _source_ directory.

1. `npm install grunt-cli -g` _*may require elevated privileges_
2. `git clone https://github.com/apigee/apigee-javascript-sdk.git apigee-javascript-sdk`
3. `cd apigee-javascript-sdk`
4. `npm install`
5. `grunt`

##Running the sample apps from localhost

With Grunt, you can run all of the apps in the /samples directory from locahost by starting a simple web server. To do this, run `grunt dev`. You can then access the samples at port 3000 on localhost. 

- [README Sample](http://localhost:3000/samples/readmeSample/index.html)
- [Entities](http://localhost:3000/samples/entities/index.html)
- [Collections](http://localhost:3000/samples/collections/index.html)
- [Monitoring](http://localhost:3000/samples/monitoring/index.html)
- [Geolocation](http://localhost:3000/samples/geolocation/index.html)
- [Books Sample](http://localhost:3000/samples/books/index.html)
- [Push Notifications - iOS](http://localhost:3000/samples/push/ios/www/index.html)
- [Push Notifications - Android](http://localhost:3000/samples/push/ios/assets/www/index.html)
- [Messagee (a simple twitter clone)](http://localhost:3000/samples/messagee/index.html)