describe("FireGrapher Tests:", function() {
  beforeEach(function(done) {
    beforeEachHelper(done);
  });

  afterEach(function(done) {
    afterEachHelper(done);
  });

  describe("FireGrapher Tests:", function() {
    describe("Contructor", function() {
      it("Constructor throws errors given invalid Firebase ref", function() {
        invalidFirebaseRefs.forEach(function(invalidFirebaseRef) {
          expect(function() { new FireGrapher(invalidFirebaseRef, "#graph1", validConfig); }).toThrow();
        });
      });

      it("Constructor throws errors given invalid CSS selectors", function() {
        invalidCssSelectors.forEach(function(invalidCssSelector) {
          expect(function() { new FireGrapher(firebaseRef, invalidCssSelector, validConfig); }).toThrow();
        });
      });

      xit("Constructor throws errors given invalid config objects", function() {
        expect(true).toBeFalsy();
      });

      it("Constructor does not throw errors given valid inputs", function() {
        validCssSelectors.forEach(function(validCssSelector) {
          expect(function() { new FireGrapher(firebaseRef, validCssSelector, validConfig); }).not.toThrow();
        });
      });
    });
  });
});