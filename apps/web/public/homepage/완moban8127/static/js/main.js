

function revealFunction() {
    //first we need to initialize our "sr" (scroll reveal)
    //do you know all the behaviors that will be the same for all animations? Just send it directly here, as in my case, the duration, the distance...

    window.sr = ScrollReveal({ duration: 1950, distance: '250px', easing: 'ease-out' });

    //here we can create infinite classes according to our needs
    //so first we declare the name of the class and pass the props to it
    //see the documentation and you are free to do anything you can think of about the scroll fade effect :)

    sr.reveal('.reveal-left', { origin: 'left', reset: false });
    sr.reveal('.reveal-top', { origin: 'top', reset: false });
    sr.reveal('.reveal-bottom', { origin: 'bottom', reset: false });
    sr.reveal('.reveal-right', { origin: 'right', reset: false });

    sr.reveal('.reveal-reset-true', { origin: 'bottom', reset: true });
    sr.reveal('.reveal-rotate', { origin: 'bottom', rotate: { x:1000, z:1000 }, reset: true });
    sr.reveal('.reveal-bottom-reset', { origin: 'bottom', reset: true });
}

//fist of all, on load we call our magic
window.addEventListener('load', function () {
    revealFunction();
});





(function($) {
    'use strict';

//Toggle Nav for mobile  menu
    $('.menu-toggle').click(function(){
        $('.menu-wrapper').toggleClass('active-nav');
    });


    //Toggle Nav for mobile menu
$('.open_bar').click(function(){
$('nav').addClass('active-nav');
$('.menu-toggle').addClass('closee');
});
$('.close_bar').click(function(){
$('nav').removeClass('active-nav');
$('.menu-toggle').removeClass('closee');
});

$(document).ready(function(){
    $('.venobox').venobox(); 
});

    
	 // Slider Active
$('.slider-list').owlCarousel({ 
        loop: true,
        autoplay: true,
        autoplayTimeout: 5000,
        smartSpeed: 1500,
        dots:false,
        animateIn:'fadeIn',
        animateOut:'fadeOut',
        nav: false,
        navText: ["<i class='fas fa-angle-left''></i>", "<i class='fas fa-angle-right''></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 1
            },
            992: {
                items: 1
            },
            1000: {
                items: 1
            },
            1920: {
                items: 1
            }
        }
    });	


    $('.testi-slider2').owlCarousel({
        loop:true,
        autoplay: true,
        autoplayTimeout: 5000,
        smartSpeed: 1500,
        nav:false,
        dots: false,
        navText: ["<i class='fas fa-angle-left''></i>", "<i class='fas fa-angle-right''></i>"],
        items:1,
    });


    $('.spa-slider').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 10000,
        smartSpeed: 1500,
        margin:10,
        dots:false,
        nav: true,
        navText: ["<i class='fas fa-angle-left''></i>", "<i class='fas fa-angle-right''></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 1
            },
            992: {
                items: 2
            },
            1000: {
                items: 2
            },
            1920: {
                items: 2
            }
        }
    }); 


    $('.bed-slider').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 5000,
        smartSpeed: 1500,
        dots:false,
        margin:30,
        nav: false,
        navText: ["<i class='fas fa-angle-left''></i>", "<i class='fas fa-angle-right''></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            },
            1000: {
                items: 3
            },
            1920: {
                items: 3
            }
        }
    }); 


    $('.brand-slider').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 5000,
        smartSpeed: 1500,
        dots:false,
        margin:30,
        nav: false,
        navText: ["<i class='fas fa-angle-left''></i>", "<i class='fas fa-angle-right''></i>"],
        responsive: {
            0: {
                items: 2
            },
            768: {
                items: 3
            },
            992: {
                items: 5
            },
            1000: {
                items: 6
            },
            1920: {
                items: 6
            }
        }
    });

// blog slider

      $('.blog-slider').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 10000,
        smartSpeed: 1500,
        margin: 30,
        dots:false,
        nav: false,
        navText: ["<i class='fas fa-angle-left''></i>", "<i class='fas fa-angle-right''></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 2
            },
            1000: {
                items: 3
            },
            1920: {
                items: 3
            }
        }
    });


// Mobile Menu

(function($) {
    'use strict';
    
   // Initialize meanMenu for mobile
        if ($(".mobile-menu").length) {
            var mobileMenuContent = $(".header-area .saymon_menu .nav_scroll").html();
            $(".mobile-menu .navigation").append(mobileMenuContent);

            // Initialize meanmenu for mobile menu toggle
            $('.mobile-menu nav').meanmenu({
                meanScreenWidth: "991",
                meanMenuContainer: ".mobile-menu",
                onePage: false
            });
        }



    // Dark Js
  
    // Light mode dark mode javascript code

const toggleButton = document.getElementById("toggleButton");
const body = document.body;
let isDarkMode = false;

// Check local storage for the mode
const storedMode = localStorage.getItem("darkMode");
if (storedMode === "true") {
  isDarkMode = true;
}

// Function to update the mode
function updateMode() {
  if (isDarkMode) {
    body.classList.add("dark");
  } else {
    body.classList.remove("dark");
  }
  localStorage.setItem("darkMode", isDarkMode);
}

// Initial mode setup
updateMode();

// Toggle mode when the button is clicked
toggleButton.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  updateMode();
});










})(jQuery);




//====== scrollcue js ======

(function($) {
    'use strict';

    $(function(){
          scrollCue.init({
          duration : 2500,
          interval : -0.7,
          percentage : 0.90,
          smartSpeed: 500 
          
        })
    });

})(jQuery);


 

 

  // Counter Up =========
jQuery(document).ready(function( $ ) {

    $('.counter').counterUp({
            time: 1500
    });

});


        /* Portfolio Isotope  */
    $('.image_load').imagesLoaded(function() {

        if ($.fn.isotope) {

            var $portfolio = $('.image_load');

            $portfolio.isotope({

                itemSelector: '.grid-item',

                filter: '*',

                resizesContainer: true,

                layoutMode: 'masonry',

                transitionDuration: '0.8s'

            });
            $('.menu-filtering li').on('click', function() {

                $('.menu-filtering li').removeClass('current_menu_item');

                $(this).addClass('current_menu_item');

                var selector = $(this).attr('data-filter');

                $portfolio.isotope({

                    filter: selector,

                });

            });

        };

    });

    


  

         
    
         //Header Search
    if($('.search-box-outer').length) {
        $('.search-box-outer').on('click', function() {
            $('body').addClass('search-active');
        });
        $('.close-search').on('click', function() {
            $('body').removeClass('search-active');
        });
    }


// sticky
    var wind = $(window);
    var sticky = $('#sticky-header');
    wind.on('scroll', function () {
        var scroll = wind.scrollTop();
        if (scroll < 100) {
            sticky.removeClass('sticky-nav');
        } else {
            sticky.addClass('sticky-nav');
        }
    });

// scroll strat============================

		 $(window).on('scroll', function () {
        var scrolled = $(window).scrollTop();
        if (scrolled > 300) $('.go-top').addClass('active');
        if (scrolled < 300) $('.go-top').removeClass('active');
    });

    $('.go-top').on('click', function () {
        $("html, body").animate({
            scrollTop: "0"
        }, 1200);
    });






// to wow Jquery
new WOW().init();
    

	

   


})(jQuery);






    jQuery(document).ready(function ($) {
        "use strict";

        // =======< accordion js >========
        $(".accordion > li:eq(0) a").addClass("active").next().slideDown();
        $('.accordion a').on('click', function (j) {
            var dropDown = $(this).closest("li").find("p");

            $(this).closest(".accordion").find("p").not(dropDown).slideUp();

            if ($(this).hasClass("active")) {
                $(this).removeClass("active");
            } else {
                $(this).closest(".accordion").find("a.active").removeClass("active");
                $(this).addClass("active");
            }

            dropDown.stop(false, true).slideToggle();

            j.preventDefault();
        });


       


        //======< Custom Tab >======
        $('.tab ul.tabs').addClass('active').find('> li:eq(0)').addClass('current');

        $(".tab ul.tabs li a").on("click", function (g) {
            var tab = $(this).closest('.tab'),
                index = $(this).closest('li').index();

            tab.find('ul.tabs > li').removeClass('current');
            $(this).closest('li').addClass('current');

            tab.find('.tab_content').find('div.tabs_item').not('div.tabs_item:eq(' + index + ')').slideUp();
            tab.find('.tab_content').find('div.tabs_item:eq(' + index + ')').slideDown();

            g.preventDefault();
        });





    });


  /*------------- preloader js --------------*/
    var percentage = 0;
    var LoadingCounter = setInterval(function() {
        if (percentage <= 100) {
            // $('#loading-screen ').css('opacity', (100 - percentage));
            $("#loading-screen .loading-counter").text(percentage + "%");
            $("#loading-screen .bar").css("width", (100 - percentage) / 2 + "%");
            $("#loading-screen .progress-line").css(
                "transform",
                "scale(" + percentage / 100 + ")"
            );
            percentage++;
        } else {
            $("#loading-screen").fadeOut(500);
            setTimeout(() => {
                $("#loading-screen").remove();
            }, 500);
            clearInterval(LoadingCounter);
        }
    }, 10);
    










