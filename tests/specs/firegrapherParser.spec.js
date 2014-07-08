describe("FireGrapherParser Tests:", function() {
  // Stub out the grapher class
  var grapherStub = {
    init: function() {},
    draw: function() {},
    addDataPoint: function() {},
  }

  beforeEach(function(done) {
    beforeEachHelper(done);
  });

  afterEach(function(done) {
    afterEachHelper(done);
  });

  describe("Constructor:", function() {
    it("Constructor returns the correct paths to records", function(done) {
      var config = {
        type : "line",
        path: "*",
        xCoord: {
          "value" : "time"
        },
        yCoord: {
          "value" : "price"
        },
        series: "series"
      };

      var parser = new FireGrapherParser(firebaseRef, config, grapherStub);
      parser.parsePath([{
        "path": "/",
        "params": {}
      }], 0);
      window.setTimeout(function() {
        expect(parser.pathsToRecords.length).toEqual(1);
        expect(parser.pathsToRecords).toEqual([
          { path: "/", params: {} }
        ]);
        done();
      }, 50);

      expect(true).toBeTruthy();
    });

    it("Constructor returns the correct paths to records when using wildcard in path and series", function(done) {
      var config = {
        type : "line",
        path: "$series/*",
        xCoord: {
          "value" : "time"
        },
        yCoord: {
          "value" : "price"
        },
        series: "$series"
      };

      firebaseRef.set({
        "a": true,
        "b": true,
        "c": true
      }, function() {
        var parser = new FireGrapherParser(firebaseRef, config, grapherStub);
        parser.parsePath([{
          "path": "/",
          "params": {}
        }], 0);
        window.setTimeout(function() {
          expect(parser.pathsToRecords.length).toEqual(3);
          expect(parser.pathsToRecords).toEqual([
            { path: "/a/", params: { $series : "a" } },
            { path: "/b/", params: { $series : "b" } },
            { path: "/c/", params: { $series : "c" } }
          ]);
          done();
        }, 50);
      });
      expect(true).toBeTruthy();
    });

    it("Constructor returns the correct paths to records when not using *", function(done) {
      var config = {
        type : "line",
        path: "jacobcoin",
        xCoord: {
          "value" : "time"
        },
        yCoord: {
          "value" : "price"
        },
        series: "jacobcoin"
      };

      firebaseRef.set({
        "jacobcoin": true
      }, function() {
        var parser = new FireGrapherParser(firebaseRef, config, grapherStub);
        parser.parsePath([{
          "path": "/",
          "params": {}
        }], 0);
        window.setTimeout(function() {
          expect(parser.pathsToRecords.length).toEqual(1);
          expect(parser.pathsToRecords).toEqual([
            { path: "/jacobcoin/", params: {} }
          ]);
          done();
        }, 50);
      });
      expect(true).toBeTruthy();
    });
  });
});