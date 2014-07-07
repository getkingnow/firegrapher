/**
 * Creates a D3Graph instance.
 *
 * @constructor
 * @this {D3Graph}
 * @param {object} config A list of options and styles which explain what the graph and how to style the graph.
 * @param {string} cssSelector The CSS selector of the tag which will hold the graph.
 */
var D3Graph = function(config, cssSelector) {

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/
  var _config = config;
  var _cssSelector = cssSelector;
  var _graph;
  var _xScale, _yScale, _xDomain, _yDomain;
  var _numSeries;

  var _this = this;

  /**
   * Public
   */
  this.init = function() {
    this.data = {};
    _xDomain = { min: Number.MAX_VALUE/2, max: Number.MIN_VALUE/2 };
    _yDomain = { min: Number.MAX_VALUE/2, max: Number.MIN_VALUE/2 };
    _numSeries = 0;

    if (_config.type === "bar") {
      _xScale = d3.scale.ordinal();
    }
    else {
      _xScale = d3.scale.linear()
        .domain([_xDomain.min, _xDomain.max]); // wait for first data point to auto-snap
    }

    _xScale
      .range([0, _config.styles.size.width]);
    _yScale = d3.scale.linear()
      .domain([_yDomain.min, _yDomain.max]) // wait for first data point to auto-snap
      .range([_config.styles.size.height, 0]);
  };

  this.draw = function() {
    var margin = { top: 20, bottom: 30, left: 60, right: 20 };
    var height = _config.styles.size.height - margin.bottom - margin.top;
    var width = _config.styles.size.width - margin.left - margin.right;

    // if we need to redraw the scales,
    // that means everything on it, is not to scale
    // so we need to redraw the entire graph
    d3.select(_cssSelector + " svg").remove();
    _graph = d3.select(_cssSelector)
      .append("svg")
        .attr("class", "fg-" + _config.type)
        .attr("width", _config.styles.size.width + margin.left + margin.right)
        .attr("height", _config.styles.size.height + margin.bottom + margin.top)
        .append("g")
          .attr("transform", "translate("+margin.left+", "+margin.bottom+")");

    // append graph title
    if (_config.title) {
      _graph.append("text")
        .attr("class", "fg-title")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(_config.title);
    }

    // set the range based on the calculated width and height
    _yScale.range([height, 0]);
    if (_config.type === "bar") {
      _xScale.rangeRoundBands([0, width], 0.1, 1);
    } else {
      _xScale.range([0, width]);
    }

    // set the new axes
    var xAxis = d3.svg.axis()
      .orient("bottom")
      .scale(_xScale)
      .ticks(Math.floor(width * 0.035))
      .tickSize(-height, -height);

    var yAxis = d3.svg.axis()
      .orient("left")
      .scale(_yScale)
      .ticks(Math.floor(height * 0.035))
      .tickSize(-width, -width);

    // adding new scales
    _graph
      .append("g")
        .attr("class", "fg-axis fg-x-axis")
        .attr("transform", "translate(0," + (height) + ")")
        .attr("shape-rendering", "crispEdges")
        .call(xAxis)
        .selectAll("text")
          .attr("x", 0)
          .attr("y", 10);

    _graph
      .append("g")
        .attr("class", "fg-axis fg-y-axis")
        .attr("shape-rendering", "crispEdges")
        .call(yAxis)
        .selectAll("text")
          .attr("x", -10)
          .attr("y", 0);

    // Style the graph
    _graph.selectAll(".domain")
      .attr("stroke", _config.styles.outerStrokeColor)
      .attr("stroke-width", _config.styles.outerStrokeWidth)
      .attr("fill", _config.styles.fillColor)
      .attr("fill-opacity", _config.styles.fillOpacity);

    _graph.selectAll(".fg-x-axis .tick")
      .attr("stroke", _config.styles.innerStrokeColor)
      .attr("stroke-width", (_config.type === "bar") ? 0 : _config.styles.innerStrokeWidth);

    _graph.selectAll(".fg-y-axis .tick")
      .attr("stroke", _config.styles.innerStrokeColor)
      .attr("stroke-width", _config.styles.innerStrokeWidth);

    _graph.selectAll(".fg-x-axis text")
      .attr("stroke", "none")
      .attr("fill", _config.styles.axes.x.ticks.fillColor)
      .attr("font-size", _config.styles.axes.x.ticks.fontSize);

    _graph.selectAll(".fg-y-axis text")
      .attr("stroke", "none")
      .attr("fill", _config.styles.axes.y.ticks.fillColor)
      .attr("font-size", _config.styles.axes.y.ticks.fontSize);


    // TODO: Use custom google font from https://www.google.com/fonts
    // labels
    _graph
      .append("text")
        .attr("class", "fg-axis-label fg-x-axis-label")
        .attr("transform", "translate(0, 50)")
        .attr("fill", _config.styles.axes.x.label.fillColor)
        .attr("font-size", _config.styles.axes.x.label.fontSize)
        .attr("font-weight", "bold")
        .attr("dx", width)
        .attr("dy", height)
        .style("text-anchor", "end")
        .text(_config.xCoord.label);

    _graph
      .append("text")
        .attr("class", "fg-axis-label fg-y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("fill", _config.styles.axes.y.label.fillColor)
        .attr("font-size", _config.styles.axes.y.label.fontSize)
        .attr("font-weight", "bold")
        .attr("dy", -margin.left + 16) // -margin.left will put it at 0, need to make room for text so add a bit for text size
        .style("text-anchor", "end")
        .text(_config.yCoord.label);

    // reload the lines and datapoints
    for (var series in _this.data) {
      if (_this.data.hasOwnProperty(series)) {
        var seriesIndex = _this.data[series].seriesIndex;
        var coordinates = _this.data[series].values;

        // if scales haven't changed, go ahead and add the new data point
        switch (_config.type) {
          case "line":
            _drawLegend();
            _drawLine(seriesIndex, coordinates);
            _drawDataPoints(seriesIndex, coordinates);
            break;
          case "scatter":
            _drawLegend();
            _drawDataPoints(seriesIndex, coordinates);
            break;
          case "bar":
            _drawBar(series, _this.data[series]);
            break;
        }
      }
    }
  };

  this.addDataPoint = function(newDataPoint) {
    switch (_config.type) {
      case "bar":
        _addDataPointToBarGraph(newDataPoint);
        break;
      case "line":
      case "scatter":
        _addDataPointToGraph(newDataPoint);
        break;
    }
  };

  /**
   * Private
   */
  function _addDataPointToBarGraph(newDataPoint) {
    var redrawGraph = false;
    // if a series doesn't exist, create it
    if (typeof _this.data[newDataPoint.series] === "undefined") {
      redrawGraph = true;
      _numSeries += 1;
      _this.data[newDataPoint.series] = {
        seriesIndex: _numSeries,
        values : [],
        aggregation: 0
      };
      // x is an ordinal of all of the series, since a new one was introduced, add it
      _xScale.domain(Object.keys(_this.data));
    }
    _this.data[newDataPoint.series].values.push(newDataPoint.value);
    var aggtype = "median";
    var i = 0;
    switch(aggtype) {
      case "mean":
        var sum = 0;
        for (; i < _this.data[newDataPoint.series].values.length; i++) {
          sum += _this.data[newDataPoint.series].values[i];
        }
        _this.data[newDataPoint.series].aggregation = sum / _this.data[newDataPoint.series].values.length;
        break;
      case "median":
        var tmpArray = _this.data[newDataPoint.series].values.slice(0); // slice will clone
        tmpArray.sort(function(a, b) { return a-b; });
        _this.data[newDataPoint.series].aggregation = tmpArray[Math.ceil(tmpArray.length / 2)];
        break;
      case "min":
        _this.data[newDataPoint.series].aggregation = Number.MAX_VALUE;
        for (; i < _this.data[newDataPoint.series].values.length; i++) {
          if (_this.data[newDataPoint.series].values[i] < _this.data[newDataPoint.series].aggregation) {
            _this.data[newDataPoint.series].aggregation = _this.data[newDataPoint.series].values[i];
          }
        }
        break;
      case "max":
        _this.data[newDataPoint.series].aggregation = Number.MIN_VALUE;
        for (; i < _this.data[newDataPoint.series].values.length; i++) {
          if (_this.data[newDataPoint.series].values[i] > _this.data[newDataPoint.series].aggregation) {
            _this.data[newDataPoint.series].aggregation = _this.data[newDataPoint.series].values[i];
          }
        }
        break;
      case "sum":
        _this.data[newDataPoint.series].aggregation += newDataPoint.value;
        break;
      default: // default sum
        _this.data[newDataPoint.series].aggregation += newDataPoint.value;
        break;
    }
    _this.data[newDataPoint.series].aggregation = (_this.data[newDataPoint.series].aggregation) ? _this.data[newDataPoint.series].aggregation : 0;

    redrawGraph = redrawGraph || _changeScales(
      // x is an ordinal, don't try to set min and max domains
      null,
      // y is based on 0 to the max value in values
      [0, _this.data[newDataPoint.series].aggregation]);
    if (redrawGraph) {
      // if the scales have changed, we will redraw everything with the new data points
      _this.draw();
    } else {
      // if scales haven't changed, go ahead and add the new data point
      _drawBar(newDataPoint.series, _this.data[newDataPoint.series]);
    }
  }

  function _addDataPointToGraph(newDataPoint) {
    // TODO: BUG: there seem to be multiples of each data point for series 1+
    // if a series doesn't exist, create it
    if (typeof _this.data[newDataPoint.series] === "undefined") {
      _this.data[newDataPoint.series] = {
        seriesIndex: _numSeries,
        streamCount : 0,
        values : []
      };
      _numSeries += 1;
    }
    _this.data[newDataPoint.series].streamCount += 1;

    // Update the data at the datapoint
    var coordinates = _this.data[newDataPoint.series].values;
    coordinates.push(newDataPoint);
    if (coordinates.length > 1 && newDataPoint.xCoord <= coordinates[coordinates.length - 2].xCoord) {
      // need to sort because x coords are now out of order (so that our line doesn't plot backwards)
      coordinates.sort(function(a, b) { return b.xCoord - a.xCoord; });
    }

    // get the domain with the new coordinate
    var redrawGraph = _changeScales(
      d3.extent(coordinates, function(d) { return d.xCoord; }),
      d3.extent(coordinates, function(d) { return d.yCoord; }));

    // if we're doing a time series, shift the graph accordingly
    if (_config.xCoord.limit && coordinates.length > _config.xCoord.limit) {
      coordinates.shift();
      // force the domain change after shifting all the points
      _xScale.domain(d3.extent(coordinates, function(d) { return d.xCoord; }));
      redrawGraph = true;
    }

    // if the scales have changed, we will redraw everything with the new data points
    if (redrawGraph) {
      _this.draw();
    } else {
      var seriesIndex = _this.data[newDataPoint.series].seriesIndex;
      _drawLegend();
      switch (_config.type) {
        case "line":
          _drawLine(seriesIndex, coordinates);
          _drawDataPoints(seriesIndex, coordinates);
          break;
        case "scatter":
          _drawDataPoints(seriesIndex, coordinates);
          break;
      }
    }
  }

  // Graphing Methods
  /**
   * Takes in a min and max for both x and y coordinates and adjusts the scales as necessary
   * @xMinMax is an array of 2 numbers [min, max]
   * @yMinMax is an array of 2 numbers [min, max]
   * @return true if scales were changed
   */
  function _changeScales(xMinMax, yMinMax) {
    var changedX = false, changedY = false;
    // update the scales based on the new domains
    if (xMinMax && xMinMax[0] < _xDomain.min) {
      _xDomain.min = xMinMax[0];
      changedX = true;
    }
    if (xMinMax && xMinMax[1] > _xDomain.max) {
      _xDomain.max = xMinMax[1];
      changedX = true;
    }
    if (yMinMax && yMinMax[0] < _yDomain.min) {
      _yDomain.min = yMinMax[0];
      changedY = true;
    }
    if (yMinMax && yMinMax[1] > _yDomain.max) {
      _yDomain.max = yMinMax[1];
      changedY = true;
    }
    if (changedX) {
      _xScale.domain([_xDomain.min, _xDomain.max]);
    }
    if (changedY) {
      var padding = (_yDomain.max - _yDomain.min) * 0.1;
      _yScale.domain([_yDomain.min - padding, _yDomain.max + padding]);
    }
    return changedX || changedY;
  }

  function _drawLegend() {
    var series = [];
    for (var k in _this.data) {
      if (k !== "undefined") {
        series.push(k);
      }
    }
    // remove old legend
    _graph.selectAll("g.fg-legend").remove();
    // if multiple series, draw new legend
    if (series.length > 1) {
      var margin = { top: 5, bottom: 5, left: 5, right: 5 };
      var legendWidth = 50;
      var legendHeight = series.length * 20;
      var x = _config.styles.size.width - legendWidth * 2 - margin.left - margin.right;
      var y = _config.styles.size.height - legendHeight * 2 - margin.top - margin.bottom;

      // can't attach text to rect, so make a g with both
      var gs = _graph
        .append("g")
          .attr("class", "fg-legend");

      // append rectangle for shape if necessary, stroke set to none to remove
      gs.append("rect")
        .attr("class", "fg-legend-container")
        .attr("x", x)
        .attr("y", y)
        .attr("width", legendWidth + margin.left + margin.right)
        .attr("height", legendHeight + margin.top + margin.bottom)
        .style("stroke", "red")
        .style("fill", "black");

      // append the series name and appropriate stroke color
      gs.selectAll("text")
        .data(series).enter()
        .append("text")
          .attr("class", function(d, i) {
            return "fg-legend-series fg-series-" + i;
          })
          .attr("x", x)
          .attr("y", y)
          .attr("dx", legendWidth)
          .attr("dy", function(d, i) { return (i+1) * 20; })
          .style("text-anchor", "end")
          .style("stroke", function(d, i) {
            return _config.styles.series.strokeColors[i];
          })
          .text(function(d) {
            return d;
          });
    }
  }

  function _drawLine(seriesIndex, dataPoints) {
    var line = d3.svg.line()
      .defined(function(d) { return d !== null; })
      .x(function(value) {
        return _xScale(value.xCoord);
      })
      .y(function(value) {
        return _yScale(value.yCoord);
      })
      .interpolate("linear");

    // if line does not already exist, add a new one
    if (_graph.selectAll("path.fg-series-" + seriesIndex)[0].length === 0) {
      _graph
        .append("path")
          .attr("class", "fg-series fg-series-" + seriesIndex);
    }

    // update the line with the data
    _graph.select("path.fg-series-" + seriesIndex)
      .data([dataPoints])
      .attr("class", "fg-series fg-series-" + seriesIndex)
      .attr("stroke", _config.styles.series.strokeColors[seriesIndex])  // What if more series than colors?
      .attr("stroke-width", _config.styles.series.strokeWidth)
      .attr("fill", _config.styles.series.fillColors[seriesIndex])
      .attr("d", line(dataPoints));
  }

  function _drawDataPoints(seriesIndex, dataPoints) {
    _graph.selectAll("circle.fg-series" + seriesIndex)
      .data(dataPoints).enter()
      .append("circle")
        .attr("class", "fg-marker fg-series-" + seriesIndex)
        .attr("stroke", _config.styles.markers.strokeColors[seriesIndex]) // What if more series than colors?
        .attr("stroke-width", _config.styles.markers.strokeWidth)
        .attr("fill", _config.styles.markers.fillColors[seriesIndex])
        .attr("cx", function(dataPoint) {
          return _xScale(dataPoint.xCoord);
        })
        .attr("cy", function(dataPoint) {
          return _yScale(dataPoint.yCoord);
        })
        .attr("r", _config.styles.markers.size);
  }

  function _drawBar(series, barData) {
    var seriesIndex = barData.seriesIndex;
    _graph.selectAll(".fg-bar .fg-series"+seriesIndex)
      .data([barData]).enter()
      .append("rect")
        .attr("class", "fg-series fg-series-" + seriesIndex)
        .attr("value", function(d) { return d.aggregation; })
        .attr("x", function() { return _xScale(series); })
        .attr("width", _xScale.rangeBand())
        .attr("y", function(d) { return _yScale(d.aggregation); })
        .attr("height", function(d) { return _yScale.range()[0] - _yScale(d.aggregation); });
  }
};
