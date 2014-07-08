$(function() {
  /************/
  /*  GRAPHS  */
  /************/
    var firebaseRef = new Firebase("https://FireGrapherStocks.firebaseIO-demo.com/");
  var fireGrapher1 = new FireGrapher(firebaseRef.child("stocks"), "#graph1", {
    type : "line",
    path: "$symbol/*",
    title: "Price over Time (Stocks in USD)",
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
    series: "$symbol"
  });




  $("#graph1").fadeIn(1000, function() {
    $(this).attr("style", "display: block");
  });

  /* Scroll animations */
  $(window).scroll(function(){
    var scrollBottom = $(window).scrollTop() + $(window).height();
    var windowWidth = $(window).width();

    var scrollButtonRotation;
    if ((scrollBottom  - 500- $("#scrollButton").height()) > $("#section4").offset().top) {
      scrollButtonRotation = "rotate(180deg)";
      $("#scrollButton").addClass("rotated");
    }
    else {
      scrollButtonRotation = "rotate(0deg)";
      $("#scrollButton").removeClass("rotated");
    }
    $("#scrollButton").css({
      "transition": "0.5s",
      "-webkit-transform": scrollButtonRotation,
      "-moz-transform": scrollButtonRotation,
      "-ms-transform": scrollButtonRotation,
      "-o-transform": scrollButtonRotation,
      "transform": scrollButtonRotation
    });

    $(".fadeInSection").each(function(index) {
      if (!$(this).hasClass("fadedIn")) {
        var sectionImage = $(this).find("img");
        var sectionText = $(this).find("p");

        var imageOffset = sectionImage.offset();
        var textOffset = sectionText.offset();

        if (scrollBottom > (imageOffset.top + (sectionImage.height() / 2))) {
          // Ensure the animation only runs once
          $(this).addClass("fadedIn");

          // At small widths, the sliding animation messes things up, so just fade in the elements
          if (windowWidth < 1000) {
            $(this).find("*").animate({
              opacity: 1
            }, 1000, function() {
              $(this).attr("style", "opacity: 1");
            });
          }

          // Otherwise, slide them in
          else {
            // Move the elements left and right while still hidden
            var leftElement, rightElement;
            if (index % 2 == 0) {
              leftElement = sectionImage;
              rightElement = sectionText;

              sectionImage.offset({
                left: imageOffset.left - 50
              });

              sectionText.offset({
                left: textOffset.left + 50
              });
            }
            else {
              leftElement = sectionText;
              rightElement = sectionImage;

              sectionImage.offset({
                left: imageOffset.left + 50
              });

              sectionText.offset({
                left: textOffset.left - 50
              });
            }

            // Fade and slide in the elements
            leftElement.animate({
              opacity: 1,
              left: "+=50"
            }, 1000, function() {
              $(this).attr("style", "opacity: 1");
            });

            rightElement.animate({
              opacity: 1,
              left: "-=50"
            }, 1000, function() {
              $(this).attr("style", "opacity: 1");
            });
          }
        }
      }
    });
  });

  /* Scroll button */
  $("#scrollButton").on("click", function() {
    // Get the scroll bar's bottom position (top + height + padding)
    var scrollButtonBottom = $(this).offset().top + $(this).height() + 50 + 300;

    var section1Top = $("#section1").offset().top;
    var section2Top = $("#section2").offset().top;
    var section3Top = $("#section3").offset().top;
    var section4Top = $("#section4").offset().top;

    if (scrollButtonBottom <= section1Top + $("#section1").height()) {
      $("html, body").animate({
        scrollTop: section2Top
      }, 750);
    }
    else if (scrollButtonBottom < section2Top + $("#section2").height()) {
      $("html, body").animate({
        scrollTop: section2Top
      }, 750);
    }
    else if (scrollButtonBottom < section3Top + $("#section3").height()) {
      $("html, body").animate({
        scrollTop: section3Top
      }, 750);
    }
    else if (scrollButtonBottom < section4Top + $("#section4").height()) {
      $("html, body").animate({
        scrollTop: section4Top
      }, 750);
    }
    else if ($(this).hasClass("rotated")) {
      $("html, body").animate({
        scrollTop: section1Top
      }, 750);
    }
    else {
      $("html, body").animate({
        scrollTop: copyrightSectionTop
      }, 750);
    }
  });
});