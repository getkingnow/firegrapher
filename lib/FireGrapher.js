var FireGrapher = (function() {
  "use strict";

  FireGrapher = function () {
    return;
  };

  FireGrapher.prototype.graph = function (cssSelector, firebaseRef, config) {
    this.cssSelector = cssSelector;
    this.firebaseRef = firebaseRef;

    this.validateConfig(config);
    this.config = config;
    this.setDefaultConfig();

    this.draw();

    // Parse path
    this.pathNodes = config.path.split("/");
    this.parsePath(["/"], 0);
  };

  FireGrapher.prototype.setDefaultConfig = function() {
    switch (this.config.type) {
      case "line":
      case "scatter":
        this.config.graph = (this.config.graph) ? this.config.graph : {};
        this.config.graph.width = (this.config.graph.width) ? this.config.graph.width : 500;
        this.config.graph.height = (this.config.graph.height) ? this.config.graph.height : 150;
        this.config.xCoord.min = (this.config.xCoord.min) ? this.config.xCoord.min : 0;
        this.config.xCoord.max = (this.config.xCoord.max) ? this.config.xCoord.max : 50;
        this.config.yCoord.min = (this.config.yCoord.min) ? this.config.yCoord.min : 0;
        this.config.yCoord.max = (this.config.yCoord.max) ? this.config.yCoord.max : 200;
        break;
    }
  };

  FireGrapher.prototype.validateConfig = function(config) {
    // Every config needs to specify the graph type
    var validGraphTypes = ["table", "line", "scatter"];
    if (typeof config.type === "undefined") {
      throw new Error("No graph \"type\" specified. Must be \"table\", \"line\", or \"scatter\"");
    }
    if (validGraphTypes.indexOf(config.type) === -1) {
      throw new Error("Invalid graph \"type\" specified. Must be \"table\", \"line\", or \"scatter\"");
    }

    // Every config needs to specify the path to an individual record
    if (typeof config.path === "undefined") {
      throw new Error("No \"path\" to individual record specified.");
    }
    // TODO: other validation for things like $, *, etc.

    switch (config.type) {
      case "table":
        // Every table config needs to specify its column labels and values
        if (typeof config.columns === "undefined") {
          throw new Error("No table \"columns\" specified.");
        }
        config.columns.forEach(function(column) {
          if (typeof column.label === "undefined") {
            throw new Error("Missing \"columns\" label.");
          }
          if (typeof column.value === "undefined") {
            throw new Error("Missing \"columns\" value.");
          }
        });
        break;
      case "line":
        if (typeof config.xCoord === "undefined") {
          throw new Error("No \"xCoord\" specified.");
        }
        if (typeof config.yCoord === "undefined") {
          throw new Error("No \"yCoord\" specified.");
        }
        break;
      case "scatter":
        break;
    }
  };

  FireGrapher.prototype.parsePath = function(paths, nodeIndex) {
    // If we've gone through all of the nodes, listen for new records
    if (nodeIndex === this.pathNodes.length) {
      var eventToListenTo = (this.pathNodes[this.pathNodes.length - 1] === "*") ? "child_added" : "value";

      paths.forEach(function(path) {
        this.listenForNewRecords(path, eventToListenTo);
      }.bind(this));
    }
    else {
      // Get the current node's value
      var node = this.pathNodes[nodeIndex];

      // Make sure the * is only used as the last part of the path
      if (node[0] === "*") {
        if (nodeIndex !== (this.pathNodes.length - 1)) {
          throw new Error("You can only use * as the last character in your \"path\"");
        }
        this.parsePath(paths, nodeIndex + 1);
      }
      // Check for wildcard nodes
      else if (node[0] === "$") {
        paths.forEach(function(path) {
          this.firebaseRef.child(path).on("child_added", function(childSnapshot) {
            this.parsePath([path + childSnapshot.name() + "/"], nodeIndex + 1);
          }.bind(this));
        }.bind(this));
      }

      // Regular nodes
      else {
        paths.forEach(function(path) {
          this.parsePath([path += node + "/"], nodeIndex + 1);
        }.bind(this));
      }
    }
  };

  FireGrapher.prototype.listenForNewRecords = function(path, eventToListenTo) {
    var pathParts = path.split("/");
    var lastPathPart = pathParts[pathParts.length - 2];

    // TODO: if eventToListenTo is "child_added", we need to also listen to "child_changed" and "child_removed"

    switch (this.config.type) {
      case "table":
        this.firebaseRef.child(path).on(eventToListenTo, function(childSnapshot) {
          var data = childSnapshot.val();
          var newDataPoint = [];
          this.config.columns.forEach(function(column) {
            newDataPoint.push((typeof data[column.value] !== "undefined") ? data[column.value].toString() : "");
          });
          this.addDataPointToTable(newDataPoint);
        }.bind(this));
        break;
      case "line":
      case "scatter":
        this.firebaseRef.child(path).on(eventToListenTo, function(childSnapshot) {
          var data = childSnapshot.val();

          var series = (this.config.line[0] === "$") ? lastPathPart : data[this.config.line];
          var xCoord;
          if (typeof this.config.xCoord.stream !== "undefined" && this.config.xCoord.stream) {
            xCoord = (this.graphData[series] && this.graphData[series].streamCount) ? this.graphData[series].streamCount : 0;
          }
          else {
            xCoord = parseInt(data[this.config.xCoord.value]);
          }

          this.addDataPointToGraph({
            "series": series,
            "xCoord": xCoord,
            "yCoord": parseInt(data[this.config.yCoord.value])
          }, this.config.type);

        }.bind(this));
        break;
    }
  };

  // ===============
  // Tabling Methods
  // ===============

  FireGrapher.prototype.addDataPointToTable = function(newDataPoint) {
    this.tableRows.push(newDataPoint);
    this.table
      .selectAll("div.row")
        .data(this.tableRows).enter()
          .append("div").attr("class", "row clearfix")
            .selectAll("div.cell").data(function(d) {
              return d;
            }).enter()
              .append("div").attr("class", "cell").attr("width", function(d, i) {
                return this.config.columns[i].width;
              }.bind(this))
              .text(function(d) {
                return d;
              });
  };

  // ================
  // Graphing Methods
  // ================

  FireGrapher.prototype.addDataPointToGraph = function(newDataPoint, graphType) {
    // if a series doesn't exist, create it
    if (typeof this.graphData[newDataPoint.series] === "undefined") {
      this.graphData[newDataPoint.series] = {
        streamCount : 0,
        coordinates : []
      };
    }
    this.graphData[newDataPoint.series].streamCount += 1;

    // Update the data at the datapoint
    var coordinates = this.graphData[newDataPoint.series].coordinates;
    coordinates.push(newDataPoint);
    if (coordinates.length > 1 && newDataPoint.xCoord <= coordinates[coordinates.length - 2].xCoord) {
      // need to sort because x coords are now out of order (so that our line doesn't plot backwards)
      coordinates.sort(function(a, b) { return b.xCoord - a.xCoord; });
    }

    var updateGraph = false;
    // if we're doing a time series, shift the graph accordingly
    if (this.config.xCoord.limit && coordinates.length > this.config.xCoord.limit) {
      coordinates.shift();
      this.config.xCoord.min = this.graphData[newDataPoint.series].streamCount - this.config.xCoord.limit;
      updateGraph = true;
    }

    // update graph as necessary
    if (this.config.xCoord.min > newDataPoint.xCoord) {
      this.config.xCoord.min = newDataPoint.xCoord;
      updateGraph = true;
    }
    if (this.config.xCoord.max < newDataPoint.xCoord) {
      this.config.xCoord.max = newDataPoint.xCoord;
      updateGraph = true;
    }
    if (this.config.yCoord.min > newDataPoint.yCoord) {
      this.config.yCoord.min = newDataPoint.yCoord;
      updateGraph = true;
    }
    if (this.config.yCoord.max < newDataPoint.yCoord) {
      this.config.yCoord.max = newDataPoint.yCoord;
      updateGraph = true;
    }
    if (updateGraph) {
      this.drawGraph();
    }

    // redraw the graph based on new data points
    switch (graphType) {
      case "line":
        this.drawLine(newDataPoint.series, coordinates);
        this.drawDataPoints(newDataPoint.series, coordinates);
        break;
      case "scatter":
        this.drawDataPoints(newDataPoint.series, coordinates);
        break;
    }
  };

  FireGrapher.prototype.drawLine = function(series, dataPoints) {
    var line = d3.svg.line()
      .defined(function(d) { return d !== null; })
      .x(function(value) {
        return this.interpolateXCoord(value.xCoord);
      }.bind(this))
      .y(function(value) {
        return this.interpolateYCoord(value.yCoord);
      }.bind(this))
      .interpolate("linear");
    // if line does not already exist, add a new one
    if (this.graph.selectAll("path."+series)[0].length === 0) {
      this.graph.append("path").attr("class", series);
    }
    // update the line with the data
    this.graph.select("path." + series)
      .data([dataPoints])
      .attr("d", line(dataPoints));
  };

  FireGrapher.prototype.drawDataPoints = function(series, dataPoints) {
    this.graph.selectAll("circle." + series)
      .data(dataPoints).enter()
        .append("circle")
          .attr("class", "dot " + series)
          .attr("cx", function(dataPoint) {
            return this.interpolateXCoord(dataPoint.xCoord);
          }.bind(this))
          .attr("cy", function(dataPoint) {
            return this.interpolateYCoord(dataPoint.yCoord);
          }.bind(this))
          .attr("r", 3.5);
  };

  FireGrapher.prototype.drawScales = function() {    
    // removing old scales
    while (this.graph.select("g").remove()[0][0] !== null) {
      continue;
    }

    // adding new scales
    this.graph.append("g").attr("class", "x axis").attr("transform", "translate(0," + this.config.graph.height + ")")
      .call(d3.svg.axis()
        .scale(this.interpolateXCoord)
        .ticks(4).tickSubdivide(1).tickSize(-this.config.graph.height, -this.config.graph.height, -50))
      // move the labels to where they can be seen
      .selectAll("text").attr("y", 15).style("text-anchor", "start");
    this.graph.append("g").attr("class", "y axis")
      .call(d3.svg.axis()
        .orient("left")
        .scale(this.interpolateYCoord)
        .ticks(8).tickSubdivide(0).tickSize(-this.config.graph.width, -this.config.graph.width, -50))
      // move the labels to where they can be seen
      .selectAll("text").attr("x", 5).attr("y", -10).style("text-anchor", "start");
  };

  FireGrapher.prototype.drawGraph = function() {
    // updating the interpolations to new scales
    var paddingY = this.config.yCoord.max * 0.05;
    this.interpolateXCoord = d3.scale.linear().domain([this.config.xCoord.min, this.config.xCoord.max]).range([0, this.config.graph.width]);
    this.interpolateYCoord = d3.scale.linear().domain([this.config.yCoord.min - paddingY, this.config.yCoord.max + paddingY]).range([this.config.graph.height, 0]);

    // drawing scales again
    this.drawScales();

    // removing old lines
    while (this.graph.select("path").remove()[0][0] !== null) {
      continue;
    }
    // removing old points
    while (this.graph.select("circle").remove()[0][0] !== null) {
      continue;
    }

    // adding lines to new graph
    for (var key in this.graphData) {
      if (this.graphData.hasOwnProperty(key)) {
        this.drawLine(key, this.graphData[key].coordinates);
        this.drawDataPoints(key, this.graphData[key].coordinates);
      }
    }
  };

  // ===============
  // General Methods
  // ===============
  FireGrapher.prototype.draw = function() {
    switch (this.config.type) {
      case "table":
        this.tableRows = [];
        this.table = d3.select(this.cssSelector).append("div").attr("class", "table");
        // draw header columns
        this.table
          .append("div").attr("class", "row clearfix")
          .selectAll("div.header").data(this.config.columns).enter()
            .append("div")
              .attr("class", "header")
              .attr("width", function(column) {
                return column.width;
              })
              .text(function (column) { return column.label; });
        break;
      case "line":
      case "scatter":
        this.graphData = {};
        this.graph = d3.select(this.cssSelector).append("svg:svg").attr("width", "100%").attr("height", "100%");
        this.drawGraph();
        break;
    }
  };

  return FireGrapher;
})();

/* jshint -W117 */
if (typeof module !== "undefined") {
  module.exports = FireGrapher;
}