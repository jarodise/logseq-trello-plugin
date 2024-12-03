var events = require("events");
var request = require("request");
var mocha = require("mocha");
var should = require("should");
var Trello = require("../index");
var Stream = require("stream");

var behavesLike = require("./trello-behaviors");

describe("Trello", function () {

  describe("#constructor()", function () {
    it("should throw an Error if no API key is supplied", function () {
      (function () { new Trello(); }).should.throw("Application API key is required");
    });

    it("should not require a user's token", function () {
      new Trello("APIKEY").should.be.ok;
    });

    it("should set key and token properties", function () {
      var trello = new Trello("APIKEY", "USERTOKEN");

      trello.key.should.equal("APIKEY");
      trello.token.should.equal("USERTOKEN");
    });
  });

  describe("Requests", function () {
    beforeEach(function () {
      request.get = function (options) {
        this.request = { options: options };
        return new events.EventEmitter();
      }.bind(this);

      request.post = function (options) {
        this.request = { options: options };
        return new events.EventEmitter();
      }.bind(this);

      request.put = function (options) {
        this.request = { options: options };
        return new events.EventEmitter();
      }.bind(this);

      request.del = function (options) {
        this.request = { options: options };
        return new events.EventEmitter();
      }.bind(this);

      request.verb = function (options) {
        this.request = { options: options };
        return new events.EventEmitter();
      }.bind(this);

      this.trello = new Trello("APIKEY", "USERTOKEN");
    });

    describe("#get()", function () {
      beforeEach(function () {
        this.trello.get("/test", { type: "any" }, function () {});
      });

      behavesLike.aRequest();

      it("should not require json arguments", function () {
        this.trello.get("/test", function () {});
        this.request.options.json.should.be.ok;
      });

      it("should make a GET request", function () {
        this.request.options.method.should.equal("GET");
      });
    });

    describe("#post()", function () {
      beforeEach(function () {
        this.trello.post("/test", { type: "any" }, function () {});
      });

      behavesLike.aRequest();

      it("should not require json arguments", function () {
        this.trello.post("/test", function () {});
        this.request.options.json.should.be.ok;
      });

      it("should make a POST request", function () {
        this.request.options.method.should.equal("POST");
      });

      it("should not have query parameters", function () {
        this.request.options.url.should.not.containEql("?");
      });
    });

    describe("#post() - image stream upload", function () {
      beforeEach(function () {
        this.trello.post("/test", { attachment: new Stream.Readable() }, function () {});
      });

      behavesLike.aPostBodyRequest();

      it("should have an formData.file property", function () {
        this.request.options.formData.should.have.property("file");
      });

      // Check if a readable stream
      // http://stackoverflow.com/a/28564000
      it("should have a readable stream as formData.file property", function () {
        this.request.options.formData.file.should.be.an.instanceOf(Stream.Stream);
        this.request.options.formData.file._read.should.be.a.Function;
        this.request.options.formData.file._readableState.should.be.an.Object;
      });
    });

    describe("#post() - image url upload", function () {
      beforeEach(function () {
        this.trello.post("/test", { attachment: 'image.png' }, function () {});
      });

      behavesLike.aPostBodyRequest();

      it("should have an formData.url property", function () {
        this.request.options.formData.should.have.property("url");
      });

      it("should have a string as formData.url property", function () {
        this.request.options.formData.url.should.be.a.String;
      });
    });

    describe("#put()", function () {
      beforeEach(function () {
        this.trello.put("/test", { type: "any" }, function () {});
      });

      behavesLike.aRequest();

      it("should not require json arguments", function () {
        this.trello.put("/test", function () {});
        this.request.options.json.should.be.ok;
      });

      it("should make a PUT request", function () {
        this.request.options.method.should.equal("PUT");
      });
    });

    describe("#del()", function () {
      beforeEach(function () {
        this.trello.del("/test", { type: "any" }, function () {});
      });

      behavesLike.aRequest();

      it("should not require json arguments", function () {
        this.trello.del("/test", function () {});
        this.request.options.json.should.be.ok;
      });

      it("should make a DELETE request", function () {
        this.request.options.method.should.equal("DELETE");
      });
    });

    describe("#request()", function () {
      beforeEach(function () {
        this.trello.request("VERB", "/test", { type: "any" }, function () {});
      });

      behavesLike.aRequest();

      it("should not require json arguments", function () {
        this.trello.request("VERB", "/test", function () {});
        this.request.options.json.should.be.ok;
      });

      it("should make a request with any method specified", function () {
        this.request.options.method.should.equal("VERB");
      });

      it("should allow uris with a leading slash", function () {
        this.trello.request("VERB", "/test", function () {});
        this.request.options.url.should.containEql("https://api.trello.com/test");
      });

      it("should allow uris without a leading slash", function () {
        this.trello.request("VERB", "test", function () {});
        this.request.options.url.should.containEql("https://api.trello.com/test");
      });

      it("should parse jsonstring parameters from the uri", function () {
        this.trello.request("VERB", "/test?name=values", function () {});
        this.request.options.json.should.have.property("name");
        this.request.options.json.name.should.equal("values");
      });

      it("should pass through any errors without response bodies", function () {
        var method = request.get;

        request.get = function (options, callback) {
          callback(new Error("Something bad happened."));
        };

        this.trello.request("GET", "/test", function (err, response) {
          err.message.should.equal("Something bad happened.");
        });

        request.get = method;
      });
    });
  });
});
