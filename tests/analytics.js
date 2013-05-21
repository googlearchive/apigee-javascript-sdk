//Hack around IE console.log
window.console = window.console || {};
window.console.log = window.console.log || function() {};


//Wrap this all up in a nice simple module export.
var Apigee = (function(){

  //I dislike repeating strings so this goes here. All constants to the top!
  var VERBS = {
    get:"GET",
    post:"POST",
    put:"PUT",
    del:"DELETE",
    head:"HEAD"
  };

  var SDKVERSION = "0.0.1";

  var LOGLEVELS = {
    verbose: "V",
    debug: "D",
    info:  "I",
    warn: "W",
    error: "E",
    assert: "A"
  };

  var LOGLEVELNUMBERS = {
    verbose:2,
    debug:3,
    info:4,
    warn:5,
    error:6,
    assert:7
  }

  var UNKNOWN = "UNKNOWN";

  var Apigee = {};
  //Work around hack because onerror is always called in the window context so we can't store crashes internally
  //This isn't too bad because we are encapsulated.
  var logs = [];
  var metrics = [];
  //Constructor for mobile analytics SDK
  Apigee.MobileAnalytics = function(options) {
    this.orgName = options.orgName;
    this.appName = options.appName;

    //Put this in here because I don't want sync issues with testing.
    this.testMode = options.testMode || false;
    //You best know what you're doing if you're setting this for mobile analytics!
    this.apiUrl = typeof options.apiUrl === "undefined" ? "https://api.usergrid.org/" : options.apiUrl;
    
    this.syncDate = timeStamp();

    //Can do a manual config override specifiying raw json as your config. I use this for testing. 
    //May be useful down the road. Needs to conform to current config.

    if(typeof options.config !== "undefined") {
      this.configuration = options.config;
      if(this.configuration.deviceLevelOverrideEnabled === true) {
        this.deviceConfig = this.configuration.deviceLevelAppConfig;
      } else if(this.abtestingOverrideEnabled === true){
        this.deviceConfig = this.configuration.abtestingAppConfig;
      } else {
        this.deviceConfig = this.configuration.defaultAppConfig;
      }
    } else {
      this.downloadConfig();
    }

    //Don't do anything if configuration wasn't loaded.
    if(this.configuration !== null) {
      
      //Ensure that we want to sample data from this device.
      var sampleSeed = 0; 
      if(this.deviceConfig.samplingRate < 100) {
        sampleSeed = Math.floor(Math.random() * 101)
      }

      //If we're not in the sampling window don't setup data collection at all
      if(sampleSeed < this.deviceConfig.samplingRate){
        this.appId = this.configuration.instaOpsApplicationId;

        //Let's monkeypatch logging calls to intercept and send to server.
        if(this.deviceConfig.enableLogMonitoring) {
          this.patchLoggingCalls();
        }

        // var syncInterval = 3000;
        // if (typeof this.deviceConfig.agentUploadIntervalInSeconds !== "undefined") {
        //   syncInterval = this.deviceConfig.agentUploadIntervalInSeconds;
        // }
        

        //Needed for the setInterval call for syncing. Have to pass in a ref to ourselves. It blows scope away.
        //var self = this;
        //Old server syncing logic
        // setInterval(function(){
        //   var syncObject = {};
        //   //Just in case something bad happened.
        //   if(typeof self.sessionMetrics !== "undefined") {
        //     syncObject.sessionMetrics = self.sessionMetrics;
        //   }
        //   var syncFlag = false;
        //   self.syncDate = timeStamp();
        //   //Go through each of the aggregated metrics
        //   //If there are unreported metrics present add them to the object to be sent across the network
        //   if(metrics.length > 0) {
        //     syncFlag = true;
        //   }

        //   if(logs.length > 0) {
        //     syncFlag = true;
        //   }

        //   syncObject.logs = logs;
        //   syncObject.metrics = metrics;
          
        //   //If there is data to sync go ahead and do it.
        //   if(syncFlag && !self.testMode) {
        //     self.sync(syncObject);
        //   }

        // }, syncInterval);

        //Setting up the catching of errors and network calls
        if(this.deviceConfig.networkMonitoringEnabled) {
           this.patchNetworkCalls(XMLHttpRequest);
        }
        
        window.onerror = Apigee.MobileAnalytics.catchCrashReport;
        
        //setup more intelligent sync rules.


        window.addEventListener("beforeunload", function(e){
          
        });


        
      }
    } else {
      console.log("Error configuration unavailable.");
    }
  }
  
  /*
  * Function for downloading the current mobile analytics configuration.
  *
  * @method downloadConfig
  * @public
  * @params {function} callback
  * NOTE: Passing in a callback makes this call async. Wires it all up for you.
  *
  */
  Apigee.MobileAnalytics.prototype.downloadConfig = function(callback){
    var configRequest = new XMLHttpRequest();
    var path = this.apiUrl + this.orgName + '/' + this.appName + '/apm/apigeeMobileConfig';
    //If we have a function lets load the config async else do it sync.
    if(typeof callback === "function") {
      configRequest.open(VERBS.get, path, true);
      configRequest.setRequestHeader("Accept", "application/json");
      configRequest.setRequestHeader("Content-Type","application/json");
      configRequest.onreadystatechange = onreadystatechange;
      configRequest.send();
    } else {
      configRequest.open(VERBS.get, path, false);
      configRequest.setRequestHeader("Accept", "application/json");
      configRequest.setRequestHeader("Content-Type","application/json");
      configRequest.send();
      if(configRequest.status === 200) {
        var config = JSON.parse(configRequest.responseText);
        this.configuration = config;
        if(config.deviceLevelOverrideEnabled === true) {
          this.deviceConfig = config.deviceLevelAppConfig;
        } else if(this.abtestingOverrideEnabled === true){
          this.deviceConfig = config.abtestingAppConfig;
        } else {
          this.deviceConfig = config.defaultAppConfig;
        }
      } else {
        //When tapping into the configuration. If it's null let's assume bad things happened.
        this.configuration = null;
      }
    }

    //A little async magic. Let's return the AJAX issue from downloading the configs.
    //Or we can return the parsed out config.
    function onReadyStateChange() {
      if(configRequest.readyState === 4) {
        if(configRequest.status === 200) {
          callback(null, JSON.parse(configRequest.responseText));
        } else {
          callback(configRequest.statusText);
        }
      }
    }
  }


  /*
  * Function for syncing data back to the server. Currently called in the Apigee.MobileAnalytics constructor using setInterval.
  * 
  * @method sync
  * @public
  * @params {object} syncObject
  *
  */
  Apigee.MobileAnalytics.prototype.sync = function(syncObject){
    //Sterilize the sync data
    var syncData = {}
    syncData.logs = syncObject.logs;
    syncData.metrics = syncObject.metrics;
    syncData.sessionMetrics = this.sessionMetrics;
    syncData.orgName = this.orgName;
    syncData.appName = this.appName;
    syncData.fullAppName = this.orgName + '_' + this.appName;
    syncData.instaOpsApplicationId = this.configuration.instaOpsApplicationId;
    syncData.timeStamp = timeStamp();

    //Send it to the apmMetrics endpoint.
    var syncRequest = new XMLHttpRequest();
    var path = this.apiUrl + this.orgName + '/' + this.appName + '/apm/apmMetrics';
    syncRequest.open(VERBS.post, path, false);
    syncRequest.setRequestHeader("Accept", "application/json");
    syncRequest.setRequestHeader("Content-Type","application/json");
    syncRequest.send(JSON.stringify(syncData));
    
    //Only wipe data if the sync was good. Hold onto it if it was bad.
    if(syncRequest.status === 200) {
      logs = [];
      metrics = [];
      var response = syncRequest.responseText;
      console.log(response);
    } else {
      //Not much we can do if there was an error syncing data.
      //Log it to console accordingly.
      console.log("Error syncing");
      console.log(syncRequest.responseText);
    }
  }

  /*
  * Function that is called during the window.onerror handler. Grabs all parameters sent by that function.
  *
  * @method catchCrashReport
  * @public 
  * @param {string} crashEvent
  * @param {string} url
  * @param {string} line
  *
  */
  Apigee.MobileAnalytics.catchCrashReport = function(crashEvent, url, line) {
    logCrash({tag:"CRASH", logMessage:"Error:"+crashEvent+" for url:"+url+" on line:"+line});
  }

  /*
  * Registers a device with mobile analytics. Generates a new UUID for a device and collects relevant info on it.
  *
  * @method registerDevice
  * @public 
  *
  */
  Apigee.MobileAnalytics.prototype.startSession = function() {
    //If the user agent string exists on the device
    var sessionSummary = {};
    sessionSummary.timeStamp = timeStamp();
    //Lets set all the automatically unknowns
    sessionSummary.networkCarrier = UNKNOWN;
    sessionSummary.deviceCountry = UNKNOWN;
    sessionSummary.batteryLevel = "-100";
    sessionSummary.networkSubType = UNKNOWN;
    sessionSummary.networkCountry = UNKNOWN;
    sessionSummary.sessionId = randomUUID();
    sessionSummary.applicationVersion = "1.0";
    sessionSummary.appId = this.appId.toString();
    sessionSummary.sdkType = "javascript";


    //We're checking if it's a phonegap app.
    //If so let's use APIs exposed by phonegap to collect device info.
    //If not let's fallback onto stuff we should collect ourselves.
    if (isPhoneGap()) {
      //framework is phonegap.
      sessionSummary.devicePlatform = window.device.platform;
      sessionSummary.deviceOperatingSystem = window.device.version;
      
      //Get the device id if we want it. If we dont, but we want it obfuscated generate
      //a one off id and attach it to localStorage.
      if(this.deviceConfig.deviceIdCaptureEnabled) {
        if(this.deviceConfig.obfuscateDeviceId) {
          sessionSummary.deviceId = generateDeviceId();
        } else {
          sessionSummary.deviceId = window.device.uuid;
        }
      } else {
        if(this.deviceConfig.obfuscateDeviceId) {
          sessionSummary.deviceId = generateDeviceId();
        } else {
          sessionSummary.deviceId = UNKNOWN;
        }
      }

      sessionSummary.deviceModel = window.device.name;
      sessionSummary.networkType = navigator.network.connection.type;

    } else if (isTrigger()) {
      //Framework is trigger
      var os = UNKNOWN;
      if(forge.is.ios()){
        os = "iOS";
      } else if(forge.is.android()) {
        os = "Android";
      }
      sessionSummary.devicePlatform = UNKNOWN;
      sessionSummary.deviceOperatingSystem = os;
      
      //Get the device id if we want it. Trigger.io doesn't expose device id APIs
      if(this.deviceConfig.deviceIdCaptureEnabled) {
        sessionSummary.deviceId = generateDeviceId();
      } else {
        sessionSummary.deviceId = UNKNOWN;
      }

      sessionSummary.deviceModel = UNKNOWN;
      forge.event.connectionStateChange.addListener(function(){
        this.sessionMetrics.networkType = forge.is.connection.wifi() ? "WIFI" : UNKNOWN;
      });
    } else if (isTitanium()) {
      //Framework is appcelerator
      sessionSummary.devicePlatform = window.Titanium.getName();
      sessionSummary.deviceOperatingSystem = window.Titanium.getOsname();
      
      //Get the device id if we want it. If we dont, but we want it obfuscated generate
      //a one off id and attach it to localStorage.
      if(this.deviceConfig.deviceIdCaptureEnabled) {
        if(this.deviceConfig.obfuscateDeviceId) {
          sessionSummary.deviceId = generateDeviceId();
        } else {
          sessionSummary.deviceId = window.Titanium.createUUID();
        }
      } else {
        if(this.deviceConfig.obfuscateDeviceId) {
          sessionSummary.deviceId = generateDeviceId();
        } else {
          sessionSummary.deviceId = UNKNOWN;
        }
      }

      sessionSummary.deviceModel = window.Titanium.getModel();
      sessionSummary.networkType = window.Titanium.Network.getNetworkTypeName();
    } else {
      //Can't detect framework assume browser.
      //Here we want to check for localstorage and make sure the browser has it
      if(typeof window.localStorage !== "undefined") {
        //If no uuid is set in localstorage create a new one, and set it as the session's deviceId

        if(this.deviceConfig.deviceIdCaptureEnabled) {
          sessionSummary.deviceId = generateDeviceId();
        } else {
          sessionSummary.deviceId = UNKNOWN;
        }
      }
      
      if(typeof navigator.userAgent !== "undefined") {
        //Small hack to make all device names consistent.
        var ua = navigator.userAgent.toLowerCase();
        //For now detect iPhone, iPod, Android, WebOS
        var device = UNKNOWN;
        if(/ipad/.test(ua)) {
          device = "iPad";
        } else if (/iphone/.test(ua)) {
          device = "iPhone";
        } else if (/android/.test(ua)) {
          device = "Android";
        } else if (/webos/.test(ua)) {
          device = "WebOS"
        }
        sessionSummary.deviceOperatingSystem = device;
      }

      if(typeof navigator.platform !== "undefined") {
        sessionSummary.devicePlatform = navigator.platform;
      }

      // if(typeof navigator.appVersion !== "undefined") {
      //   sessionSummary.appVersion = navigator.appVersion;
      // }

      if (typeof navigator.language !== "undefined") {
        sessionSummary.localLanguage = navigator.language;
      }

    }
    this.sessionMetrics = sessionSummary;
  }

  /*
  * Method to encapsulate the monkey patching of AJAX methods. We pass in the XMLHttpRequest object for monkey patching.
  *
  * @method catchCrashReport
  * @public 
  * @param {XMLHttpRequest} XHR
  *
  */
  Apigee.MobileAnalytics.prototype.patchNetworkCalls = function(XHR){
       "use strict";
       var apigee = this;
       var open = XHR.prototype.open;
       var send = XHR.prototype.send;
       
       XHR.prototype.open = function(method, url, async, user, pass) {
          this._method = method;
          this._url = url;
          open.call(this, method, url, async, user, pass);
       };
       
       XHR.prototype.send = function(data) {
          var self = this;
          var startTime;
          var oldOnReadyStateChange;
          var method = this._method;
          var url = this._url;
       
          function onReadyStateChange() {
              if(self.readyState == 4) // complete
              {
                  //gap_exec and any other platform specific filtering here
                  //gap_exec is used internally by phonegap, and shouldn't be logged.
                  if( url.indexOf("/!gap_exec") === -1 && url.indexOf(apigee.apiUrl) === -1) {
                      var endTime = timeStamp();
                      var latency = endTime - startTime;
                      var summary = { 
                                      url:url, 
                                      startTime:startTime.toString(), 
                                      endTime:endTime.toString(), 
                                      numSamples:"1", 
                                      latency:latency.toString(), 
                                      timeStamp:startTime.toString(),
                                      httpStatusCode:self.status,
                                      responseDataSize:self.responseText.length
                                    };
                      if(self.status == 200) {
                          //Record the http call here
                          summary.numErrors = "0";
                          console.log(JSON.stringify(summary));
                          apigee.logNetworkCall(summary);
                      } else {
                          //Record a connection failure here
                          summary.numErrors = "1";
                          apigee.logNetworkCall(summary);          
                      }
                  }
              }
   
              if(oldOnReadyStateChange) {
                  oldOnReadyStateChange();
              }
          }
       
          if(!this.noIntercept) {
              startTime = timeStamp();
       
              if(this.addEventListener) {
                  this.addEventListener("readystatechange", onReadyStateChange, false);
              } else {
                  oldOnReadyStateChange = this.onreadystatechange;
                  this.onreadystatechange = onReadyStateChange;
              }
          }
       
          send.call(this, data);
       } 
  }

  Apigee.MobileAnalytics.prototype.patchLoggingCalls = function(){
    //Hacky way of tapping into this and switching it around but it'll do.
    //We assume that the first argument is the intended log message. Except assert which is the second message.
    var self = this;
    var original = window.console
    window.console = {
        log: function(){
            self.logInfo({tag:"CONSOLE", logMessage:arguments[0]});
            original.log.apply(original, arguments);
        }
        , warn: function(){
            self.logWarn({tag:"CONSOLE", logMessage:arguments[0]});
            original.warn.apply(original, arguments);
        }
        , error: function(){
            self.logError({tag:"CONSOLE", logMessage:arguments[0]});
            original.error.apply(original, arguments);
        }, assert: function(){
            self.logAssert({tag:"CONSOLE", logMessage:arguments[1]});
            original.assert.apply(original, arguments);     
        }, debug: function(){
            self.logDebug({tag:"CONSOLE", logMessage:arguments[0]});
            original.debug.apply(original, arguments);
        }

    }

  }


  /*
  * Logs a user defined message.
  *
  * @method logMessage
  * @public 
  * @param {object} options
  *
  */
  Apigee.MobileAnalytics.prototype.logMessage = function(options) {
    var log = options || {};
    var cleansedLog = {
      logLevel:log.logLevel,
      logMessage: log.logMessage.substring(0, 250),
      tag: log.tag,
      timeStamp: timeStamp()
    }
    logs.push(cleansedLog);
  }

  /*
  * Logs a user defined verbose message.
  *
  * @method logDebug
  * @public 
  * @param {object} options
  *
  */
  Apigee.MobileAnalytics.prototype.logVerbose = function(options) {
    var logOptions = options || {};
    logOptions.logLevel = LOGLEVELS.verbose;
    if(this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.verbose ) {
      this.logMessage(options);
    }
  }

  /*
  * Logs a user defined debug message.
  *
  * @method logDebug
  * @public 
  * @param {object} options
  *
  */
  Apigee.MobileAnalytics.prototype.logDebug = function(options) {
    var logOptions = options || {};
    logOptions.logLevel = LOGLEVELS.debug;
    if(this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.debug ) {
      this.logMessage(options);
    }
  }

  /*
  * Logs a user defined informational message.
  *
  * @method logInfo
  * @public 
  * @param {object} options
  *
  */
  Apigee.MobileAnalytics.prototype.logInfo = function(options) {
    var logOptions = options || {};
    logOptions.logLevel = LOGLEVELS.info;  
    if(this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.info ) {
      this.logMessage(options);
    }
  }

  /*
  * Logs a user defined warning message.
  *
  * @method logWarn
  * @public 
  * @param {object} options
  *
  */
  Apigee.MobileAnalytics.prototype.logWarn = function(options) {
    var logOptions = options || {};
    logOptions.logLevel = LOGLEVELS.warn;
    if(this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.warn ) {
      this.logMessage(options);
    }
  }

  /*
  * Logs a user defined error message.
  *
  * @method logError
  * @public 
  * @param {object} options
  *
  */
  Apigee.MobileAnalytics.prototype.logError = function(options) {
    var logOptions = options || {};
    logOptions.logLevel = LOGLEVELS.error;
    if(this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.error ) {
      this.logMessage(options);
    }
  }

  /*
  * Logs a user defined assert message.
  *
  * @method logAssert
  * @public 
  * @param {object} options
  *
  */
  Apigee.MobileAnalytics.prototype.logAssert = function(options) {
    var logOptions = options || {};
    logOptions.logLevel = LOGLEVELS.assert;
    if(this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.assert ) {
      this.logMessage(options);
    }
  }

  /* 
  * Internal function for encapsulating crash log catches. Not directly callable.
  * Needed because of funkiness with the errors being thrown solely on the window
  *
  */
  function logCrash(options) {
    var log = options || {};
    var cleansedLog = {
      logLevel: LOGLEVELS.assert,
      logMessage: log.logMessage,
      tag: log.tag,
      timeStamp: timeStamp()
    }
    logs.push(cleansedLog);
  }

  /*
  * Logs a network call.
  *
  * @method logNetworkCall
  * @public 
  * @param {object} options
  *
  */
  Apigee.MobileAnalytics.prototype.logNetworkCall = function(options) {
    metrics.push(options);
  }


  /*
  * Gets custom config parameters. These are set by user in dashboard.
  * 
  * @method getConfig
  * @public
  * @param {string} key
  * @returns {stirng} value
  * 
  * TODO: Once there is a dashboard plugged into the API implement this so users can set
  * custom configuration parameters for their applications.
  */
  Apigee.MobileAnalytics.prototype.getConfig = function(key) {

  }

  //TEST HELPERS NOT REALLY MEANT TO BE USED OUTSIDE THAT CONTEXT.
  //Simply exposes some internal data that is collected.

  Apigee.MobileAnalytics.prototype.logs = function(){
    return logs;
  }

  Apigee.MobileAnalytics.prototype.metrics = function(){
    return metrics;
  }

  Apigee.MobileAnalytics.prototype.sessionMetrics = function(){
    return this.sessionMetrics;
  }

  Apigee.MobileAnalytics.prototype.clearMetrics = function(){
    logs = [];
    metrics = [];
  }

  //UUID Generation function unedited
   
  /* randomUUID.js - Version 1.0
  *
  * Copyright 2008, Robert Kieffer
  *
  * This software is made available under the terms of the Open Software License
  * v3.0 (available here: http://www.opensource.org/licenses/osl-3.0.php )
  *
  * The latest version of this file can be found at:
  * http://www.broofa.com/Tools/randomUUID.js
  *
  * For more information, or to comment on this, please go to:
  * http://www.broofa.com/blog/?p=151
  */
   
  /**
  * Create and return a "version 4" RFC-4122 UUID string.
  */
  function randomUUID() {
    var s = [], itoh = '0123456789ABCDEF';
   
    // Make array of random hex digits. The UUID only has 32 digits in it, but we
    // allocate an extra items to make room for the '-'s we'll be inserting.
    for (var i = 0; i <36; i++) s[i] = Math.floor(Math.random()*0x10);
   
    // Conform to RFC-4122, section 4.4
    s[14] = 4;  // Set 4 high bits of time_high field to version
    s[19] = (s[19] & 0x3) | 0x8;  // Specify 2 high bits of clock sequence
   
    // Convert to hex chars
    for (var i = 0; i <36; i++) s[i] = itoh[s[i]];
   
    // Insert '-'s
    s[8] = s[13] = s[18] = s[23] = '-';
   
    return s.join('');
  }

  //Generate an epoch timestamp string
  function timeStamp() {
    return new Date().getTime().toString();
  }

  //Generate a device id, and attach it to localStorage.
  function generateDeviceId(){
    if(typeof window.localStorage.getItem("uuid") === null) {
      return window.localStorage.getItem("uuid");
    } else {
      var uuid = randomUUID();
      window.localStorage.setItem("uuid", uuid);
      return window.localStorage.getItem("uuid");
    }
  }

  //Helper. Determines if the platform device is phonegap
  function isPhoneGap(){
    return (typeof window.device !== "undefined" && typeof window.device.phonegap !== "undefined");
  }

  //Helper. Determines if the platform device is trigger.io
  function isTrigger(){
    return (typeof window.forge !== "undefined");
  }

  //Helper. Determines if the platform device is titanium.
  function isTitanium(){
    return (typeof Titanium !== "undefined");
  }

  return Apigee;

}())
