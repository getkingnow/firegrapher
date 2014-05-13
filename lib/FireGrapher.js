var FireGrapher = (function() {
  "use strict";

  FireGrapher = function () {
    return;
  };

  FireGrapher.prototype.graph = function (cssSelector, firebaseRef, config) {
    this.firebaseRef = firebaseRef;

    console.log(cssSelector);
    console.log(firebaseRef);
    console.log(config);

    // Validate inputs
    var validChartTypes = ["grid", "line", "scatter"];
    if (validChartTypes.indexOf(config.type) === -1) {
      throw new Error("Invalid chart type. Must be \"grid\", \"line\", or \"scatter\"");
    }
    // TODO: more validation


    this.drawGraph(cssSelector);

    // Parse path
    var nodes = config.path.split("/");
    console.log(nodes);

    this.parsePathNode(["/"], nodes, 0).then(function(paths) {
      paths.forEach(function(path) {
        console.log(path);
        firebaseRef.child(path).on("child_added", function(childSnapshot) {
          var data = childSnapshot.val();
          var pathParts = path.split("/");
          console.log(pathParts);
          var lastPathPart = pathParts[pathParts.length - 2];
          console.log(lastPathPart);
          this.addToD3({
            "line": lastPathPart,
            "xCoord": data[config.xCoord.value],
            "yCoord": data[config.yCoord.value]
          });
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };

  FireGrapher.prototype.parsePathNode = function(paths, nodes, nodeIndex) {
    return new RSVP.Promise(function(resolve) {
      console.log("Calling parsePathNode() with index " + nodeIndex);
      var node = nodes[nodeIndex];
      if (node[0] === "*") {
        console.assert(nodeIndex === nodes.length - 1, "WHATTTT?");
        console.log(nodeIndex + ": individual record");
        resolve(paths);
      }
      else if (node[0] === "$") {
        console.log(nodeIndex + ": param");

        var pathPromises = [];
        paths.forEach(function(path) {
          pathPromises.push(new RSVP.Promise(function(subResolve) {
            console.log(path);
            this.firebaseRef.child(path).once("value", function(dataSnapshot) {
              console.log(dataSnapshot);
              var newPaths = [];

              dataSnapshot.forEach(function(childSnapshot) {
                console.log(childSnapshot.name());
                newPaths.push(path + childSnapshot.name() + "/");
              }.bind(this));

              subResolve(newPaths);
            }.bind(this));
          }.bind(this)));
        }.bind(this));

        new RSVP.all(pathPromises).then(function(promisesData) {
          var newPaths = [];
          promisesData.forEach(function(promiseData) {
            promiseData.forEach(function(path) {
              newPaths.push(path);
            });
          });
          console.log(newPaths);

          this.parsePathNode(newPaths, nodes, nodeIndex + 1).then(function(finalPaths) {
            console.log("Final paths: " + nodeIndex);
            console.log(finalPaths);
            resolve(finalPaths);
          });
        }.bind(this));
      }
      else {
        console.log(nodeIndex + ": regular node");

        var newPaths = [];
        paths.forEach(function(path) {
          newPaths.push(path += node + "/");
        });

        this.parsePathNode(newPaths, nodes, nodeIndex + 1).then(function(finalPaths) {
          console.log("Final paths: " + nodeIndex);
            console.log(finalPaths);
          resolve(finalPaths);
        });
      }
    }.bind(this));
  };

  FireGrapher.prototype.addToLineGraph = function(newDataPoint) {
    // create a set of data if not exists
    if (typeof this.graphData[newDataPoint.line] === "undefined") {
      this.graphData[newDataPoint.line] = [];
    }

    // Update the data at the datapoint
    this.graphData[newDataPoint.line][newDataPoint.xCoord] = newDataPoint.yCoord;

    // create a d3 line if one does not exist exists
    var line = this.graphLines[newDataPoint.line];
    if (typeof line === "undefined") {
      line = d3.svg.line()
        .x(function(value, index) {
          return this.interpolateXCoord(index);
        }.bind(this))
        .y(function(value) {
          return this.interpolateYCoord(value);
        }.bind(this))
        .interpolate("basis");

      // If a new line was created, let's add it to the graph
      this.graph.append("svg:path").attr("d", line(this.graphData[newDataPoint.line])).attr("id", newDataPoint.line);

      this.graphLines[newDataPoint.line] = line;
    }
    else {
      // update the line with the data
      this.graph.select("#" + newDataPoint.line)
        .data([this.graphData[newDataPoint.line]])
        .attr("d", line);
    }
  };

  FireGrapher.prototype.drawGraph = function(cssSelector) {
    this.drawLineGraph(cssSelector);
  };

  FireGrapher.prototype.drawLineGraph = function(cssSelector) {
    // TODO: allow user to conifgure these
    var graphWidth = 800;
    var graphHeight = 120;
    var minX = 0, maxX = 30;
    var minY = 40, maxY = 150;


    this.graphData = {};
    this.graphLines = {};
    this.interpolateXCoord = d3.scale.linear().domain([minX, maxX]).range([0, graphWidth]);
    this.interpolateYCoord = d3.scale.linear().domain([minY, maxY]).range([0, graphHeight]);

    this.graph = d3.select(cssSelector).append("svg:svg").attr("width", "100%").attr("height", "100%");
  };


  return FireGrapher;
})();

/* jshint -W117 */
if (typeof module !== "undefined") {
  module.exports = FireGrapher;
}