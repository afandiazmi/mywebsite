var $body = $('body'),
		$logoClass = $('.logo'),
		$blockSmMenu = $('#smallMenu'),
		$mainNav = $('#mainNav'),
		$moreBtn = $('#more-btn'),
		$menuScrolling = $('#menuScrolling'),
		$menuClickBtn = $('#menuClickBtn'),
		$content = $('.header, .page, .main-top, .footer'),
		$interceptScroll = $('#interceptScroll'),
		$showMenuBtn = $('#showMenuBtn');

var deviceTap = (function(){
	if ( navigator.userAgent.match(/iPad|iPhone|Android/i)) {
		return 'touchstart';
	} else return 'click';
})();

(function(){
	$('.copy-btn').each(function(index){
		$(this).attr('id', 'copyBtn' + index);
	});
}) ()

// Height links in left menu
var lengthLinkM = $('.link-menu').length,
		heightOneL = $('.link-menu').height(),
		heightLinkM = heightOneL * lengthLinkM;

$(document).ready(function() {

	/* MENU */ 
  $logoClass.on(deviceTap, function(){
	$('#close-conf').trigger(deviceTap);
	$blockSmMenu.toggleClass('animHide');  });

  $body.scrollspy({ target: '#mainNav'});

 	if ( !(navigator.userAgent.match(/iPad|iPhone|Android/i))){
 		$('#menuScrolling > li').each(function(index){
			$(this).attr('data-indx', index);
		});

		$('#mainNav').on('activate.bs.scrollspy', function() {	  
		  this.heightActiveL = $('#menuScrolling .active')
		  	.attr('data-indx') * heightOneL
		  scrollInMenu(this.heightActiveL, 200);
		})
 	}	  

	$menuClickBtn.on(deviceTap, function(){
		console.log(222);
		$mainNav.toggleClass('closeMenu');
		$content.addClass('marginLeft');
		$menuClickBtn.fadeOut();
		$blockSmMenu.addClass('animHide');
		$('#close-conf').trigger(deviceTap);
	});

	// on click #more-btn scroll to last element in menu
	$moreBtn.on(deviceTap, function() {
		scrollInMenu(2500, 200);
	});	

	$('.addColor').each(function(){
		var bgColorRow = $(this).closest('article').css('background-color');
		$(this).css('fill', bgColorRow);
	});

	// Remove open menu after load page in ipads and phones 
	if ($body.width() < 1210) {
		$mainNav.addClass('closeMenu');
		$content.removeClass('marginLeft');
		$menuClickBtn.fadeIn();
		setTimeout(function(){
			$mainNav.removeClass('offMenu');
		}, 400);
	};

	// 
	$body.on(deviceTap, function(e){
		if (!$(e.target).hasClass('logo') && !$(e.target).hasClass('smMenuLink') && !$(e.target).hasClass('menuBtn')) {
			$blockSmMenu.addClass('animHide');
		};  
  }); 
	
	/* SHOWING MENU */
	$showMenuBtn.on(deviceTap, function(event){
	 	$mainNav.addClass('closeMenu');
	 	$content.removeClass('marginLeft');
	 	$menuClickBtn.fadeIn(200);
	 	event.stopPropagation();
	 });

	$interceptScroll.on(deviceTap, function(){
		$showMenuBtn.trigger(deviceTap);
		return false;
	});

	$('.code-block').scrollbar({
		ignoreMobile: false,
		disableBodyScroll: true
	});
	
	$('.load-more-btn').on(deviceTap, function() {
		var $btn = $(this),
				icons = $btn.data('icons'),
				$stat = $btn.prev('.galery-icon-wrap');
		$stat.toggleClass('hideIcons');		

		if ($stat.hasClass('hideIcons')) {
			$btn.animate({
				opacity: '0'
			}, function() {
				$btn.text('Load more...');
				$btn.closest('div')
					.find('.load-container')
						.empty();
			});
			$btn.animate({opacity: '1'});
			setTimeout(function(){
				// 
				var num = $btn.closest('div').offset().top;
				$body.animate({
				  	scrollTop: $btn.closest('div').offset().top - 30
					}, 300);
				// 
			},0);
				
		}	else {
			$btn.animate({
				opacity: '0'
			}, function() {
				$('.load-container').each(function(){
					$(this).empty();
				});

				$btn.text('Hide')
				.closest('div')
					.find('.load-container')
						.load('ajax/'+icons+ '.html');
			});
			$btn.animate({ opacity: '1'});
		}
		
		return false;
	});

	// hover in menu link
	$menuScrolling.on('mouseover', '.link-menu',function() {
		$(this).prev().addClass('thirdHover');
    $(this).prev().prev().addClass('firstHover');
	});

	$menuScrolling.on('mouseleave', '.link-menu',function() {
		$(this).prev().removeClass('thirdHover');
    $(this).prev().prev().removeClass('firstHover');
	});

	// Initialize selectBox.js
	$('select').selectBox({
		menuSpeed: 'fast',
		menuTransition: 'slide'
	});
	
	function initCopyClip(elem) {
		var clickBtn = new ZeroClipboard(elem);
		clickBtn.on( "copy", function (event) {
			var targetText = elem.closest('div').find('.copied').text();
			var clipboard = event.clipboardData;
		  clipboard.setData( "text/plain", targetText );
		  showAlertMsg();
		});
	}

	setTimeout(function(){
		addHeightScr();
	}, 0);
	
	//
	var thisClickLab;
	$(".label-photo").on(deviceTap, $('.wrap-pie-block'), function(){
		thisClickLab = $(this).attr("data-click-lab");
		$('.highlight-label').each(function() {
			 if ($(this).attr("data-click-lab") == thisClickLab) {
			 	$(this).addClass('bgColorLab');
			 	setTimeout(function(){
			 		$('.container').find('.highlight-label').removeClass('bgColorLab');
			 	}, 4300);
			 };
		});
	});
	// -----------------

	// create button for copying code
	// initialize zeroclipboard plugin
	for(var i= 0; i < $('.copy-btn').length; i++){
		this.elemClipTxt = '#copyBtn' + i;
		initCopyClip($(this.elemClipTxt));
	};

	var $copyNonFormated = $('#copyNonFormated'),
			clickBtnF = new ZeroClipboard($copyNonFormated);
	clickBtnF.on( "copy", function (event) {

		var targetText = $('#insertSyntaxCode').html(),
				clipboard = event.clipboardData;
	  clipboard.setData( "text/plain", targetText );
	  showAlertMsg();
	});

	// init functions
	autoscrollM();
	initScrollbarMenu();
	autoUpdateHMenu();
	 
});  

// -------------------------------
/* DOCUMENT RESIZE */
$(window).resize(function(){
	addHeightScr();
	autoUpdateHMenu();
});

// -------------------------------
/* FUNCTION LIST */
function showAlertMsg() {
	$('#alert-msg').fadeIn();
	setTimeout(function(){
		$('#alert-msg').fadeOut();
	}, 2000);
}

function addHeightScr() {
	$('.unitHeight').each(function(){
		var $this = $(this),
				thisHeight = $this.height();

		$this.parent().find('.code-wrapper').css({
			'height' : thisHeight
		});
		$this.parent().find('.code-wrapper > div').css({
			'height' : thisHeight - 40,
			'max-height' : 10000,
			'top' : 20
		});
	});
}

function initScrollbarMenu() {
	$menuScrolling.scrollbar({
		ignoreMobile: false,
		disableBodyScroll: true
	});	
}

function autoUpdateHMenu() {
	$('#mainNav > .nav').height( $mainNav.height() - $showMenuBtn.height() - $moreBtn.height() -5 );
}

function autoscrollM() {
	this.scrolledEl = window.innerHeight / $('.link-menu').height() -4;
}

function scrollInMenu(position, speed){
	if (position) {
		$menuScrolling.animate({
		  scrollTop: position - 47
		 }, speed);
		return false;
	};
}
