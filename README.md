FireGrapher
===========

Graphing/charting library for Firebase

TODO
-----
Remaining FireGrapher work
* legends [Tony]
* additional configurations [Jacob]
* documentation [Jacob]
* clean up in general [both]
* graph titles [Tony]
* clean up CSS class names [Jacob]



# Config options

## Line graph

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

## Scatter graph

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

## Bar graph

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

## Table

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

## Map

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
