var request = require("request");
var querystring = require("querystring");
var OAuth = require("./trello-oauth");

// Creates a new Trello request wrapper.
// Syntax: new Trello(applicationApiKey, userToken)
var Trello = module.exports = function (key, token) {
  if (!key) {
    throw new Error("Application API key is required");
  }

  this.key = key;
  this.token = token;
  this.host = "https://api.trello.com";
};

// Make a GET request to Trello.
// Syntax: trello.get(uri, [query], callback)
Trello.prototype.get = function () {
  Array.prototype.unshift.call(arguments, "GET");
  return this.request.apply(this, arguments);
};

// Make a POST request to Trello.
// Syntax: trello.post(uri, [query], callback)
Trello.prototype.post = function () {
  Array.prototype.unshift.call(arguments, "POST");
  return this.request.apply(this, arguments);
};

// Make a PUT request to Trello.
// Syntax: trello.put(uri, [query], callback)
Trello.prototype.put = function () {
  Array.prototype.unshift.call(arguments, "PUT");
  return this.request.apply(this, arguments);
};

// Make a DELETE request to Trello.
// Syntax: trello.del(uri, [query], callback)
Trello.prototype.del = function () {
  Array.prototype.unshift.call(arguments, "DELETE");
  return this.request.apply(this, arguments);
};

// Make a request to Trello.
// Syntax: trello.request(method, uri, [query], callback)
Trello.prototype.request = function (method, uri, argsOrCallback, callback) {
  var args;

  if (arguments.length === 3) {
    callback = argsOrCallback;
    args = {};
  }
  else {
    args = argsOrCallback || {};
  }

  var url = this.host + (uri[0] === "/" ? "" : "/") + uri;

  if (method === "GET") {
    url += "?" + querystring.stringify(this.addAuthArgs(this.parseQuery(uri, args)));
  }

  var options = {
    url: url,
    method: method
  };

  if (args.attachment) {
    options.formData = {
      key: this.key,
      token: this.token
    };

    if (typeof args.attachment === "string" || args.attachment instanceof String) {
      options.formData.url = args.attachment;
    }
    else {
      options.formData.file = args.attachment;
    }
  }
  else {
    options.json = this.addAuthArgs(this.parseQuery(uri, args));
  }

  request[method === 'DELETE' ? 'del' : method.toLowerCase()](options, function (err, response, body) {
    if (!err && response.statusCode >= 400) {
      err = new Error(body);
      err.statusCode = response.statusCode;
      err.responseBody = body;
      err.statusMessage = require('http').STATUS_CODES[response.statusCode];
    }

    callback(err, body);
  });
};

Trello.prototype.addAuthArgs = function (args) {
  args.key = this.key;

  if (this.token) {
    args.token = this.token;
  }

  return args;
};

Trello.prototype.parseQuery = function (uri, args) {
  if (uri.indexOf("?") !== -1) {
    var ref = querystring.parse(uri.split("?")[1]);

    for (var key in ref) {
      var value = ref[key];
      args[key] = value;
    }
  }

  return args;
};

Trello.OAuth = OAuth;
