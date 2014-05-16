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
      this.config.graph.height = (this.config.graph.height) ? this.config.graph.height : 300;
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
        });

      }.bind(this));
      break;
  }
};
// Tabling Methods
FireGrapher.prototype.addHeaders = function(columns) {
  // draw header columns
  this.sortColumn = 0;
  this.sortAsc = true;
  this.table
    .append("div")
      .attr("class", "row head clearfix")
      .selectAll("div.header")
        .data(columns).enter()
        .append("div")
          .attr("class", "header")
          .attr("width", function(column) {
            return column.width;
          })
          .text(function (column) { return column.label; })
          .on("click", function (d) {
              // update sortColumn to sort on clicked on column
              var newSortColumn = 0;
              for (var i = 0; i < columns.length; i++) {
                if (columns[i] === d) {
                  newSortColumn = i;
                }
              }
              if (this.sortColumn !== newSortColumn) {
                this.sortColumn = newSortColumn; // change sort column
                this.sortAsc = true;
              } else {
                this.sortAsc = !this.sortAsc; // change sort type
              }
              this.table.selectAll("div.data").sort(function(a, b) {
                if (a[this.sortColumn] === b[this.sortColumn]) {
                  return 0;
                } else if (this.sortAsc) {
                  return a[this.sortColumn] > b[this.sortColumn];
                } else {
                  return a[this.sortColumn] < b[this.sortColumn];
                }
              }.bind(this));
          }.bind(this));
};

FireGrapher.prototype.addDataPointToTable = function(newDataPoint) {
  this.tableRows.push(newDataPoint);
  this.table
    .selectAll("div.row")
      .data(this.tableRows).enter()
      .append("div").attr("class", "row data clearfix")
        .selectAll("div.cell").data(function(d) {
          return d;
        }).enter()
        .append("div")
          .attr("class", "cell").attr("width", function(d, i) {
            return this.config.columns[i].width;
          }.bind(this))
          .text(function(d) {
            return d;
          });
};

// Graphing Methods
/**
 * Takes in a min and max for both x and y coordinates and adjusts the scales as necessary
 * @xMinMax is an array of 2 numbers [min, max]
 * @yMinMax is an array of 2 numbers [min, max]
 * @return true if scales were changed
 */
FireGrapher.prototype.changeScales = function(xMinMax, yMinMax) {
  var changedX = false, changedY = false;
  // update the scales based on the new domains
  if (xMinMax[0] < this.xScale.domain()[0]) {
    this.xScale.domain([xMinMax[0], this.xScale.domain()[1]]);
    changedX = true;
  }
  if (xMinMax[1] > this.xScale.domain()[1]) {
    this.xScale.domain([this.xScale.domain()[0], xMinMax[1]]);
    changedX = true;
  }
  if (yMinMax[0] < this.yScale.domain()[0]) {
    this.yScale.domain([yMinMax[0], this.yScale.domain()[1]]);
    changedY = true;
  }
  if (yMinMax[1] > this.yScale.domain()[1]) {
    this.yScale.domain([this.yScale.domain()[0], yMinMax[1]]);
    changedY = true;
  }
  if (changedY) {
    var yDomain = this.yScale.domain();
    var padding = (yDomain[1] - yDomain[0]) * 0.1;
    this.yScale.domain([yDomain[0] - padding, yDomain[1] + padding]);
  }
  return changedX || changedY;
};

FireGrapher.prototype.addDataPointToGraph = function(newDataPoint) {
  // if a series doesn't exist, create it
  if (typeof this.graphData[newDataPoint.series] === "undefined") {
    this.numSeries += 1;
    this.graphData[newDataPoint.series] = {
      seriesIndex: this.numSeries,
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
  // get the domain with the new coordinate
  var redrawScales = this.changeScales(
    d3.extent(coordinates, function(d) { return d.xCoord; }),
    d3.extent(coordinates, function(d) { return d.yCoord; }));
  // if we're doing a time series, shift the graph accordingly
  if (this.config.xCoord.limit && coordinates.length > this.config.xCoord.limit) {
    coordinates.shift();
    // force the domain change after shifting all the points
    this.xScale.domain(d3.extent(coordinates, function(d) { return d.xCoord; }));
    redrawScales = true;
  }

  if (redrawScales) {
    // if the scales have changed, we will redraw everything with the new data points
    this.drawScales();
  } else {
    // if scales haven't changed, go ahead and add the new data point
    switch (this.config.type) {
      case "line":
        var seriesIndex = this.graphData[newDataPoint.series].seriesIndex;
        this.drawLine(seriesIndex, coordinates);
        this.drawDataPoints(seriesIndex, coordinates);
        break;
      case "scatter":
        this.drawDataPoints(this.graphData[newDataPoint.series].seriesIndex, coordinates);
        break;
    }
  }
};

FireGrapher.prototype.drawLine = function(seriesIndex, dataPoints) {
  var line = d3.svg.line()
    .defined(function(d) { return d !== null; })
    .x(function(value) {
      return this.xScale(value.xCoord);
    }.bind(this))
    .y(function(value) {
      return this.yScale(value.yCoord);
    }.bind(this))
    .interpolate("linear");
  // if line does not already exist, add a new one
  if (this.graph.selectAll("path.series" + seriesIndex)[0].length === 0) {
    this.graph.append("path").attr("class", "series series" + seriesIndex);
  }
  // update the line with the data
  this.graph.select("path.series" + seriesIndex)
    .data([dataPoints])
    .attr("d", line(dataPoints));
};

FireGrapher.prototype.drawDataPoints = function(seriesIndex, dataPoints) {
  this.graph.selectAll("circle.series" + seriesIndex)
    .data(dataPoints).enter()
    .append("circle")
      .attr("class", "dataPoint series" + seriesIndex)
      .attr("cx", function(dataPoint) {
        return this.xScale(dataPoint.xCoord);
      }.bind(this))
      .attr("cy", function(dataPoint) {
        return this.yScale(dataPoint.yCoord);
      }.bind(this))
      .attr("r", 3.5);
};

FireGrapher.prototype.drawScales = function() {
  // if we need to redraw the scales,
  // that means everything on it, is not to scale
  // so we need to redraw the entire graph
  var margin = { top: 20, bottom: 30, left: 50, right: 20 };
  var height = this.config.graph.height - margin.bottom - margin.top;
  var width = this.config.graph.width - margin.left - margin.right;
  d3.select(this.cssSelector + " svg").remove();
  this.graph = d3.select(this.cssSelector)
    .append("svg")
      .attr("class", this.config.type)
      .attr("width", this.config.graph.width + margin.left + margin.right)
      .attr("height", this.config.graph.height + margin.bottom + margin.top)
      .append("g")
        .attr("transform", "translate("+margin.left+", "+margin.bottom+")");

  this.xScale.range([0, width]);
  this.yScale.range([height, 0]);

  // set the new axes
  var xAxis = d3.svg.axis()
    .orient("bottom")
    .scale(this.xScale)
    .ticks(Math.floor(width * 0.035));
  var yAxis = d3.svg.axis()
    .orient("left")
    .scale(this.yScale)
    .ticks(Math.floor(height * 0.035));

  // adding new scales
  this.graph
    .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (height) + ")")
      .call(xAxis)
      .selectAll("text")
        .attr("x", 0)
        .attr("y", 10);
  this.graph
    .append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .selectAll("text")
        .attr("x", -10)
        .attr("y", 0);

  // labels
  this.graph
    .append("text")
      .attr("transform", "translate(0, 50)")
      .attr("dx", width)
      .attr("dy", height)
      .style("text-anchor", "end")
      .text(this.config.xCoord.label);

  this.graph
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("dy", -margin.left + 16) // -margin.left will put it at 0, need to make room for text so add a bit for text size
      .style("text-anchor", "end")
      .text(this.config.yCoord.label);

  // reload the lines and datapoints
  for (var series in this.graphData) {
    if (this.graphData.hasOwnProperty(series)) {
      var seriesIndex = this.graphData[series].seriesIndex;
      var coordinates = this.graphData[series].coordinates;

      // if scales haven't changed, go ahead and add the new data point
      switch (this.config.type) {
        case "line":
          this.drawLine(seriesIndex, coordinates);
          this.drawDataPoints(seriesIndex, coordinates);
          break;
        case "scatter":
          this.drawDataPoints(seriesIndex, coordinates);
          break;
      }
    }
  }
};

// General Methods
FireGrapher.prototype.draw = function() {
  switch (this.config.type) {
    case "table":
      this.tableRows = [];
      this.table = d3.select(this.cssSelector)
        .append("div")
        .attr("class", "table");
      this.addHeaders(this.config.columns);
      break;
    case "line":
    case "scatter":
      this.graphData = {};
      this.numSeries = 0;

      this.xScale = d3.scale.linear()
        .domain([1000000, -1000000]) // wait for first data point to auto-snap
        .range([0, this.config.graph.width]);
      this.yScale = d3.scale.linear()
        .domain([1000000, -1000000]) // wait for first data point to auto-snap
        .range([this.config.graph.height, 0]);
      break;
  }
};
  return FireGrapher;
})();

/* jshint -W117 */
if (typeof module !== "undefined") {
  module.exports = FireGrapher;
}