/*! apigee-javascript-sdk@2.0.5 2013-11-14 */
window.console = window.console || {};

window.console.log = window.console.log || function() {};

window.Usergrid = window.Usergrid || {};

Usergrid = Usergrid || {};

Usergrid.SDK_VERSION = "0.10.03";

Usergrid.Client = function(options) {
    this.URI = options.URI || "https://api.usergrid.com";
    this.orgName = options.orgName;
    this.appName = options.appName;
    this.buildCurl = options.buildCurl || false;
    this.logging = options.logging || false;
    this._callTimeout = options.callTimeout || 3e4;
    this._callTimeoutCallback = options.callTimeoutCallback || null;
    this.logoutCallback = options.logoutCallback || null;
};

Usergrid.Client.prototype.request = function(options, callback) {
    var self = this;
    var method = options.method || "GET";
    var endpoint = options.endpoint;
    var body = options.body || {};
    var qs = options.qs || {};
    var mQuery = options.mQuery || false;
    if (mQuery) {
        var uri = this.URI + "/" + endpoint;
    } else {
        var uri = this.URI + "/" + this.orgName + "/" + this.appName + "/" + endpoint;
    }
    if (self.getToken()) {
        qs["access_token"] = self.getToken();
    }
    var encoded_params = encodeParams(qs);
    if (encoded_params) {
        uri += "?" + encoded_params;
    }
    body = JSON.stringify(body);
    var xhr = new XMLHttpRequest();
    xhr.open(method, uri, true);
    if (body) {
        xhr.setRequestHeader("Content-Type", "application/json");
    }
    xhr.onerror = function() {
        self._end = new Date().getTime();
        if (self.logging) {
            console.log("success (time: " + self.calcTimeDiff() + "): " + method + " " + uri);
        }
        if (self.logging) {
            console.log("Error: API call failed at the network level.");
        }
        clearTimeout(timeout);
        var err = true;
        if (typeof callback === "function") {
            callback(err, data);
        }
    };
    xhr.onload = function(response) {
        self._end = new Date().getTime();
        if (self.logging) {
            console.log("success (time: " + self.calcTimeDiff() + "): " + method + " " + uri);
        }
        clearTimeout(timeout);
        response = JSON.parse(xhr.responseText);
        if (xhr.status != 200) {
            var error = response.error;
            var error_description = response.error_description;
            if (self.logging) {
                console.log("Error (" + xhr.status + ")(" + error + "): " + error_description);
            }
            if (error == "auth_expired_session_token" || error == "unauthorized" || error == "auth_missing_credentials" || error == "auth_invalid") {
                if (typeof self.logoutCallback === "function") {
                    return self.logoutCallback(true, response);
                }
            }
            if (typeof callback === "function") {
                callback(true, response);
            }
        } else {
            if (typeof callback === "function") {
                callback(false, response);
            }
        }
    };
    var timeout = setTimeout(function() {
        xhr.abort();
        if (self._callTimeoutCallback === "function") {
            self._callTimeoutCallback("API CALL TIMEOUT");
        } else {
            self.callback("API CALL TIMEOUT");
        }
    }, self._callTimeout);
    if (this.logging) {
        console.log("calling: " + method + " " + uri);
    }
    if (this.buildCurl) {
        var curlOptions = {
            uri: uri,
            body: body,
            method: method
        };
        this.buildCurlCall(curlOptions);
    }
    this._start = new Date().getTime();
    xhr.send(body);
};

Usergrid.Client.prototype.createEntity = function(options, callback) {
    var options = {
        client: this,
        data: options
    };
    var entity = new Usergrid.Entity(options);
    entity.save(function(err, data) {
        if (typeof callback === "function") {
            callback(err, entity);
        }
    });
};

Usergrid.Client.prototype.createCollection = function(options, callback) {
    options.client = this;
    var collection = new Usergrid.Collection(options, function(err, data) {
        if (typeof callback === "function") {
            callback(err, collection);
        }
    });
};

Usergrid.Client.prototype.createUserActivity = function(user, options, callback) {
    options.type = "users/" + user + "/activities";
    var options = {
        client: this,
        data: options
    };
    var entity = new Usergrid.Entity(options);
    entity.save(function(err, data) {
        if (typeof callback === "function") {
            callback(err, entity);
        }
    });
};

Usergrid.Client.prototype.calcTimeDiff = function() {
    var seconds = 0;
    var time = this._end - this._start;
    try {
        seconds = (time / 10 / 60).toFixed(2);
    } catch (e) {
        return 0;
    }
    return seconds;
};

Usergrid.Client.prototype.setToken = function(token) {
    this.token = token;
    if (typeof Storage !== "undefined") {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    }
};

Usergrid.Client.prototype.getToken = function() {
    if (this.token) {
        return this.token;
    } else if (typeof Storage !== "undefined") {
        return localStorage.getItem("token");
    }
    return null;
};

Usergrid.Client.prototype.login = function(username, password, callback) {
    var self = this;
    var options = {
        method: "GET",
        endpoint: "token",
        qs: {
            username: username,
            password: password,
            grant_type: "password"
        }
    };
    this.request(options, function(err, data) {
        var user = {};
        if (err && self.logging) {
            console.log("error trying to log user in");
        } else {
            user = new Usergrid.Entity("users", data.user);
            self.setToken(data.access_token);
        }
        if (typeof callback === "function") {
            callback(err, data, user);
        }
    });
};

Usergrid.Client.prototype.loginFacebook = function(facebookToken, callback) {
    var self = this;
    var options = {
        method: "GET",
        endpoint: "auth/facebook",
        qs: {
            fb_access_token: facebookToken
        }
    };
    this.request(options, function(err, data) {
        var user = {};
        if (err && self.logging) {
            console.log("error trying to log user in");
        } else {
            user = new Usergrid.Entity("users", data.user);
            self.setToken(data.access_token);
        }
        if (typeof callback === "function") {
            callback(err, data, user);
        }
    });
};

Usergrid.Client.prototype.getLoggedInUser = function(callback) {
    if (!this.getToken()) {
        callback(true, null, null);
    } else {
        var self = this;
        var options = {
            method: "GET",
            endpoint: "users/me"
        };
        this.request(options, function(err, data) {
            if (err) {
                if (self.logging) {
                    console.log("error trying to log user in");
                }
                if (typeof callback === "function") {
                    callback(err, data, null);
                }
            } else {
                var options = {
                    client: self,
                    data: data.entities[0]
                };
                var user = new Usergrid.Entity(options);
                if (typeof callback === "function") {
                    callback(err, data, user);
                }
            }
        });
    }
};

Usergrid.Client.prototype.isLoggedIn = function() {
    if (this.getToken()) {
        return true;
    }
    return false;
};

Usergrid.Client.prototype.logout = function() {
    this.setToken(null);
};

Usergrid.Client.prototype.buildCurlCall = function(options) {
    var curl = "curl";
    var method = (options.method || "GET").toUpperCase();
    var body = options.body || {};
    var uri = options.uri;
    if (method === "POST") {
        curl += " -X POST";
    } else if (method === "PUT") {
        curl += " -X PUT";
    } else if (method === "DELETE") {
        curl += " -X DELETE";
    } else {
        curl += " -X GET";
    }
    curl += " " + uri;
    body = JSON.stringify(body);
    if (body !== '"{}"' && method !== "GET" && method !== "DELETE") {
        curl += " -d '" + body + "'";
    }
    console.log(curl);
    return curl;
};

Usergrid.Entity = function(options) {
    this._client = options.client;
    this._data = options.data || {};
};

Usergrid.Entity.prototype.get = function(field) {
    if (field) {
        return this._data[field];
    } else {
        return this._data;
    }
};

Usergrid.Entity.prototype.set = function(key, value) {
    if (typeof key === "object") {
        for (var field in key) {
            this._data[field] = key[field];
        }
    } else if (typeof key === "string") {
        if (value === null) {
            delete this._data[key];
        } else {
            this._data[key] = value;
        }
    } else {
        this._data = null;
    }
};

Usergrid.Entity.prototype.save = function(callback) {
    var type = this.get("type");
    var method = "POST";
    if (isUUID(this.get("uuid"))) {
        method = "PUT";
        type += "/" + this.get("uuid");
    }
    var self = this;
    var data = {};
    var entityData = this.get();
    for (var item in entityData) {
        if (item === "metadata" || item === "created" || item === "modified" || item === "type" || item === "activatted") {
            continue;
        }
        data[item] = entityData[item];
    }
    var options = {
        method: method,
        endpoint: type,
        body: data
    };
    this._client.request(options, function(err, retdata) {
        if (err && self._client.logging) {
            console.log("could not save entity");
            if (typeof callback === "function") {
                return callback(err, retdata, self);
            }
        } else {
            if (retdata.entities.length) {
                var entity = retdata.entities[0];
                self.set(entity);
            }
            var needPasswordChange = type === "users" && entityData.oldpassword && entityData.newpassword;
            if (needPasswordChange) {
                var pwdata = {};
                pwdata.oldpassword = entityData.oldpassword;
                pwdata.newpassword = entityData.newpassword;
                this._client.request({
                    method: "PUT",
                    endpoint: type,
                    body: pwdata
                }, function(err, data) {
                    if (err && self._client.logging) {
                        console.log("could not update user");
                    }
                    self.set("oldpassword", null);
                    self.set("newpassword", null);
                    if (typeof callback === "function") {
                        callback(err, data, self);
                    }
                });
            } else if (typeof callback === "function") {
                callback(err, retdata, self);
            }
        }
    });
};

Usergrid.Entity.prototype.fetch = function(callback) {
    var type = this.get("type");
    var self = this;
    if (this.get("uuid")) {
        type += "/" + this.get("uuid");
    } else {
        if (type === "users") {
            if (this.get("username")) {
                type += "/" + this.get("username");
            } else {
                if (typeof callback === "function") {
                    var error = "cannot fetch entity, no username specified";
                    if (self._client.logging) {
                        console.log(error);
                    }
                    return callback(true, error, self);
                }
            }
        } else {
            if (this.get("name")) {
                type += "/" + this.get("name");
            } else {
                if (typeof callback === "function") {
                    var error = "cannot fetch entity, no name specified";
                    if (self._client.logging) {
                        console.log(error);
                    }
                    return callback(true, error, self);
                }
            }
        }
    }
    var options = {
        method: "GET",
        endpoint: type
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("could not get entity");
        } else {
            if (data.user) {
                self.set(data.user);
            } else if (data.entities.length) {
                var entity = data.entities[0];
                self.set(entity);
            }
        }
        if (typeof callback === "function") {
            callback(err, data, self);
        }
    });
};

Usergrid.Entity.prototype.destroy = function(callback) {
    var type = this.get("type");
    if (isUUID(this.get("uuid"))) {
        type += "/" + this.get("uuid");
    } else {
        if (typeof callback === "function") {
            var error = "Error trying to delete object - no uuid specified.";
            if (self._client.logging) {
                console.log(error);
            }
            callback(true, error);
        }
    }
    var self = this;
    var options = {
        method: "DELETE",
        endpoint: type
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("entity could not be deleted");
        } else {
            self.set(null);
        }
        if (typeof callback === "function") {
            callback(err, data);
        }
    });
};

Usergrid.Entity.prototype.connect = function(connection, entity, callback) {
    var self = this;
    var connecteeType = entity.get("type");
    var connectee = this.getEntityId(entity);
    if (!connectee) {
        if (typeof callback === "function") {
            var error = "Error trying to delete object - no uuid specified.";
            if (self._client.logging) {
                console.log(error);
            }
            callback(true, error);
        }
        return;
    }
    var connectorType = this.get("type");
    var connector = this.getEntityId(this);
    if (!connector) {
        if (typeof callback === "function") {
            var error = "Error in connect - no uuid specified.";
            if (self._client.logging) {
                console.log(error);
            }
            callback(true, error);
        }
        return;
    }
    var endpoint = connectorType + "/" + connector + "/" + connection + "/" + connecteeType + "/" + connectee;
    var options = {
        method: "POST",
        endpoint: endpoint
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("entity could not be connected");
        }
        if (typeof callback === "function") {
            callback(err, data);
        }
    });
};

Usergrid.Entity.prototype.getEntityId = function(entity) {
    var id = false;
    if (isUUID(entity.get("uuid"))) {
        id = entity.get("uuid");
    } else {
        if (type === "users") {
            id = entity.get("username");
        } else if (entity.get("name")) {
            id = entity.get("name");
        }
    }
    return id;
};

Usergrid.Entity.prototype.getConnections = function(connection, callback) {
    var self = this;
    var connectorType = this.get("type");
    var connector = this.getEntityId(this);
    if (!connector) {
        if (typeof callback === "function") {
            var error = "Error in getConnections - no uuid specified.";
            if (self._client.logging) {
                console.log(error);
            }
            callback(true, error);
        }
        return;
    }
    var endpoint = connectorType + "/" + connector + "/" + connection + "/";
    var options = {
        method: "GET",
        endpoint: endpoint
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("entity could not be connected");
        }
        self[connection] = {};
        var length = data.entities.length;
        for (var i = 0; i < length; i++) {
            if (data.entities[i].type === "user") {
                self[connection][data.entities[i].username] = data.entities[i];
            } else {
                self[connection][data.entities[i].name] = data.entities[i];
            }
        }
        if (typeof callback === "function") {
            callback(err, data);
        }
    });
};

Usergrid.Entity.prototype.disconnect = function(connection, entity, callback) {
    var self = this;
    var connecteeType = entity.get("type");
    var connectee = this.getEntityId(entity);
    if (!connectee) {
        if (typeof callback === "function") {
            var error = "Error trying to delete object - no uuid specified.";
            if (self._client.logging) {
                console.log(error);
            }
            callback(true, error);
        }
        return;
    }
    var connectorType = this.get("type");
    var connector = this.getEntityId(this);
    if (!connector) {
        if (typeof callback === "function") {
            var error = "Error in connect - no uuid specified.";
            if (self._client.logging) {
                console.log(error);
            }
            callback(true, error);
        }
        return;
    }
    var endpoint = connectorType + "/" + connector + "/" + connection + "/" + connecteeType + "/" + connectee;
    var options = {
        method: "DELETE",
        endpoint: endpoint
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("entity could not be disconnected");
        }
        if (typeof callback === "function") {
            callback(err, data);
        }
    });
};

Usergrid.Collection = function(options, callback) {
    this._client = options.client;
    this._type = options.type;
    this.qs = options.qs || {};
    this._list = [];
    this._iterator = -1;
    this._previous = [];
    this._next = null;
    this._cursor = null;
    this.fetch(callback);
};

Usergrid.Collection.prototype.fetch = function(callback) {
    var self = this;
    var qs = this.qs;
    if (this._cursor) {
        qs.cursor = this._cursor;
    } else {
        delete qs.cursor;
    }
    var options = {
        method: "GET",
        endpoint: this._type,
        qs: this.qs
    };
    this._client.request(options, function(err, data) {
        if (err && self._client.logging) {
            console.log("error getting collection");
        } else {
            var cursor = data.cursor || null;
            self.saveCursor(cursor);
            if (data.entities) {
                self.resetEntityPointer();
                var count = data.entities.length;
                self._list = [];
                for (var i = 0; i < count; i++) {
                    var uuid = data.entities[i].uuid;
                    if (uuid) {
                        var entityData = data.entities[i] || {};
                        var entityOptions = {
                            type: self._type,
                            client: self._client,
                            uuid: uuid,
                            data: entityData
                        };
                        var ent = new Usergrid.Entity(entityOptions);
                        var ct = self._list.length;
                        self._list[ct] = ent;
                    }
                }
            }
        }
        if (typeof callback === "function") {
            callback(err, data);
        }
    });
};

Usergrid.Collection.prototype.addEntity = function(options, callback) {
    var self = this;
    options.type = this._type;
    this._client.createEntity(options, function(err, entity) {
        if (!err) {
            var count = self._list.length;
            self._list[count] = entity;
        }
        if (typeof callback === "function") {
            callback(err, entity);
        }
    });
};

Usergrid.Collection.prototype.destroyEntity = function(entity, callback) {
    var self = this;
    entity.destroy(function(err, data) {
        if (err) {
            if (self._client.logging) {
                console.log("could not destroy entity");
            }
            if (typeof callback === "function") {
                callback(err, data);
            }
        } else {
            self.fetch(callback);
        }
    });
};

Usergrid.Collection.prototype.getEntityByUUID = function(uuid, callback) {
    var options = {
        data: {
            type: this._type,
            uuid: uuid
        },
        client: this._client
    };
    var entity = new Usergrid.Entity(options);
    entity.fetch(callback);
};

Usergrid.Collection.prototype.getFirstEntity = function() {
    var count = this._list.length;
    if (count > 0) {
        return this._list[0];
    }
    return null;
};

Usergrid.Collection.prototype.getLastEntity = function() {
    var count = this._list.length;
    if (count > 0) {
        return this._list[count - 1];
    }
    return null;
};

Usergrid.Collection.prototype.hasNextEntity = function() {
    var next = this._iterator + 1;
    var hasNextElement = next >= 0 && next < this._list.length;
    if (hasNextElement) {
        return true;
    }
    return false;
};

Usergrid.Collection.prototype.getNextEntity = function() {
    this._iterator++;
    var hasNextElement = this._iterator >= 0 && this._iterator <= this._list.length;
    if (hasNextElement) {
        return this._list[this._iterator];
    }
    return false;
};

Usergrid.Collection.prototype.hasPrevEntity = function() {
    var previous = this._iterator - 1;
    var hasPreviousElement = previous >= 0 && previous < this._list.length;
    if (hasPreviousElement) {
        return true;
    }
    return false;
};

Usergrid.Collection.prototype.getPrevEntity = function() {
    this._iterator--;
    var hasPreviousElement = this._iterator >= 0 && this._iterator <= this._list.length;
    if (hasPreviousElement) {
        return this.list[this._iterator];
    }
    return false;
};

Usergrid.Collection.prototype.resetEntityPointer = function() {
    this._iterator = -1;
};

Usergrid.Collection.prototype.saveCursor = function(cursor) {
    if (this._next !== cursor) {
        this._next = cursor;
    }
};

Usergrid.Collection.prototype.resetPaging = function() {
    this._previous = [];
    this._next = null;
    this._cursor = null;
};

Usergrid.Collection.prototype.hasNextPage = function() {
    return this._next;
};

Usergrid.Collection.prototype.getNextPage = function(callback) {
    if (this.hasNextPage()) {
        this._previous.push(this._cursor);
        this._cursor = this._next;
        this._list = [];
        this.fetch(callback);
    }
};

Usergrid.Collection.prototype.hasPreviousPage = function() {
    return this._previous.length > 0;
};

Usergrid.Collection.prototype.getPreviousPage = function(callback) {
    if (this.hasPreviousPage()) {
        this._next = null;
        this._cursor = this._previous.pop();
        this._list = [];
        this.fetch(callback);
    }
};

function isUUID(uuid) {
    var uuidValueRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuid) return false;
    return uuidValueRegex.test(uuid);
}

function encodeParams(params) {
    tail = [];
    var item = [];
    if (params instanceof Array) {
        for (i in params) {
            item = params[i];
            if (item instanceof Array && item.length > 1) {
                tail.push(item[0] + "=" + encodeURIComponent(item[1]));
            }
        }
    } else {
        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                var value = params[key];
                if (value instanceof Array) {
                    for (i in value) {
                        item = value[i];
                        tail.push(key + "=" + encodeURIComponent(item));
                    }
                } else {
                    tail.push(key + "=" + encodeURIComponent(value));
                }
            }
        }
    }
    return tail.join("&");
}

(function() {
    var name = "Usergrid", global = this, overwrittenName = global[name];
    var Usergrid = Usergrid || global.Usergrid;
    if (!Usergrid) {
        throw "Usergrid module is required for the monitoring module.";
    }
    Usergrid.client.prototype.logVerbose = function(options) {
        this.monitor.logVerbose(options);
    };
    Usergrid.client.prototype.logDebug = function(options) {
        this.monitor.logDebug(options);
    };
    Usergrid.client.prototype.logInfo = function(options) {
        this.monitor.logInfo(options);
    };
    Usergrid.client.prototype.logWarn = function(options) {
        this.monitor.logWarn(options);
    };
    Usergrid.client.prototype.logError = function(options) {
        this.monitor.logError(options);
    };
    Usergrid.client.prototype.logAssert = function(options) {
        this.monitor.logAssert(options);
    };
    global[name] = {
        client: Usergrid.client,
        entity: Usergrid.entity,
        collection: Usergrid.collection,
        group: Usergrid.group,
        AUTH_CLIENT_ID: Usergrid.AUTH_CLIENT_ID,
        AUTH_APP_USER: Usergrid.AUTH_APP_USER,
        AUTH_NONE: Usergrid.AUTH_NONE
    };
    global[name].noConflict = function() {
        if (overwrittenName) {
            global[name] = overwrittenName;
        }
        return Usergrid;
    };
    return global[name];
})();

(function() {
    var name = "Apigee", global = this, overwrittenName = global[name];
    var Usergrid = Usergrid || global.Usergrid;
    if (!Usergrid) {
        throw "Usergrid module is required for the monitoring module.";
    }
    var VERBS = {
        get: "GET",
        post: "POST",
        put: "PUT",
        del: "DELETE",
        head: "HEAD"
    };
    var MONITORING_SDKVERSION = "0.0.1";
    var LOGLEVELS = {
        verbose: "V",
        debug: "D",
        info: "I",
        warn: "W",
        error: "E",
        assert: "A"
    };
    var LOGLEVELNUMBERS = {
        verbose: 2,
        debug: 3,
        info: 4,
        warn: 5,
        error: 6,
        assert: 7
    };
    var UNKNOWN = "UNKNOWN";
    var SDKTYPE = "JavaScript";
    var logs = [];
    var metrics = [];
    var Apigee = Usergrid;
    Apigee.prototype = Usergrid.prototype;
    Apigee.Client = function(options) {
        this.monitoringEnabled = options.monitoringEnabled || true;
        if (this.monitoringEnabled) {
            try {
                this.monitor = new Apigee.MonitoringClient(options);
            } catch (e) {
                console.log(e);
            }
        }
        Usergrid.client.call(this, options);
    };
    Apigee.Client.prototype = Usergrid.client.prototype;
    Apigee.MonitoringClient = function(options) {
        var self = this;
        this.orgName = options.orgName;
        this.appName = options.appName;
        this.syncOnClose = options.syncOnClose || false;
        this.testMode = options.testMode || false;
        this.URI = typeof options.URI === "undefined" ? "https://api.usergrid.com" : options.URI;
        this.syncDate = timeStamp();
        if (typeof options.config !== "undefined") {
            this.configuration = options.config;
            if (this.configuration.deviceLevelOverrideEnabled === true) {
                this.deviceConfig = this.configuration.deviceLevelAppConfig;
            } else if (this.abtestingOverrideEnabled === true) {
                this.deviceConfig = this.configuration.abtestingAppConfig;
            } else {
                this.deviceConfig = this.configuration.defaultAppConfig;
            }
        } else {
            this.configuration = null;
            this.downloadConfig();
        }
        if (this.configuration !== null && this.configuration !== "undefined") {
            var sampleSeed = 0;
            if (this.deviceConfig.samplingRate < 100) {
                sampleSeed = Math.floor(Math.random() * 101);
            }
            if (sampleSeed < this.deviceConfig.samplingRate) {
                this.appId = this.configuration.instaOpsApplicationId;
                this.appConfigType = this.deviceConfig.appConfigType;
                if (this.deviceConfig.enableLogMonitoring) {
                    this.patchLoggingCalls();
                }
                var syncIntervalMillis = 3e3;
                if (typeof this.deviceConfig.agentUploadIntervalInSeconds !== "undefined") {
                    syncIntervalMillis = this.deviceConfig.agentUploadIntervalInSeconds * 1e3;
                }
                if (!this.syncOnClose) {
                    setInterval(function() {
                        self.prepareSync();
                    }, syncIntervalMillis);
                } else {
                    if (isPhoneGap()) {
                        window.addEventListener("pause", function() {
                            self.prepareSync();
                        }, false);
                    } else if (isTrigger()) {
                        forge.event.appPaused.addListener(function(data) {}, function(error) {
                            console.log("Error syncing data.");
                            console.log(error);
                        });
                    } else if (isTitanium()) {} else {
                        window.addEventListener("beforeunload", function(e) {
                            self.prepareSync();
                        });
                    }
                }
                if (this.deviceConfig.networkMonitoringEnabled) {
                    this.patchNetworkCalls(XMLHttpRequest);
                }
                window.onerror = Apigee.MonitoringClient.catchCrashReport;
                this.startSession();
            }
        } else {
            console.log("Error: Apigee APM configuration unavailable.");
        }
    };
    Apigee.MonitoringClient.prototype.applyMonkeyPatches = function() {
        var self = this;
        if (self.deviceConfig.enableLogMonitoring) {
            self.patchLoggingCalls();
        }
        if (self.deviceConfig.networkMonitoringEnabled) {
            self.patchNetworkCalls(XMLHttpRequest);
        }
    };
    Apigee.MonitoringClient.prototype.getConfig = function(options, callback) {
        if (typeof options.config !== "undefined") {
            this.configuration = options.config;
            if (this.configuration.deviceLevelOverrideEnabled === true) {
                this.deviceConfig = this.configuration.deviceLevelAppConfig;
            } else if (this.abtestingOverrideEnabled === true) {
                this.deviceConfig = this.configuration.abtestingAppConfig;
            } else {
                this.deviceConfig = this.configuration.defaultAppConfig;
            }
            callback(this.deviceConfig);
        } else {
            this.configuration = null;
            this.downloadConfig(callback);
        }
    };
    Apigee.MonitoringClient.prototype.downloadConfig = function(callback) {
        var configRequest = new XMLHttpRequest();
        var path = this.URI + "/" + this.orgName + "/" + this.appName + "/apm/apigeeMobileConfig";
        if (typeof callback === "function") {
            configRequest.open(VERBS.get, path, true);
        } else {
            configRequest.open(VERBS.get, path, false);
        }
        var self = this;
        configRequest.setRequestHeader("Accept", "application/json");
        configRequest.setRequestHeader("Content-Type", "application/json");
        configRequest.onreadystatechange = onReadyStateChange;
        configRequest.send();
        function onReadyStateChange() {
            if (configRequest.readyState === 4) {
                if (typeof callback === "function") {
                    if (configRequest.status === 200) {
                        callback(null, JSON.parse(configRequest.responseText));
                    } else {
                        callback(configRequest.statusText);
                    }
                } else {
                    if (configRequest.status === 200) {
                        var config = JSON.parse(configRequest.responseText);
                        self.configuration = config;
                        if (config.deviceLevelOverrideEnabled === true) {
                            self.deviceConfig = config.deviceLevelAppConfig;
                        } else if (self.abtestingOverrideEnabled === true) {
                            self.deviceConfig = config.abtestingAppConfig;
                        } else {
                            self.deviceConfig = config.defaultAppConfig;
                        }
                        self.prepareSync();
                    }
                }
            }
        }
    };
    Apigee.MonitoringClient.prototype.sync = function(syncObject) {
        var syncData = {};
        syncData.logs = syncObject.logs;
        syncData.metrics = syncObject.metrics;
        syncData.sessionMetrics = this.sessionMetrics;
        syncData.orgName = this.orgName;
        syncData.appName = this.appName;
        syncData.fullAppName = this.orgName + "_" + this.appName;
        syncData.instaOpsApplicationId = this.configuration.instaOpsApplicationId;
        syncData.timeStamp = timeStamp();
        var syncRequest = new XMLHttpRequest();
        var path = this.URI + "/" + this.orgName + "/" + this.appName + "/apm/apmMetrics";
        syncRequest.open(VERBS.post, path, false);
        syncRequest.setRequestHeader("Accept", "application/json");
        syncRequest.setRequestHeader("Content-Type", "application/json");
        syncRequest.send(JSON.stringify(syncData));
        if (syncRequest.status === 200) {
            logs = [];
            metrics = [];
            var response = syncRequest.responseText;
        } else {
            console.log("Error syncing");
            console.log(syncRequest.responseText);
        }
    };
    Apigee.MonitoringClient.catchCrashReport = function(crashEvent, url, line) {
        logCrash({
            tag: "CRASH",
            logMessage: "Error:" + crashEvent + " for url:" + url + " on line:" + line
        });
    };
    Apigee.MonitoringClient.prototype.startLocationCapture = function() {
        var self = this;
        if (self.deviceConfig.locationCaptureEnabled && typeof navigator.geolocation !== "undefined") {
            var geoSuccessCallback = function(position) {
                self.sessionMetrics.latitude = position.coords.latitude;
                self.sessionMetrics.longitude = position.coords.longitude;
            };
            var geoErrorCallback = function() {
                console.log("Location access is not available.");
            };
            navigator.geolocation.getCurrentPosition(geoSuccessCallback, geoErrorCallback);
        }
    };
    Apigee.MonitoringClient.prototype.detectAppPlatform = function(sessionSummary) {
        var self = this;
        var callbackHandler_Titanium = function(e) {
            sessionSummary.devicePlatform = e.name;
            sessionSummary.deviceOSVersion = e.osname;
            if (self.deviceConfig.deviceIdCaptureEnabled) {
                if (self.deviceConfig.obfuscateDeviceId) {
                    sessionSummary.deviceId = generateDeviceId();
                } else {
                    sessionSummary.deviceId = e.uuid;
                }
            } else {
                if (this.deviceConfig.obfuscateDeviceId) {
                    sessionSummary.deviceId = generateDeviceId();
                } else {
                    sessionSummary.deviceId = UNKNOWN;
                }
            }
            sessionSummary.deviceModel = e.model;
            sessionSummary.networkType = e.networkType;
        };
        var callbackHandler_PhoneGap = function(e) {
            if ("device" in window) {
                sessionSummary.devicePlatform = window.device.platform;
                sessionSummary.deviceOSVersion = window.device.version;
                sessionSummary.deviceModel = window.device.name;
            } else if (window.cordova) {
                sessionSummary.devicePlatform = window.cordova.platformId;
                sessionSummary.deviceOSVersion = UNKNOWN;
                sessionSummary.deviceModel = UNKNOWN;
            }
            if ("connection" in navigator) {
                sessionSummary.networkType = navigator.connection.type || UNKNOWN;
            }
            if (self.deviceConfig.deviceIdCaptureEnabled) {
                if (self.deviceConfig.obfuscateDeviceId) {
                    sessionSummary.deviceId = generateDeviceId();
                } else {
                    sessionSummary.deviceId = window.device.uuid;
                }
            } else {
                if (this.deviceConfig.obfuscateDeviceId) {
                    sessionSummary.deviceId = generateDeviceId();
                } else {
                    sessionSummary.deviceId = UNKNOWN;
                }
            }
            return sessionSummary;
        };
        var callbackHandler_Trigger = function(sessionSummary) {
            var os = UNKNOWN;
            if (forge.is.ios()) {
                os = "iOS";
            } else if (forge.is.android()) {
                os = "Android";
            }
            sessionSummary.devicePlatform = UNKNOWN;
            sessionSummary.deviceOSVersion = os;
            if (self.deviceConfig.deviceIdCaptureEnabled) {
                sessionSummary.deviceId = generateDeviceId();
            } else {
                sessionSummary.deviceId = UNKNOWN;
            }
            sessionSummary.deviceModel = UNKNOWN;
            sessionSummary.networkType = forge.is.connection.wifi() ? "WIFI" : UNKNOWN;
            return sessionSummary;
        };
        if (isPhoneGap()) {
            sessionSummary = callbackHandler_PhoneGap(sessionSummary);
        } else if (isTrigger()) {
            sessionSummary = callbackHandler_Trigger(sessionSummary);
        } else if (isTitanium()) {
            Ti.App.addEventListener("analytics:platformMetrics", callbackHandler_Titanium);
        } else {
            if (typeof window.localStorage !== "undefined") {
                if (self.deviceConfig.deviceIdCaptureEnabled) {
                    sessionSummary.deviceId = generateDeviceId();
                }
            }
            if (typeof navigator.userAgent !== "undefined") {
                var browserData = determineBrowserType(navigator.userAgent, navigator.appName);
                sessionSummary.devicePlatform = browserData.devicePlatform;
                sessionSummary.deviceOSVersion = browserData.deviceOSVersion;
                if (typeof navigator.language !== "undefined") {
                    sessionSummary.localLanguage = navigator.language;
                }
            }
        }
        if (isTitanium()) {
            Ti.App.fireEvent("analytics:attachReady");
        }
        return sessionSummary;
    };
    Apigee.MonitoringClient.prototype.startSession = function() {
        if (this.configuration === null || this.configuration === "undefined") {
            return;
        }
        var self = this;
        var sessionSummary = {};
        sessionSummary.timeStamp = timeStamp();
        sessionSummary.appConfigType = this.appConfigType;
        sessionSummary.appId = this.appId.toString();
        sessionSummary.applicationVersion = "undefined" !== typeof this.appVersion ? this.appVersion.toString() : UNKNOWN;
        sessionSummary.batteryLevel = "-100";
        sessionSummary.deviceCountry = UNKNOWN;
        sessionSummary.deviceId = UNKNOWN;
        sessionSummary.deviceModel = UNKNOWN;
        sessionSummary.deviceOSVersion = UNKNOWN;
        sessionSummary.devicePlatform = UNKNOWN;
        sessionSummary.localCountry = UNKNOWN;
        sessionSummary.localLanguage = UNKNOWN;
        sessionSummary.networkCarrier = UNKNOWN;
        sessionSummary.networkCountry = UNKNOWN;
        sessionSummary.networkSubType = UNKNOWN;
        sessionSummary.networkType = UNKNOWN;
        sessionSummary.sdkType = SDKTYPE;
        sessionSummary.sessionId = randomUUID();
        sessionSummary.sessionStartTime = sessionSummary.timeStamp;
        self.startLocationCapture();
        self.sessionMetrics = self.detectAppPlatform(sessionSummary);
    };
    Apigee.MonitoringClient.prototype.patchNetworkCalls = function(XHR) {
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
                if (self.readyState == 4) {
                    var monitoringURL = apigee.getMonitoringURL();
                    if (url.indexOf("/!gap_exec") === -1 && url.indexOf(monitoringURL) === -1) {
                        var endTime = timeStamp();
                        var latency = endTime - startTime;
                        var summary = {
                            url: url,
                            startTime: startTime.toString(),
                            endTime: endTime.toString(),
                            numSamples: "1",
                            latency: latency.toString(),
                            timeStamp: startTime.toString(),
                            httpStatusCode: self.status.toString(),
                            responseDataSize: self.responseText.length.toString()
                        };
                        if (self.status == 200) {
                            summary.numErrors = "0";
                            apigee.logNetworkCall(summary);
                        } else {
                            summary.numErrors = "1";
                            apigee.logNetworkCall(summary);
                        }
                    } else {}
                }
                if (oldOnReadyStateChange) {
                    oldOnReadyStateChange();
                }
            }
            if (!this.noIntercept) {
                startTime = timeStamp();
                if (this.addEventListener) {
                    this.addEventListener("readystatechange", onReadyStateChange, false);
                } else {
                    oldOnReadyStateChange = this.onreadystatechange;
                    this.onreadystatechange = onReadyStateChange;
                }
            }
            send.call(this, data);
        };
    };
    Apigee.MonitoringClient.prototype.patchLoggingCalls = function() {
        var self = this;
        var original = window.console;
        window.console = {
            log: function() {
                self.logInfo({
                    tag: "CONSOLE",
                    logMessage: arguments[0]
                });
                original.log.apply(original, arguments);
            },
            warn: function() {
                self.logWarn({
                    tag: "CONSOLE",
                    logMessage: arguments[0]
                });
                original.warn.apply(original, arguments);
            },
            error: function() {
                self.logError({
                    tag: "CONSOLE",
                    logMessage: arguments[0]
                });
                original.error.apply(original, arguments);
            },
            assert: function() {
                self.logAssert({
                    tag: "CONSOLE",
                    logMessage: arguments[1]
                });
                original.assert.apply(original, arguments);
            },
            debug: function() {
                self.logDebug({
                    tag: "CONSOLE",
                    logMessage: arguments[0]
                });
                original.debug.apply(original, arguments);
            }
        };
        if (isTitanium()) {
            var originalTitanium = Ti.API;
            window.console.log = function() {
                originalTitanium.info.apply(originalTitanium, arguments);
            };
            Ti.API = {
                info: function() {
                    self.logInfo({
                        tag: "CONSOLE_TITANIUM",
                        logMessage: arguments[0]
                    });
                    originalTitanium.info.apply(originalTitanium, arguments);
                },
                log: function() {
                    var level = arguments[0];
                    if (level === "info") {
                        self.logInfo({
                            tag: "CONSOLE_TITANIUM",
                            logMessage: arguments[1]
                        });
                    } else if (level === "warn") {
                        self.logWarn({
                            tag: "CONSOLE_TITANIUM",
                            logMessage: arguments[1]
                        });
                    } else if (level === "error") {
                        self.logError({
                            tag: "CONSOLE_TITANIUM",
                            logMessage: arguments[1]
                        });
                    } else if (level === "debug") {
                        self.logDebug({
                            tag: "CONSOLE_TITANIUM",
                            logMessage: arguments[1]
                        });
                    } else if (level === "trace") {
                        self.logAssert({
                            tag: "CONSOLE_TITANIUM",
                            logMessage: arguments[1]
                        });
                    } else {
                        self.logInfo({
                            tag: "CONSOLE_TITANIUM",
                            logMessage: arguments[1]
                        });
                    }
                    originalTitanium.log.apply(originalTitanium, arguments);
                }
            };
        }
    };
    Apigee.MonitoringClient.prototype.prepareSync = function() {
        var syncObject = {};
        var self = this;
        if (typeof self.sessionMetrics !== "undefined") {
            syncObject.sessionMetrics = self.sessionMetrics;
        }
        var syncFlag = false;
        this.syncDate = timeStamp();
        if (metrics.length > 0) {
            syncFlag = true;
        }
        if (logs.length > 0) {
            syncFlag = true;
        }
        syncObject.logs = logs;
        syncObject.metrics = metrics;
        if (syncFlag && !self.testMode) {
            this.sync(syncObject);
        }
    };
    Apigee.MonitoringClient.prototype.logMessage = function(options) {
        var log = options || {};
        var cleansedLog = {
            logLevel: log.logLevel,
            logMessage: log.logMessage.substring(0, 250),
            tag: log.tag,
            timeStamp: timeStamp()
        };
        logs.push(cleansedLog);
    };
    Apigee.MonitoringClient.prototype.logVerbose = function(options) {
        var logOptions = options || {};
        logOptions.logLevel = LOGLEVELS.verbose;
        if (this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.verbose) {
            this.logMessage(options);
        }
    };
    Apigee.MonitoringClient.prototype.logDebug = function(options) {
        var logOptions = options || {};
        logOptions.logLevel = LOGLEVELS.debug;
        if (this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.debug) {
            this.logMessage(options);
        }
    };
    Apigee.MonitoringClient.prototype.logInfo = function(options) {
        var logOptions = options || {};
        logOptions.logLevel = LOGLEVELS.info;
        if (this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.info) {
            this.logMessage(options);
        }
    };
    Apigee.MonitoringClient.prototype.logWarn = function(options) {
        var logOptions = options || {};
        logOptions.logLevel = LOGLEVELS.warn;
        if (this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.warn) {
            this.logMessage(options);
        }
    };
    Apigee.MonitoringClient.prototype.logError = function(options) {
        var logOptions = options || {};
        logOptions.logLevel = LOGLEVELS.error;
        if (this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.error) {
            this.logMessage(options);
        }
    };
    Apigee.MonitoringClient.prototype.logAssert = function(options) {
        var logOptions = options || {};
        logOptions.logLevel = LOGLEVELS.assert;
        if (this.deviceConfig.logLevelToMonitor >= LOGLEVELNUMBERS.assert) {
            this.logMessage(options);
        }
    };
    function logCrash(options) {
        var log = options || {};
        var cleansedLog = {
            logLevel: LOGLEVELS.assert,
            logMessage: log.logMessage,
            tag: log.tag,
            timeStamp: timeStamp()
        };
        logs.push(cleansedLog);
    }
    Apigee.MonitoringClient.prototype.logNetworkCall = function(options) {
        metrics.push(options);
    };
    Apigee.MonitoringClient.prototype.getMonitoringURL = function() {
        return this.URI + "/" + this.orgName + "/" + this.appName + "/apm/";
    };
    Apigee.MonitoringClient.prototype.getConfig = function(key) {};
    Apigee.MonitoringClient.prototype.logs = function() {
        return logs;
    };
    Apigee.MonitoringClient.prototype.metrics = function() {
        return metrics;
    };
    Apigee.MonitoringClient.prototype.getSessionMetrics = function() {
        return this.sessionMetrics;
    };
    Apigee.MonitoringClient.prototype.clearMetrics = function() {
        logs = [];
        metrics = [];
    };
    Apigee.MonitoringClient.prototype.mixin = function(destObject) {
        var props = [ "bind", "unbind", "trigger" ];
        for (var i = 0; i < props.length; i++) {
            destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
        }
    };
    function randomUUID() {
        var s = [], itoh = "0123456789ABCDEF", i;
        for (i = 0; i < 36; i++) {
            s[i] = Math.floor(Math.random() * 16);
        }
        s[14] = 4;
        s[19] = s[19] & 3 | 8;
        for (i = 0; i < 36; i++) {
            s[i] = itoh[s[i]];
        }
        s[8] = s[13] = s[18] = s[23] = "-";
        return s.join("");
    }
    function timeStamp() {
        return new Date().getTime().toString();
    }
    function generateDeviceId() {
        if (typeof window.localStorage.getItem("uuid") === null) {
            return window.localStorage.getItem("uuid");
        } else {
            var uuid = randomUUID();
            window.localStorage.setItem("uuid", uuid);
            return window.localStorage.getItem("uuid");
        }
    }
    function isPhoneGap() {
        return typeof cordova !== "undefined" || typeof PhoneGap !== "undefined" || typeof window.device !== "undefined";
    }
    function isTrigger() {
        return typeof window.forge !== "undefined";
    }
    function isTitanium() {
        return typeof Titanium !== "undefined";
    }
    var BROWSERS = [ "Opera", "MSIE", "Safari", "Chrome", "Firefox" ];
    function determineBrowserType(ua, appName) {
        var browserName = appName;
        var nameOffset, verOffset, verLength, ix, fullVersion = UNKNOWN;
        var browserData = {
            devicePlatform: UNKNOWN,
            deviceOSVersion: UNKNOWN
        };
        BROWSERS.forEach(function(b) {
            if (fullVersion !== UNKNOWN) {
                return;
            }
            verOffset = ua.indexOf(b);
            verLength = verOffset + b.length + 1;
            if (verOffset !== -1) {
                browserName = b;
                fullVersion = ua.substring(verLength);
                if ((verOffset = ua.indexOf("Version")) != -1) {
                    fullVersion = ua.substring(verOffset + 8);
                }
            }
        });
        if (fullVersion === UNKNOWN) {
            nameOffset = ua.lastIndexOf(" ") + 1;
            verOffset = ua.lastIndexOf("/");
            if (nameOffset < verOffset) {
                browserName = ua.substring(nameOffset, verOffset);
                fullVersion = ua.substring(verOffset + 1);
            }
        }
        if ((ix = fullVersion.indexOf(";")) != -1) {
            fullVersion = fullVersion.substring(0, ix);
        }
        if ((ix = fullVersion.indexOf(" ")) != -1) {
            fullVersion = fullVersion.substring(0, ix);
        }
        if (browserName === "MSIE") {
            browserName = "Microsoft Internet Explorer";
        }
        browserData.devicePlatform = browserName;
        browserData.deviceOSVersion = fullVersion;
        return browserData;
    }
    global[name] = {
        Client: Apigee.Client,
        Entity: Apigee.entity,
        Collection: Apigee.collection,
        Group: Apigee.group,
        MonitoringClient: Apigee.MonitoringClient,
        AUTH_CLIENT_ID: Apigee.AUTH_CLIENT_ID,
        AUTH_APP_USER: Apigee.AUTH_APP_USER,
        AUTH_NONE: Apigee.AUTH_NONE
    };
    global[name].noConflict = function() {
        if (overwrittenName) {
            global[name] = overwrittenName;
        }
        return Apigee;
    };
    return global[name];
})();