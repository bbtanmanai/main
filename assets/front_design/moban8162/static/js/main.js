/*------------------------------------------------------------------
* Project:        Jobee - Job Portal HTML Template
* Author:         Cyclone_themes
* URL:            https://account.templatemonster.com/profile
* Created:        05/20/2023
-------------------------------------------------------------------
*/

(function ($) {
    "use strict";


    /*======== Doucument Ready Function =========*/
    jQuery(document).ready(function () {
        //CACHE JQUERY OBJECTS
        $("#status").fadeOut();
        $("#preloader").delay(200).fadeOut("slow");
        $("body").delay(200).css({
            "overflow": "visible"
        });


        /* Init Wow Js */
        new WOW().init();

    });

    //search categories
    $('a[href="#search1"]').on('click', function (event) {
        event.preventDefault();
        $('#search1').addClass('open');
        $('#search1 > form > input[type="search"]').focus();
    });
    $('#search1, #search1 button.close').on('click keyup', function (event) {
        if (event.target == this || event.target.className == 'close' || event.keyCode == 27) {
            $(this).removeClass('open');
        }
    });

    jQuery(document).ready(() => {
        jQuery('.js-video-button').modalVideo({
            channel: 'vimeo'
        });
    });

    // Range sliders activation
    $(".range-slider-ui").each(function () {
        var minRangeValue = $(this).attr('data-min');
        var maxRangeValue = $(this).attr('data-max');
        var minName = $(this).attr('data-min-name');
        var maxName = $(this).attr('data-max-name');
        var unit = $(this).attr('data-unit');
        $(this).slider({
            range: true,
            min: minRangeValue,
            max: maxRangeValue,
            values: [minRangeValue, maxRangeValue],
            slide: function (event, ui) {
                event = event;
                var currentMin = parseInt(ui.values[0]);
                var currentMax = parseInt(ui.values[1]);
                $(this).children(".min-value").text(currentMin + " " + unit);
                $(this).children(".max-value").text(currentMax + " " + unit);
                $(this).children(".current-min").val(currentMin);
                $(this).children(".current-max").val(currentMax);
            }
        });
    });


    /* ------------------------------------------------------------------------ */
    /* BACK TO TOP
    /* ------------------------------------------------------------------------ */
    $(document).on('click', '#back-to-top, .back-to-top', () => {
        $('html, body').animate({
            scrollTop: 0
        }, '500');
        return false;
    });
    $(window).on('scroll', () => {
        if ($(window).scrollTop() > 500) {
            $('#back-to-top').fadeIn(200);
        } else {
            $('#back-to-top').fadeOut(200);
        }
    });

    // Slick SLider

    $('.banner-slider').slick({
        infinite: true,
        slidesToShow: 4,
        slidesToScroll: 1,
        arrows: true,
        dots: false,
        autoplay: true,
        speed: 2000,
        rows: 0,
        cursor: false,
        loop: true,
        responsive: [{
            breakpoint: 1000,
            settings: {
                slidesToShow: 2
            }
        }, {
            breakpoint: 800,
            settings: {
                slidesToShow: 1
            }
        }]
    });


    //  Owl Carousel 
    $('.dish-slider').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 10000,
        smartSpeed: 1500,
        dots: true,
        margin: 50,
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
                items: 2
            },
            1000: {
                items: 2
            },
            1920: {
                items: 3
            }
        }
    });

    $('.testi-slider2').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 10000,
        smartSpeed: 1500,
        dots: true,
        margin: 50,
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

    $('.brand-slider').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 10000,
        smartSpeed: 1500,
        dots: true,
        margin: 50,
        nav: false,
        navText: ["<i class='fas fa-angle-left''></i>", "<i class='fas fa-angle-right''></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 3
            },
            992: {
                items: 4
            },
            1000: {
                items: 5
            },
            1920: {
                items: 6
            }
        }
    });


    // Portfolio Isotope
    $('.image_load').imagesLoaded(function () {

        if ($.fn.isotope) {

            var $portfolio = $('.image_load');

            $portfolio.isotope({

                itemSelector: '.grid-item',

                filter: '*',

                resizesContainer: true,

                layoutMode: 'masonry',

                transitionDuration: '0.8s'

            });
            $('.menu-filtering li').on('click', function () {

                $('.menu-filtering li').removeClass('current_menu_item');

                $(this).addClass('current_menu_item');

                var selector = $(this).attr('data-filter');

                $portfolio.isotope({

                    filter: selector,

                });

            });

        };

    });




    /*-----------------------------------------------------------------------------------*/
    /*  COUNTDOWN
    /*-----------------------------------------------------------------------------------*/

    $(document).ready(() => {
        loopcounter('coming-counter');
    });

    /*-----------------------------------------------------------------------------------*/
    /*  COUNTER UP
    /*-----------------------------------------------------------------------------------*/
    $('.value').counterUp({
        delay: 50,
        time: 1000
    });
    /*-----------------------------------------------------------------------------------*/
    /*  MASONRY
    /*-----------------------------------------------------------------------------------*/

    $('.blog-main').masonry({
        // options
        itemSelector: '.mansonry-item',
    });

    $('.trend-box1').masonry({
        // options
        itemSelector: '.mansonry-item1',
    });

    // Nice Select JS
    $('.niceSelect').niceSelect();

    $('a[href="#search1"]').on('click', function (event) {
        event.preventDefault();
        $('#search1').addClass('open');
        $('#search1 > form > input[type="search"]').focus();
    });
    $('#search1, #search1 button.close').on('click keyup', function (event) {
        if (event.target == this || event.target.className == 'close' || event.keyCode == 27) {
            $(this).removeClass('open');
        }
    });
    //Do not include! This prevents the form from submitting for DEMO purposes only!
    $('form').submit(function (event) {
        event.preventDefault();
        return false;
    });

})(jQuery);

//====== scrollcue js ======

(function ($) {
    'use strict';

    $(function () {
        scrollCue.init({
            duration: 2500,
            interval: -0.7,
            percentage: 0.90,
            smartSpeed: 500

        })
    });


    jQuery(window).on('resize load', () => {
        resize_eb_slider();
    }).resize();
    /**
     * Resize slider
     */
    function resize_eb_slider() {
        let bodyheight = jQuery(this).height();
        if (jQuery(window).width() > 1400) {
            bodyheight *= 0.90;
            jQuery('.slider').css('height', `${bodyheight}px`);
        }
    }



    /*--
            Ajax Contact Form
        -----------------------------------*/
        document.addEventListener("DOMContentLoaded", function () {
            function handleFormSubmission(form, statusElement, formIndex) {
                form.addEventListener("submit", function (ev) {
                    ev.preventDefault();
                    var data = new FormData(form);
                    sendAjaxRequest("POST", form.action, data, function (response) {
                        handleSuccess(response, statusElement, formIndex);
                    }, function (statusCode, responseText) {
                        handleError(statusCode, responseText, statusElement, formIndex);
                    });
                });
            }
        
            function handleSuccess(response, statusElement, formIndex) {
                forms[formIndex].reset();
                statusElement.classList.remove("error");
                statusElement.classList.add("success", "show");
                statusElement.innerHTML = '<i class="far fa-check-circle"></i> Successfully Done!';
                // You can do something with the response from the server if needed.
                setTimeout(function () {
                    statusElement.classList.remove("show");
                }, 3000); // Hide after 3 seconds
            }
        
            function handleError(statusCode, responseText, statusElement, formIndex) {
                statusElement.classList.remove("success");
                statusElement.classList.add("error", "show");
                statusElement.innerHTML = '<i class="far fa-times-circle"></i> Oops! There was a problem.';
                // You can display more specific error information if needed.
                setTimeout(function () {
                    statusElement.classList.remove("show");
                }, 3000); // Hide after 3 seconds
            }
        
            function sendAjaxRequest(method, url, data, successCallback, errorCallback) {
                var xhr = new XMLHttpRequest();
                xhr.open(method, url);
                xhr.setRequestHeader("Accept", "application/json");
                xhr.onreadystatechange = function () {
                    if (xhr.readyState !== XMLHttpRequest.DONE) return;
                    if (xhr.status === 200) {
                        successCallback(xhr.response);
                    } else {
                        errorCallback(xhr.status, xhr.responseText);
                    }
                };
                xhr.send(data);
            }
        
            var forms = document.querySelectorAll(".contact-form, .subscribe-form");
            var statuses = document.querySelectorAll(".status, .subscribe-status");
        
            forms.forEach(function (form, index) {
                handleFormSubmission(form, statuses[index], index);
            });
        });
        



    // to wow Jquery
    new WOW().init();



})(jQuery);