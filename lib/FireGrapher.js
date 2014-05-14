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

    this.drawGraph();

    // Parse path
    this.pathNodes = config.path.split("/");
    this.parsePath(["/"], 0);
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
            newDataPoint.push(data[column.value] ? data[column.value] : "");
          });
          this.addToTable(newDataPoint);
        }.bind(this));
        break;
      case "line":
        this.firebaseRef.child(path).on(eventToListenTo, function(childSnapshot) {
          var data = childSnapshot.val();

          var line;
          if (this.config.line[0] === "$") {
            line = lastPathPart;
          }
          else {
            line = data[this.config.line];
          }

          var xCoord;
          if (typeof this.config.xCoord.stream !== "undefined" && this.config.xCoord.stream) {
            xCoord = (this.streamCounts[line]) ? this.streamCounts[line] : 0;
          }
          else {
            xCoord = parseInt(data[this.config.xCoord.value]);
          }

          this.addDataPointToLineGraph({
            "line": line,
            "xCoord": xCoord,
            "yCoord": parseInt(data[this.config.yCoord.value])
          });
        }.bind(this));
        break;
    }
  };

  FireGrapher.prototype.addDataPointToTable = function(newDataPoint) {
    this.tableRows.push(newDataPoint);
    var rows = this.innerTable.selectAll("div.row").data(this.tableRows).enter().append("div").attr("class", "row");
    rows.selectAll("div.cell").data(function(d) {
      return d;
    }).enter()
    .append("div")
    .attr("class", "cell")
    .attr("width", function(d, i) {
      return this.config.columns[i].width;
    }.bind(this))
    .text(function(d) {
      return d;
    });
  };

  FireGrapher.prototype.addDataPointToLineGraph = function(newDataPoint) {
    // create a set of data if not exists
    if (typeof this.graphData[newDataPoint.line] === "undefined") {
      this.graphData[newDataPoint.line] = {
        coordinates : []
      };

      this.streamCounts[newDataPoint.line] = 0;
    }
    this.streamCounts[newDataPoint.line] += 1;

    // Update the data at the datapoint
    var coordinates = this.graphData[newDataPoint.line].coordinates;
    if (coordinates.length > 0 && newDataPoint.xCoord <= coordinates[coordinates.length - 1].x) {
      // need to sort because x coords are now out of order (so that our line doesn't plot backwards)
      coordinates.push({ x : newDataPoint.xCoord, y : newDataPoint.yCoord });
      coordinates.sort(function(a, b) { return b.x - a.x; });
    } else {
      coordinates.push({ x : newDataPoint.xCoord, y : newDataPoint.yCoord });
    }

    if (coordinates.length > this.config.xCoord.limit) {
      coordinates.shift();
      this.config.xCoord.min = this.streamCounts[newDataPoint.line] - this.config.xCoord.limit;
      this.renderGraph();
    }

    // update graph as necessary
    var configChanged = false;
    if (this.config.xCoord.min > newDataPoint.xCoord) {
      this.config.xCoord.min = newDataPoint.xCoord;
      configChanged = true;
    }
    if (this.config.xCoord.max < newDataPoint.xCoord) {
      this.config.xCoord.max = newDataPoint.xCoord;
      configChanged = true;
    }
    if (this.config.yCoord.min > newDataPoint.yCoord) {
      this.config.yCoord.min = newDataPoint.yCoord;
      configChanged = true;
    }
    if (this.config.yCoord.max < newDataPoint.yCoord) {
      this.config.yCoord.max = newDataPoint.yCoord;
      configChanged = true;
    }
    if (configChanged) {
      this.renderGraph();
    }

    // create a d3 line if one does not exist exists
    var line = this.graphLines[newDataPoint.line];
    if (typeof line === "undefined") {
      line = this.addLineToGraph(newDataPoint.line, coordinates);
    }
    else {
      // update the line with the data
      this.graph.select("path." + newDataPoint.line)
        .data([coordinates])
        .attr("d", line)
        ;

      // adding points
      this.graph.append("circle")
        .attr("class", "dot " + newDataPoint.line)
        .attr("cx", this.interpolateXCoord(newDataPoint.xCoord))
        .attr("cy", this.interpolateYCoord(newDataPoint.yCoord))
        .attr("r", 3.5);
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

  FireGrapher.prototype.setDefaultConfig = function() {
    if (this.config.type === "line") {
      this.config.graph = (this.config.graph) ? this.config.graph : {};
      this.config.graph.width = (this.config.graph.width) ? this.config.graph.width : 500;
      this.config.graph.height = (this.config.graph.height) ? this.config.graph.height : 150;
      this.config.xCoord.min = (this.config.xCoord.min) ? this.config.xCoord.min : 0;
      this.config.xCoord.max = (this.config.xCoord.max) ? this.config.xCoord.max : 50;
      this.config.yCoord.min = (this.config.yCoord.min) ? this.config.yCoord.min : 0;
      this.config.yCoord.max = (this.config.yCoord.max) ? this.config.yCoord.max : 200;
    }
  };

  FireGrapher.prototype.renderGraph = function() {
    // updating the interpolations to new scales
    var paddingY = this.config.yCoord.max * 0.05;
    this.interpolateXCoord = d3.scale.linear().domain([this.config.xCoord.min, this.config.xCoord.max]).range([0, this.config.graph.width]);
    this.interpolateYCoord = d3.scale.linear().domain([this.config.yCoord.min - paddingY, this.config.yCoord.max + paddingY]).range([this.config.graph.height, 0]);

    // removing old scales
    while (this.graph.select("g").remove()[0][0] !== null) {
      continue;
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
    while (this.graph.select("path").remove()[0][0] !== null) {
      continue;
    }
    // removing old points
    while (this.graph.select("circle").remove()[0][0] !== null) {
      continue;
    }

    // adding lines to new graph
    for (var key in this.graphLines) {
      if (this.graphLines.hasOwnProperty(key)) {
        this.addLineToGraph(key, this.graphData[key].coordinates);
      }
    }

  };

  FireGrapher.prototype.addLineToGraph = function(name, data) {
    var line = d3.svg.line()
      .defined(function(d) { return d !== null; })
      .x(function(value) {
        return this.interpolateXCoord(value.x);
      }.bind(this))
      .y(function(value) {
        return this.interpolateYCoord(value.y);
      }.bind(this))
      .interpolate("linear");
    this.graph.append("svg:path").attr("d", line(this.graphData[name].coordinates)).attr("class", name);
    this.graphLines[name] = line;

    // adding points
    this.graph.selectAll("circle." + name)
      .data(data)
      .enter().append("circle")
      .attr("class", "dot " + name)
      .attr("cx", line.x())
      .attr("cy", line.y())
      .attr("r", 3.5);
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
    this.streamCounts = {};

    this.graph = d3.select(this.cssSelector).append("svg:svg").attr("width", "100%").attr("height", "100%");
    this.renderGraph();
  };

  FireGrapher.prototype.drawTable = function() {
    this.tableHeader = {};
    this.tableRows = [];
    this.outerTable = d3.select(this.cssSelector).append("div").attr("class", "table outer");
    // draw header columns
    this.outerTable
      .append("div").attr("class", "row")
      .selectAll("div.header").data(this.config.columns).enter()
        .append("div")
          .attr("class", "header")
          .attr("width", function(column) {
            return column.width;
          })
          .text(function (column) { return column.label; });
    // draw inner table
    this.innerTable = this.outerTable
      .append("div").attr("class", "table inner");
  };


  return FireGrapher;
})();

/* jshint -W117 */
if (typeof module !== "undefined") {
  module.exports = FireGrapher;
}