# FireGrapher

TODO
-----
Remaining FireGrapher work
* [Done] legends [Tony]
** CSS works remains
* additional configurations [Jacob]
* documentation [Jacob]
* clean up in general [both]
* [Done] graph titles [Tony]
* clean up CSS class names [Jacob]

FireGrapher is a graphing/charting library for your Firebase data. It's goal is to provide an expressive, easily-customizable, and realtime graphing tool which requires no knowledge of existing graphing tools and only take a few lines of JavaScript to produce. FireGrapher is designed to work with Firebase and works no matter how you organize your data. Because FireGrapher is backed by Firebase, your graphs update in realtime with no extra work.

## Downloading

FireGrapher is built on top of both Firebase and d3.js. d3.js is a powerful graphing library ....

In order to use FireGrapher in your project, you need to include the following files in your HTML file:

```html
<!-- d3.js -->
<script src="d3.min.js"></script>

<!-- Firebase -->
<script src="firebase.min.js"></script>

<!-- FireGrapher -->
<script src="FireGrapher.min.js"></script>
```

You can find each of these files in the `/dest/` directory of this GitHub repository. For debugging purposes, there is also non-minified `FireGrapher.js` file in the `/dest/` directory.

You can also download all of these files via Bower [__Note__: FireGrapher is currently not available via bower]:

```bash
$ bower install d3?? firebase [geofire]
```

## API Reference

### FireGrapher

#### new FireGrapher()

Returns a new `FireGrapher` instance. Every `FireGrapher` instace can generate a single graph.

#### FireGrapher.graph(cssSelector, firebaseRef, config)

Creates a graph of the data stored at `firebaseRef` and places it in the element specified by `cssSelector`.

`cssSelector` is a CSS selector which uniquely identifies a single HTML element on your page.

`firebaseRef` is a reference to a Firebase location.

`config` is a configuration dictionary which explains what your data looks like and what type of graph you want to generate.

## Graph Types

### Line Graph

  {
    *type: "line",
    *path: "/path/to/records/*",
    *series: "nameOfSeries",
    *axes: {
      *x: {
        label: "",
        *value: "string",
        numTicks: #,
        stream: # [default is 0]
      },
      *y: {
        label: "",
        *value: [required],
        numTicks: #
      }
    },
    legend: boolean [default is true],
    size: {
      width: 500,
      heigh 300
    }
  }

### Scatter Plot

  {
    *type: "line",
    *path: "/path/to/records/*",
    *series: "nameOfSeries",
    *axes: {
      *x: {
        label: "",
        *value: "string",
        numTicks: #,
        stream: # [default is 0]
      },
      *y: {
        label: "",
        *value: [required],
        numTicks: #
      }
    },
    legend: boolean [default is true],
    size: {
      width: 500,
      heigh 300
    }
  }

### Bar Graph

  {
    *type: "bar",
    *path: "/path/to/records/*",
    *axes: {
      *x: {
        label: "",
        *value: "nameOfSeries"
      },
      *y: {
        label: "",
        *value: [required],
        aggregation: [*sum, mean, median, min, max],
        numTicks: #
      }
    },
    size: {
      width: 500,
      heigh 300
    }
  }

### Table

  {
    *type: "table",
    *path: "/path/to/records/*",
    *columns: [
      *{
        *label: ,
        *value: ,
        sortable: boolean [default is true]
      },
      ...
    ],
    sortedBy: "columnValue" [default is first column]
  }

### Map

  {
    *type: "map",
    *path: "/path/to/records/*",
    *markers: {
      *label: "key",
      *latitude: "latitude",
      *longitude: "longitude",
      *radius: "radius"
    }
  }

## Styling Graphs

Since d3.js generates graph using SVG, you can style your graphs the same as you would style any SVG: using CSS. FireGrapher assigns class to every piece of your graphs so that they are highly customizable. Here is a full class list for each graph type and the associated styles for them:

By default, FireGrapher assigns styles to your graphs, giving them all a consistent look at feel. However, you can customize as much or as little of those styles as you would like.

View the `TODO` directory for some sample CSS and SCSS files with custom styles. If you come up with a style set you would like to share, submit a PR and we can add it for others to use!

"styles": {
      graph: {
        "fillColor": "#DDDDDD",
        "fillOpacity": 0.3,
        "outerStrokeColor": "#000000",
        "outerStrokeWidth": 2,
        "innerStrokeColor": "#000000",
        "innerStrokeWidth": 1
      },
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









