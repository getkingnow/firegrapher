/**
   * Creates a d3 graph of the data at firebaseRef according to the config options
   * and places it in the element specified by the inputted CSS selector.
   *
   * param {Firebase} firebaseRef A Firebase reference to the data that will be graphed.
   * param {string} cssSelector A unique CSS selector whose corresponding element will hold the graph.
   * param {object} config A collection of graph configuration options.
   */
var FireGrapher = function(firebaseRef, cssSelector, config) {
  /********************/
  /*  PRIVATE METHODS */
  /********************/
  /**
   * Validates the inputted Firebase reference.
   *
   * @param {Firebase} firebaseRef The Firebase reference to validate.
   */
  function _validateFirebaseRef(firebaseRef) {
    var error;
    if (typeof firebaseRef === "undefined") {
      error = "no \"firebaseRef\" specified";
    }
    else if (firebaseRef instanceof Firebase === false) {
      // TODO: can they pass in a limit query?
      error = "\"firebaseRef\" must be an instance of Firebase";
    }

    if (typeof error !== "undefined") {
      throw new Error("FireGrapher: " + error);
    }
  }

  /**
   * Validates the inputted CSS selector.
   *
   * @param {string} cssSelector The CSS selector to validate.
   */
  function _validateCssSelector(cssSelector) {
    var error;
    if (typeof cssSelector === "undefined") {
      error = "no \"cssSelector\" specified";
    }
    else if (typeof cssSelector !== "string") {
      error = "\"cssSelector\" must be a string";
    }
    else {
      var matchedElements = document.querySelectorAll(cssSelector);
      if (matchedElements.length === 0) {
        error = "no element matches the CSS selector '" + cssSelector + "'";
      }
      else if (matchedElements.length > 1) {
        error = "multiple elements (" + matchedElements.length + " total) match the CSS selector '" + cssSelector + "'";
      }
    }

    if (typeof error !== "undefined") {
      throw new Error("FireGrapher: " + error);
    }
  }

  /**
   *  Validates the inputted config object and makes sure no options have invalid values.
   *
   *  @param {object} config The graph configuration object to validate.
   */
  function _validateConfig(config) {
    // TODO: upgrade
    var error;

    if (typeof config === "undefined") {
      error = "no \"config\" specified";
    }

    // Every config needs to specify the graph type
    var validGraphTypes = ["table", "line", "scatter", "bar", "map"];
    if (typeof config.type === "undefined") {
      error = "no graph \"type\" specified. Must be \"table\", \"line\", or \"scatter\"";
    }
    if (validGraphTypes.indexOf(config.type) === -1) {
      error = "Invalid graph \"type\" specified. Must be \"table\", \"line\", or \"scatter\"";
    }

    // Every config needs to specify the path to an individual record
    if (typeof config.path === "undefined") {
      error = "no \"path\" to individual record specified";
    }
    // TODO: other validation for things like $, *, etc.

    switch (config.type) {
      case "map":
        if (typeof config.marker === "undefined" ||
            typeof config.marker.latitude === "undefined" ||
            typeof config.marker.longitude === "undefined" ||
            typeof config.marker.magnitude === "undefined") {
          error = "incomplete \"marker\" definition specified. \nExpected: " + JSON.stringify(_getDefaultConfig().marker) + "\nActual: " + JSON.stringify(config.marker);
        }
        break;
      case "table":
        // Every table config needs to specify its column labels and values
        if (typeof config.columns === "undefined") {
          error = "no table \"columns\" specified";
        }
        config.columns.forEach(function(column) {
          if (typeof column.label === "undefined") {
            error = "missing \"columns\" label";
          }
          if (typeof column.value === "undefined") {
            error = "missing \"columns\" value";
          }
        });
        break;
      case "line":
        if (typeof config.xCoord === "undefined") {
          error = "no \"xCoord\" specified";
        }
        if (typeof config.yCoord === "undefined") {
          error = "no \"yCoord\" specified.";
        }
        break;
      case "bar":
        if (typeof config.value === "undefined") {
          error = "no \"value\" specified.";
        }
        break;
      case "scatter":
        break;
    }

    if (typeof error !== "undefined") {
      throw new Error("FireGrapher: " + error);
    }
  }

  /**
   *  Adds default values to the graph config object
   */
  function _getDefaultConfig() {
    // Default colors (turquoise, alizaren (red), amethyst (purple), peter river (blue), sunflower, pumpkin, emerald, carrot, midnight blue, pomegranate)
    var defaultStrokeColors = ["#1ABC9C", "#E74C3C", "#9B59B6", "#3498DB", "#F1C40F", "#D35400", "#2ECC71", "#E67E22", "#2C3E50", "#C0392B"];
    var defaultFillColors = ["#28E1BC", "#ED7469", "#B07CC6", "#5FAEE3", "#F4D03F", "#FF6607", "#54D98B", "#EB9850", "#3E5771", "#D65448"];

    // Define a default config object
    return {
      "styles": {
        "fillColor": "#DDDDDD",
        "fillOpacity": 0.3,
        "outerStrokeColor": "#000000",
        "outerStrokeWidth": 2,
        "innerStrokeColor": "#000000",
        "innerStrokeWidth": 1,
        /*"size": {
          "width": 500,
          "height": 300
        },*/
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
          "strokeColors": defaultStrokeColors
        },
        "markers": {
          "size": 3.5,
          "strokeWidth": 2,
          "style": "default",
          "strokeColors": defaultStrokeColors,
          "fillColors": defaultFillColors // What about if style is set to "flat"?
        },
        "legend": {
          "fontSize": "16px",
          "stroke": "#000000",
          "strokeWidth": "2px",
          "fill": "#AAAAAA",
          "fillOpacity": 0.7
        }
      },
      "xCoord": {
        "label": ""
      },
      "yCoord": {
        "label": ""
      },
      "marker": {
        "label" : "label",
        "latitude" : "latitude",
        "longitude" : "longitude",
        "magnitude" : "radius"
      }
    };
  }

  /**
   *  Recursively loops through the inputted config object and sets any unspecified
   *  options to their default values
   */
  function _recursivelySetDefaults(outputConfig, defaultConfig) {
    for (var key in defaultConfig) {
      if (typeof defaultConfig[key] === "object") {
        outputConfig[key] = (outputConfig[key]) ? outputConfig[key] : {};
        _recursivelySetDefaults(outputConfig[key], defaultConfig[key]);
      }
      else {
        outputConfig[key] = (outputConfig[key]) ? outputConfig[key] : defaultConfig[key];
      }
      // TODO: change
      //outputConfig[key] = outputConfig[key] || defaultConfig[key];
    }
  }

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/
  // Validate the inputs
  _validateFirebaseRef(firebaseRef);
  _validateCssSelector(cssSelector);
  _validateConfig(config);

  // Recursively loop through the global config object and set any unspecified options
  // to their default values
  _recursivelySetDefaults(config, _getDefaultConfig());
  var el = document.querySelector(cssSelector);
  config.styles.size = {
    width: el.clientWidth,
    height: el.clientHeight
  };

  var d3Grapher;
  switch(config.type) {
    case "line":
    case "scatter":
    case "bar":
      d3Grapher = new D3Graph(config, cssSelector);
      break;
    case "map":
      d3Grapher = new D3Map(config, cssSelector);
      break;
    case "table":
      d3Grapher = new D3Table(config, cssSelector);
      break;
    default:
      throw new Error("Invalid config type: " + config.type);
  }

  // Initialize the graph
  d3Grapher.init();

  var parser = new FireGrapherParser(firebaseRef, config, d3Grapher);

  var initialPathsToRecords = [{
    "path": "/",
    "params": {}
  }];
  parser.parsePath(initialPathsToRecords, 0);

  //console.log(initialPathsToRecords);
  //_parsePath(pathDicts, 0);

};