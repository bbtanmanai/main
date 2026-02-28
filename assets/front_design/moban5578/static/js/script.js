(function($) {
	
	"use strict";
	
	//Hide Loading Box (Preloader)
	function handlePreloader() {
		if($('.preloader').length){
			$('.preloader').delay(200).fadeOut(500);
		}
	}
	
	//Update Header Style and Scroll to Top
	function headerStyle() {
		if($('.main-header').length){
			var windowpos = $(window).scrollTop();
			var siteHeader = $('.main-header');
			var scrollLink = $('.scroll-to-top');
			var sticky_header = $('.main-header .sticky-header');
			if (windowpos > 200) {
				siteHeader.addClass('fixed-header');
				sticky_header.addClass("animated slideInDown");
				scrollLink.fadeIn(300);
			} else {
				siteHeader.removeClass('fixed-header');
				sticky_header.removeClass("animated slideInDown");
				scrollLink.fadeOut(300);
			}
		}
	}
	headerStyle();

	//Submenu Dropdown Toggle
	if($('.main-header li.dropdown ul').length){
		$('.main-header .navigation li.dropdown').append('<div class="dropdown-btn"><span class="fa fa-plus"></span></div>');
	}

	//Mobile Nav Hide Show
	if($('.mobile-menu').length){
		
		var mobileMenuContent = $('.main-header .nav-outer .main-menu .navigation').html();
		$('.mobile-menu').append('<div class="close-btn"><span class="icon flaticon-cancel-music"></span></div>');
		$('.mobile-menu .navigation').append(mobileMenuContent);
		$('.sticky-header .navigation').append(mobileMenuContent);
		$('.mobile-menu .close-btn').on('click', function() {
			$('body').removeClass('mobile-menu-visible');
		});
		//Dropdown Button
		$('.mobile-menu li.dropdown .dropdown-btn').on('click', function() {
			$(this).prev('ul').slideToggle(500);
			$(this).toggleClass('active');
		});
		//Menu Toggle Btn
		$('.mobile-nav-toggler').on('click', function() {
			$('body').addClass('mobile-menu-visible');
		});

		//Menu Toggle Btn
		$('.mobile-menu .menu-backdrop, .mobile-menu .close-btn').on('click', function() {
			$('body').removeClass('mobile-menu-visible');
		});
	}

	//Header Search
	if($('.room-block').length) {
		$('.room-block .inner-box').on('mouseenter', function() {
			var text_height = $(this).find('.text').height();
			$(this).parents('.room-block').find('.overlay-cotnent').css({"padding-bottom": text_height + 30});
			$(this).addClass('active')
		});
		$('.room-block .inner-box').on('mouseleave', function() {
			$(this).parents('.room-block').find('.overlay-cotnent').css({"padding-bottom": 30});
			$(this).removeClass('active')
		});
	}

	// Banner Carousel / Owl Carousel 
	if ($('.banner-carousel').length) {
		$('.banner-carousel').owlCarousel({
			animateOut: 'fadeOut',
		    animateIn: 'fadeIn',
			loop:true,
			margin:0,
			smartSpeed: 500,
			nav:true,
			items:1,
			autoHeight: true,
			autoplay: true,
			autoplayTimeout:10000,
			navText: [ '<span class="flaticon-left-chevron"></span>', '<span class="flaticon-right-arrow"></span>' ],
		}); 
	}

	// Testimonial Carousel
	if ($('.rooms-carousel').length) {
		$('.rooms-carousel').owlCarousel({
			loop:true,
			margin:0,
			nav:false,
			smartSpeed: 700,
			autoplay: 5000,
			navText: [ '<span class="fa fa-angle-left"></span>', '<span class="fa fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				600:{
					items:1
				},
				991:{
					items:2
				},
				1500:{
					items:3
				},
			}
		});
	}

	// Testimonial Carousel
	if ($('.rooms-carousel-two').length) {
		$('.rooms-carousel-two').owlCarousel({
			loop:true,
			margin:30,
			nav:false,
			smartSpeed: 700,
			autoplay: 5000,
			navText: [ '<span class="fa fa-angle-left"></span>', '<span class="fa fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				600:{
					items:1
				},
				768:{
					items:2
				},
				1500:{
					items:3
				},
			}
		});
	}

	// Packages Carousel
	if ($('.packages-carousel').length) {
		$('.packages-carousel').owlCarousel({
			animateOut: 'fadeOut',
		    animateIn: 'fadeIn',	
			loop:true,
			margin:0,
			items:1,
			nav:true,
			smartSpeed: 400,
			autoplay: 5000,
			navText: [ '<span class="flaticon-left-chevron"></span>', '<span class="flaticon-right-arrow"></span>' ],
		});
	}

	// Packages Carousel
	if ($('.packages-carousel-two').length) {
		$('.packages-carousel-two').owlCarousel({	
			loop:true,
			margin:40,
			items:1,
			nav:false,
			smartSpeed: 400,
			autoplay: 5000,
			navText: [ '<span class="flaticon-left-chevron"></span>', '<span class="flaticon-right-arrow"></span>' ],
			responsive:{
				0:{
					items:1
				},
				768:{
					items:2,
					margin:20
				},
				1280:{
					items:3
				},
				1920:{
					items:4
				},
			}
		});
	}

	// Packages Carousel
	if ($('.packages-carousel-three').length) {
		$('.packages-carousel-three').owlCarousel({	
			loop:true,
			margin:0,
			items:1,
			nav:false,
			smartSpeed: 400,
			autoplay: 5000,
			navText: [ '<span class="flaticon-left-chevron"></span>', '<span class="flaticon-right-arrow"></span>' ],
			responsive:{
				0:{
					items:1
				},
				768:{
					items:2,
				},
				1280:{
					items:3,
				},
				1920:{
					items:4
				},
			}
		});
	}


	// Testimonial Carousel
	if ($('.testimonial-carousel').length) {
		$('.testimonial-carousel').owlCarousel({
			loop:true,
			margin:0,
			nav:false,
			smartSpeed: 700,
			autoplay: 5000,
			navText: [ '<span class="fa fa-angle-left"></span>', '<span class="fa fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				600:{
					items:1
				},
				768:{
					items:2
				},
				1024:{
					items:3
				},
			}
		});
	}

	// Testimonial Carousel Two
	if ($('.testimonial-carousel-two').length) {
		$('.testimonial-carousel-two').owlCarousel({
			loop:true,
			margin:0,
			nav:false,
			smartSpeed: 700,
			autoplay: false,
			navText: [ '<span class="fa fa-angle-left"></span>', '<span class="fa fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				600:{
					items:1
				},
				1140:{
					items:2
				}
			}
		});
	}

	// Testimonial Carousel Three
	if ($('.testimonial-carousel-three').length) {
		$('.testimonial-carousel-three').owlCarousel({
			loop:true,
			margin:0,
			nav:true,
			items:1,
			smartSpeed: 700,
			autoplay: false,
			navText: [ '<span class="flaticon-left-chevron"></span>', '<span class="flaticon-right-arrow"></span>' ],
		});
	}

	// Gallery Carousel
	if ($('.gallery-carousel').length) {
		$('.gallery-carousel').owlCarousel({
			loop:true,
			margin:0,
			nav:false,
			smartSpeed: 700,
			navText: [ '<span class="fa fa-angle-left"></span>', '<span class="fa fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				600:{
					items:2
				},
				768:{
					items:3
				},
				1024:{
					items:4
				},
				1400:{
					items:5
				},
			}
		});
	}

	// Gallery Carousel
	if ($('.gallery-carousel-two').length) {
		$('.gallery-carousel-two').owlCarousel({
			loop:true,
			margin:0,
			nav:false,
			smartSpeed: 700,
			navText: [ '<span class="fa fa-angle-left"></span>', '<span class="fa fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				600:{
					items:2
				},
				991:{
					items:3
				},
				1400:{
					items:4
				},
			}
		});
	}

	// Room Details Page Carousel
	if($('.room-gallery').length){
		var thumbsCarousel = new Swiper('.room-gallery .thumbs-carousel', {
	      spaceBetween: 30,
	      slidesPerView: 4,
	      freeMode: true,
			breakpoints: {
		      320: {       
			      slidesPerView: 4, 
			      spaceBetween: 20,
		      },
		      640: {       
			      slidesPerView: 4, 
			      spaceBetween: 30,
		      } 
		  
		   },
	      watchSlidesVisibility: true,
	      watchSlidesProgress: true,
	    });

	    var imageCarousel = new Swiper('.room-gallery .image-carousel', {
	      spaceBetween: 0,
	      loop:true,
	      navigation: {
	        nextEl: '.swiper-button-next',
	        prevEl: '.swiper-button-prev',
	      },
	      thumbs: {
	        swiper: thumbsCarousel
	      },
	    });
	}

	// Testimonial Section Four Carousel
	if($('.testimonial-section-four').length){
		var thumbsCarousel = new Swiper('.testimonial-section-four .thumbs-carousel', {
	      spaceBetween: 30,
	      slidesPerView: 4,
	      freeMode: true,
	      watchSlidesVisibility: true,
	      watchSlidesProgress: true,
	      breakpoints: {
		      320: {       
			      spaceBetween: 20,
			      slidesPerView: 4, 
		      },
		      640: {       
			      spaceBetween: 30,
			      slidesPerView: 4, 
		      } 
		  
		   }
	    });

	    var contentCarousel = new Swiper('.testimonial-section-four .content-carousel', {
	      spaceBetween: 0,
	      loop:true,
	      effect: 'fade',
		  fadeEffect: {
		    crossFade: true
		  },
	      navigation: {
	        nextEl: '.swiper-button-next',
	        prevEl: '.swiper-button-prev',
	      },
	      thumbs: {
	        swiper: thumbsCarousel
	      },
	    });
	}
	
	//Fact Counter + Text Count
	if($('.count-box').length){
		$('.count-box').appear(function(){
	
			var $t = $(this),
				n = $t.find(".count-text").attr("data-stop"),
				r = parseInt($t.find(".count-text").attr("data-speed"), 10);
				
			if (!$t.hasClass("counted")) {
				$t.addClass("counted");
				$({
					countNum: $t.find(".count-text").text()
				}).animate({
					countNum: n
				}, {
					duration: r,
					easing: "linear",
					step: function() {
						$t.find(".count-text").text(Math.floor(this.countNum));
					},
					complete: function() {
						$t.find(".count-text").text(this.countNum);
					}
				});
			}
			
		},{accY: 0});
	}

	//Tabs Box
	if($('.tabs-box').length){
		$('.tabs-box .tab-buttons .tab-btn').on('click', function(e) {
			e.preventDefault();
			var target = $($(this).attr('data-tab'));
			
			if ($(target).is(':visible')){
				return false;
			}else{
				target.parents('.tabs-box').find('.tab-buttons').find('.tab-btn').removeClass('active-btn');
				$(this).addClass('active-btn');
				target.parents('.tabs-box').find('.tabs-content').find('.tab').fadeOut(0);
				target.parents('.tabs-box').find('.tabs-content').find('.tab').removeClass('active-tab animated fadeIn');
				$(target).fadeIn(300);
				$(target).addClass('active-tab animated fadeIn');
			}
		});
	}

	//Accordion Box
	if($('.accordion-box').length){
		$(".accordion-box").on('click', '.acc-btn', function() {
			
			var outerBox = $(this).parents('.accordion-box');
			var target = $(this).parents('.accordion');
			
			if($(this).hasClass('active')!==true){
				$(outerBox).find('.accordion .acc-btn').removeClass('active ');
			}
			
			if ($(this).next('.acc-content').is(':visible')){
				return false;
			}else{
				$(this).addClass('active');
				$(outerBox).children('.accordion').removeClass('active-block');
				$(outerBox).find('.accordion').children('.acc-content').slideUp(300);
				target.addClass('active-block');
				$(this).next('.acc-content').slideDown(300);	
			}
		});	
	}

	//MixItup Gallery
	if($('.filter-list').length){
	 	 $('.filter-list').mixItUp();
	 }


	//LightBox / Fancybox
	if($('.lightbox-image').length) {
		$('.lightbox-image').fancybox({
			openEffect  : 'fade',
			closeEffect : 'fade',
			helpers : {
				media : {}
			}
		});
	}

	//Contact Form Validation
	if($('#contact-form').length){
		$('#contact-form').validate({
			rules: {
				username: {
					required: true
				},
				email: {
					required: true,
					email: true
				},
				phone: {
					required: true,
				},
				subject: {
					required: true,
				},
				message: {
					required: true
				}
			}
		});
	}
	
	//Custom Seclect Box
	if($('.custom-select-box').length){
		$('.custom-select-box').selectmenu().selectmenu('menuWidget').addClass('overflow');
	}

	//news Tabs
	if($('.room-tabs').length){
		$('.room-tabs .tab-btn').on('click', function(e) {
			e.preventDefault();
			var target = $($(this).attr('data-tab'));
			if ($(target).hasClass('actve-tab')){
				return false;
			}else{
				$('.room-tabs .tab-btn').removeClass('active-btn');
				$(this).addClass('active-btn');
				$('.room-tabs .tabs-content .room-tab').removeClass('active-tab');
				$(target).addClass('active-tab');
			}
		});
	}

	//Sortable Masonary with Filters
	function enableMasonry() {
		if($('.sortable-masonry').length){
	
			var winDow = $(window);
			// Needed variables
			var $container=$('.sortable-masonry .items-container');
			var $filter=$('.filter-btns');
	
			$container.isotope({
				filter:'*',
				 masonry: {
					columnWidth : '.masonry-item.col-lg-4'
				 },
				animationOptions:{
					duration:500,
					easing:'linear'
				}
			});
			
	
			// Isotope Filter 
			$filter.find('li').on('click', function(){
				var selector = $(this).attr('data-filter');
	
				try {
					$container.isotope({ 
						filter	: selector,
						animationOptions: {
							duration: 500,
							easing	: 'linear',
							queue	: false
						}
					});
				} catch(err) {
	
				}
				return false;
			});
	
	
			winDow.on('resize', function(){
				var selector = $filter.find('li.active').attr('data-filter');

				$container.isotope({ 
					filter	: selector,
					animationOptions: {
						duration: 500,
						easing	: 'linear',
						queue	: false
					}
				});
			});
	
	
			var filterItemA	= $('.filter-btns li');
	
			filterItemA.on('click', function(){
				var $this = $(this);
				if ( !$this.hasClass('active')) {
					filterItemA.removeClass('active');
					$this.addClass('active');
				}
			});
		}
	}
	
	enableMasonry();

	// Scroll to a Specific Div
	if($('.scroll-to-target').length){
		$(".scroll-to-target").on('click', function() {
			var target = $(this).attr('data-target');
		   // animate
		   $('html, body').animate({
			   scrollTop: $(target).offset().top
			 }, 1500);
	
		});
	}
	
	// Elements Animation
	if($('.wow').length){
		var wow = new WOW(
		  {
			boxClass:     'wow',      // animated element css class (default is wow)
			animateClass: 'animated', // animation css class (default is animated)
			offset:       0,          // distance to the element when triggering the animation (default is 0)
			mobile:       false,       // trigger animations on mobile devices (default is true)
			live:         true       // act on asynchronously loaded content (default is true)
		  }
		);
		wow.init();
	}


/* ==========================================================================
   When document is Scrollig, do
   ========================================================================== */
	
	$(window).on('scroll', function() {
		headerStyle();
	});
	
/* ==========================================================================
   When document is loading, do
   ========================================================================== */
	
	$(window).on('load', function() {
		handlePreloader();
		enableMasonry();
	});	

})(window.jQuery);