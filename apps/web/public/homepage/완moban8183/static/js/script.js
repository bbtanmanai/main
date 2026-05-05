$(window).on("load", function () {

   // Preload 
   $("#preload").fadeOut(500);

});

jQuery(document).ready(function () {

   // Boxloader
   $(".wrapper-aboutus, .single-step, #services .single-service, .wrapper-sale,.wrapper-testimonials").boxLoader({
      direction: "y",
      position: "100%",
      effect: "fadeIn",
      duration: "1.5s",
      windowarea: "100%"
   });

   // Owl Carousel Projects
   $('.projects-carousel').owlCarousel({
      loop: true,
      margin: 20,
      nav: false,
      dots: true,
      responsive: {
         0: {
            items: 1
         },
         600: {
            items: 2
         },
         1100: {
            items: 3
         },
         1200: {
            items: 4
         }
      }
   });

   // Owl Carousel Testimonials
   $('.testimonials-carousel').owlCarousel({
      loop: true,
      margin: 20,
      nav: false,
      dots: true,
      responsive: {
         0: {
            items: 1
         },
         600: {
            items: 1
         },
         1000: {
            items: 1
         }
      }
   });

   // Dropdown Mobile Menu 
   $('.mobile-menu > li.menu-item-has-children > a').append('<i class="fa-solid fa-chevron-down"></i>');
   $('.mobile-menu .sub-menu > li.menu-item-has-children > a').append('<i class="fa-solid fa-chevron-down"></i>');
   $('.mobile-menu > li.menu-item-has-children > a').click(function () {
      $(this).next('.sub-menu').slideToggle();

   });
   $('.mobile-menu .sub-menu > li.menu-item-has-children > a').click(function () {
      $(this).next('.sub-menu').slideToggle();

   });

   // Show/hide Mobile Menu 
   $('#closemenu').click(function (event) {
      event.preventDefault();
      $('#mobile-nav').animate({
         'left': '-320px'
      }, 800);
   });
   $('#openmenu').click(function (event) {
      event.preventDefault();
      $('#mobile-nav').animate({
         'left': '0px'
      }, 800);
   });

   // Scroll Top Button
   $('#scroll-top').click(function () {
      $('body,html').animate({
         scrollTop: 0
      }, 800);
      return false;
   });

   // Scroll Top
   $('#scroll-top').hide();
   $(window).scroll(function () {
      if ($(this).scrollTop() > 50) {
         $('#scroll-top').fadeIn();
      } else {
         $('#scroll-top').fadeOut();
      }
   });

   // Accordion FAQ
   var titleAccordion = $('.wrapper-accordion h3');
   var contentAccordion = $('.content-accordion');

   titleAccordion.click(function () {
      var content = $(this).next(contentAccordion);
      if (content.is(':visible')) {
         content.slideUp();
         $(this).children('.fa-solid').removeClass('fa-chevron-up').addClass('fa-chevron-down');
      } else {
         contentAccordion.slideUp();
         content.slideDown();
         titleAccordion.children('.fa-solid').removeClass('fa-chevron-up').addClass('fa-chevron-down');
         $(this).children('.fa-solid').removeClass('fa-chevron-down').addClass('fa-chevron-up');
      }

   });

   // Ajax Send Appointment
   $('#sendappointment').click(function (event) {
      event.preventDefault();

      var name = $('input[name="name"]').val();
      var lastname = $('input[name="lastname"]').val();
      var phone = $('input[name="phone"]').val();
      var email = $('input[name="email"]').val();
      var date = $('input[name="date"]').val();
      var time = $('input[name="time"]').val();

      if (name == '' || lastname == '' || phone == '' || email == '' || date == '' || time == '') {

         $('.res-appointment').fadeIn().html('<span class="error">All fields must be filled.</span>');
         $('input').focus(function () {
            $('.res-appointment').fadeOut();
         });
      } else {
         $.ajax({
            url: '../appointment.php',
            type: 'POST',
            data: {
               name: name,
               lastname: lastname,
               phone: phone,
               email: email,
               date: date,
               time: time
            },
            dataType: 'html',
            success: function (data) {
               if (data == 'Send') {
                  $('.res-appointment').fadeIn().html('<span class="send">Thanks. We will contact you shortly.</span>');

                  $('input[name="name"]').val('');
                  $('input[name="lastname"]').val('');
                  $('input[name="phone"]').val('');
                  $('input[name="email"]').val('');
                  $('input[name="date"]').val('');
                  $('input[name="time"]').val('');
               }
            }
         }); // ajax
      }

   });


});