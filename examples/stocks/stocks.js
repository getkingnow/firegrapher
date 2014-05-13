(function() {
  var firebaseRef = new Firebase("https://FireGrapherStocks.firebaseIO-demo.com/");
  firebaseRef.set({
    "stocks": {
      "MSFT": [
        { "time": 0, "price": 60 },
        { "time": 1, "price": 61.5 },
        { "time": 2, "price": 62.5 },
        { "time": 3, "price": 61 },
        { "time": 4, "price": 63.7 },
        { "time": 5, "price": 67 },
        { "time": 6, "price": 67 },
        { "time": 7, "price": 65.8 },
        { "time": 8, "price": 66 },
        { "time": 9, "price": 67 },
        { "time": 10, "price": 70 },
        { "time": 11, "price": 75 }
      ],
      "AAPL": [
        { "time": 0, "price": 68 },
        { "time": 1, "price": 60 },
        { "time": 2, "price": 56 },
        { "time": 3, "price": 55.9 },
        { "time": 4, "price": 53 },
        { "time": 5, "price": 50 },
        { "time": 6, "price": 55 },
        { "time": 7, "price": 56 },
        { "time": 8, "price": 58 },
        { "time": 9, "price": 61 },
        { "time": 10, "price": 67 },
        { "time": 11, "price": 68 },
        { "time": 12, "price": 60 },
        { "time": 13, "price": 56 },
        { "time": 14, "price": 55.9 },
        { "time": 15, "price": 53 },
        { "time": 16, "price": 50 },
        { "time": 17, "price": 55 },
        { "time": 18, "price": 56 },
        { "time": 19, "price": 58 },
        { "time": 20, "price": 61 },
        { "time": 21, "price": 60 },
        { "time": 22, "price": 56 },
        { "time": 23, "price": 55.9 },
        { "time": 24, "price": 53 },
        { "time": 25, "price": 50 },
        { "time": 26, "price": 55 },
        { "time": 27, "price": 56 },
        { "time": 28, "price": 58 },
        { "time": 29, "price": 61 },
        { "time": 30, "price": 67 }
      ],
      "GOOG": [
        { "time": 0, "price": 100 },
        { "time": 1, "price": 88.5 },
        { "time": 2, "price": 102 },
        { "time": 3, "price": 104 },
        { "time": 4, "price": 107 },
        { "time": 5, "price": 109 },
        { "time": 6, "price": 115 },
        { "time": 7, "price": 111 },
        { "time": 8, "price": 112 },
        { "time": 9, "price": 111 },
        { "time": 10, "price": 120 }
      ]
    }
  })

  var fireGrapher = new FireGrapher();
  fireGrapher.graph("stockChart1", firebaseRef.child("stocks"), {
    type : "line",
    path: "$symbol/*",
    xCoord: {
      "label" : "Time",
      "value" : "time"
    },
    yCoord: {
      "label" : "Price",
      "value" : "price"
    },
    line: "$symbol"
  });
})();