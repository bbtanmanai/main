// =================== ****************** ================== //
// Template Name: PowerUp
// Description:  PowerUp Html Template
// Version: 1.0.0

// =================== ****************** ================== //

var MyScroll = "";
(function (window, document, $, undefined) {
  "use strict";
  // ==========================================================
  // Detect mobile device and add class "is-mobile" to </body>
  // ==========================================================

  // Detect mobile device (Do not remove!!!)
  var isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Nokia|Opera Mini/i.test(
      navigator.userAgent
    )
      ? true
      : false;
  var Scrollbar = window.Scrollbar;
  // Add class "is-mobile" to </body>

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
      Init.backToTop();
      Init.preloader();
      Init.dropdown();
      Init.header();
      Init.slick();
      Init.countdownInit(".countdown", "2025/11/11");
      Init.filterSearch();
      Init.filterToggle();
      Init.priceRangeSlider();
      Init.quantityHandle();
      Init.cartSidebar();
      Init.formValidation();
      Init.contactForm();
    },

    w: function (e) {
      if (isMobile) {
        $("body").addClass("is-mobile");
      }
    },

    backToTop: function () {
      var btn = $("#backto-top");
      $(window).on("scroll", function () {
        if ($(window).scrollTop() > 300) {
          btn.addClass("show");
        } else {
          btn.removeClass("show");
        }
      });
      btn.on("click", function (e) {
        e.preventDefault();
        $("html, body").animate(
          {
            scrollTop: 0,
          },
          "300"
        );
      });
    },

    preloader: function () {
      setTimeout(function () {
        $("#preloader").hide("slow");
      }, 1800);
    },

    // Header
    dropdown: function () {
      const selectedAll = document.querySelectorAll(".wrapper-dropdown");

      selectedAll.forEach((selected) => {
        const optionsContainer = selected.children[2];
        const optionsList = selected.querySelectorAll(
          "div.wrapper-dropdown li"
        );

        selected.addEventListener("click", () => {
          let arrow = selected.children[1];

          if (selected.classList.contains("active")) {
            handleDropdown(selected, arrow, false);
          } else {
            let currentActive = document.querySelector(
              ".wrapper-dropdown.active"
            );

            if (currentActive) {
              let anotherArrow = currentActive.children[1];
              handleDropdown(currentActive, anotherArrow, false);
            }

            handleDropdown(selected, arrow, true);
          }
        });

        // update the display of the dropdown
        for (let o of optionsList) {
          o.addEventListener("click", () => {
            selected.querySelector(".selected-display").innerHTML = o.innerHTML;
          });
        }
      });

      // check if anything else ofther than the dropdown is clicked
      window.addEventListener("click", function (e) {
        if (e.target.closest(".wrapper-dropdown") === null) {
          closeAllDropdowns();
        }
      });

      // close all the dropdowns
      function closeAllDropdowns() {
        const selectedAll = document.querySelectorAll(".wrapper-dropdown");
        selectedAll.forEach((selected) => {
          const optionsContainer = selected.children[2];
          let arrow = selected.children[1];

          handleDropdown(selected, arrow, false);
        });
      }

      // open all the dropdowns
      function handleDropdown(dropdown, arrow, open) {
        if (open) {
          arrow.classList.add("rotated");
          dropdown.classList.add("active");
        } else {
          arrow.classList.remove("rotated");
          dropdown.classList.remove("active");
        }
      }
    },

    // Header
    header: function () {
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

      if ($(".main-menu__nav").length && $(".mobile-nav__container").length) {
        let navContent = document.querySelector(".main-menu__nav").innerHTML;
        let mobileNavContainer = document.querySelector(
          ".mobile-nav__container"
        );
        mobileNavContainer.innerHTML = navContent;
      }
      if ($(".sticky-header__content").length) {
        let navContent = document.querySelector(".header-bottom-area").innerHTML;
        let mobileNavContainer = document.querySelector(
          ".sticky-header__content"
        );
        mobileNavContainer.innerHTML = navContent;
      }

      if ($(".mobile-nav__container .main-menu__list").length) {
        let dropdownAnchor = $(
          ".mobile-nav__container .main-menu__list .dropdown > a"
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

      if ($(".mobile-nav__toggler").length) {
        $(".mobile-nav__toggler").on("click", function (e) {
          e.preventDefault();
          $(".mobile-nav__wrapper").toggleClass("expanded");
          $("body").toggleClass("locked");
        });
      }

      $(window).on("scroll", function () {
        if ($(".stricked-menu").length) {
          var headerScrollPos = 120;
          var stricky = $(".stricked-menu");
          if ($(window).scrollTop() > headerScrollPos) {
            stricky.addClass("stricky-fixed");
          } else if ($(this).scrollTop() <= headerScrollPos) {
            stricky.removeClass("stricky-fixed");
          }
        }
      });
    },

    // Slick Slider
    slick: function () {
      if ($(".hero-banner-slider").length) {
        $(".hero-banner-slider")
          .slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            autoplay: false,
            speed: 800,
            lazyLoad: "progressive",
            arrows: false,
            dots: false,
          })
          .slickAnimation();

        $(".arrow-btn").on("click touch", function (e) {
          e.preventDefault();

          var arrow = $(this);

          if (!arrow.hasClass("animate")) {
            arrow.addClass("animate");
            setTimeout(() => {
              arrow.removeClass("animate");
            }, 1600);
          }
        });
      }

      if ($(".brand-slider").length) {
        $(".brand-slider").slick({
          autoplay: true,
          autoplaySpeed: 0,
          speed: 10000,
          arrows: false,
          swipe: true,
          slidesToShow: 5,
          cssEase: "linear",
          pauseOnFocus: false,
          pauseOnHover: false,

          responsive: [
            {
              breakpoint: 1499,
              settings: {
                slidesToShow: 4,
              },
            },
            {
              breakpoint: 1299,
              settings: {
                slidesToShow: 3,
              },
            },
          ],
        });
      }

      if ($(".product-detail-slider").length) {
        $(".product-detail-slider").slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          fade: true,
          asNavFor: ".product-slider-asnav",
        });
      }
      if ($(".product-slider-asnav").length) {
        $(".product-slider-asnav").slick({
          slidesToShow: 4,
          slidesToScroll: 1,
          asNavFor: ".product-detail-slider",
          dots: false,
          arrows: false,
          centerMode: false,
          variableWidth: true,
          focusOnSelect: true,
        });
      }

      // ******** TIMELINES SLIDERS START ********* //
      function initializeSlider(
        $slider,
        slidesToShow,
        responsiveSettings = []
      ) {
        var $progressBar = $slider.siblings(".progress");
        var $progressBarLabel = $slider.siblings(".slider__label");

        function updateProgressBar(slick, nextSlide) {
          var sliderWidth = $slider.outerWidth();
          var slideWidth = sliderWidth / slick.slideCount;
          var calc = (slideWidth * (nextSlide + 1) * 100) / sliderWidth;

          $progressBar
            .css("background-size", calc + "% 100%")
            .attr("aria-valuenow", calc);

          $progressBarLabel.text(calc.toFixed(0) + "% completed");
        }

        $slider.on("init", function (event, slick) {
          updateProgressBar(slick, 0);
        });

        $slider.on(
          "beforeChange",
          function (event, slick, currentSlide, nextSlide) {
            updateProgressBar(slick, nextSlide);
          }
        );

        $slider.slick({
          autoplay: false,
          slidesToShow: slidesToShow,
          slidesToScroll: 1,
          speed: 400,
          cssEase: "linear",
          arrows: false,
          responsive: responsiveSettings,
        });
      }

      if ($(".product-slider").length) {
        initializeSlider($(".product-slider"), 4, [
          {
            breakpoint: 1199,
            settings: {
              slidesToShow: 3,
            },
          },
          {
            breakpoint: 992,
            settings: {
              slidesToShow: 2,
            },
          },
          {
            breakpoint: 576,
            settings: {
              slidesToShow: 1,
            },
          },
        ]);
      }

      if ($(".testimonials-slider").length) {
        initializeSlider($(".testimonials-slider"), 3, [
          {
            breakpoint: 1099,
            settings: {
              slidesToShow: 2,
            },
          },
          {
            breakpoint: 576,
            settings: {
              slidesToShow: 1,
            },
          },
        ]);
      }

      // ******** TIMELINES SLIDERS END ********* //
      var percentTime;
      var tick;
      var time = 0.1;
      var progressBarIndex = 0;

      $(".progressBarContainer .progressBar").each(function (index) {
        var progress = "<div class='inProgress inProgress" + index + "'></div>";
        $(this).html(progress);
      });

      function startProgressbar() {
        resetProgressbar();
        percentTime = 0;
        tick = setInterval(interval, 10);
      }

      function interval() {
        if (
          $(
            '.slider .slick-track div[data-slick-index="' +
              progressBarIndex +
              '"]'
          ).attr("aria-hidden") === "true"
        ) {
          progressBarIndex = $(
            '.slider .slick-track div[aria-hidden="false"]'
          ).data("slickIndex");
          startProgressbar();
        } else {
          percentTime += 1 / (time + 5);
          $(".inProgress" + progressBarIndex).css({
            width: percentTime + "%",
          });
          if (percentTime >= 100) {
            $(".single-item").slick("slickNext");
            progressBarIndex++;
            if (progressBarIndex > 2) {
              progressBarIndex = 0;
            }
            startProgressbar();
          }
        }
      }

      function resetProgressbar() {
        $(".inProgress").css({
          width: 0 + "%",
        });
        clearInterval(tick);
      }
      startProgressbar();
      // End ticking machine

      $(".item").click(function () {
        clearInterval(tick);
        var goToThisIndex = $(this).find("span").data("slickIndex");
        $(".single-item").slick("slickGoTo", goToThisIndex, false);
        startProgressbar();
      });

      $(".btn-prev").click(function () {
        var $this = $(this).attr("data-slide");
        $("." + $this).slick("slickPrev");
      });

      $(".btn-next").click(function () {
        var $this = $(this).attr("data-slide");
        $("." + $this).slick("slickNext");
      });
    },

    filterSearch: function () {
      if ($("#searchInput").length) {
        $("#searchInput").on("keyup", function () {
          var value = $(this).val().toLowerCase();
          $(".blogs-block").filter(function () {
            var hasMatch =
              $(this).find(".blog-title").text().toLowerCase().indexOf(value) >
              -1;
            $(this).toggle(hasMatch);
          });
        });
      }
    },

    // Countdown Timer
    countdownInit: function (countdownSelector, countdownTime, countdown) {
      var eventCounter = $(countdownSelector);
      if (eventCounter.length) {
        eventCounter.countdown(countdownTime, function (e) {
          $(this).html(
            e.strftime(
              "<li><h3>%D</h3><p>Days</p></li>\
              <li><h3>%H</h3><p>Hrs</p></li>\
              <li><h3>%M</h3><p>Mins</p></li>\
              <li><h3>%S</h3><p>Secs</p></li>"
            )
          );
        });
      }
    },

    // Filter Toggle Button
    filterToggle: function () {
      if ($(".category-block").length) {
        $(".category-block .title").on("click", function (e) {
          var count = $(this).data("count");
          if (
            $(".category-block.box-" + count + " .content-block").is(":visible")
          ) {
            $(".category-block.box-" + count + " span i").removeClass(
              "fa-chevron-up"
            );
            $(".category-block.box-" + count + " span i").addClass("fa-chevron-down");
            $(".category-block.box-" + count + " .content-block").hide("slow");
          } else {
            $(".category-block.box-" + count + " span i").removeClass(
              "fa-chevron-down"
            );
            $(".category-block.box-" + count + " span i").addClass(
              "fa-chevron-up"
            );
            $(".category-block.box-" + count + " .content-block").show("slow");
          }
        });
      }

      if ($(".logo-icon").length) {
        $("#magnifying-btn").on("click", function (event) {
          event.stopPropagation();
          $(".input-search").slideDown("fast");
        });

        $(document).on("click", function (event) {
          if (!$(event.target).closest(".search-block").length) {
            $(".input-search").slideUp("fast");
          }
        });

        $(".search-block").on("click", function (event) {
          event.stopPropagation();
        });
      }
      if ($(".toggle-sidebar").length) {
        $(".shop-filter").on("click", function () {
          $(".toggle-sidebar").animate({ left: "0" }, 300);
          $(".shop-sidebar-overlay").fadeIn(300);
          $("body").addClass("no-scroll"); // Disable scroll
        });

        $(".shop-sidebar-overlay").on("click", function () {
          $(".toggle-sidebar").animate({ left: "-800px" }, 300);
          $(this).fadeOut(300);
          $("body").removeClass("no-scroll"); // Enable scroll
        });
      }
      if ($(".feature-products").length) {
        $(".tab-link").click(function () {
          var tabID = $(this).attr("data-tab");

          $(this).addClass("active").siblings().removeClass("active");
          $("#tab-" + tabID)
            .addClass("active")
            .siblings()
            .removeClass("active");

          var currentSlider = $("#tab-" + tabID).find(".product-slider");

          if (currentSlider.hasClass("slick-initialized")) {
            currentSlider.slick("setPosition");
          } else {
            currentSlider.slick();
          }
        });
      }
    },

    // Form Validation
    priceRangeSlider: function () {
      const priceGap = 1000;

      $(".price-input input").on("input", function () {
        let minPrice = parseInt($(".price-input .input-min").val()),
          maxPrice = parseInt($(".price-input .input-max").val());

        if (
          maxPrice - minPrice >= priceGap &&
          maxPrice <= $(".range-input .range-max").attr("max")
        ) {
          if ($(this).hasClass("input-min")) {
            $(".range-input .range-min").val(minPrice);
            $(".slider .progress-range").css(
              "left",
              (minPrice / $(".range-input .range-min").attr("max")) * 100 + "%"
            );
          } else {
            $(".range-input .range-max").val(maxPrice);
            $(".slider .progress-range").css(
              "right",
              100 -
                (maxPrice / $(".range-input .range-max").attr("max")) * 100 +
                "%"
            );
          }
        }
      });

      $(".range-input input").on("input", function () {
        let minVal = parseInt($(".range-input .range-min").val()),
          maxVal = parseInt($(".range-input .range-max").val());

        if (maxVal - minVal < priceGap) {
          if ($(this).hasClass("range-min")) {
            $(".range-input .range-min").val(maxVal - priceGap);
          } else {
            $(".range-input .range-max").val(minVal + priceGap);
          }
        } else {
          $(".price-input .input-min").val(minVal);
          $(".price-input .input-max").val(maxVal);
          $(".slider .progress-range").css(
            "left",
            (minVal / $(".range-input .range-min").attr("max")) * 100 + "%"
          );
          $(".slider .progress-range").css(
            "right",
            100 -
              (maxVal / $(".range-input .range-max").attr("max")) * 100 +
              "%"
          );
        }
      });
    },

    // Quantity Controller
    quantityHandle: function () {
      $(".decrement").on("click", function () {
        var qtyInput = $(this).closest(".quantity-wrap").children(".number");
        var qtyVal = parseInt(qtyInput.val());
        if (qtyVal > 0) {
          qtyInput.val(qtyVal - 1);
        }
      });
      $(".increment").on("click", function () {
        var qtyInput = $(this).closest(".quantity-wrap").children(".number");
        var qtyVal = parseInt(qtyInput.val());
        qtyInput.val(parseInt(qtyVal + 1));
      });
    },

    // Cart Sidebar
    cartSidebar: function () {
      $(".cart-button").on("click", function () {
        $("#sidebar-cart").css("right", "0");
        $("#sidebar-cart-curtain")
          .fadeIn(0)
          .css("display", "block")
          .animate({ opacity: 1 }, 200); // Smooth fade in the curtain
      });

      $(".close-popup").on("click", function () {
        $("#sidebar-cart").css("right", "-101%");
        $("#sidebar-cart-curtain").animate({ opacity: 0 }, 200, function () {
          $(this).css("display", "none");
        });
      });
    },

    // Form Validation
    formValidation: function () {
      if ($(".contact-form").length) {
        $(".contact-form").validate();
      }
      if ($(".blog-form").length) {
        $(".blog-form").validate();
      }
    },

    // Contact Form
    contactForm: function () {
      $(".contact-form").on("submit", function (e) {
        e.preventDefault();
        if ($(".contact-form").valid()) {
          var _self = $(this);
          _self
            .closest("div")
            .find('button[type="submit"]')
            .attr("disabled", "disabled");
          var data = $(this).serialize();
          $.ajax({
            url: "./assets/mail/contact.php",
            type: "post",
            dataType: "json",
            data: data,
            success: function (data) {
              $(".contact-form").trigger("reset");
              _self.find('button[type="submit"]').removeAttr("disabled");
              if (data.success) {
                document.getElementById("message").innerHTML =
                  "<h6 class='black mt-3'>Email Sent Successfully</h6>";
              } else {
                document.getElementById("message").innerHTML =
                  "<h6 class='black mt-3'>There is an error</h6>";
              }
              $("#messages").show("slow");
              $("#messages").slideDown("slow");
              setTimeout(function () {
                $("#messages").slideUp("hide");
                $("#messages").hide("slow");
              }, 4000);
            },
          });
        } else {
          return false;
        }
      });
    },
  };

  Init.i();
})(window, document, jQuery);
