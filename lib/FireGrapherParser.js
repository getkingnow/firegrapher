/**
 * Creates a d3 graph of the data at firebaseRef according to the config options.
 *
 * param {string} cssSelector A unique CSS selector which will own the graph.
 * param {object} firebaseRef A Firebase reference to the data that will be graphed.
 * param {object} config A list of options and styles which explain what the graph and how to style the graph.
 */
FireGrapher.prototype.graph = function (cssSelector, firebaseRef, config) {
  // Store the inputted parameters globally
  this.cssSelector = cssSelector;
  this.firebaseRef = firebaseRef;

  // Validate the passed config and set appropriate defaults
  this.validateConfig(config);
  this.config = config;

  // Recursively loop through the global config object and set any unspecified options
  // to their default values
  this.recursivelySetDefaults(this.config, this.getDefaultConfig());

  // Parse the path to an individual record and set appropriate Firebase event handlers
  // to make the graph dynamic
  this.pathNodes = config.path.split("/");
  var pathDicts = [{
    "path": "/",
    "params": {}
  }];
  this.parsePath(pathDicts, 0);

  // Draw the graph
  this.draw();
};

/**
 *  Validates the inputted config object and makes sure no options have invalid values.
 *
 *  param {config} A list of options and styles which explain what the graph and how to style the graph.
 */
FireGrapher.prototype.validateConfig = function(config) {
  // Every config needs to specify the graph type
  var validGraphTypes = ["table", "line", "scatter", "bar", "map"];
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
    case "map":
      if (typeof config.marker === "undefined" ||
          typeof config.marker.latitude === "undefined" ||
          typeof config.marker.longitude === "undefined" ||
          typeof config.marker.magnitude === "undefined") {
        throw new Error("Incomplete \"marker\" definition specified. \nExpected: " + JSON.stringify(this.getDefaultConfig().marker) + "\nActual: " + JSON.stringify(config.marker));
      }
      break;
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
    case "bar":
      if (typeof config.value === "undefined") {
        throw new Error("No \"value\" specified.");
      }
      break;
    case "scatter":
      break;
  }
};

/**
 *  Adds default values to the graph config object
 */
FireGrapher.prototype.getDefaultConfig = function() {
  // Default colors (turquoise, alizaren (red), amethyst (purple), peter river (blue), sunflower, pumpkin, emerald, carrot, midnight blue, pomegranate)
  var defaultStrokeColors = ["#1ABC9C", "#E74C3C", "#9B59B6", "#3498DB", "#F1C40F", "#D35400", "#2ECC71", "#E67E22", "#2C3E50", "#C0392B"];
  var defaultFillColors = ["#28E1BC", "#ED7469", "#B07CC6", "#5FAEE3", "#F4D03F", "#FF6607", "#54D98B", "#EB9850", "#3E5771", "#D65448"];

  // Define a default config object
  var configDefaults = {
    "styles": {
      "fillColor": "#DDDDDD",
      "fillOpacity": 0.3,
      "outerStrokeColor": "#000000",
      "outerStrokeWidth": 2,
      "innerStrokeColor": "#000000",
      "innerStrokeWidth": 1,
      "size": {
        "width": 500,
        "height": 300
      },
      "axes": {
        "x": {
          "ticks": {
            "fillColor": "#000000",
            "fontSize": "14px"
          },
          "label": {
            "fillColor": "#000000",
            "fontSize": "14px"
          }
        },
        "y": {
          "ticks": {
            "fillColor": "#000000",
            "fontSize": "14px"
          },
          "label": {
            "fillColor": "#000000",
            "fontSize": "14px"
          }
        }
      },
      "series": {
        "strokeWidth": 2,
        "strokeColors": defaultStrokeColors,
        "fillColors": ["none", "none", "none", "none", "none", "none", "none", "none", "none", "none", "none"]
      },
      "markers": {
        "size": 3.5,
        "strokeWidth": 2,
        "style": "default",
        "strokeColors": defaultStrokeColors,
        "fillColors": defaultFillColors // What about if style is set to "flat"?
      }
    },
    "xCoord": {
      "label": "",
      "min": 0,
      "max": 50
    },
    "yCoord": {
      "label": "",
      "min": 0,
      "max": 200
    },
    "marker": {
      "label" : "label",
      "latitude" : "latitude",
      "longitude" : "longitude",
      "magnitude" : "radius"
    }
  };

  return configDefaults;
};

/**
 *  Recursively loops through the inputted config object and sets any unspecified
 *  options to their default values
 */
FireGrapher.prototype.recursivelySetDefaults = function(outputConfig, defaultConfig) {
  for (var key in defaultConfig) {
    if (typeof defaultConfig[key] === "object") {
      outputConfig[key] = (outputConfig[key]) ? outputConfig[key] : {};
      this.recursivelySetDefaults(outputConfig[key], defaultConfig[key]);
    }
    else {
      outputConfig[key] = (outputConfig[key]) ? outputConfig[key] : defaultConfig[key];
    }
    // TODO: change
    //outputConfig[key] = outputConfig[key] || defaultConfig[key];
  }
};

/**
 * ParseS the path to an individual record and sets appropriate Firebase event handlers
 * to make the graph dynamic.
 *
 * param {list of dictionaries} pathDicts A list of dictionaries which specify paths along
 * which we need to listen for new records.
 * param {integer} nodeIndex The index of the current node along the parse path.
 */
FireGrapher.prototype.parsePath = function(pathDicts, nodeIndex) {
  // If we've gone through all parts of the path, we have made it to the individual records level
  if (nodeIndex === this.pathNodes.length) {
    var eventToListenTo = (this.pathNodes[this.pathNodes.length - 1] === "*") ? "child_added" : "value";

    pathDicts.forEach(function(pathDict) {
      this.listenForNewRecords(pathDict, eventToListenTo);
      if (eventToListenTo === "child_added") {
        this.listenForRemovedRecords(pathDict);
        this.listenForChangedRecords(pathDict);
      }
    }.bind(this));
  }

  // Otherwise, parse the next part of the path
  else {
    // Get the name of the current node in the path
    var node = this.pathNodes[nodeIndex];

    // Make sure the * is only used as the last part of the path
    if (node[0] === "*") {
      if (nodeIndex !== (this.pathNodes.length - 1)) {
        throw new Error("You can only use * as the last character in your \"path\"");
      }

      // Parse the path one last time
      this.parsePath(pathDicts, nodeIndex + 1);
    }

    // If this is a wildcard node, add it to the params list and find every possible node name
    else if (node[0] === "$") {
      pathDicts.forEach(function(pathDict) {
        // Create a series for each child in this path
        this.firebaseRef.child(pathDict.path).on("child_added", function(childSnapshot) {
          // Append the current node's value to a new path dictionary
          var newPathDict = {
            "path": pathDict.path + childSnapshot.name() + "/",
            "params": {}
          };

          // Create the params object for the new path dictionary
          newPathDict.params[node] = childSnapshot.name();
          for (var key in pathDict.params) {
            if (pathDict.params.hasOwnnKey(key)) {
              newPathDict.params[key] = pathDict.params;
            }
          }

          // Recursively parse the path at the next level
          this.parsePath([newPathDict], nodeIndex + 1);
        }.bind(this));

        // Remove series from the graph when they are removed from Firebase
        this.firebaseRef.child(pathDict.path).on("child_removed", function(childSnapshot) {
          this.removeSeries(childSnapshot.name());
        }.bind(this));
      }.bind(this));
    }

    // Regular nodes
    else {
      // Append the current node to each path
      var newPathDicts = [];
      pathDicts.forEach(function(pathDict) {
        newPathDicts.push({
          "path": pathDict.path + node + "/",
          "params": pathDict.params
        });
      }.bind(this));

      // Recursively parse the path at the next level
      this.parsePath(newPathDicts, nodeIndex + 1);
    }
  }
};

FireGrapher.prototype.listenForNewRecords = function(pathDict, eventToListenTo) {
  this.firebaseRef.child(pathDict.path).on(eventToListenTo, function(childSnapshot) {
    var data = childSnapshot.val();
    var series;
    switch (this.config.type) {
      case "map":
        this.addDataPointToMap({
          "path": pathDict.path + childSnapshot.name(),
          "label": data[this.config.marker.label],
          "radius": data[this.config.marker.magnitude],
          "latitude": parseFloat(data[this.config.marker.latitude]),
          "longitude": parseFloat(data[this.config.marker.longitude])
        });
        break;
      case "table":
        var newDataPoint = [];
        this.config.columns.forEach(function(column) {
          newDataPoint.push((typeof data[column.value] !== "undefined") ? data[column.value].toString() : "");
        });
        this.addDataPointToTable(newDataPoint);
        break;
      case "bar":
        series = (this.config.series[0] === "$") ? pathDict.params[this.config.series] : data[this.config.series];
        this.addDataPointToBarGraph({
          "path": pathDict.path + childSnapshot.name(),
          "series": series,
          "value": parseInt(data[this.config.value])
        });
        break;
      case "line":
      case "scatter":
        series = (this.config.series[0] === "$") ? pathDict.params[this.config.series] : data[this.config.series];
        var xCoord;
        if (typeof this.config.xCoord.stream !== "undefined" && this.config.xCoord.stream) {
          xCoord = (this.graphData[series] && this.graphData[series].streamCount) ? this.graphData[series].streamCount : 0;
        }
        else {
          xCoord = parseInt(data[this.config.xCoord.value]);
        }
        this.addDataPointToGraph({
          "series": series,
          "path": pathDict.path + childSnapshot.name(),
          "xCoord": xCoord,
          "yCoord": parseInt(data[this.config.yCoord.value])
        });
        break;
    }
  }.bind(this));
};

FireGrapher.prototype.removeSeries = function(seriesName) {
  switch (this.config.type) {
    case "bar":
    case "line":
    case "scatter":
      delete this.graphData[seriesName];
      this.drawGraph();
      // TODO: want to make it so that we can remove this series and re-use it's series color
      // this.numSeries -= 1; // Doesn't work since only opens up the latest color, not this series' color
  }
};

FireGrapher.prototype.listenForRemovedRecords = function(pathDict) {
  switch (this.config.type) {
    case "map":
      this.firebaseRef.child(pathDict.path).on("child_removed", function(childSnapshot) {
        this.points.forEach(function(dataPoint, index) {
          if (dataPoint.path === (pathDict.path + childSnapshot.name())) {
            this.points.splice(index, 1);
          }
        }.bind(this));
        this.drawMap();
      }.bind(this));
      break;
    case "table":
      break;
    case "bar":
    case "line":
    case "scatter":
      this.firebaseRef.child(pathDict.path).on("child_removed", function(childSnapshot) {
        var series = (this.config.series[0] === "$") ? pathDict.params[this.config.series] : childSnapshot.val()[this.config.series];
        this.graphData[series].values.forEach(function(dataPoint, index) {
          if (dataPoint.path === (pathDict.path + childSnapshot.name())) {
            var spliced = this.graphData[series].values.splice(index, 1);
            if (this.config.type === "bar") {
              this.graphData[series].sum -= spliced;
            }
          }
        }.bind(this));
        this.drawGraph();
      }.bind(this));
      break;
  }
};

FireGrapher.prototype.listenForChangedRecords = function() {
  // TODO: implement
  /*switch (this.config.type) {
    case "table":
      break;
    case "bar":
    case "line":
    case "scatter":
      this.firebaseRef.child(pathDict.path).on("child_removed", function(childSnapshot) {
        var series = (this.config.series[0] === "$") ? pathDict.params[this.config.series] : childSnapshot.val()[this.config.series];
        this.graphData[series].values.forEach(function(dataPoint, index) {
          if (dataPoint.path === (pathDict.path + childSnapshot.name())) {
            var spliced = this.graphData[series].values.splice(index, 1);
            if (this.config.type === "bar") {
              this.graphData[series].sum -= spliced;
            }
          }
        }.bind(this));
        this.drawGraph();
      }.bind(this));
      break;
  }*/
};