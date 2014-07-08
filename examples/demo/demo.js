$(function() {
  $("#mainMenuScreenshot").fadeIn(1000, function() {
    $(this).attr("style", "display: block");
  });

  /* Scroll animations */
  $(window).scroll(function(){
    var scrollBottom = $(window).scrollTop() + $(window).height();
    var windowWidth = $(window).width();

    var scrollButtonRotation;
    if ((scrollBottom - 50 - $("#scrollButton").height()) > $("#copyrightSection").offset().top) {
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

    var mainSectionTop = $("#mainSection").offset().top;
    var gameBoardSectionTop = $("#gameBoardSection").offset().top;
    var savedGamesSectionTop = $("#savedGamesSection").offset().top;
    var highScoresSectionTop = $("#highScoresSection").offset().top;
    var recapSectionTop = $("#recapSection").offset().top;
    var emailFormSectionTop = $("#emailFormSection").offset().top;
    var copyrightSectionTop = $("#copyrightSection").offset().top;

    if (scrollButtonBottom <= mainSectionTop + $("#mainSection").height()) {
      $("html, body").animate({
        scrollTop: gameBoardSectionTop
      }, 750);
    }
    else if (scrollButtonBottom < gameBoardSectionTop + $("#gameBoardSection").height()) {
      $("html, body").animate({
        scrollTop: gameBoardSectionTop
      }, 750);
    }
    else if (scrollButtonBottom < savedGamesSectionTop + $("#savedGamesSection").height()) {
      $("html, body").animate({
        scrollTop: savedGamesSectionTop
      }, 750);
    }
    else if (scrollButtonBottom < highScoresSectionTop + $("#highScoresSection").height()) {
      $("html, body").animate({
        scrollTop: highScoresSectionTop
      }, 750);
    }
    else if (scrollButtonBottom < recapSectionTop + $("#recapSection").height()) {
      $("html, body").animate({
        scrollTop: recapSectionTop
      }, 750);
    }
    else if (scrollButtonBottom < emailFormSectionTop + $("#emailFormSection").height()) {
      $("html, body").animate({
        scrollTop: emailFormSectionTop
      }, 750);
    }
    else if ($(this).hasClass("rotated")) {
      $("html, body").animate({
        scrollTop: mainSectionTop
      }, 750);
    }
    else {
      $("html, body").animate({
        scrollTop: copyrightSectionTop
      }, 750);
    }
  });

  /* Adds the email in the email form to the database */
  $("#emailFormSubmitButton").on("click", addEmailToDatabase);
  function addEmailToDatabase() {
    // If the email is valid, add the email to the database
    var email = $("#emailInput").val();

    // Remove the click event from the form's submit button so we don't accidentally add the same email twice
    $("#emailFormSubmitButton").off("click");

    // Add the email to the database
    $.ajax({
      type: "POST",
      url: "../php/addEmail.php",
      dataType: "text",
      data: {
        email: email
      },
      success: function (response) {
        // If we successfully inserted the email into the database, show the success message
        if (response == "success") {
          $("#emailForm").fadeOut(400, function() {
            $("#emailFormSuccessMessage").fadeIn(400);
          });
        }

        // Otherwise, show the invalid email warning and turn the click event listener back on for the form's submit button
        else {
          $("#invalidEmailWarning").fadeIn(400);
          $("#emailFormSubmitButton").on("click", addEmailToDatabase);
        }
      },
      error: function (xhr, ajaxOptions, thrownError){
      }
    });
  };
});