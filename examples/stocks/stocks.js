(function() {
  var firebaseRef = new Firebase("https://FireGrapherStocks.firebaseIO-demo.com/");
  firebaseRef.update({
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
        { "time": 29, "price": 61 }
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
  });

  var fireGrapher1 = new FireGrapher();
  fireGrapher1.graph("#stockChart1", firebaseRef.child("stocks"), {
    type : "line",
    path: "$symbol/*",
    xCoord: {
      "label" : "Time",
      "value" : "time",
      "min": 0,
      "max": 30
    },
    yCoord: {
      "label" : "Price",
      "value" : "price",
      "min": 40,
      "max": 150
    },
    graph: {
      "width": 500,
      "height": 150
    },
    line: "$symbol"
  });

  firebaseRef.update({
    "stocks2": [
      { "symbol": "MSFT", "time": 0, "price": 60 },
      { "symbol": "MSFT", "time": 1, "price": 61.5 },
      { "symbol": "MSFT", "time": 2, "price": 62.5 },
      { "symbol": "MSFT", "time": 3, "price": 61 },
      { "symbol": "MSFT", "time": 4, "price": 63.7 },
      { "symbol": "MSFT", "time": 5, "price": 67 },
      { "symbol": "MSFT", "time": 6, "price": 67 },
      { "symbol": "MSFT", "time": 7, "price": 65.8 },
      { "symbol": "MSFT", "time": 8, "price": 66 },
      { "symbol": "MSFT", "time": 9, "price": 67 },
      { "symbol": "MSFT", "time": 10, "price": 70 },
      { "symbol": "MSFT", "time": 11, "price": 75 },
      { "symbol": "AAPL", "time": 0, "price": 68 },
      { "symbol": "AAPL", "time": 1, "price": 60 },
      { "symbol": "AAPL", "time": 2, "price": 56 },
      { "symbol": "AAPL", "time": 3, "price": 55.9 },
      { "symbol": "AAPL", "time": 4, "price": 53 },
      { "symbol": "AAPL", "time": 5, "price": 50 },
      { "symbol": "AAPL", "time": 6, "price": 55 },
      { "symbol": "AAPL", "time": 7, "price": 56 },
      { "symbol": "AAPL", "time": 8, "price": 58 },
      { "symbol": "AAPL", "time": 9, "price": 61 },
      { "symbol": "AAPL", "time": 10, "price": 67 },
      { "symbol": "AAPL", "time": 11, "price": 68 },
      { "symbol": "AAPL", "time": 12, "price": 60 },
      { "symbol": "AAPL", "time": 13, "price": 56 },
      { "symbol": "AAPL", "time": 14, "price": 55.9 },
      { "symbol": "AAPL", "time": 15, "price": 53 },
      { "symbol": "AAPL", "time": 16, "price": 50 },
      { "symbol": "AAPL", "time": 17, "price": 55 },
      { "symbol": "AAPL", "time": 18, "price": 56 },
      { "symbol": "AAPL", "time": 19, "price": 58 },
      { "symbol": "AAPL", "time": 20, "price": 61 },
      { "symbol": "AAPL", "time": 21, "price": 60 },
      { "symbol": "AAPL", "time": 22, "price": 56 },
      { "symbol": "AAPL", "time": 23, "price": 55.9 },
      { "symbol": "AAPL", "time": 24, "price": 53 },
      { "symbol": "AAPL", "time": 25, "price": 50 },
      { "symbol": "AAPL", "time": 26, "price": 55 },
      { "symbol": "AAPL", "time": 27, "price": 56 },
      { "symbol": "AAPL", "time": 28, "price": 58 },
      { "symbol": "AAPL", "time": 29, "price": 61 },
      { "symbol": "GOOG", "time": 0, "price": 100 },
      { "symbol": "GOOG", "time": 1, "price": 88.5 },
      { "symbol": "GOOG", "time": 2, "price": 102 },
      { "symbol": "GOOG", "time": 3, "price": 104 },
      { "symbol": "GOOG", "time": 4, "price": 107 },
      { "symbol": "GOOG", "time": 5, "price": 109 },
      { "symbol": "GOOG", "time": 6, "price": 115 },
      { "symbol": "GOOG", "time": 7, "price": 111 },
      { "symbol": "GOOG", "time": 8, "price": 112 },
      { "symbol": "GOOG", "time": 9, "price": 111 },
      { "symbol": "GOOG", "time": 10, "price": 120 }
    ]
  });

  var fireGrapher2 = new FireGrapher();
  fireGrapher2.graph("#stockChart2", firebaseRef.child("stocks2"), {
    type : "line",
    path: "*",
    xCoord: {
      "label" : "Time",
      "value" : "time"
    },
    yCoord: {
      "label" : "Price",
      "value" : "price"
    },
    line: "symbol"
  });

  firebaseRef.update({
    "users": {
      "0" : {
        "firstName": "Jacob",
        "lastName": "Wenger",
        "email": "jacob@firebase.com",
        "gender": "Male",
        "isPaid": false
      },
      "1" : {
        "firstName": "Tony",
        "lastName": "Meng",
        "email": "tony@firebase.com",
        "gender": "Male",
        "isPaid": true
      },
      "2" : {
        "firstName": "Al",
        "lastName": "Coholic",
        "email": "al@firebase.com",
        "gender": "Male",
        "isPaid": true
      },
      "3" : {
        "firstName": "Anne",
        "lastName": "Teak",
        "email": "anne@firebase.com",
        "gender": "Female",
        "isPaid": false
      },
      "4" : {
        "firstName": "Portia",
        "lastName": "Johns",
        "email": "portia@firebase.com",
        "gender": "Female",
        "isPaid": false
      },
      "5" : {
        "firstName": "Stan",
        "lastName": "Francisco",
        "email": "stan@firebase.com",
        "gender": "Male",
        "isPaid": true
      },
      "6" : {
        "firstName": "Paulie",
        "lastName": "Exclusion",
        "email": "paulie@firebase.com",
        "gender": "Male",
        "isPaid": false
      },
      "7" : {
        "firstName": "Jeff",
        "lastName": "Jefferson",
        "email": "jeff@firebase.com",
        "gender": "Male",
        "isPaid": true
      },
      "8" : {
        "firstName": "Mary",
        "lastName": "Annette",
        "email": "mary@firebase.com",
        "gender": "Female",
        "isPaid": true
      },
      "9" : {
        "firstName": "Firebase",
        "lastName": "Williams",
        "email": "firebase@firebase.com",
        "gender": "Male",
        "isPaid": false
      }
    }
  });

  var fireGrapher3 = new FireGrapher();
  fireGrapher3.graph("#userTable", firebaseRef.child("users"), {
    type : "table",
    path: "$userId6",
    columns: [
      { "label": "First Name", "value": "firstName" },
      { "label": "Last Name", "value": "lastName" },
      { "label": "Email", "value": "email" },
      { "label": "Gender", "value": "gender" },
      { "label": "Is Paid?", "value": "isPaid" }
    ]
  });

  var digitalCurrencyFirebaseRef = new Firebase("https://publicdata-cryptocurrency.firebaseio.com/");
  var fireGrapher4 = new FireGrapher();
  fireGrapher4.graph("#digitalCurrencyChart", digitalCurrencyFirebaseRef, {
    type : "line",
    path: "bitcoin",
    xCoord: {
      "label" : "Time",
      "stream" : true,
      "min": 0,
      "max": 30
    },
    yCoord: {
      "label" : "Price (USD)",
      "value" : "ask",
      "min": 415,
      "max": 470
    },
    graph: {
      "width": 500,
      "height": 150
    },
    line: "$currency"
  });
})();