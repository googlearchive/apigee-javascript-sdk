(function() {
  var name = 'Usergrid', global = this, overwrittenName = global[name];
  var Usergrid=Usergrid||global.Usergrid;
  if(!Usergrid){
    throw "Usergrid module is required for the monitoring module."
  }
  /*
   * Logs a user defined verbose message.
   *
   * @method logDebug
   * @public
   * @param {object} options
   *
   */
  Usergrid.client.prototype.logVerbose = function(options) {
    this.monitor.logVerbose(options);
  };

  /*
   * Logs a user defined debug message.
   *
   * @method logDebug
   * @public
   * @param {object} options
   *
   */
  Usergrid.client.prototype.logDebug = function(options) {
    this.monitor.logDebug(options);
  };

  /*
   * Logs a user defined informational message.
   *
   * @method logInfo
   * @public
   * @param {object} options
   *
   */
  Usergrid.client.prototype.logInfo = function(options) {
    this.monitor.logInfo(options);
  };

  /*
   * Logs a user defined warning message.
   *
   * @method logWarn
   * @public
   * @param {object} options
   *
   */
  Usergrid.client.prototype.logWarn = function(options) {
    this.monitor.logWarn(options);
  };

  /*
   * Logs a user defined error message.
   *
   * @method logError
   * @public
   * @param {object} options
   *
   */
  Usergrid.client.prototype.logError = function(options) {
    this.monitor.logError(options);
  };

  /*
   * Logs a user defined assert message.
   *
   * @method logAssert
   * @public
   * @param {object} options
   *
   */
  Usergrid.client.prototype.logAssert = function(options) {
    this.monitor.logAssert(options);
  };



  global[name] = {
    client:Usergrid.client, 
    entity : Usergrid.entity,
    collection : Usergrid.collection,
    group : Usergrid.group,
    AUTH_CLIENT_ID : Usergrid.AUTH_CLIENT_ID,
    AUTH_APP_USER : Usergrid.AUTH_APP_USER,
    AUTH_NONE : Usergrid.AUTH_NONE
  };
  global[name].noConflict = function() {
    if(overwrittenName){
      global[name] = overwrittenName;
    }
    return Usergrid;
  };
  return global[name];
})();

