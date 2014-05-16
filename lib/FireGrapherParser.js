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

FireGrapher.prototype.setDefaults = function(outputGraph, graphDefaults) {
  for (var key in graphDefaults) {
    if (typeof graphDefaults.key === "object") {
      outputGraph[key] = (outputGraph[key]) ? outputGraph[key] : {};
      this.setDefaults(outputGraph[key], graphDefaults[key]);
    }
    else {
      outputGraph[key] = (outputGraph[key]) ? outputGraph[key] : graphDefaults[key];
    }
  }
};

FireGrapher.prototype.setDefaultConfig = function() {
  // Default colors (turquoise, alizaren (red), amethyst (purple), peter river (blue), sunflower, pumpkin, emerald, carrot, midnightBlue, pomegranate)
  var defaultStrokeColors = ["#1ABC9C", "#E74C3C", "#9B59B6", "#3498DB", "#F1C40F", "#D35400", "#2ECC71", "#E67E22", "#2C3E50", "#C0392B"];
  var defaultFillColors = ["#28E1BC", "#ED7469", "#B07CC6", "#5FAEE3", "#F4D03F", "#FF6607", "#54D98B", "#EB9850", "#3E5771", "#D65448"];

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
    }
  }

  this.setDefaults(this.config, configDefaults);
};

FireGrapher.prototype.validateConfig = function(config) {
  // Every config needs to specify the graph type
  var validGraphTypes = ["table", "line", "scatter", "bar"];
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
    case "bar":
      if (typeof config.value === "undefined") {
        throw new Error("No \"value\" specified.");
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
      if (eventToListenTo === "child_added") {
        this.listenForRemovedRecords(path);
      }
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
  this.firebaseRef.child(path).on(eventToListenTo, function(childSnapshot) {
    var data = childSnapshot.val();
    var series;
    switch (this.config.type) {
      case "table":
        var newDataPoint = [];
        this.config.columns.forEach(function(column) {
          newDataPoint.push((typeof data[column.value] !== "undefined") ? data[column.value].toString() : "");
        });
        newDataPoint.path = path + childSnapshot.name();
        this.addDataPointToTable(newDataPoint);
        break;
      case "bar":
        series = (this.config.series[0] === "$") ? lastPathPart : data[this.config.series];
        this.addDataPointToBarGraph({
          "series": series,
          "value": parseInt(data[this.config.value])
        });
        break;
      case "line":
      case "scatter":
        series = (this.config.series[0] === "$") ? lastPathPart : data[this.config.series];
        var xCoord;
        if (typeof this.config.xCoord.stream !== "undefined" && this.config.xCoord.stream) {
          xCoord = (this.graphData[series] && this.graphData[series].streamCount) ? this.graphData[series].streamCount : 0;
        }
        else {
          xCoord = parseInt(data[this.config.xCoord.value]);
        }
        this.addDataPointToGraph({
          "series": series,
          "path": path + childSnapshot.name(),
          "xCoord": xCoord,
          "yCoord": parseInt(data[this.config.yCoord.value])
        });
        break;
    }
  }.bind(this));
};

FireGrapher.prototype.listenForRemovedRecords = function(path) {
  var pathParts = path.split("/");
  var lastPathPart = pathParts[pathParts.length - 2];

  switch (this.config.type) {
    case "table":
      break;
    case "bar":
    case "line":
    case "scatter":
      this.firebaseRef.child(path).on("child_removed", function(childSnapshot) {
        var data = childSnapshot.val();
        var series = (this.config.series[0] === "$") ? lastPathPart : data[this.config.series];
        this.graphData[series].values.forEach(function(dataPoint, index) {
          if (dataPoint.path === (path + childSnapshot.name())) {
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