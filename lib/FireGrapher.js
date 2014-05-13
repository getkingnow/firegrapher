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


    this.drawGraph(cssSelector);

    // Parse path
    var nodes = config.path.split("/");
    console.log(nodes);

    var pathToThisPoint = "/";


// nodes.forEach(function(node, index) {
//       if (node[0] === "*") {
//         console.log(index + ": individual record");
//         console.log(paths);
//       }
//       else if (node[0] === "$") {
//         console.log(index + ": param");

//         // Remove the "$"
//         var param = node.slice(1);

//         console.log(param);
//         var newPaths = [];

//         paths.forEach(function(path) {
//           firebaseRef.child(path).once("value", function(dataSnapshot) {
//             dataSnapshot.forEach(function(childSnapshot) {
//               console.log(childSnapshot.name());
//               newPaths.push(path + childSnapshot.name() + "/");



//               childSnapshot.ref().on("child_added", function(subChildSnapshot) {
//                 var data = subChildSnapshot.val();
//                 this.addToD3({
//                   "line": childSnapshot.name(),
//                   "xCoord": data[config.xCoord.value],
//                   "yCoord": data[config.yCoord.value]
//                 });
//               }.bind(this));
//             }.bind(this));
//           }.bind(this));
//         }.bind(this));

//         paths = newPaths;
//       }
//       else {
//         console.log(index + ": regular node");
//         paths.forEach(function(path) {
//           path += (node + "/");
//         });
//         console.log(paths);
//       }
//     }.bind(this));

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
              this.addToLineGraph({
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
  }

  FireGrapher.prototype.drawLineGraph = function(cssSelector) {
    // TODO: allow user to conifgure these
    var graphWidth = 1600;
    var graphHeight = 450;
    var minX = 0, maxX = 30;
    var minY = 40, maxY = 150;


    this.graphData = {};
    this.graphLines = {};
    this.interpolateXCoord = d3.scale.linear().domain([minX, maxX]).range([0, graphWidth]);
    this.interpolateYCoord = d3.scale.linear().domain([minY, maxY]).range([0, graphHeight]);

    this.graph = d3.select(cssSelector).append("svg:svg").attr("width", "100%").attr("height", "100%");
    // add scales
    this.graph.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + graphHeight + ")")
      .call(d3.svg.axis()
        .scale(d3.scale.linear().domain([minX, maxX]).range([0, graphWidth]))
        .ticks(4).tickSubdivide(1).tickSize(-graphHeight, -graphHeight, -50))
      // move the labels to where they can be seen
      .selectAll("text")
      .attr("y", 15)
      .style("text-anchor", "start");

    this.graph.append("g")
      .attr("class", "y axis")
      .call(d3.svg.axis()
        .orient("left")
        .scale(d3.scale.linear().domain([minY, maxY]).range([graphHeight, 0]))
        .ticks(8).tickSubdivide(0).tickSize(-graphWidth, -graphWidth, -50))
      // move the labels to where they can be seen
      .selectAll("text")
      .attr("x", 5)
      .attr("y", -10)
      .style("text-anchor", "start");
  };

  return FireGrapher;
})();

/* jshint -W117 */
if (typeof module !== "undefined") {
  module.exports = FireGrapher;
}