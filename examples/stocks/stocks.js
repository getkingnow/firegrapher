(function() {
  var firebaseRef = new Firebase("https://FireGrapherStocks.firebaseIO-demo.com/");

  function getRandomValue(min, max) {
    return Math.ceil(Math.random() * (max - min)) + min;
  };

  function addStockPrice(path, symbol, time, price, grouped) {
    if (grouped) {
      firebaseRef.child(path + "/" + symbol).push({
        "time": time,
        "price": price
      });
    }
    else {
      firebaseRef.child(path).push({
        "symbol": symbol,
        "time": time,
        "price": price
      });
    }
  };

  function addYahooStocks() {
    for (var i = 0; i < 30; ++i) {
      addStockPrice("stocks", "YHOO", i, getRandomValue(5, 40), true);
    }
  };

  document.getElementById("addYahooStocksButton").addEventListener("click", addYahooStocks);

  firebaseRef.remove(function() {
    // Populate /stocks/
    for (var i = 0; i < 30; ++i) {
      addStockPrice("stocks", "MSFT", i, getRandomValue(50, 55), true);
      addStockPrice("stocks", "AAPL", i, getRandomValue(40, 60), true);
      addStockPrice("stocks", "GOOG", i, getRandomValue(0, 100), true);
    }

    // Populate /stock2/
    for (var i = 0; i < 30; ++i) {
      addStockPrice("stocks2", "MSFT", i, getRandomValue(50, 55), false);
      addStockPrice("stocks2", "AAPL", i, getRandomValue(40, 60), false);
      addStockPrice("stocks2", "GOOG", i, getRandomValue(0, 100), false);
    }

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

    window.setInterval(function() {
      var price = getRandomValue(40, 70);
      firebaseRef.child("jacobcoin").set({
        "bid": price,
        "ask": price
      })
    }, 100);

    var fireGrapher4 = new FireGrapher();
    fireGrapher4.graph("#jacobcoinChart", firebaseRef, {
      type : "line",
      path: "jacobcoin",
      xCoord: {
        "label" : "Time",
        "stream" : true,
        "limit": 30
      },
      yCoord: {
        "label" : "Price (USD)",
        "value" : "ask",
        "min": 40,
        "max": 60
      },
      graph: {
        "width": 500,
        "height": 150
      },
      line: "$currency"
    });

    var currencyRef = new Firebase("https://publicdata-cryptocurrency.firebaseio.com/");
    var fireGrapher5 = new FireGrapher();
    fireGrapher5.graph("#digitalCurrencyChart", currencyRef, {
      type : "line",
      path: "bitcoin",
      xCoord: {
        "label" : "Time",
        "stream" : true,
        "limit": 30
      },
      yCoord: {
        "label" : "Price (USD)",
        "value" : "ask",
        "min": 446,
        "max": 448
      },
      graph: {
        "width": 500,
        "height": 300
      },
      line: "$currency"
    });
  });
})();