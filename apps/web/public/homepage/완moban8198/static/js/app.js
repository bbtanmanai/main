var MyScroll = "";
(function (window, document, $, undefined) {
  "use strict";
  var isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Nokia|Opera Mini/i.test(
      navigator.userAgent
    )
      ? !0
      : !1;
  var Scrollbar = window.Scrollbar;
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
      Init.BackToTop();
      Init.preloader();
      Init.header();
      Init.slick();
      Init.passwordIcon();
      Init.formValidation();
      Init.contactForm();
      Init.checkBoxes();
      Init.wow();
      Init.cursor();
      // Init.contactmodal();
      Init.dropdown();
      Init.showReview();
    },

    /*-- Back-to-top --*/
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

    preloader: function () {
      setTimeout(function () {
        $("#preloader").hide("slow");
      }, 1500);
    },

    showReview: function () {
      $(".review-btn").on("click", function () {
        $(".review-btn").removeClass("te-button");
        var id = $(this).attr("data-atr");
        $(this).addClass("te-button");

        // Hide all review blocks slowly
        $(".review-block").hide("slow");

        // Show the selected review block slowly
        $("#" + id).show("slow");
      });
    },
    teamMemberShow: function (e) {
      $(".member").on("click", function () {
        var id = $(this).attr("id");
        $(".member").removeClass("active");
        $(this).addClass("active");
        $(".member-details").hide("slow");
        $("." + id).show("slow");
      });
    },

    serviceShow: function (e) {
      $(".service_title").on("click", function () {
        var id = $(this).attr("id");
        $(".service_title").removeClass("active");
        $(this).addClass("active");
        $(".service-detail").hide("slow");
        $("." + id).show("slow");
      });
    },

    w: function (e) {
      if (isMobile) {
        $("body").addClass("is-mobile");
      }
    },

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
        let navContent = document.querySelector(".main-menu").innerHTML;
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
          var headerScrollPos = 130;
          var stricky = $(".stricked-menu");
          if ($(window).scrollTop() > headerScrollPos) {
            stricky.addClass("stricky-fixed");
          } else if ($(this).scrollTop() <= headerScrollPos) {
            stricky.removeClass("stricky-fixed");
          }
        }
      });
    },

    wow: function () {
      if ($(".wow").length) {
        var wow = new WOW({
          boxClass: "wow", // animated element css class (default is wow)
          animateClass: "animated", // animation css class (default is animated)
          mobile: true, // trigger animations on mobile devices (default is true)
          live: true, // act on asynchronously loaded content (default is true)
        });
        wow.init();
      }
    },

    cursor: function () {
      if ($(".custom-cursor").length) {
        var cursor = document.querySelector(".custom-cursor__cursor");
        var cursorinner = document.querySelector(".custom-cursor__cursor-two");
        var a = document.querySelectorAll("a");

        document.addEventListener("mousemove", function (e) {
          var x = e.clientX;
          var y = e.clientY;
          cursor.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
        });

        document.addEventListener("mousemove", function (e) {
          var x = e.clientX;
          var y = e.clientY;
          cursorinner.style.left = x + "px";
          cursorinner.style.top = y + "px";
        });

        document.addEventListener("mousedown", function () {
          cursor.classList.add("click");
          cursorinner.classList.add("custom-cursor__innerhover");
        });

        document.addEventListener("mouseup", function () {
          cursor.classList.remove("click");
          cursorinner.classList.remove("custom-cursor__innerhover");
        });

        a.forEach((item) => {
          item.addEventListener("mouseover", () => {
            cursor.classList.add("custom-cursor__hover");
          });
          item.addEventListener("mouseleave", () => {
            cursor.classList.remove("custom-cursor__hover");
          });
        });
      }
    },

    slick: function () {
      if ($(".testimonials-slider").length) {
        $(".testimonials-slider").slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: !0,
          autoplay: true,
          dots: !0,
          draggable: !0,
          arrows: false,
          lazyLoad: "progressive",
          speed: 800,
          autoplaySpeed: 2000,
          responsive: [
            { breakpoint: 1025, settings: { slidesToShow: 1 } },
            { breakpoint: 576, settings: { slidesToShow: 1 } },
          ],
        });
      }

      if ($(".latest-stories-slider").length) {
        $(".latest-stories-slider").slick({
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: !0,
          autoplay: true,
          dots: !0,
          draggable: !0,
          arrows: false,
          lazyLoad: "progressive",
          speed: 800,
          autoplaySpeed: 2000,
          responsive: [
            { breakpoint: 1025, settings: { slidesToShow: 2 } },
            { breakpoint: 576, settings: { slidesToShow: 1 } },
          ],
        });
      }

      if ($(".brand-slider").length) {
        $(".brand-slider").slick({
          infinite: true,
          slidesToShow: 5,
          arrows: false,
          autoplay: true,
          cssEase: "linear",
          autoplaySpeed: 0,
          speed: 8000,
          pauseOnFocus: false,
          pauseOnHover: false,
          responsive: [
            {
              breakpoint: 1699,
              settings: {
                slidesToShow: 5,
              },
            },
            {
              breakpoint: 1599,
              settings: {
                slidesToShow: 4,
              },
            },
            {
              breakpoint: 769,
              settings: {
                slidesToShow: 3,
              },
            },
            {
              breakpoint: 576,
              settings: {
                slidesToShow: 2,
              },
            },
            {
              breakpoint: 450,
              settings: {
                slidesToShow: 1,
              },
            },
          ],
        });
      }
      if ($(".brand-slider2").length) {
        $(".brand-slider2").slick({
          slidesToShow: 7,
          slidesToScroll: 2,
          autoplay: true,
          centerMode: !0,
          autoplaySpeed: true,
          speed: 8000,
          cssEase: "linear",
          infinite: !0,
          arrows: !1,
          touchMove: !0,
          swipeToSlide: !0,
          swipe: !0,
          responsive: [
            {
              breakpoint: 1099,
              settings: { slidesToShow: 4 },
            },
            {
              breakpoint: 899,
              settings: { slidesToShow: 3 },
            },
            {
              breakpoint: 769,
              settings: { slidesToShow: 3 },
            },
            {
              breakpoint: 576,
              settings: { slidesToShow: 2 },
            },
          ],
        });
      }

      $(".btn-prev").click(function () {
        var $this = $(this).attr("data-slide");
        $("." + $this).slick("slickPrev");
      });
      $(".btn-next").click(function () {
        var $this = $(this).attr("data-slide");
        $("." + $this).slick("slickNext");
      });
    },
    // Toggle CheckBoxes
    checkBoxes: function () {
      $(".sub-checkboxes").hide();
      $(".arrow-block").click(function () {
        var subCheckboxes = $(this).next(".sub-checkboxes");
        var chevronIcon = $(this).find("i");
        subCheckboxes.slideToggle("fast");
        chevronIcon.toggleClass("fa-chevron-down fa-chevron-up");
      });
      $(".check-block, .sub-check-box").click(function (event) {
        event.stopPropagation();
      });

      if ($(".customer-container").length) {
        $(".signin-button").click(function () {
          $(".sign-form").slideToggle();
        });
      }
    },

    // contactmodal: function () {
    //   const contactInfoSection = document.getElementById("contactInfoSection");
    //   const cvUploadSection = document.getElementById("cvUploadSection");
    //   const confirmationSection = document.getElementById(
    //     "confirmationSection"
    //   );
    //   const thankYouSection = document.getElementById("thankYouSection");
    //   const nextStepButton = document.getElementById("nextStepButton");
    //   const submitButton = document.getElementById("submitButton");
    //   const backButton = document.getElementById("backButton");
    //   const confirmButton = document.getElementById("confirmButton");
    //   const progressBar = document.getElementById("progressBar");
    //   const modalHeader = document.querySelector(".modal-header");
    //   const modalFooter = document.querySelector(".modal-footer");

    //   let progress = 50;

    //   // Initial visibility of confirm button
    //   confirmButton.style.display = "none";

    //   // Move to CV Upload section
    //   nextStepButton.addEventListener("click", function () {
    //     contactInfoSection.style.display = "none";
    //     cvUploadSection.style.display = "block";
    //     nextStepButton.style.display = "none";
    //     submitButton.style.display = "block";
    //     backButton.style.display = "block";
    //     progress = 100;
    //     updateProgressBar();
    //   });

    //   // Move to Confirmation section
    //   submitButton.addEventListener("click", function () {
    //     // Populate the confirmation details
    //     document.getElementById("summaryName").innerText =
    //       document.getElementById("fname").value;
    //     document.getElementById("summaryEmail").innerText =
    //       document.getElementById("e-mail").value;
    //     document.getElementById("summaryCountry").innerText =
    //       document.getElementById("ctext").value;
    //     document.getElementById("summaryNumber").innerText =
    //       document.getElementById("number").value;
    //     document.getElementById("summaryFileName").innerText =
    //       document.getElementById("fileName").textContent;

    //     cvUploadSection.style.display = "none";
    //     confirmationSection.style.display = "block"; // Display the confirmation section
    //     submitButton.style.display = "none";
    //     backButton.style.display = "block";
    //     confirmButton.style.display = "block"; // Show confirm button only in confirmation section
    //   });

    //   // Confirm and show Thank You section
    //   confirmButton.addEventListener("click", function () {
    //     confirmationSection.style.display = "none";
    //     thankYouSection.style.display = "block"; // Display the Thank You section
    //     backButton.style.display = "none";
    //     confirmButton.style.display = "none"; // Hide confirm button after confirmation

    //     // Hide modal header and footer, including progress bar
    //     if (modalHeader) modalHeader.style.display = "none !important";
    //     if (modalFooter) modalFooter.style.display = "none";
    //   });

    //   // Back button functionality
    //   backButton.addEventListener("click", function () {
    //     if (confirmationSection.style.display === "block") {
    //       confirmationSection.style.display = "none";
    //       cvUploadSection.style.display = "block";
    //       submitButton.style.display = "block";
    //       confirmButton.style.display = "none"; // Hide confirm button when going back
    //     } else if (cvUploadSection.style.display === "block") {
    //       cvUploadSection.style.display = "none";
    //       contactInfoSection.style.display = "block";
    //       nextStepButton.style.display = "block";
    //       backButton.style.display = "none";
    //       progress = 50;
    //       updateProgressBar();
    //     }
    //   });

    //   // Update progress bar
    //   function updateProgressBar() {
    //     progressBar.style.width = progress + "%";
    //     progressBar.setAttribute("aria-valuenow", progress);
    //   }

    //   // CV file upload display
    //   document
    //     .getElementById("cvUpload")
    //     .addEventListener("change", function () {
    //       const file = this.files[0];
    //       document.getElementById("fileName").textContent = file
    //         ? file.name
    //         : "";
    //     });
    // },

    dropdown: function () {
      const selectedAll = document.querySelectorAll(".wrapper-dropdown");

      selectedAll.forEach((selected) => {
        const arrow = selected.children[1];
        const optionsContainer = selected.children[2];
        const optionsList = selected.querySelectorAll("ul.topbar-dropdown li");

        selected.addEventListener("click", (event) => {
          event.stopPropagation();

          if (selected.classList.contains("active")) {
            handleDropdown(selected, arrow, false);
          } else {
            let currentActive = document.querySelector(
              ".wrapper-dropdown.active"
            );
            if (currentActive && currentActive !== selected) {
              let anotherArrow = currentActive.children[1];
              handleDropdown(currentActive, anotherArrow, false);
            }

            handleDropdown(selected, arrow, true);
          }
        });

        optionsList.forEach((option) => {
          option.addEventListener("click", () => {
            selected.querySelector(".form-control").innerHTML =
              option.innerHTML;
          });
        });
      });

      window.addEventListener("click", (e) => {
        if (!e.target.closest(".wrapper-dropdown")) {
          closeAllDropdowns();
        }
      });

      function closeAllDropdowns() {
        selectedAll.forEach((selected) => {
          const arrow = selected.children[1];
          handleDropdown(selected, arrow, false);
        });
      }

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

    //   dropdown: function () {
    //     const selectedAll = document.querySelectorAll(".wrapper-dropdown");

    //     selectedAll.forEach((selected) => {
    //         const arrow = selected.querySelector('svg'); // Adjust if arrow is not always at [1]
    //         const optionsContainer = selected.querySelector('ul.topbar-dropdown'); // Adjust if not at [2]
    //         const optionsList = selected.querySelectorAll("ul.topbar-dropdown li");

    //         selected.addEventListener("click", (event) => {
    //             event.stopPropagation();

    //             // Toggle active class
    //             if (selected.classList.contains("active")) {
    //                 handleDropdown(selected, arrow, false);
    //             } else {
    //                 let currentActive = document.querySelector(".wrapper-dropdown.active");
    //                 if (currentActive && currentActive !== selected) {
    //                     let anotherArrow = currentActive.querySelector('svg');
    //                     handleDropdown(currentActive, anotherArrow, false);
    //                 }

    //                 handleDropdown(selected, arrow, true);
    //             }
    //         });

    //         // Set the selected option
    //         optionsList.forEach((option) => {
    //             option.addEventListener("click", (e) => {
    //                 const selectedDisplay = selected.querySelector(".selected-display"); // Adjust if needed
    //                 if (selectedDisplay) {
    //                     selectedDisplay.innerHTML = option.innerHTML;
    //                 } else {
    //                     console.error(".selected-display element not found");
    //                 }
    //             });
    //         });
    //     });

    //     // Close dropdown when clicking outside
    //     window.addEventListener("click", (e) => {
    //         if (!e.target.closest(".wrapper-dropdown")) {
    //             closeAllDropdowns();
    //         }
    //     });

    //     function closeAllDropdowns() {
    //         selectedAll.forEach((selected) => {
    //             const arrow = selected.querySelector('svg');
    //             handleDropdown(selected, arrow, false);
    //         });
    //     }

    //     function handleDropdown(dropdown, arrow, open) {
    //         if (open) {
    //             arrow.classList.add("rotated");
    //             dropdown.classList.add("active");
    //         } else {
    //             arrow.classList.remove("rotated");
    //             dropdown.classList.remove("active");
    //         }
    //     }
    // },

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
    formValidation: function () {
      if ($(".contact-form").length) {
        $(".contact-form").validate();
      }
      if ($(".login-form").length) {
        $(".login-form").validate();
      }
    },
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
                  "<h5 class='color-primary mt-16 mb-16'>Email Sent Successfully</h5>";
              } else {
                document.getElementById("message").innerHTML =
                  "<h5 class='color-primary mt-16 mb-16'>There is an error</h5>";
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
          return !1;
        }
      });
    },
  };
  Init.i();
})(window, document, jQuery);
