/*! apigee-javascript-sdk@2.0.5 2014-01-08 */
(function() {
    var name = "Usergrid", global = global || this, overwrittenName = global[name];
    var AUTH_CLIENT_ID = "CLIENT_ID";
    var AUTH_APP_USER = "APP_USER";
    var AUTH_NONE = "NONE";
    if ("undefined" === typeof console) {
        global.console = {
            log: function() {},
            warn: function() {},
            error: function() {},
            dir: function() {}
        };
    }
    function Usergrid() {}
    Usergrid.Client = function(options) {
        this.URI = options.URI || "https://api.usergrid.com";
        if (options.orgName) {
            this.set("orgName", options.orgName);
        }
        if (options.appName) {
            this.set("appName", options.appName);
        }
        if (options.appVersion) {
            this.set("appVersion", options.appVersion);
        }
        this.authType = options.authType || AUTH_NONE;
        this.clientId = options.clientId;
        this.clientSecret = options.clientSecret;
        this.setToken(options.token || null);
        this.buildCurl = options.buildCurl || false;
        this.logging = options.logging || false;
        this._callTimeout = options.callTimeout || 3e4;
        this._callTimeoutCallback = options.callTimeoutCallback || null;
        this.logoutCallback = options.logoutCallback || null;
    };
    Usergrid.Client.prototype._request_node = function(options, callback) {
        global.request = global.request || require("request");
        var request = global.request;
        var self = this;
        var method = options.method || "GET";
        var endpoint = options.endpoint;
        var body = options.body || {};
        var qs = options.qs || {};
        var mQuery = options.mQuery || false;
        var orgName = this.get("orgName");
        var appName = this.get("appName");
        if (!mQuery && !orgName && !appName) {
            if (typeof this.logoutCallback === "function") {
                return this.logoutCallback(true, "no_org_or_app_name_specified");
            }
        }
        if (mQuery) {
            uri = this.URI + "/" + endpoint;
        } else {
            uri = this.URI + "/" + orgName + "/" + appName + "/" + endpoint;
        }
        if (this.authType === AUTH_CLIENT_ID) {
            qs.client_id = this.clientId;
            qs.client_secret = this.clientSecret;
        } else if (this.authType === AUTH_APP_USER) {
            qs.access_token = self.getToken();
        }
        if (this.logging) {
            console.log("calling: " + method + " " + uri);
        }
        this._start = new Date().getTime();
        var callOptions = {
            method: method,
            uri: uri,
            json: body,
            qs: qs
        };
        request(callOptions, function(err, r, data) {
            if (self.buildCurl) {
                options.uri = r.request.uri.href;
                self.buildCurlCall(options);
            }
            self._end = new Date().getTime();
            if (r.statusCode === 200) {
                if (self.logging) {
                    console.log("success (time: " + self.calcTimeDiff() + "): " + method + " " + uri);
                }
                callback(err, data);
            } else {
                err = true;
                if (r.error === "auth_expired_session_token" || r.error === "auth_missing_credentials" || r.error == "auth_unverified_oath" || r.error === "expired_token" || r.error === "unauthorized" || r.error === "auth_invalid") {
                    var error = r.body.error;
                    var errorDesc = r.body.error_description;
                    if (self.logging) {
                        console.log("Error (" + r.statusCode + ")(" + error + "): " + errorDesc);
                    }
                    if (typeof self.logoutCallback === "function") {
                        self.logoutCallback(err, data);
                    } else if (typeof callback === "function") {
                        callback(err, data);
                    }
                } else {
                    var error = r.body.error;
                    var errorDesc = r.body.error_description;
                    if (self.logging) {
                        console.log("Error (" + r.statusCode + ")(" + error + "): " + errorDesc);
                    }
                    if (typeof callback === "function") {
                        callback(err, data);
                    }
                }
            }
        });
    };
    Usergrid.Client.prototype._request_xhr = function(options, callback) {
        var self = this;
        var method = options.method || "GET";
        var endpoint = options.endpoint;
        var body = options.body || {};
        var qs = options.qs || {};
        var mQuery = options.mQuery || false;
        var orgName = this.get("orgName");
        var appName = this.get("appName");
        if (!mQuery && !orgName && !appName) {
            if (typeof this.logoutCallback === "function") {
                return this.logoutCallback(true, "no_org_or_app_name_specified");
            }
        }
        var uri;
        if (mQuery) {
            uri = this.URI + "/" + endpoint;
        } else {
            uri = this.URI + "/" + orgName + "/" + appName + "/" + endpoint;
        }
        if (self.getToken()) {
            qs.access_token = self.getToken();
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
            xhr.setRequestHeader("Accept", "application/json");
        }
        xhr.onerror = function(response) {
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
                callback(err, response);
            }
        };
        xhr.onload = function(response) {
            self._end = new Date().getTime();
            if (self.logging) {
                console.log("success (time: " + self.calcTimeDiff() + "): " + method + " " + uri);
            }
            clearTimeout(timeout);
            try {
                response = JSON.parse(xhr.responseText);
            } catch (e) {
                response = {
                    error: "unhandled_error",
                    error_description: xhr.responseText
                };
                xhr.status = xhr.status === 200 ? 400 : xhr.status;
                console.error(e);
            }
            if (xhr.status != 200) {
                var error = response.error;
                var error_description = response.error_description;
                if (self.logging) {
                    console.log("Error (" + xhr.status + ")(" + error + "): " + error_description);
                }
                if (error == "auth_expired_session_token" || error == "auth_missing_credentials" || error == "auth_unverified_oath" || error == "expired_token" || error == "unauthorized" || error == "auth_invalid") {
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
    Usergrid.Client.prototype.request = function(options, callback) {
        if ("undefined" !== typeof window) {
            Usergrid.Client.prototype._request_xhr.apply(this, arguments);
        } else {
            Usergrid.Client.prototype._request_node.apply(this, arguments);
        }
    };
    Usergrid.Client.prototype.buildAssetURL = function(uuid) {
        var self = this;
        var qs = {};
        var assetURL = this.URI + "/" + this.orgName + "/" + this.appName + "/assets/" + uuid + "/data";
        if (self.getToken()) {
            qs.access_token = self.getToken();
        }
        var encoded_params = encodeParams(qs);
        if (encoded_params) {
            assetURL += "?" + encoded_params;
        }
        return assetURL;
    };
    Usergrid.Client.prototype.createGroup = function(options, callback) {
        var getOnExist = options.getOnExist || false;
        options = {
            path: options.path,
            client: this,
            data: options
        };
        var group = new Usergrid.Group(options);
        group.fetch(function(err, data) {
            var okToSave = err && "service_resource_not_found" === data.error || "no_name_specified" === data.error || "null_pointer" === data.error || !err && getOnExist;
            if (okToSave) {
                group.save(function(err, data) {
                    if (typeof callback === "function") {
                        callback(err, group);
                    }
                });
            } else {
                if (typeof callback === "function") {
                    callback(err, group);
                }
            }
        });
    };
    Usergrid.Client.prototype.createEntity = function(options, callback) {
        var getOnExist = options.getOnExist || false;
        options = {
            client: this,
            data: options
        };
        var entity = new Usergrid.Entity(options);
        entity.fetch(function(err, data) {
            var okToSave = err && "service_resource_not_found" === data.error || "no_name_specified" === data.error || "null_pointer" === data.error || !err && getOnExist;
            if (okToSave) {
                entity.set(options.data);
                entity.save(function(err, data) {
                    if (typeof callback === "function") {
                        callback(err, entity, data);
                    }
                });
            } else {
                if (typeof callback === "function") {
                    callback(err, entity, data);
                }
            }
        });
    };
    Usergrid.Client.prototype.getEntity = function(options, callback) {
        options = {
            client: this,
            data: options
        };
        var entity = new Usergrid.Entity(options);
        entity.fetch(function(err, data) {
            if (typeof callback === "function") {
                callback(err, entity, data);
            }
        });
    };
    Usergrid.Client.prototype.restoreEntity = function(serializedObject) {
        var data = JSON.parse(serializedObject);
        options = {
            client: this,
            data: data
        };
        var entity = new Usergrid.Entity(options);
        return entity;
    };
    Usergrid.Client.prototype.createCollection = function(options, callback) {
        options.client = this;
        var collection = new Usergrid.Collection(options, function(err, data) {
            if (typeof callback === "function") {
                callback(err, collection, data);
            }
        });
    };
    Usergrid.Client.prototype.restoreCollection = function(serializedObject) {
        var data = JSON.parse(serializedObject);
        data.client = this;
        var collection = new Usergrid.Collection(data);
        return collection;
    };
    Usergrid.Client.prototype.getFeedForUser = function(username, callback) {
        var options = {
            method: "GET",
            endpoint: "users/" + username + "/feed"
        };
        this.request(options, function(err, data) {
            if (typeof callback === "function") {
                if (err) {
                    callback(err);
                } else {
                    callback(err, data, data.entities);
                }
            }
        });
    };
    Usergrid.Client.prototype.createUserActivity = function(user, options, callback) {
        options.type = "users/" + user + "/activities";
        options = {
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
    Usergrid.Client.prototype.createUserActivityWithEntity = function(user, content, callback) {
        var username = user.get("username");
        var options = {
            actor: {
                displayName: username,
                uuid: user.get("uuid"),
                username: username,
                email: user.get("email"),
                picture: user.get("picture"),
                image: {
                    duration: 0,
                    height: 80,
                    url: user.get("picture"),
                    width: 80
                }
            },
            verb: "post",
            content: content
        };
        this.createUserActivity(username, options, callback);
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
        this.set("token", token);
    };
    Usergrid.Client.prototype.getToken = function() {
        return this.get("token");
    };
    Usergrid.Client.prototype.setObject = function(key, value) {
        if (value) {
            value = JSON.stringify(value);
        }
        this.set(key, value);
    };
    Usergrid.Client.prototype.set = function(key, value) {
        var keyStore = "apigee_" + key;
        this[key] = value;
        if (typeof Storage !== "undefined") {
            if (value) {
                localStorage.setItem(keyStore, value);
            } else {
                localStorage.removeItem(keyStore);
            }
        }
    };
    Usergrid.Client.prototype.getObject = function(key) {
        return JSON.parse(this.get(key));
    };
    Usergrid.Client.prototype.get = function(key) {
        var keyStore = "apigee_" + key;
        if (this[key]) {
            return this[key];
        } else if (typeof Storage !== "undefined") {
            return localStorage.getItem(keyStore);
        }
        return null;
    };
    Usergrid.Client.prototype.signup = function(username, password, email, name, callback) {
        var self = this;
        var options = {
            type: "users",
            username: username,
            password: password,
            email: email,
            name: name
        };
        this.createEntity(options, callback);
    };
    Usergrid.Client.prototype.login = function(username, password, callback) {
        var self = this;
        var options = {
            method: "POST",
            endpoint: "token",
            body: {
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
                options = {
                    client: self,
                    data: data.user
                };
                user = new Usergrid.Entity(options);
                self.setToken(data.access_token);
            }
            if (typeof callback === "function") {
                callback(err, data, user);
            }
        });
    };
    Usergrid.Client.prototype.reAuthenticateLite = function(callback) {
        var self = this;
        var options = {
            method: "GET",
            endpoint: "management/me",
            mQuery: true
        };
        this.request(options, function(err, response) {
            if (err && self.logging) {
                console.log("error trying to re-authenticate user");
            } else {
                self.setToken(response.access_token);
            }
            if (typeof callback === "function") {
                callback(err);
            }
        });
    };
    Usergrid.Client.prototype.reAuthenticate = function(email, callback) {
        var self = this;
        var options = {
            method: "GET",
            endpoint: "management/users/" + email,
            mQuery: true
        };
        this.request(options, function(err, response) {
            var organizations = {};
            var applications = {};
            var user = {};
            var data;
            if (err && self.logging) {
                console.log("error trying to full authenticate user");
            } else {
                data = response.data;
                self.setToken(data.token);
                self.set("email", data.email);
                localStorage.setItem("accessToken", data.token);
                localStorage.setItem("userUUID", data.uuid);
                localStorage.setItem("userEmail", data.email);
                var userData = {
                    username: data.username,
                    email: data.email,
                    name: data.name,
                    uuid: data.uuid
                };
                options = {
                    client: self,
                    data: userData
                };
                user = new Usergrid.Entity(options);
                organizations = data.organizations;
                var org = "";
                try {
                    var existingOrg = self.get("orgName");
                    org = organizations[existingOrg] ? organizations[existingOrg] : organizations[Object.keys(organizations)[0]];
                    self.set("orgName", org.name);
                } catch (e) {
                    err = true;
                    if (self.logging) {
                        console.log("error selecting org");
                    }
                }
                applications = self.parseApplicationsArray(org);
                self.selectFirstApp(applications);
                self.setObject("organizations", organizations);
                self.setObject("applications", applications);
            }
            if (typeof callback === "function") {
                callback(err, data, user, organizations, applications);
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
                var options = {
                    client: self,
                    data: data.user
                };
                user = new Usergrid.Entity(options);
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
        if (this.getToken() && this.getToken() != "null") {
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
        if ("undefined" !== typeof window) {
            body = JSON.stringify(body);
        }
        if (body !== '"{}"' && method !== "GET" && method !== "DELETE") {
            curl += " -d '" + body + "'";
        }
        console.log(curl);
        return curl;
    };
    Usergrid.Client.prototype.getDisplayImage = function(email, picture, size) {
        try {
            if (picture) {
                return picture;
            }
            var size = size || 50;
            if (email.length) {
                return "https://secure.gravatar.com/avatar/" + MD5(email) + "?s=" + size + encodeURI("&d=https://apigee.com/usergrid/images/user_profile.png");
            } else {
                return "https://apigee.com/usergrid/images/user_profile.png";
            }
        } catch (e) {
            return "https://apigee.com/usergrid/images/user_profile.png";
        }
    };
    Usergrid.Entity = function(options) {
        if (options) {
            this._data = options.data || {};
            this._client = options.client || {};
        }
    };
    Usergrid.Entity.prototype.serialize = function() {
        return JSON.stringify(this._data);
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
            this._data = {};
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
            if (item === "metadata" || item === "created" || item === "modified" || item === "type" || item === "activated" || item === "uuid") {
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
                if (retdata.entities) {
                    if (retdata.entities.length) {
                        var entity = retdata.entities[0];
                        self.set(entity);
                        var path = retdata.path;
                        while (path.substring(0, 1) === "/") {
                            path = path.substring(1);
                        }
                        self.set("type", path);
                    }
                }
                var needPasswordChange = (self.get("type") === "user" || self.get("type") === "users") && entityData.oldpassword && entityData.newpassword;
                if (needPasswordChange) {
                    var pwdata = {};
                    pwdata.oldpassword = entityData.oldpassword;
                    pwdata.newpassword = entityData.newpassword;
                    var options = {
                        method: "PUT",
                        endpoint: type + "/password",
                        body: pwdata
                    };
                    self._client.request(options, function(err, data) {
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
        try {
            if (type === undefined) {
                throw "cannot fetch entity, no entity type specified";
            } else if (this.get("uuid")) {
                type += "/" + this.get("uuid");
            } else if (type === "users" && this.get("username")) {
                type += "/" + this.get("username");
            } else if (this.get("name")) {
                type += "/" + encodeURIComponent(this.get("name"));
            } else if (typeof callback === "function") {
                throw "no_name_specified";
            }
        } catch (e) {
            if (self._client.logging) {
                console.log(e);
            }
            return callback(true, {
                error: e
            }, self);
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
                    self._json = JSON.stringify(data.user, null, 2);
                } else if (data.entities) {
                    if (data.entities.length) {
                        var entity = data.entities[0];
                        self.set(entity);
                    }
                }
            }
            if (typeof callback === "function") {
                callback(err, data, self);
            }
        });
    };
    Usergrid.Entity.prototype.destroy = function(callback) {
        var self = this;
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
        var error;
        var connecteeType = entity.get("type");
        var connectee = this.getEntityId(entity);
        if (!connectee) {
            if (typeof callback === "function") {
                error = "Error trying to delete object - no uuid specified.";
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
                error = "Error in connect - no uuid specified.";
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
                callback(err, data, data.entities);
            }
        });
    };
    Usergrid.Entity.prototype.getGroups = function(callback) {
        var self = this;
        var endpoint = "users" + "/" + this.get("uuid") + "/groups";
        var options = {
            method: "GET",
            endpoint: endpoint
        };
        this._client.request(options, function(err, data) {
            if (err && self._client.logging) {
                console.log("entity could not be connected");
            }
            self.groups = data.entities;
            if (typeof callback === "function") {
                callback(err, data, data.entities);
            }
        });
    };
    Usergrid.Entity.prototype.getActivities = function(callback) {
        var self = this;
        var endpoint = this.get("type") + "/" + this.get("uuid") + "/activities";
        var options = {
            method: "GET",
            endpoint: endpoint
        };
        this._client.request(options, function(err, data) {
            if (err && self._client.logging) {
                console.log("entity could not be connected");
            }
            for (var entity in data.entities) {
                data.entities[entity].createdDate = new Date(data.entities[entity].created).toUTCString();
            }
            self.activities = data.entities;
            if (typeof callback === "function") {
                callback(err, data, data.entities);
            }
        });
    };
    Usergrid.Entity.prototype.getFollowing = function(callback) {
        var self = this;
        var endpoint = "users" + "/" + this.get("uuid") + "/following";
        var options = {
            method: "GET",
            endpoint: endpoint
        };
        this._client.request(options, function(err, data) {
            if (err && self._client.logging) {
                console.log("could not get user following");
            }
            for (var entity in data.entities) {
                data.entities[entity].createdDate = new Date(data.entities[entity].created).toUTCString();
                var image = self._client.getDisplayImage(data.entities[entity].email, data.entities[entity].picture);
                data.entities[entity]._portal_image_icon = image;
            }
            self.following = data.entities;
            if (typeof callback === "function") {
                callback(err, data, data.entities);
            }
        });
    };
    Usergrid.Entity.prototype.getFollowers = function(callback) {
        var self = this;
        var endpoint = "users" + "/" + this.get("uuid") + "/followers";
        var options = {
            method: "GET",
            endpoint: endpoint
        };
        this._client.request(options, function(err, data) {
            if (err && self._client.logging) {
                console.log("could not get user followers");
            }
            for (var entity in data.entities) {
                data.entities[entity].createdDate = new Date(data.entities[entity].created).toUTCString();
                var image = self._client.getDisplayImage(data.entities[entity].email, data.entities[entity].picture);
                data.entities[entity]._portal_image_icon = image;
            }
            self.followers = data.entities;
            if (typeof callback === "function") {
                callback(err, data, data.entities);
            }
        });
    };
    Usergrid.Entity.prototype.getRoles = function(callback) {
        var self = this;
        var endpoint = this.get("type") + "/" + this.get("uuid") + "/roles";
        var options = {
            method: "GET",
            endpoint: endpoint
        };
        this._client.request(options, function(err, data) {
            if (err && self._client.logging) {
                console.log("could not get user roles");
            }
            self.roles = data.entities;
            if (typeof callback === "function") {
                callback(err, data, data.entities);
            }
        });
    };
    Usergrid.Entity.prototype.getPermissions = function(callback) {
        var self = this;
        var endpoint = this.get("type") + "/" + this.get("uuid") + "/permissions";
        var options = {
            method: "GET",
            endpoint: endpoint
        };
        this._client.request(options, function(err, data) {
            if (err && self._client.logging) {
                console.log("could not get user permissions");
            }
            var permissions = [];
            if (data.data) {
                var perms = data.data;
                var count = 0;
                for (var i in perms) {
                    count++;
                    var perm = perms[i];
                    var parts = perm.split(":");
                    var ops_part = "";
                    var path_part = parts[0];
                    if (parts.length > 1) {
                        ops_part = parts[0];
                        path_part = parts[1];
                    }
                    ops_part.replace("*", "get,post,put,delete");
                    var ops = ops_part.split(",");
                    var ops_object = {};
                    ops_object.get = "no";
                    ops_object.post = "no";
                    ops_object.put = "no";
                    ops_object.delete = "no";
                    for (var j in ops) {
                        ops_object[ops[j]] = "yes";
                    }
                    permissions.push({
                        operations: ops_object,
                        path: path_part,
                        perm: perm
                    });
                }
            }
            self.permissions = permissions;
            if (typeof callback === "function") {
                callback(err, data, data.entities);
            }
        });
    };
    Usergrid.Entity.prototype.disconnect = function(connection, entity, callback) {
        var self = this;
        var error;
        var connecteeType = entity.get("type");
        var connectee = this.getEntityId(entity);
        if (!connectee) {
            if (typeof callback === "function") {
                error = "Error trying to delete object - no uuid specified.";
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
                error = "Error in connect - no uuid specified.";
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
        if (options) {
            this._client = options.client;
            this._type = options.type;
            this.qs = options.qs || {};
            this._list = options.list || [];
            this._iterator = options.iterator || -1;
            this._previous = options.previous || [];
            this._next = options.next || null;
            this._cursor = options.cursor || null;
            if (options.list) {
                var count = options.list.length;
                for (var i = 0; i < count; i++) {
                    var entity = this._client.restoreEntity(options.list[i]);
                    this._list[i] = entity;
                }
            }
        }
        if (callback) {
            this.fetch(callback);
        }
    };
    Usergrid.Collection.prototype.serialize = function() {
        var data = {};
        data.type = this._type;
        data.qs = this.qs;
        data.iterator = this._iterator;
        data.previous = this._previous;
        data.next = this._next;
        data.cursor = this._cursor;
        this.resetEntityPointer();
        var i = 0;
        data.list = [];
        while (this.hasNextEntity()) {
            var entity = this.getNextEntity();
            data.list[i] = entity.serialize();
            i++;
        }
        data = JSON.stringify(data);
        return data;
    };
    Usergrid.Collection.prototype.addCollection = function(collectionName, options, callback) {
        self = this;
        options.client = this._client;
        var collection = new Usergrid.Collection(options, function(err, data) {
            if (typeof callback === "function") {
                collection.resetEntityPointer();
                while (collection.hasNextEntity()) {
                    var user = collection.getNextEntity();
                    var email = user.get("email");
                    var image = self._client.getDisplayImage(user.get("email"), user.get("picture"));
                    user._portal_image_icon = image;
                }
                self[collectionName] = collection;
                callback(err, collection);
            }
        });
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
                            self._baseType = data.entities[i].type;
                            entityData.type = self._type;
                            var entityOptions = {
                                type: self._type,
                                client: self._client,
                                uuid: uuid,
                                data: entityData
                            };
                            var ent = new Usergrid.Entity(entityOptions);
                            ent._json = JSON.stringify(entityData, null, 2);
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
    Usergrid.Collection.prototype.addExistingEntity = function(entity) {
        var count = this._list.length;
        this._list[count] = entity;
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
        this.removeEntity(entity);
    };
    Usergrid.Collection.prototype.removeEntity = function(entity) {
        var uuid = entity.get("uuid");
        for (var key in this._list) {
            var listItem = this._list[key];
            if (listItem.get("uuid") === uuid) {
                return this._list.splice(key, 1);
            }
        }
        return false;
    };
    Usergrid.Collection.prototype.getEntityByUUID = function(uuid, callback) {
        for (var key in this._list) {
            var listItem = this._list[key];
            if (listItem.get("uuid") === uuid) {
                return listItem;
            }
        }
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
        var hasNextElement = this._iterator >= 0 && this._iterator < this._list.length;
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
            return this._list[this._iterator];
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
        } else {
            callback(true);
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
        } else {
            callback(true);
        }
    };
    Usergrid.Group = function(options, callback) {
        this._path = options.path;
        this._list = [];
        this._client = options.client;
        this._data = options.data || {};
        this._data.type = "groups";
    };
    Usergrid.Group.prototype = new Usergrid.Entity();
    Usergrid.Group.prototype.fetch = function(callback) {
        var self = this;
        var groupEndpoint = "groups/" + this._path;
        var memberEndpoint = "groups/" + this._path + "/users";
        var groupOptions = {
            method: "GET",
            endpoint: groupEndpoint
        };
        var memberOptions = {
            method: "GET",
            endpoint: memberEndpoint
        };
        this._client.request(groupOptions, function(err, data) {
            if (err) {
                if (self._client.logging) {
                    console.log("error getting group");
                }
                if (typeof callback === "function") {
                    callback(err, data);
                }
            } else {
                if (data.entities) {
                    var groupData = data.entities[0];
                    self._data = groupData || {};
                    self._client.request(memberOptions, function(err, data) {
                        if (err && self._client.logging) {
                            console.log("error getting group users");
                        } else {
                            if (data.entities) {
                                var count = data.entities.length;
                                self._list = [];
                                for (var i = 0; i < count; i++) {
                                    var uuid = data.entities[i].uuid;
                                    if (uuid) {
                                        var entityData = data.entities[i] || {};
                                        var entityOptions = {
                                            type: entityData.type,
                                            client: self._client,
                                            uuid: uuid,
                                            data: entityData
                                        };
                                        var entity = new Usergrid.Entity(entityOptions);
                                        self._list.push(entity);
                                    }
                                }
                            }
                        }
                        if (typeof callback === "function") {
                            callback(err, data, self._list);
                        }
                    });
                }
            }
        });
    };
    Usergrid.Group.prototype.members = function(callback) {
        if (typeof callback === "function") {
            callback(null, this._list);
        }
    };
    Usergrid.Group.prototype.add = function(options, callback) {
        var self = this;
        options = {
            method: "POST",
            endpoint: "groups/" + this._path + "/users/" + options.user.get("username")
        };
        this._client.request(options, function(error, data) {
            if (error) {
                if (typeof callback === "function") {
                    callback(error, data, data.entities);
                }
            } else {
                self.fetch(callback);
            }
        });
    };
    Usergrid.Group.prototype.remove = function(options, callback) {
        var self = this;
        options = {
            method: "DELETE",
            endpoint: "groups/" + this._path + "/users/" + options.user.get("username")
        };
        this._client.request(options, function(error, data) {
            if (error) {
                if (typeof callback === "function") {
                    callback(error, data);
                }
            } else {
                self.fetch(callback);
            }
        });
    };
    Usergrid.Group.prototype.feed = function(callback) {
        var self = this;
        var endpoint = "groups/" + this._path + "/feed";
        var options = {
            method: "GET",
            endpoint: endpoint
        };
        this._client.request(options, function(err, data) {
            if (err && self.logging) {
                console.log("error trying to log user in");
            }
            if (typeof callback === "function") {
                callback(err, data, data.entities);
            }
        });
    };
    Usergrid.Group.prototype.createGroupActivity = function(options, callback) {
        var user = options.user;
        options = {
            client: this._client,
            data: {
                actor: {
                    displayName: user.get("username"),
                    uuid: user.get("uuid"),
                    username: user.get("username"),
                    email: user.get("email"),
                    picture: user.get("picture"),
                    image: {
                        duration: 0,
                        height: 80,
                        url: user.get("picture"),
                        width: 80
                    }
                },
                verb: "post",
                content: options.content,
                type: "groups/" + this._path + "/activities"
            }
        };
        var entity = new Usergrid.Entity(options);
        entity.save(function(err, data) {
            if (typeof callback === "function") {
                callback(err, entity);
            }
        });
    };
    function isUUID(uuid) {
        var uuidValueRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuid) {
            return false;
        }
        return uuidValueRegex.test(uuid);
    }
    function encodeParams(params) {
        var tail = [];
        var item = [];
        var i;
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
    Usergrid.SDK_VERSION = "0.10.07";
    Usergrid.NODE_MODULE_VERSION = Usergrid.SDK_VERSION;
    global[name] = {
        client: Usergrid.Client,
        entity: Usergrid.Entity,
        collection: Usergrid.Collection,
        group: Usergrid.Group,
        AUTH_CLIENT_ID: AUTH_CLIENT_ID,
        AUTH_APP_USER: AUTH_APP_USER,
        AUTH_NONE: AUTH_NONE
    };
    global[name].noConflict = function() {
        if (overwrittenName) {
            global[name] = overwrittenName;
        }
        return Usergrid;
    };
})();

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
                this.sync({});
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
        var deviceId = "UNKNOWN";
        try {
            if ("undefined" === typeof localStorage) {
                throw new Error("device or platform does not support local storage");
            }
            if (window.localStorage.getItem("uuid") === null) {
                window.localStorage.setItem("uuid", randomUUID());
            }
            deviceId = window.localStorage.getItem("uuid");
        } catch (e) {
            deviceId = randomUUID();
            console.warn(e);
        } finally {
            return deviceId;
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
    function createBrowserRegex(browser) {
        return new RegExp("\\b(" + browser + ")\\/([^\\s]+)");
    }
    function createBrowserTest(userAgent, positive, negatives) {
        var matches = BROWSER_REGEX[positive].exec(userAgent);
        negatives = negatives || [];
        if (matches && matches.length && !negatives.some(function(negative) {
            return BROWSER_REGEX[negative].exec(userAgent);
        })) {
            return matches.slice(1, 3);
        }
    }
    var BROWSER_REGEX = [ "Seamonkey", "Firefox", "Chromium", "Chrome", "Safari", "Opera" ].reduce(function(p, c) {
        p[c] = createBrowserRegex(c);
        return p;
    }, {});
    BROWSER_REGEX["MSIE"] = new RegExp(";(MSIE) ([^\\s]+)");
    var BROWSER_TESTS = [ [ "MSIE" ], [ "Opera", [] ], [ "Seamonkey", [] ], [ "Firefox", [ "Seamonkey" ] ], [ "Chromium", [] ], [ "Chrome", [ "Chromium" ] ], [ "Safari", [ "Chromium", "Chrome" ] ] ].map(function(arr) {
        return createBrowserTest(navigator.userAgent, arr[0], arr[1]);
    });
    function determineBrowserType(ua, appName) {
        var browserName = appName;
        var nameOffset, verOffset, verLength, ix, fullVersion = UNKNOWN;
        var browserData = {
            devicePlatform: UNKNOWN,
            deviceOSVersion: UNKNOWN
        };
        var browserData = BROWSER_TESTS.reduce(function(p, c) {
            return c ? c : p;
        }, "UNKNOWN");
        browserName = browserData[0];
        fullVersion = browserData[1];
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