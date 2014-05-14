var FireGrapher = (function() {
  "use strict";

  FireGrapher = function () {
    return;
  };

  FireGrapher.prototype.graph = function (cssSelector, firebaseRef, config) {
    this.cssSelector = cssSelector;
    this.firebaseRef = firebaseRef;
    this.updateConfig(config);

    this.drawGraph();

    // Parse path
    var nodes = config.path.split("/");
    this.parsePathNode(["/"], nodes, 0).then(function(paths) {
      // Get data
      console.log("Parsed paths: " + paths);
      paths.forEach(function(path) {
        var pathParts = path.split("/");
        var lastPathPart = pathParts[pathParts.length - 2];

        switch (this.config.type) {
          case "table":
            this.firebaseRef.child(path).on("value", function(childSnapshot) {
              var data = childSnapshot.val();
              var newDataPoint = [];
              this.config.columnValues.forEach(function(columnValue) {
                newDataPoint.push(data[columnValue]);
              });
              this.addToTable(newDataPoint);
            }.bind(this));
            break;
          case "line":
            this.firebaseRef.child(path).on("child_added", function(childSnapshot) {
              var data = childSnapshot.val();

              console.log(this);
              if (this.config.line[0] === "$") {
                line = lastPathPart;
              }
              else {
                line = data[config.line];
              }

              this.addToLineGraph({
                "line": line,
                "xCoord": data[config.xCoord.value],
                "yCoord": data[config.yCoord.value]
              });
            }.bind(this));
            break;
        }
      }.bind(this));
    }.bind(this));
  };

  FireGrapher.prototype.parsePathNode = function(paths, nodes, nodeIndex) {
    return new RSVP.Promise(function(resolve) {
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
            this.firebaseRef.child(path).once("value", function(dataSnapshot) {
              var newPaths = [];

              dataSnapshot.forEach(function(childSnapshot) {
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

          this.parsePathNode(newPaths, nodes, nodeIndex + 1).then(function(finalPaths) {
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
          resolve(finalPaths);
        });
      }
    }.bind(this));
  };

  FireGrapher.prototype.addToTable = function(newDataPoint) {
    console.log(newDataPoint);
  };

  FireGrapher.prototype.addToLineGraph = function(newDataPoint) {
    // create a set of data if not exists
    if (typeof this.graphData[newDataPoint.line] === "undefined") {
      this.graphData[newDataPoint.line] = [];
    }

    // Update the data at the datapoint 
    for (var i = this.graphData[newDataPoint.line].length; i < newDataPoint.xCoord; i++) {
      this.graphData[newDataPoint.line][i] = null;
    }
    this.graphData[newDataPoint.line][parseInt(newDataPoint.xCoord)] = parseInt(newDataPoint.yCoord);

    // update graph as necessary
    var newConfig = { xCoord: {}, yCoord: {} };
    if (this.config.xCoord.min > newDataPoint.xCoord) {
      newConfig.xCoord.min = newDataPoint.xCoord;
    }
    if (this.config.xCoord.max < newDataPoint.xCoord) {
      newConfig.xCoord.max = newDataPoint.xCoord;
    }
    if (this.config.yCoord.min > newDataPoint.yCoord) {
      newConfig.yCoord.min = newDataPoint.yCoord;
    }
    if (this.config.yCoord.max < newDataPoint.yCoord) {
      newConfig.yCoord.max = newDataPoint.yCoord;
    }
    this.updateConfig(newConfig);
    if (newConfig.xCoord.min || newConfig.xCoord.max || newConfig.yCoord.min || newConfig.yCoord.max) {
      this.renderGraph();
    }

    // create a d3 line if one does not exist exists
    var line = this.graphLines[newDataPoint.line];
    if (typeof line === "undefined") {
      line = this.addLineToGraph(newDataPoint.line, this.graphData[newDataPoint.line]);
    }
    else {
      // update the line with the data
      this.graph.select(this.cssSelector + " path." + newDataPoint.line)
        .data([this.graphData[newDataPoint.line]])
        .attr("d", line);
    }

    console.log(this.graphData[newDataPoint.line]);
  };

  FireGrapher.prototype.updateConfig = function(config) {
    // build default config if not exists
    this.config = (this.config) ? this.config : {};
    this.config.type = (this.config.type) ? this.config.type : null;
    this.config.graph = (this.config.graph) ? this.config.graph : {};
    this.config.xCoord = (this.config.xCoord) ? this.config.xCoord : {};
    this.config.yCoord = (this.config.yCoord) ? this.config.yCoord : {};

    // set config to new values
    this.config.type = (config.type && ["table", "line", "scatter"].indexOf(config.type) !== -1) ? config.type : (this.config.type) ? this.config.type : null;
    if (this.config.type === null) {
      throw new Error("Invalid chart type. Must be \"table\", \"line\", or \"scatter\"");
    }
    this.config.graph = {
      width : (config.graph && config.graph.width) ? config.graph.width : (this.config.graph.width) ? this.config.graph.width : 500,
      height : (config.graph && config.graph.height) ? config.graph.height : (this.config.graph.height) ? this.config.graph.height : 150
    };
    this.config.xCoord = {
      min : (config.xCoord && config.xCoord.min) ? config.xCoord.min : (this.config.xCoord.min) ? this.config.xCoord.min : 0,
      max : (config.xCoord && config.xCoord.max) ? config.xCoord.max : (this.config.xCoord.max) ? this.config.xCoord.max : 50
    };
    this.config.yCoord = {
      min : (config.yCoord && config.yCoord.min) ? config.yCoord.min : (this.config.yCoord.min) ? this.config.yCoord.min : 0,
      max : (config.yCoord && config.yCoord.max) ? config.yCoord.max : (this.config.yCoord.max) ? this.config.yCoord.max : 200
    };
  };

  FireGrapher.prototype.renderGraph = function() {
    console.log("Config has changed, syncing.");
    // updating the interpolations to new scales
    this.interpolateXCoord = d3.scale.linear().domain([this.config.xCoord.min, this.config.xCoord.max]).range([0, this.config.graph.width]);
    this.interpolateYCoord = d3.scale.linear().domain([this.config.yCoord.min, this.config.yCoord.max]).range([this.config.graph.height, 0]);

    // removing old scales
    if (this.graph.select(this.cssSelector + " g.x")[0][0] !== null) {
      this.graph.select(this.cssSelector + " g.x").remove();
    }

    if (this.graph.select(this.cssSelector + " g.y")[0][0] !== null) {
      this.graph.select(this.cssSelector + " g.y").remove();
    }

    // adding new scales
    this.graph.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.config.graph.height + ")")
      .call(d3.svg.axis()
        .scale(this.interpolateXCoord)
        .ticks(4).tickSubdivide(1).tickSize(-this.config.graph.height, -this.config.graph.height, -50))
      // move the labels to where they can be seen
      .selectAll("text")
      .attr("y", 15)
      .style("text-anchor", "start");
    this.graph.append("g")
      .attr("class", "y axis")
      .call(d3.svg.axis()
        .orient("left")
        .scale(this.interpolateYCoord)
        .ticks(8).tickSubdivide(0).tickSize(-this.config.graph.width, -this.config.graph.width, -50))
      // move the labels to where they can be seen
      .selectAll("text")
      .attr("x", 5)
      .attr("y", -10)
      .style("text-anchor", "start");

    // removing old lines
    while (this.graph.select(this.cssSelector + " path").remove()[0][0] !== null);
    // adding lines to new graph
    for (var key in this.graphLines) {
      if (this.graphLines.hasOwnProperty(key)) {
        this.addLineToGraph(key, this.graphData[key]);
      }
    }
  };

  FireGrapher.prototype.addLineToGraph = function(name, data) {
    var line = d3.svg.line()
      .defined(function(d) { return d != null; })
      .x(function(value, index) {
        return this.interpolateXCoord(index);
      }.bind(this))
      .y(function(value) {
        return this.interpolateYCoord(value);
      }.bind(this))
      .interpolate("basis");
    this.graph.append("svg:path").attr("d", line(this.graphData[name])).attr("class", name);
    this.graphLines[name] = line;
  };

  FireGrapher.prototype.drawGraph = function() {
    switch (this.config.type) {
      case "table":
        this.drawTable();
        break;
      case "line":
        this.drawLineGraph();
        break;
    }
  };

  FireGrapher.prototype.drawLineGraph = function() {
    this.graphData = {};
    this.graphLines = {};

    this.graph = d3.select(this.cssSelector).append("svg:svg").attr("width", "100%").attr("height", "100%");
    this.renderGraph();
  };

  FireGrapher.prototype.drawTable = function() {
    // TODO
  };


  return FireGrapher;
})();

/* jshint -W117 */
if (typeof module !== "undefined") {
  module.exports = FireGrapher;
}