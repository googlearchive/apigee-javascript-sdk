# Targets

A mobile app to locate the Target stores nearest you. Made in HTML5 + PhoneGap

To see the web version running live, go to: http://timanglade.github.com/targets/www/index.html

The entire app is contained in www/index.html (all the HTML & JS is in there), but the project will also work fine on your iOS mobile device using Cordova / PhoneGap. Just clone the repo, double-click the xcodeproj and build.

If you want to import the dataset (stores.json, at the root of this repo) into your own Usergrid / Apigee App Services account, you can do so by posting the file directly to the API. For example, with curl:

    curl -X POST -d '@stores.json' https://api.usergrid.com/<YOUR ORGANIZATION>/<YOUR APP>/<YOUR COLLECTION>

Send all comments and questions to tim@apigee.com!
