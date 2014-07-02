/**
 * Creates a FireGrapherParser instance.
 *
 * @constructor
 * @this {FireGrapherParser}
 * @param {Firebase} firebaseRef A Firebase reference from where the FireGrapher data will be read.
 * @param {object} config A list of options and styles which explain what the graph and how to style the graph.
 * @param {FireGrapherD3} d3Grapher Grapher instance used to draw via d3.
 */
var FireGrapherParser = function(firebaseRef, config, d3Grapher) {
  /********************/
  /*  PRIVATE METHODS */
  /********************/
  function _listenForNewRecords(pathDict, eventToListenTo) {
    _firebaseRef.child(pathDict.path).on(eventToListenTo, function(childSnapshot) {
      var data = childSnapshot.val();
      var series;
      switch (_config.type) {
        case "map":
          _d3Grapher.addDataPointToMap({
            "path": pathDict.path + childSnapshot.name(),
            "label": data[_config.marker.label],
            "radius": data[_config.marker.magnitude],
            "latitude": parseFloat(data[_config.marker.latitude]),
            "longitude": parseFloat(data[_config.marker.longitude])
          });
          break;
        case "table":
          var newDataPoint = [];
          _config.columns.forEach(function(column) {
            newDataPoint.push((typeof data[column.value] !== "undefined") ? data[column.value].toString() : "");
          });
          _d3Grapher.addDataPointToTable(newDataPoint);
          break;
        case "bar":
          series = (_config.series[0] === "$") ? pathDict.params[_config.series] : data[_config.series];
          _d3Grapher.addDataPointToBarGraph({
            "path": pathDict.path + childSnapshot.name(),
            "series": series,
            "value": parseInt(data[_config.value])
          });
          break;
        case "line":
        case "scatter":
          series = (_config.series[0] === "$") ? pathDict.params[_config.series] : data[_config.series];
          var xCoord;
          if (typeof _config.xCoord.stream !== "undefined" && _config.xCoord.stream) {
            xCoord = (_d3Grapher.graphData[series] && _d3Grapher.graphData[series].streamCount) ? _d3Grapher.graphData[series].streamCount : 0;
          }
          else {
            xCoord = parseInt(data[_config.xCoord.value]);
          }
          _d3Grapher.addDataPointToGraph({
            "series": series,
            "path": pathDict.path + childSnapshot.name(),
            "xCoord": xCoord,
            "yCoord": parseInt(data[_config.yCoord.value])
          });
          break;
      }
    });
  }

  function _removeSeries(seriesName) {
    switch (_config.type) {
      case "bar":
      case "line":
      case "scatter":
        delete _d3Grapher.graphData[seriesName];
        _d3Grapher.drawGraph();
        // TODO: want to make it so that we can remove the current series and re-use its series color
        // _d3Grapher.numSeries -= 1; // Doesn't work since only opens up the latest color, not the current series' color
        break;
    }
  }

  function _listenForRemovedRecords(pathDict) {
    switch (_config.type) {
      case "map":
        _firebaseRef.child(pathDict.path).on("child_removed", function(childSnapshot) {
          _d3Grapher.mapPoints.forEach(function(dataPoint, index) {
            if (dataPoint.path === (pathDict.path + childSnapshot.name())) {
              _d3Grapher.mapPoints.splice(index, 1);
            }
          });
          _d3Grapher.drawMap();
        });
        break;
      case "table":
        break;
      case "bar":
      case "line":
      case "scatter":
        _firebaseRef.child(pathDict.path).on("child_removed", function(childSnapshot) {
          var series = (_config.series[0] === "$") ? pathDict.params[_config.series] : childSnapshot.val()[_config.series];
          _d3Grapher.graphData[series].values.forEach(function(dataPoint, index) {
            if (dataPoint.path === (pathDict.path + childSnapshot.name())) {
              var spliced = _d3Grapher.graphData[series].values.splice(index, 1);
              if (_config.type === "bar") {
                _d3Grapher.graphData[series].sum -= spliced;
              }
            }
          });

          _d3Grapher.drawGraph();
        });
        break;
    }
  }

  function _listenForChangedRecords() {
    // TODO: implement
    /*switch (_config.type) {
      case "table":
        break;
      case "bar":
      case "line":
      case "scatter":
        _firebaseRef.child(pathDict.path).on("child_removed", function(childSnapshot) {
          var series = (_config.series[0] === "$") ? pathDict.params[_config.series] : childSnapshot.val()[_config.series];
          _d3Grapher.graphData[series].values.forEach(function(dataPoint, index) {
            if (dataPoint.path === (pathDict.path + childSnapshot.name())) {
              var spliced = _d3Grapher.graphData[series].values.splice(index, 1);
              if (_config.type === "bar") {
                _d3Grapher.graphData[series].sum -= spliced;
              }
            }
          });
          _d3Grapher.drawGraph();
        });
        break;
    }*/
  }

  /********************/
  /*  PUBLIC METHODS  */
  /********************/
  /**
   * Parses the path to an individual record and sets appropriate Firebase event handlers
   * to make the graph dynamic.
   *
   * param {list of dictionaries} pathDicts A list of dictionaries which specify paths along
   * which we need to listen for new records.
   * param {integer} nodeIndex The index of the current node along the parse path.
   */
  this.parsePath = function(pathDicts, nodeIndex) {
    // If we've gone through all parts of the path, we have made it to the individual records level
    if (nodeIndex === _pathToRecordTokens.length) {
      var eventToListenTo = (_pathToRecordTokens[_pathToRecordTokens.length - 1] === "*") ? "child_added" : "value";

      pathDicts.forEach(function(pathDict) {
        _listenForNewRecords(pathDict, eventToListenTo);
        if (eventToListenTo === "child_added") {
          _listenForRemovedRecords(pathDict);
          _listenForChangedRecords(pathDict);
        }
      });
    }

    // Otherwise, parse the next part of the path
    else {
      // Get the name of the current node in the path
      var node = _pathToRecordTokens[nodeIndex];

      // Make sure the * is only used as the last part of the path
      if (node[0] === "*") {
        if (nodeIndex !== (_pathToRecordTokens.length - 1)) {
          throw new Error("You can only use * as the last character in your \"path\"");
        }

        // Parse the path one last time
        this.parsePath(pathDicts, nodeIndex + 1);
      }

      // For a wildcard node, add it to the params list and find every possible node name
      else if (node[0] === "$") {
        pathDicts.forEach(function(pathDict) {
          // Create a series for each child in the path
          _firebaseRef.child(pathDict.path).on("child_added", function(childSnapshot) {
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
          _firebaseRef.child(pathDict.path).on("child_removed", function(childSnapshot) {
            _removeSeries(childSnapshot.name());
          });
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
        });

        // Recursively parse the path at the next level
        this.parsePath(newPathDicts, nodeIndex + 1);
      }
    }
  };

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/
  if (firebaseRef instanceof Firebase === false) {
    throw new Error("firebaseRef must be an instance of Firebase");
    // TODO: can they pass in a limit query?
  }
  var _firebaseRef = firebaseRef;

  var _config = config;

  // Parse the path to an individual record
  var _pathToRecordTokens = _config.path.split("/");

  if (d3Grapher instanceof FireGrapherD3 === false) {
    throw new Error("d3Grapher must be an instance of FireGrapherD3");
  }
  var _d3Grapher = d3Grapher;
};