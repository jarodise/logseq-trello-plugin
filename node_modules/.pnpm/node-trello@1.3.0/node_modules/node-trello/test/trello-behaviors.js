var should = require("should")

module.exports = {
  aRequest: function () {
    it("should include the key in the json", function () {
      this.request.options.json.should.have.property("key");
      this.request.options.json.key.should.equal("APIKEY");
    });

    it("should include the token in the json", function () {
      this.request.options.json.should.have.property("token");
      this.request.options.json.token.should.equal("USERTOKEN");
    });

    it("should pass any json arguments from the 'json' object", function () {
      this.request.options.json.should.have.property("type");
      this.request.options.json.type.should.equal("any");
    });

    it("should try to contact https://api.trello.com/test", function () {
      this.request.options.url.should.containEql("https://api.trello.com/test");
    });
  },

  aPostBodyRequest: function () {
    it("should have a formData property", function () {
      this.request.options.should.have.property("formData");
    });

    it("should include the key in the formData property", function () {
      this.request.options.formData.should.have.property("key");
      this.request.options.formData.key.should.equal("APIKEY");
    });

    it("should include the token in the formData property", function () {
      this.request.options.formData.should.have.property("token");
      this.request.options.formData.token.should.equal("USERTOKEN");
    });

    it("should try to contact https://api.trello.com/test", function () {
      this.request.options.url.should.containEql("https://api.trello.com/test");
    });
  }
};
