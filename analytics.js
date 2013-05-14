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
    //You best know what you're doing if you're setting this for mobile analytics!
    this.apiUrl = typeof options.apiUrl === "undefined" ? "https://api.usergrid.org/" : options.apiUrl;
    this.crashReportingEnabled = options.crashReportingEnabled || false;
    this.interceptNetworkCalls = options.interceptNetworkCalls || false;
    
    
    this.syncDate = timeStamp();

    //Pickup the mobile config here
    this.downloadConfig();

    //Don't do anything if configuration wasn't loaded.
    if(this.configuration !== null) {
      
      this.appId = this.configuration.instaOpsApplicationId;
      var deviceSyncSetting = this.configuration.defaultAppConfig.agentUploadIntervalInSeconds;
      var defaultSyncSetting = this.configuration.defaultAppConfig.agentUploadIntervalInSeconds;
      var syncInterval = 3000;
      if(typeof deviceSyncSetting !== "undefined") {
        syncInterval = deviceSyncSetting * 1000;
      } else if (typeof defaultSyncSetting !== "undefined") {
        syncInterval = defaultSyncSetting * 1000;
      }

      //Needed for the setInterval call for syncing. Have to pass in a ref to ourselves. It blows scope away.
      var self = this;
      //Set up server syncing
      setInterval(function(){
        var syncObject = {};
        //Just in case something bad happened.
        if(typeof self.sessionMetrics !== "undefined") {
          syncObject.sessionMetrics = self.sessionMetrics;
        }
        var syncFlag = false;
        self.syncDate = timeStamp();
        //Go through each of the aggregated metrics
        //If there are unreported metrics present add them to the object to be sent across the network
        if(metrics.length > 0) {
          syncObject.metrics = metrics;
          syncFlag = true;
          metrics = [];
        }

        if(logs.length > 0) {
          syncObject.logs = logs;
          syncFlag = true;
          logs = [];
        }

        //If there is data to sync go ahead and do it.
        if(syncFlag) {
          console.log("syncing");
          self.sync(syncObject);
        }

      }, 3000);

      //Setting up the catching of errors and network calls
      if(this.interceptNetworkCalls) {
        this.patchNetworkCalls(XMLHttpRequest);
      }
      
      if(this.crashReportingEnabled) {
        window.onerror = Apigee.MobileAnalytics.catchCrashReport;
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
    console.log(path);
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
    var syncData = {}
    syncData.logs = syncObject.logs;
    syncData.metrics = syncObject.metrics;
    syncData.sessionMetrics = this.sessionMetrics;
    syncData.orgName = this.orgName;
    syncData.appName = this.appName;
    syncData.fullAppName = this.orgName + '_' + this.appName;
    syncData.instaOpsApplicationId = this.configuration.instaOpsApplicationId;
    syncData.timeStamp = timeStamp();

    console.log(syncData);

    var syncRequest = new XMLHttpRequest();
    var path = this.apiUrl + this.orgName + '/' + this.appName + '/apm/apmMetrics';
    syncRequest.open(VERBS.post, path, false);
    syncRequest.setRequestHeader("Accept", "application/json");
    syncRequest.setRequestHeader("Content-Type","application/json");
    syncRequest.send(JSON.stringify(syncData));
    if(syncRequest.status === 200) {
      var response = JSON.parse(syncRequest.responseText);
      console.log(response);
    } else {
      //When tapping into the configuration. If it's null let's assume bad things happened.
      console.log("Error syncing");
      console.log(JSON.parse(syncRequest.responseText));
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
    this.logError({tag:"SDK_ERROR_LOGGER", logMessage:"Error:"+crashEvent+" for url:"+url+" on line:"+line});
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

    //We're checking if it's a phonegap app.
    //If so let's use APIs exposed by phonegap to collect device info.
    //If not let's fallback onto stuff we should collect ourselves.
    if (typeof window.device !== "undefined") {
      sessionSummary.devicePlatform = window.device.platform;
      sessionSummary.deviceOperatingSystem = window.device.version;
      sessionSummary.deviceId = window.device.uuid;
      sessionSummary.deviceModel = window.device.name;
      sessionSummary.networkType = navigator.network.connection.type;
    } else {

      //Here we want to check for localstorage and make sure the browser has it
      if(typeof window.localStorage !== "undefined") {
        //If no uuid is set in localstorage create a new one, and set it as the session's deviceId

        if(typeof window.localStorage.getItem("uuid") === null) {
          sessionSummary.deviceId = window.localStorage.getItem("uuid");
        } else {
          var uuid = randomUUID();
          window.localStorage.setItem("uuid", uuid);
          sessionSummary.deviceId = window.localStorage.getItem("uuid");
        }
      }
      
      if(typeof navigator.userAgent !== "undefined") {
        //Small hack to make all device names consistent.
        var ua = navigator.userAgent.toLowerCase();
        //For now detect iPhone, iPod, Android, WebOS
        var device = "unknown";
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
                  if( url.indexOf("/!gap_exec") === -1 ) {
                      var endTime = timeStamp();
                      var latency = endTime - startTime;
                      var summary = { 
                                      regexUrl:url, 
                                      start:startTime, 
                                      end:endTime, 
                                      numSamples:1, 
                                      minLatency:latency, 
                                      sumLatency:latency, 
                                      maxLatency:latency, 
                                      timeStamp:startTime
                                    };
                      if(self.status == 200) {
                          //Record the http call here
                          summary.numErrors = 0;
                          apigee.logNetworkCall(summary);
                      } else {
                          //Record a connection failure here
                          summary.numErrors = 1;
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
    console.log(log);
    var cleansedLog = {
      logLevel:log.logLevel,
      logMessage: log.logMessage,
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
    if(this.configuration.defaultAppConfig.logLevelToMonitor <= LOGLEVELNUMBERS.verbose ) {
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
    if(this.configuration.defaultAppConfig.logLevelToMonitor <= LOGLEVELNUMBERS.debug ) {
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
    if(this.configuration.defaultAppConfig.logLevelToMonitor <= LOGLEVELNUMBERS.info ) {
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
    logOptions.logMethod = LOGLEVELS.warn;
    if(this.configuration.defaultAppConfig.logLevelToMonitor <= LOGLEVELNUMBERS.warn ) {
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
    logOptions.logMethod = LOGLEVELS.error;
    this.logMessage(options);
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
    logOptions.logMethod = LOGLEVELS.assert;
    if(this.configuration.defaultAppConfig.logLevelToMonitor <= LOGLEVELNUMBERS.assert ) {
      this.logMessage(options);
    }
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

  function timeStamp() {
    return new Date().getTime().toString();
  }

  return Apigee;

}())
