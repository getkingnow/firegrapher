/**
 * Creates a FireGrapher instance.
 *
 * @constructor
 * @this {FireGrapher}
 */
var FireGrapher = function() {
  /********************/
  /*  PRIVATE METHODS */
  /********************/
  /**
   *  Validates the inputted config object and makes sure no options have invalid values.
   *
   *  param {config} A list of options and styles which explain what the graph and how to style the graph.
   */
  function _validateConfig(config) {
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
          throw new Error("Incomplete \"marker\" definition specified. \nExpected: " + JSON.stringify(_getDefaultConfig().marker) + "\nActual: " + JSON.stringify(config.marker));
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
  }

  /**
   *  Adds default values to the graph config object
   */
  function _getDefaultConfig() {
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

    return configDefaults;
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

  /********************/
  /*  PUBLIC METHODS  */
  /********************/
  /**
   * Creates a d3 graph of the data at firebaseRef according to the config options.
   *
   * param {string} cssSelector A unique CSS selector which will own the graph.
   * param {object} firebaseRef A Firebase reference to the data that will be graphed.
   * param {object} config A list of options and styles which explain what the graph and how to style the graph.
   */
  this.graph = function (cssSelector, firebaseRef, config) {
    // TODO: Validate inputs

    // Validate the passed config and set appropriate defaults
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

    var initialPathsToRecods = [{
      "path": "/",
      "params": {}
    }];
    parser.parsePath(initialPathsToRecods, 0);
    //_parsePath(pathDicts, 0);
  };

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/
};