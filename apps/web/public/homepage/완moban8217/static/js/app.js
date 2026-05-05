/*---------------------------------------------"
// Template Name: Audify
// Description:  Audify Html Template
// Version: 1.0.0

--------------------------------------------*/
(function (window, document, $, undefined) {
  "use strict";

  var MyScroll = "";
  var Init = {
    i: function (e) {
      Init.s();
      Init.methods();
    },
    s: function (e) {
      (this._window = $(window)),
        (this._document = $(document)),
        (this._body = $("body")),
        (this._html = $("html"));
    },
    methods: function (e) {
      Init.w();
      Init.preloader();
      Init.BackToTop();
      Init.uiHeader();
      Init.passwordIcon();
      Init.slick();
      Init.countdownInit(".countdown", "2025/12/01");
    },

    w: function (e) {
      this._window.on("load", Init.l).on("scroll", Init.res);
    },

    // =================
    // Preloader
    // =================
    preloader: function () {
      setTimeout(function () {
        $("#preloader").hide("slow");
      }, 3000);
    },

    // =================
    // Bak to top
    // =================
    BackToTop: function () {
      let scrollTop = $(".scroll-top path");
      if (scrollTop.length) {
        var e = document.querySelector(".scroll-top path"),
          t = e.getTotalLength();
        (e.style.transition = e.style.WebkitTransition = "none"),
          (e.style.strokeDasharray = t + " " + t),
          (e.style.strokeDashoffset = t),
          e.getBoundingClientRect(),
          (e.style.transition = e.style.WebkitTransition =
            "stroke-dashoffset 10ms linear");
        var o = function () {
          var o = $(window).scrollTop(),
            r = $(document).height() - $(window).height(),
            i = t - (o * t) / r;
          e.style.strokeDashoffset = i;
        };
        o(), $(window).scroll(o);
        var back = $(".scroll-top"),
          body = $("body, html");
        $(window).on("scroll", function () {
          if ($(window).scrollTop() > $(window).height()) {
            back.addClass("scroll-top--active");
          } else {
            back.removeClass("scroll-top--active");
          }
        });
      }
    },

    // =======================
    //  UI Header
    // =======================
    uiHeader: function () {
      function dynamicCurrentMenuClass(selector) {
        let FileName = window.location.href.split("/").reverse()[0];
    
        selector.find("li").each(function () {
          let anchor = $(this).find("a");
          if ($(anchor).attr("href") == FileName) {
            $(this).addClass("current");
          }
        });
        selector.children("li").each(function () {
          if ($(this).find(".current").length) {
            $(this).addClass("current");
          }
        });
        if ("" == FileName) {
          selector.find("li").eq(0).addClass("current");
        }
      }
    
      if ($(".main-menu__list").length) {
        let mainNavUL = $(".main-menu__list");
        dynamicCurrentMenuClass(mainNavUL);
      }
    
      if ($(".main-menu__nav").length && $(".sidebar-nav__container").length) {
        let navContent = document.querySelector(".main-menu__nav").innerHTML;
        let mobileNavContainer = document.querySelector(".sidebar-nav__container");
        mobileNavContainer.innerHTML = navContent;
      }
      if ($(".sticky-header__content").length) {
        let navContent = document.querySelector(".main-menu").innerHTML;
        let mobileNavContainer = document.querySelector(".sticky-header__content");
        mobileNavContainer.innerHTML = navContent;
      }
    
      if ($(".sidebar-nav__container .main-menu__list").length) {
        let dropdownAnchor = $(
          ".sidebar-nav__container .main-menu__list .dropdown > a"
        );
        dropdownAnchor.each(function () {
          let self = $(this);
          let toggleBtn = document.createElement("BUTTON");
          toggleBtn.setAttribute("aria-label", "dropdown toggler");
          toggleBtn.innerHTML = "<i class='fa fa-angle-down'></i>";
          self.append(function () {
            return toggleBtn;
          });
          self.find("button").on("click", function (e) {
            e.preventDefault();
            let self = $(this);
            self.toggleClass("expanded");
            self.parent().toggleClass("expanded");
            self.parent().parent().children("ul").slideToggle();
          });
        });
      }
    
      if ($(".sidebar-nav__toggler").length) {
        $(".sidebar-nav__toggler").on("click", function (e) {
          e.preventDefault();
          $(".sidebar-nav__wrapper").toggleClass("expanded");
          $("body").toggleClass("locked");
        });
      }
    
      $(window).on("scroll", function () {
        if ($(".stricked-menu").length) {
          var headerScrollPos = 130;
          var stricky = $(".stricked-menu");
          if ($(window).scrollTop() > headerScrollPos) {
            stricky.addClass("stricky-fixed");
          } else if ($(this).scrollTop() <= headerScrollPos) {
            stricky.removeClass("stricky-fixed");
          }
        }
    
        // Check if the user scrolls to the footer and adjust sidebar-nav__wrapper
        if ($(".sidebar-nav__wrapper").length && $(".footer").length) {
          let sidebar = $(".sidebar-nav__wrapper");
          let footerOffset = $(".footer").offset().top;
          let windowBottom = $(window).scrollTop() + $(window).height();
    
          // Adjust position when near footer
          if (windowBottom >= footerOffset) {
            sidebar.css({
              position: "absolute",
              top: footerOffset - sidebar.height() + "px",
            });
          } else {
            sidebar.css({
              position: "fixed",
              top: "0",
            });
          }
        }
      });
    },

    // =======================
    //  Slick Slider
    // =======================
    passwordIcon: function () {
      $("#eye , #eye-icon").click(function () {
        if ($(this).hasClass("fa-eye-slash")) {
          $(this).removeClass("fa-eye-slash");
          $(this).addClass("fa-eye");
          $(".password-input").attr("type", "text");
        } else {
          $(this).removeClass("fa-eye");
          $(this).addClass("fa-eye-slash");
          $(".password-input").attr("type", "password");
        }
      });
    },

    // =======================
    //  Slick Slider
    // =======================
    slick: function () {
      if ($(".hero-images-slider").length) {
        $('.hero-images-slider').slick({
          slidesToShow: 3,
          slidesToScroll: 1,
          autoplay: true,
          arrows: false,
          dots: false,
          centerMode: true,
          variableWidth: true,
          infinite: true,
          focusOnSelect: true,
          cssEase: 'linear',
          touchMove: true,
          responsive: [
            {
              breakpoint: 1599,
              settings: {
                slidesToShow: 3,
              },
            },
            {
              breakpoint: 1499,
              settings: {
                slidesToShow: 3,
              },
            },
            {
              breakpoint: 1399,
              settings: {
                slidesToShow: 3,
              },
            },
            {
              breakpoint: 490,
              settings: {
                slidesToShow: 1,
                arrows: false,
                variableWidth: false,
                centerMode: false,
              },
            },
          ]
        });
      }
    },

    // =======================
    //  Coming Soon Countdown
    // =======================
    countdownInit: function (countdownSelector, countdownTime) {
      var eventCounter = $(countdownSelector);
      if (eventCounter.length) {
        eventCounter.countdown(countdownTime, function (e) {
          $(this).html(
            e.strftime(
              '<li><div><h2>%D</h2><h6>Days</h6></div></li>\
              <li><div><h2>%H</h2><h6>Hrs</h6></div></li>\
              <li><div><h2>%M</h2><h6>Min</h6></div></li>\
              <li><div><h2>%S</h2><h6>Sec</h6></div></li>'
            )
          );
        });
      }
    },
  };

  Init.i();
})(window, document, jQuery);
