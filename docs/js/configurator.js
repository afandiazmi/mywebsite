<<<<<<< HEAD
var heightNavLiks = (function(){
		var heightAllLink = $('.title-option').outerHeight() * $('.title-option').length + $('#close-conf').outerHeight();
		return heightAllLink;
	})();

// 
$(document).ready(function(){

	// initialize scroll plugin
	initScrollPlugin('#themeWrap');
	initScrollPlugin('#deviceWrap');
	initScrollPlugin('#stylesWrap');
	// Add height in scrolling block
	addHeightScrollBl('#themeWrap');
	addHeightScrollBl('#deviceWrap');
	addHeightScrollBl('#stylesWrap');

	$customizatorBlock = $('#customizeWrap');
	$openCustomBtn = $('#customBtn');
	$closeConfBtn = $('#close-conf');

	$openCustomBtn.on('click', function(){
		$(this).animate({right:'-=100'},300);	
		$('#showMenuBtn').trigger('click');
		$customizatorBlock.addClass('opened');
	});

	// 
	$closeConfBtn.on('click', function(){
		$openCustomBtn.animate({right:'0'},300);
		$customizatorBlock.removeClass('opened');
	});
	// 

	$('.title-option').on('click', function(){
		if (!($(this).hasClass('active'))) {
			$('#customizeWrap').find('.title-option').removeClass('active');
			$(this).addClass('active');
		} else {
			$(this).removeClass('active');
		}
		
	});
	// Select device - active option
	$('.option').on('click', '.click-item',function(){
		$(this).closest('.option').find('.click-item').removeClass('activeLab');
		$(this).addClass('activeLab');
	});
	$('.check-option').on('click', function(){
		$(this).toggleClass('activeLab');
	});
	$('.colors-block').on('click', 'span', function() {
		$(this).closest('.colors-block').find('span').removeClass('activeLab');
		$(this).addClass('activeLab')
	});

	// End initialize 

	// Colopricker
	$("#colorPicker1").spectrum({
	  color: "#e5e5e5",
	  change: function(color) {
	  	console.log("colorpicker 1 - " + color.toHexString());
	  }
	});

	$("#colorPicker2").spectrum({
	  color: "#e5e5e5",
	  change: function(color) {
	    console.log("colorpicker 2 - " + color.toHexString());
	  }
	});

	$("#colorPicker3").spectrum({
	  color: "#e5e5e5",
	  change: function(color) {
	  	console.log("colorpicker 3 - " + color.toHexString());
	  }
	});

	var customColorFont;
	$("#colorPicker4").spectrum({
	  color: "#111111",
	  change: function(color) {
	  	console.log("colorpicker 4 - " + color.toHexString());
	  	customColorFont = color.toHexString()+' important!';
	  	
	  	$('p').each(function(){
	  		console.log(customColorFont);
	  		$(this).css('color', customColorFont);
	  	});
	  }
	});

	$("#colorPicker5").spectrum({
	  color: "#00c59c",
	  change: function(color) {
	  	console.log("colorpicker 5 - " + color.toHexString());
	  	$('body').css('background', color.toHexString());
	  }
	});

	// Show the original input to demonstrate the value changing when calling `set`
	$("#colorPicker1, #colorPicker2, #colorPicker3, #colorPicker4, #colorPicker5").show();

	$(".colorPick").keyup(function(event) {
		if(event.keyCode==13) {
			$(this).spectrum("set", $(this).val());
			console.log($(this).val());
		}
	});
	// 
	$('.colors-block').on('click', 'span', function(){
		console.log($(this).css('background-color'));
		$(this).closest('.color-mode').find('.colorPick').spectrum("set", $(this).css('background-color'));
	});

	// opened window in options
	var positionWindow;
	$cusmizeWindow = $('#cusmizeWindow');
	$('.stylizeLabel').on('click', function(){
		$('.stylizeLabel').each(function() {
			$(this).removeClass('active');
		});
		$this = $(this);
		$this.addClass('active');
		$this.parent().attr('contenteditable', 'true');
		$cusmizeWindow.addClass('active').css({
			'top' : $this.offset().top -120,
			'left': $this.offset().left - 30
		});
	});

	var nameOptionBlock;
	$('.optionBlock').on('click', function() {
		removeActiveClass('optionBlock');
		$(this).addClass('active');
		nameOptionBlock = '#' + $(this).attr('data-option-block');
		
		$(nameOptionBlock).addClass('active').css({
			'top' : $(this).offset().top + 15,
			'left': $(this).offset().left - 30
		});

		$('.closeVariantBlock').on('click', function() {
			removeActiveClass('optionBlock');
			$(this).closest('.variant-wrap ').removeClass('active');
		});
		//
	});

	$('.variant').on('click', function() {
		var $this = $(this);
		$this.closest('.variant-wrap').find('.variant').removeClass('active');
		$this.addClass('active');
	});

	$('#textModify').on('click', 'span', function() {
		$('.stylizeLabel.active').parent().css('text-align', $(this).attr('class'));
	});

	$('#ModifyPosition').on('click', 'span', function() {
		$('.stylizeLabel.active').parent().css('float', $(this).attr('class'));
	});

	var bgImgPattern;
	$('#backgroundModify').on('click', 'span', function() {
		bgImgPattern = 'url('+ $(this).find('img').attr('src')+ ')';
		$('body').css('background', bgImgPattern);
	});

	$('#closeModify').click(function() {
		$('#cusmizeWindow').removeClass('active');
	}); 

});

$(window).resize(function(){
	// Resize height in scrolling block
	addHeightScrollBl('#themeWrap');
	addHeightScrollBl('#deviceWrap');
	addHeightScrollBl('#stylesWrap');
});

// FUNCTION LIST
function removeActiveClass(className) {
	$('.' + className).each(function(){
		$(this).removeClass('active');
	});
}

var maxHeigthBlock;

function initScrollPlugin(id){
	if ($(id).length > 0) {
		$(id +  ' .wrap').scrollbar({
			ignoreMobile: false,
			disableBodyScroll: true
		});
	};	
}

var maxHeigthBlock;
function addHeightScrollBl(id){
	maxHeigthBlock = $('#customizeWrap').outerHeight() - heightNavLiks;

		$(id + ' .scroll-wrapper').css({
			'display' : 'table', 
			'height': 'auto'
		});
		$(id + ' .scroll-wrapper .wrap').css({
			'display' : 'table'
		});

	if ($(id + ' .wrap').height() > maxHeigthBlock) {
		$(id + ' .scroll-wrapper').css({
			'display' : 'block', 
			'height': maxHeigthBlock + 24
		});
		$(id + ' .scroll-wrapper .wrap').css({
			'display' : 'block'
		});
	}
}
=======
var heightNavLiks = (function(){
		var heightAllLink = $('.title-option').outerHeight() * $('.title-option').length + $('#close-conf').outerHeight();
		return heightAllLink;
	})();

// 
$(document).ready(function(){

	// initialize scroll plugin
	initScrollPlugin('#themeWrap');
	initScrollPlugin('#deviceWrap');
	initScrollPlugin('#stylesWrap');
	// Add height in scrolling block
	addHeightScrollBl('#themeWrap');
	addHeightScrollBl('#deviceWrap');
	addHeightScrollBl('#stylesWrap');

	$customizatorBlock = $('#customizeWrap');
	$openCustomBtn = $('#customBtn');
	$closeConfBtn = $('#close-conf');

	$openCustomBtn.on('click', function(){
		$(this).animate({right:'-=100'},300);	
		$('#showMenuBtn').trigger('click');
		$customizatorBlock.addClass('opened');
	});

	// 
	$closeConfBtn.on('click', function(){
		$openCustomBtn.animate({right:'0'},300);
		$customizatorBlock.removeClass('opened');
	});
	// 

	$('.title-option').on('click', function(){
		if (!($(this).hasClass('active'))) {
			$('#customizeWrap').find('.title-option').removeClass('active');
			$(this).addClass('active');
		} else {
			$(this).removeClass('active');
		}
		
	});
	// Select device - active option
	$('.option').on('click', '.click-item',function(){
		$(this).closest('.option').find('.click-item').removeClass('activeLab');
		$(this).addClass('activeLab');
	});
	$('.check-option').on('click', function(){
		$(this).toggleClass('activeLab');
	});
	$('.colors-block').on('click', 'span', function() {
		$(this).closest('.colors-block').find('span').removeClass('activeLab');
		$(this).addClass('activeLab')
	});

	// End initialize 

	// Colopricker
	$("#colorPicker1").spectrum({
	  color: "#e5e5e5",
	  change: function(color) {
	  	console.log("colorpicker 1 - " + color.toHexString());
	  }
	});

	$("#colorPicker2").spectrum({
	  color: "#e5e5e5",
	  change: function(color) {
	    console.log("colorpicker 2 - " + color.toHexString());
	  }
	});

	$("#colorPicker3").spectrum({
	  color: "#e5e5e5",
	  change: function(color) {
	  	console.log("colorpicker 3 - " + color.toHexString());
	  }
	});

	var customColorFont;
	$("#colorPicker4").spectrum({
	  color: "#111111",
	  change: function(color) {
	  	console.log("colorpicker 4 - " + color.toHexString());
	  	customColorFont = color.toHexString()+' important!';
	  	
	  	$('p').each(function(){
	  		console.log(customColorFont);
	  		$(this).css('color', customColorFont);
	  	});
	  }
	});

	$("#colorPicker5").spectrum({
	  color: "#00c59c",
	  change: function(color) {
	  	console.log("colorpicker 5 - " + color.toHexString());
	  	$('body').css('background', color.toHexString());
	  }
	});

	// Show the original input to demonstrate the value changing when calling `set`
	$("#colorPicker1, #colorPicker2, #colorPicker3, #colorPicker4, #colorPicker5").show();

	$(".colorPick").keyup(function(event) {
		if(event.keyCode==13) {
			$(this).spectrum("set", $(this).val());
			console.log($(this).val());
		}
	});
	// 
	$('.colors-block').on('click', 'span', function(){
		console.log($(this).css('background-color'));
		$(this).closest('.color-mode').find('.colorPick').spectrum("set", $(this).css('background-color'));
	});

	// opened window in options
	var positionWindow;
	$cusmizeWindow = $('#cusmizeWindow');
	$('.stylizeLabel').on('click', function(){
		$('.stylizeLabel').each(function() {
			$(this).removeClass('active');
		});
		$this = $(this);
		$this.addClass('active');
		$this.parent().attr('contenteditable', 'true');
		$cusmizeWindow.addClass('active').css({
			'top' : $this.offset().top -120,
			'left': $this.offset().left - 30
		});
	});

	var nameOptionBlock;
	$('.optionBlock').on('click', function() {
		removeActiveClass('optionBlock');
		$(this).addClass('active');
		nameOptionBlock = '#' + $(this).attr('data-option-block');
		
		$(nameOptionBlock).addClass('active').css({
			'top' : $(this).offset().top + 15,
			'left': $(this).offset().left - 30
		});

		$('.closeVariantBlock').on('click', function() {
			removeActiveClass('optionBlock');
			$(this).closest('.variant-wrap ').removeClass('active');
		});
		//
	});

	$('.variant').on('click', function() {
		var $this = $(this);
		$this.closest('.variant-wrap').find('.variant').removeClass('active');
		$this.addClass('active');
	});

	$('#textModify').on('click', 'span', function() {
		$('.stylizeLabel.active').parent().css('text-align', $(this).attr('class'));
	});

	$('#ModifyPosition').on('click', 'span', function() {
		$('.stylizeLabel.active').parent().css('float', $(this).attr('class'));
	});

	var bgImgPattern;
	$('#backgroundModify').on('click', 'span', function() {
		bgImgPattern = 'url('+ $(this).find('img').attr('src')+ ')';
		$('body').css('background', bgImgPattern);
	});

	$('#closeModify').click(function() {
		$('#cusmizeWindow').removeClass('active');
	}); 

});

$(window).resize(function(){
	// Resize height in scrolling block
	addHeightScrollBl('#themeWrap');
	addHeightScrollBl('#deviceWrap');
	addHeightScrollBl('#stylesWrap');
});

// FUNCTION LIST
function removeActiveClass(className) {
	$('.' + className).each(function(){
		$(this).removeClass('active');
	});
}

var maxHeigthBlock;

function initScrollPlugin(id){
	if ($(id).length > 0) {
		$(id +  ' .wrap').scrollbar({
			ignoreMobile: false,
			disableBodyScroll: true
		});
	};	
}

var maxHeigthBlock;
function addHeightScrollBl(id){
	maxHeigthBlock = $('#customizeWrap').outerHeight() - heightNavLiks;

		$(id + ' .scroll-wrapper').css({
			'display' : 'table', 
			'height': 'auto'
		});
		$(id + ' .scroll-wrapper .wrap').css({
			'display' : 'table'
		});

	if ($(id + ' .wrap').height() > maxHeigthBlock) {
		$(id + ' .scroll-wrapper').css({
			'display' : 'block', 
			'height': maxHeigthBlock + 24
		});
		$(id + ' .scroll-wrapper .wrap').css({
			'display' : 'block'
		});
	}
}
>>>>>>> f1d1f69375724cf15a401819f081afc3dfdd9df0
