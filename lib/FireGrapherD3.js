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

  var redrawScales = false;
  // if we're doing a time series, shift the graph accordingly
  if (this.config.xCoord.limit && coordinates.length > this.config.xCoord.limit) {
    coordinates.shift();
    // reset the domain after shifting all the points
    this.xScale.domain(d3.extent(coordinates, function(d) { return d.xCoord; }));
    redrawScales = true;
  }

  // update the scales based on the new data's domain
  var xNewDomain = d3.extent(coordinates, function(d) { return d.xCoord; });
  var yNewDomain = d3.extent(coordinates, function(d) { return d.yCoord; });
  if (xNewDomain[0] < this.xScale.domain()[0]) {
    this.xScale.domain([xNewDomain[0], this.xScale.domain()[1]]);
    redrawScales = true;
  }
  if (xNewDomain[1] > this.xScale.domain()[1]) {
    this.xScale.domain([this.xScale.domain()[0], xNewDomain[1]]);
    redrawScales = true;
  }
  if (yNewDomain[0] < this.yScale.domain()[0]) {
    this.yScale.domain([yNewDomain[0], this.yScale.domain()[1]]);
    redrawScales = true;
  }
  if (yNewDomain[1] > this.yScale.domain()[1]) {
    this.yScale.domain([this.yScale.domain()[0], yNewDomain[1]]);
    redrawScales = true;
  }
  if (redrawScales) {
    // if the scales have changed, we will redraw everything with the new data points
    this.drawScales();
  } else {
    // if scales haven't changed, go ahead and add the new data point
    switch (graphType) {
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
    this.graph.append("path").attr("class", "series" + seriesIndex);
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
        .attr("class", "series" + seriesIndex)
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
  d3.select(this.cssSelector + " svg").remove();
  this.graph = d3.select(this.cssSelector)
    .append("svg:svg")
      .attr("width", "100%")
      .attr("height", "100%");

  // set the new axes
  var xAxis = d3.svg.axis()
    .scale(this.xScale)
    .ticks(4)
    .tickSubdivide(1)
    .tickSize(-this.config.graph.height, -this.config.graph.height, -50);
  var yAxis = d3.svg.axis()
    .orient("left")
    .scale(this.yScale)
    .ticks(8)
    .tickSubdivide(0)
    .tickSize(-this.config.graph.width, -this.config.graph.width, -50);

  // adding new scales
  this.graph.append("g").attr("class", "x axis").attr("transform", "translate(0," + this.config.graph.height + ")")
    .call(xAxis)
    .selectAll("text")
      .attr("y", 15)
      .style("text-anchor", "start");
  this.graph.append("g").attr("class", "y axis")
    .call(yAxis)
    .selectAll("text")
      .attr("x", 5)
      .attr("y", -10)
      .style("text-anchor", "start");

  // reload the lines and datapoints
  for (var series in this.graphData) {
    if (this.graphData.hasOwnProperty(series)) {
      var seriesIndex = this.graphData[series].seriesIndex;
      var coordinates = this.graphData[series].coordinates;
      this.drawLine(seriesIndex, coordinates);
      this.drawDataPoints(seriesIndex, coordinates);
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
      this.numSeries = 0;
      this.xScale = d3.scale.linear().range([0, this.config.graph.width]);
      this.yScale = d3.scale.linear().range([this.config.graph.height, 0]);
      break;
  }
};