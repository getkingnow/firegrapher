var FireGrapher = (function() {
  "use strict";

  FireGrapher = function () {
    return;
  };

  FireGrapher.prototype.graph = function (cssSelector, firebaseRef, config) {
    console.log(cssSelector);
    console.log(firebaseRef);
    console.log(config);

    // Validate inputs
    var validChartTypes = ["grid", "line", "scatter"];
    if (validChartTypes.indexOf(config.type) === -1) {
      throw new Error("Invalid chart type. Must be \"grid\", \"line\", or \"scatter\"");
    }
    // TODO: more validation


    // Get the desired output DOM node
    var outputNode = document.querySelectorAll(cssSelector);
    if (outputNode.length !== 1) {
      throw new Error("Invalid selector.");
    }
    outputNode = outputNode[0];

    // Parse path
    var nodes = config.path.split("/");
    console.log(nodes);

    var pathToThisPoint = "/";

    nodes.forEach(function(node, index) {
      if (node[0] === "*") {
        console.log(index + ": individual record");
      }
      else if (node[0] === "$") {
        console.log(index + ": param");

        // Remove the "$"
        var param = node.slice(1);

        console.log(param);

        firebaseRef.child(pathToThisPoint).once("value", function(dataSnapshot) {
          dataSnapshot.forEach(function(childSnapshot) {
            console.log(childSnapshot.name());
            childSnapshot.ref().on("child_added", function(subChildSnapshot) {
              var data = subChildSnapshot.val();
              this.addToD3({
                "line": childSnapshot.name(),
                "xCoord": data[config.xCoord.value],
                "yCoord": data[config.yCoord.value]
              });
            }.bind(this));
          }.bind(this));
        }.bind(this));
      }
      else {
        console.log(index + ": regular node");
        pathToThisPoint += node + "/";
      }
    }.bind(this));
  };

  FireGrapher.prototype.addToD3 = function(data) {
    console.log(data);
  };

  return FireGrapher;
})();

/* jshint -W117 */
if (typeof module !== "undefined") {
  module.exports = FireGrapher;
}