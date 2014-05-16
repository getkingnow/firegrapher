// Tabling Methods
FireGrapher.prototype.addTableHeaders = function(columns) {
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
      .append("div")
        .attr("class", "row data clearfix")
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
  if (xMinMax && xMinMax[0] < this.xDomain.min) {
    this.xDomain.min = xMinMax[0];
    changedX = true;
  }
  if (xMinMax && xMinMax[1] > this.xDomain.max) {
    this.xDomain.max = xMinMax[1];
    changedX = true;
  }
  if (yMinMax && yMinMax[0] < this.yDomain.min) {
    this.yDomain.min = yMinMax[0];
    changedY = true;
  }
  if (yMinMax && yMinMax[1] > this.yDomain.max) {
    this.yDomain.max = yMinMax[1];
    changedY = true;
  }
  if (changedX) {
    this.xScale.domain([this.xDomain.min, this.xDomain.max]);
  }
  if (changedY) {
    var padding = (this.yDomain.max - this.yDomain.min) * 0.1;
    this.yScale.domain([this.yDomain.min - padding, this.yDomain.max + padding]);
  }
  return changedX || changedY;
};

FireGrapher.prototype.addDataPointToBarGraph = function(newDataPoint) {
  var redrawGraph = false;
  // if a series doesn't exist, create it
  if (typeof this.graphData[newDataPoint.series] === "undefined") {
    redrawGraph = true;
    this.numSeries += 1;
    this.graphData[newDataPoint.series] = {
      seriesIndex: this.numSeries,
      values: [],
      sum: 0
    };
    // x is an ordinal of all of the series, since a new one was introduced, add it
    this.xScale.domain(Object.keys(this.graphData));
  }
  this.graphData[newDataPoint.series].values.push(newDataPoint.value);
  this.graphData[newDataPoint.series].sum += newDataPoint.value;

  redrawGraph = redrawGraph || this.changeScales(
    // x is an ordinal, don't try to set min and max domains
    null, 
    // y is based on 0 to the max value in values
    [0, this.graphData[newDataPoint.series].sum]);
  if (redrawGraph) {
    // if the scales have changed, we will redraw everything with the new data points
    this.drawGraph();
  } else {
    // if scales haven't changed, go ahead and add the new data point
    var seriesIndex = this.graphData[newDataPoint.series].seriesIndex;
    this.drawBar(seriesIndex, this.graphData[newDataPoint.series].sum);
  }
};

FireGrapher.prototype.addDataPointToGraph = function(newDataPoint) {
  // if a series doesn't exist, create it
  if (typeof this.graphData[newDataPoint.series] === "undefined") {
    this.graphData[newDataPoint.series] = {
      seriesIndex: this.numSeries,
      streamCount : 0,
      values : []
    };
    this.numSeries += 1;
  }
  this.graphData[newDataPoint.series].streamCount += 1;

  // Update the data at the datapoint
  var coordinates = this.graphData[newDataPoint.series].values;
  coordinates.push(newDataPoint);
  if (coordinates.length > 1 && newDataPoint.xCoord <= coordinates[coordinates.length - 2].xCoord) {
    // need to sort because x coords are now out of order (so that our line doesn't plot backwards)
    coordinates.sort(function(a, b) { return b.xCoord - a.xCoord; });
  }

  // get the domain with the new coordinate
  var redrawGraph = this.changeScales(
    d3.extent(coordinates, function(d) { return d.xCoord; }),
    d3.extent(coordinates, function(d) { return d.yCoord; }));

  // if we're doing a time series, shift the graph accordingly
  if (this.config.xCoord.limit && coordinates.length > this.config.xCoord.limit) {
    coordinates.shift();
    // force the domain change after shifting all the points
    this.xScale.domain(d3.extent(coordinates, function(d) { return d.xCoord; }));
    redrawGraph = true;
  }

  // if the scales have changed, we will redraw everything with the new data points
  if (redrawGraph) {
    this.drawGraph();
  } else {
    var seriesIndex = this.graphData[newDataPoint.series].seriesIndex;
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
    this.graph
      .append("path")
        .attr("class", "series series" + seriesIndex);
  }

  // update the line with the data
  this.graph.select("path.series" + seriesIndex)
    .data([dataPoints])
    .attr("stroke", this.config.graph.series.strokeColors[seriesIndex])  // What if more series than colors?
    .attr("stroke-width", this.config.graph.series.strokeWidth)
    .attr("fill", this.config.graph.series.fillColors[seriesIndex])
    .attr("class", "series series" + seriesIndex)
    .attr("d", line(dataPoints));
};

FireGrapher.prototype.drawDataPoints = function(seriesIndex, dataPoints) {
  this.graph.selectAll("circle.series" + seriesIndex)
    .data(dataPoints).enter()
    .append("circle")
      .attr("stroke", this.config.graph.markers.strokeColors[seriesIndex]) // What if more series than colors?
      .attr("stroke-width", this.config.graph.markers.strokeWidth)
      .attr("fill", this.config.graph.markers.fillColors[seriesIndex])
      .attr("class", "marker series" + seriesIndex)
      .attr("cx", function(dataPoint) {
        return this.xScale(dataPoint.xCoord);
      }.bind(this))
      .attr("cy", function(dataPoint) {
        return this.yScale(dataPoint.yCoord);
      }.bind(this))
      .attr("r", this.config.graph.markers.size);
};

FireGrapher.prototype.drawBar = function(seriesIndex, seriesSum) {
  this.graph.selectAll(".bar.series"+seriesIndex)
    .data([seriesSum]).enter()
    .append("rect")
      .attr("value", seriesSum)
      .attr("class", "bar series" + seriesIndex)
      .attr("x", function(d) { return this.xScale(d); }.bind(this))
      .attr("width", this.xScale.rangeBand())
      .attr("y", function(d) { return this.yScale(d); }.bind(this))
      .attr("height", function(d) { return this.yScale.range()[0] - this.yScale(d); }.bind(this));
};

FireGrapher.prototype.drawGraph = function() {
  var margin = { top: 20, bottom: 30, left: 60, right: 20 };
  var height = this.config.graph.height - margin.bottom - margin.top;
  var width = this.config.graph.width - margin.left - margin.right;

  // if we need to redraw the scales,
  // that means everything on it, is not to scale
  // so we need to redraw the entire graph
  d3.select(this.cssSelector + " svg").remove();
  this.graph = d3.select(this.cssSelector)
    .append("svg")
      .attr("class", this.config.type)
      .attr("width", this.config.graph.width + margin.left + margin.right)
      .attr("height", this.config.graph.height + margin.bottom + margin.top)
      .append("g")
        .attr("transform", "translate("+margin.left+", "+margin.bottom+")");

  // set the range based on the calculated width and height
  this.yScale.range([height, 0]);
  if (this.config.type === "bar") {
    this.xScale.rangeBands([0, width]);
  } else {
    this.xScale.range([0, width]);
  }

  // set the new axes
  var xAxis = d3.svg.axis()
    .orient("bottom")
    .scale(this.xScale)
    .ticks(Math.floor(width * 0.035))
    .tickSize(-height, -height);

  // if it's a bar graph, set 1 tick per bar
  if (this.config.type === "bar") {
    xAxis.ticks(this.xScale.domain().length);
  }

  var yAxis = d3.svg.axis()
    .orient("left")
    .scale(this.yScale)
    .ticks(Math.floor(height * 0.035))
    .tickSize(-width, -width);

  // adding new scales
  this.graph
    .append("g")
      .attr("class", "axis xAxis")
      .attr("transform", "translate(0," + (height) + ")")
      .call(xAxis)
      .selectAll("text")
        .attr("x", 0)
        .attr("y", 10);
  this.graph
    .append("g")
      .attr("class", "axis yAxis")
      .call(yAxis)
      .selectAll("text")
        .attr("x", -10)
        .attr("y", 0);

  // labels
  this.graph
    .append("text")
      .attr("class", "axisLabel xAxisLabel")
      .attr("transform", "translate(0, 50)")
      .attr("dx", width)
      .attr("dy", height)
      .style("text-anchor", "end")
      .text(this.config.xCoord.label);

  this.graph
    .append("text")
      .attr("class", "axisLabel yAxisLabel")
      .attr("transform", "rotate(-90)")
      .attr("dy", -margin.left + 16) // -margin.left will put it at 0, need to make room for text so add a bit for text size
      .style("text-anchor", "end")
      .text(this.config.yCoord.label);

  // reload the lines and datapoints
  for (var series in this.graphData) {
    if (this.graphData.hasOwnProperty(series)) {
      var seriesIndex = this.graphData[series].seriesIndex;
      var coordinates = this.graphData[series].values;

      // if scales haven't changed, go ahead and add the new data point
      switch (this.config.type) {
        case "line":
          this.drawLine(seriesIndex, coordinates);
          this.drawDataPoints(seriesIndex, coordinates);
          break;
        case "scatter":
          this.drawDataPoints(seriesIndex, coordinates);
          break;
        case "bar":
          this.drawBar(seriesIndex, this.graphData[series].sum);
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
      this.addTableHeaders(this.config.columns);
      break;
    case "bar":
    case "line":
    case "scatter":
      this.graphData = {};
      this.xDomain = { min: 1000000, max: -1000000 };
      this.yDomain = { min: 1000000, max: -1000000 };
      this.numSeries = 0;

      if (this.config.type === "bar") {
        this.xScale = d3.scale.ordinal();
      }
      else {
        this.xScale = d3.scale.linear();
      }

      this.xScale
        .domain([this.xDomain.min, this.xDomain.max]) // wait for first data point to auto-snap
        .range([0, this.config.graph.width]);
      this.yScale = d3.scale.linear()
        .domain([this.yDomain.min, this.yDomain.max]) // wait for first data point to auto-snap
        .range([this.config.graph.height, 0]);
      break;
  }
};