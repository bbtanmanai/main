document.addEventListener("DOMContentLoaded", function(){
  window.addEventListener('scroll', function() {
      if (window.scrollY > 100) {
        document.getElementById('navbar_top').classList.add('fixed-top');
        // add padding top to show content behind navbar
        navbar_height = document.querySelector('.navbar').offsetHeight;
      } else {
        document.getElementById('navbar_top').classList.remove('fixed-top');
         // remove padding top from body
        document.body.style.paddingTop = '0';
      } 
  });
}); 
// DOMContentLoaded  end

$(document).ready(function() {
    $( '.carosel.testimonial' ).each( function() {
        $( this ).slick( {
        infinite: true,
        autoplay: true,
        autoplaySpeed: 3000,
        slidesToShow: 1,
        slidesToScroll: 1,
        speed: 2000,
        dots: true,
        arrows: false,
  
        responsive: [
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
              }
            },
            {
              breakpoint: 600,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
              }
            },
            {
              breakpoint: 480,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
              }
            }
          ]
    } );
  } );
} );

// page loader
$(window).on('load', function () {
  $('#loading').hide();
}) 

// contact form
function ValidateEmail(email) {
  var expr = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
  return expr.test(email);
};

$("#demoContact").click(function() {
  if(!ValidateEmail($("#txtcontact").val())) {
    $("#error").addClass("error-msg-contact-display");
  } else {
    $("#error").removeClass("error-msg-contact-display");
    $("#success").addClass("success-msg-contact-display").delay(3000).queue(function() {
      $(this).removeClass("success-msg-contact-display").dequeue();
    });
  }

});

// contact form 1
function ValidateEmail1(email) {
  var expr = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
  return expr.test(email);
};

$("#demoContact1").click(function() {
  if(!ValidateEmail1($("#txtcontact1").val())) {
    $("#error1").addClass("error-msg-contact-display");
  } else {
    $("#error1").removeClass("error-msg-contact-display");
    $("#success1").addClass("success-msg-contact-display").delay(3000).queue(function() {
      $(this).removeClass("success-msg-contact-display").dequeue();
    });
  }

});

AOS.init();

$(".navclick").click(function() {
  $("#main_nav").removeClass("show");
});