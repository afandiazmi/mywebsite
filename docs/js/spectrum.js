(function (window, $, undefined) {
  "use strict";
  var defaultOpts = {
    // Callbacks
    beforeShow: noop,
    move: noop,
    change: noop,
    show: noop,
    hide: noop,

    // Options
    color: false,
    allowEmpty: false,
    showButtons: true,
    appendTo: "body",
    preferredFormat: 'hex',   
    disabled: false
  },
  spectrums = [],
  IE = !!/msie/i.exec( window.navigator.userAgent ),
    rgbaSupport = (function() {
      function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
      }

      var elem = document.createElement('div');
      var style = elem.style;
      style.cssText = 'background-color:rgba(0,0,0,.5)';
      return contains(style.backgroundColor, 'rgba');
    })(),
    inputTypeColorSupport = (function() {
      var colorInput = $("<input type='color' value='!' />")[0];
      return colorInput.type === "color" && colorInput.value !== "!";
    })(),
    replaceInput = [
      "<div class='sp-preview'><span>...</span><div class='sp-preview-inner'></div></div>"
    ].join(''),
    markup = (function () {
      // IE does not support gradients with multiple stops, so we need to simulate
      //  that for the rainbow slider with 8 divs that each have a single gradient
        var gradientFix = "";
        if (IE) {
          for (var i = 1; i <= 6; i++) {
            gradientFix += "<div class='sp-" + i + "'></div>";
          }
        }
        return [
            "<div class='sp-container sp-hidden'>",
              "<div class='sp-picker-container'>",
                  "<div class='sp-top sp-cf'>",
                      "<div class='sp-fill'></div>",
                      "<div class='sp-top-inner'>",
                          "<div class='sp-color'>",
                            "<div class='sp-sat'>",
                              "<div class='sp-val'>",
                                "<div class='sp-dragger'></div>",
                              "</div>",
                            "</div>",
                            "</div>",
                            "</div>",
                            "<div class='sp-hue'>",
                                "<div class='sp-slider'></div>",
                                gradientFix,
                            "</div>",
                        "</div>",                        
                    "</div>",
                    "<div class='sp-button-container sp-cf'>",
                        "<button type='button' class='sp-close'>Close</button>",
                        "<button type='button' class='sp-choose'>Choose</button>",
                    "</div>",
                "</div>",
            "</div>"
        ].join("");
    })();

    function hideAll() {
      for (var i = 0; i < spectrums.length; i++) {
        if (spectrums[i]) {
          spectrums[i].hide();
        }
      }
    }

    function instanceOptions(o, callbackContext) {
      var opts = $.extend({}, defaultOpts, o);
      opts.callbacks = {
        'move': bind(opts.move, callbackContext),
        'change': bind(opts.change, callbackContext),
        'show': bind(opts.show, callbackContext),
        'hide': bind(opts.hide, callbackContext),
        'beforeShow': bind(opts.beforeShow, callbackContext)
      };
      return opts;
    }

    function spectrum(element, o) {
      var opts = instanceOptions(o, element),
          flat = opts.flat,
          callbacks = opts.callbacks,
          resize = throttle(reflow, 10),
          visible = false,
          dragWidth = 0,
          dragHeight = 0,
          dragHelperHeight = 0,
          slideHeight = 0,
          slideWidth = 0,
          alphaWidth = 0,
          alphaSlideHelperWidth = 0,
          slideHelperHeight = 0,
          currentHue = 0,
          currentSaturation = 0,
          currentValue = 0,
          currentAlpha = 1,
          palette = [],
          paletteArray = [],
          paletteLookup = {},
          draggingClass = "sp-dragging",
          shiftMovementDirection = null;

      var doc = element.ownerDocument,
          body = doc.body,
          boundElement = $(element),
          disabled = false,
          container = $(markup, doc),
          pickerContainer = container.find(".sp-picker-container"),
          dragger = container.find(".sp-color"),
          dragHelper = container.find(".sp-dragger"),
          slider = container.find(".sp-hue"),
          slideHelper = container.find(".sp-slider"),
          alphaSlider = container.find(".sp-alpha"),
          alphaSlideHelper = container.find(".sp-alpha-handle"),
          textInput = container.find(".sp-input"),
          spCloseBtn = container.find(".sp-close"),
          chooseButton = container.find(".sp-choose"),
          toggleButton = container.find(".sp-palette-toggle"),
          isInput = boundElement.is("input"),
          isInputTypeColor = isInput && inputTypeColorSupport && boundElement.attr("type") === "color",
          shouldReplace = isInput && !flat,
          replacer = (shouldReplace) ? $(replaceInput).addClass(opts.className) : $([]),
          offsetElement = (shouldReplace) ? replacer : boundElement,
          previewElement = replacer.find(".sp-preview-inner"),
          initialColor = opts.color || (isInput && boundElement.val()),
          colorOnShow = false,
          preferredFormat = opts.preferredFormat,
          currentPreferredFormat = preferredFormat,
          isEmpty = !initialColor,
          allowEmpty = opts.allowEmpty && !isInputTypeColor;

        function applyOptions() {
          if (opts.palette) {
            palette = opts.palette.slice(0);
            paletteArray = $.isArray(palette[0]) ? palette : [palette];
            paletteLookup = {};
            for (var i = 0; i < paletteArray.length; i++) {
              for (var j = 0; j < paletteArray[i].length; j++) {
                var rgb = tinycolor(paletteArray[i][j]).toRgbString();
                paletteLookup[rgb] = true;
              }
            }
          }
          
          container.toggleClass("sp-clear-enabled", allowEmpty);
          container.toggleClass("sp-buttons-disabled", !opts.showButtons);
          reflow();
        }
        function initialize() {
          
          if (IE) {
            container.find("*:not(input)").attr("unselectable", "on");
          }
          applyOptions();
          if (shouldReplace) {
            boundElement.after(replacer).hide();
          }
          
          if (flat) {
            boundElement.after(container).hide();
          }
          else {
            var appendTo = opts.appendTo === "parent" ? boundElement.parent() : $(opts.appendTo);
            if (appendTo.length !== 1) {
              appendTo = $("body");
            }
            appendTo.append(container);
          }

          offsetElement.bind("click.spectrum touchstart.spectrum", function (e) {
            if (!disabled) {
              toggle();
            }
            e.stopPropagation();
            if (!$(e.target).is("input")) {
              e.preventDefault();
            }
          });
          if(boundElement.is(":disabled") || (opts.disabled === true)) {
            disable();
          }
          // Prevent clicks from bubbling up to document.  This would cause it to be hidden.
          container.click(stopPropagation);

          // Handle user typed input
          textInput.bind("paste", function () {
            setTimeout(setFromTextInput, 1);
          });
          textInput.keydown(function (e) { if (e.keyCode == 13) { setFromTextInput(); } });

          chooseButton.bind("click.spectrum", function (e) {
            e.stopPropagation();
            e.preventDefault();

            if (isValid()) {
              updateOriginalInput(true);
              hide();
            }
          });

          spCloseBtn.click(function() {
            $('body').trigger('click');
          });
          
          toggleButton.bind("click.spectrum", function (e) {
            e.stopPropagation();
            e.preventDefault();
            applyOptions();
          });

          draggable(alphaSlider, function (dragX, dragY, e) {
            currentAlpha = (dragX / alphaWidth);
            isEmpty = false;
            if (e.shiftKey) {
              currentAlpha = Math.round(currentAlpha * 10) / 10;
            }

            move();
          }, dragStart, dragStop);

          draggable(slider, function (dragX, dragY) {
            currentHue = parseFloat(dragY / slideHeight);
            isEmpty = false;
            move();
          }, dragStart, dragStop);

          draggable(dragger, function (dragX, dragY, e) {
            if (!e.shiftKey) {
              shiftMovementDirection = null;
            }
            else if (!shiftMovementDirection) {
              var oldDragX = currentSaturation * dragWidth;
              var oldDragY = dragHeight - (currentValue * dragHeight);
              var furtherFromX = Math.abs(dragX - oldDragX) > Math.abs(dragY - oldDragY);
              shiftMovementDirection = furtherFromX ? "x" : "y";
            }

            var setSaturation = !shiftMovementDirection || shiftMovementDirection === "x";
            var setValue = !shiftMovementDirection || shiftMovementDirection === "y";
            if (setSaturation) {
              currentSaturation = parseFloat(dragX / dragWidth);
            }
            if (setValue) {
              currentValue = parseFloat((dragHeight - dragY) / dragHeight);
            }

            isEmpty = false;
            move();

          }, dragStart, dragStop);

          if (!!initialColor) {
            set(initialColor);
            updateUI();
            currentPreferredFormat = preferredFormat || tinycolor(initialColor).format;
          }

          function paletteElementClick(e) {
            if (e.data && e.data.ignore) {
              set($(e.target).closest(".sp-thumb-el").data("color"));
              move();
            }
            else {
              set($(e.target).closest(".sp-thumb-el").data("color"));
              move();
              updateOriginalInput(true);
              hide();
            }
            return false;
          }
        }

        function dragStart() {
          if (dragHeight <= 0 || dragWidth <= 0 || slideHeight <= 0) {
            reflow();
          }
          container.addClass(draggingClass);
          shiftMovementDirection = null;
          boundElement.trigger('dragstart.spectrum', [ get() ]);
        }

        function dragStop() {
          container.removeClass(draggingClass);
          boundElement.trigger('dragstop.spectrum', [ get() ]);
        }

        function toggle() {
          if (visible) {
            hide();
          }
          else {
            show();
          }
        }

        function show() {
          var event = $.Event('beforeShow.spectrum');

          if (visible) {
            reflow();
            return;
          }

          boundElement.trigger(event, [ get() ]);

          if (callbacks.beforeShow(get()) === false || event.isDefaultPrevented()) {
            return;
          }

          hideAll();
          visible = true;

          $(doc).bind("click.spectrum", hide);
          $(window).bind("resize.spectrum", resize);
          replacer.addClass("sp-active");
          container.removeClass("sp-hidden");

          reflow();
          updateUI();

          colorOnShow = get();

          callbacks.show(colorOnShow);
          boundElement.trigger('show.spectrum', [ colorOnShow ]);
        }

        function hide(e) {
          // Return on right click
          if (e && e.type == "click" && e.button == 2) { return; }
          // Return if hiding is unnecessary
          if (!visible || flat) { return; }
          visible = false;

          $(doc).unbind("click.spectrum", hide);
          $(window).unbind("resize.spectrum", resize);

          replacer.removeClass("sp-active");
          container.addClass("sp-hidden");
          var colorHasChanged = !tinycolor.equals(get(), colorOnShow);
          callbacks.hide(get());
          boundElement.trigger('hide.spectrum', [ get() ]);
        }

        function revert() {
          set(colorOnShow, true);
        }

        function set(color, ignoreFormatChange) {
          if (tinycolor.equals(color, get())) {
            // Update UI just in case a validation error needs
            // to be cleared.
            updateUI();
            return;
          }

          var newColor, newHsv;
          if (!color && allowEmpty) {
            isEmpty = true;
          } else {
            isEmpty = false;
            newColor = tinycolor(color);
            newHsv = newColor.toHsv();

            currentHue = (newHsv.h % 360) / 360;
            currentSaturation = newHsv.s;
            currentValue = newHsv.v;
            currentAlpha = newHsv.a;
          }
          updateUI();

          if (newColor && newColor.isValid() && !ignoreFormatChange) {
            currentPreferredFormat = preferredFormat || newColor.getFormat();
          }
        }

        function get(opts) {
          opts = opts || { };
          if (allowEmpty && isEmpty) {
            return null;
          }

          return tinycolor.fromRatio({
            h: currentHue,
            s: currentSaturation,
            v: currentValue,
            a: Math.round(currentAlpha * 100) / 100
          }, { format: opts.format || currentPreferredFormat });
        }

        function isValid() {
          return !textInput.hasClass("sp-validation-error");
        }

        function move() {
          updateUI();
          callbacks.move(get());
          boundElement.trigger('move.spectrum', [ get() ]);
        }

        function updateUI() {
          textInput.removeClass("sp-validation-error");
          updateHelperLocations();

          // Update dragger background color (gradients take care of saturation and value).
          var flatColor = tinycolor.fromRatio({ h: currentHue, s: 1, v: 1 });
          dragger.css("background-color", flatColor.toHexString());

          // Get a format that alpha will be included in (hex and names ignore alpha)
          var format = currentPreferredFormat;
          if (currentAlpha < 1 && !(currentAlpha === 0 && format === "name")) {
            if (format === "hex" || format === "hex3" || format === "hex6" || format === "name") {
              format = "rgb";
            }
          }

          var realColor = get({ format: format }),
              displayColor = '';

          //reset background info for preview element
          previewElement.removeClass("sp-clear-display");
          previewElement.css('background-color', 'transparent');

          if (!realColor && allowEmpty) {
            // Update the replaced elements background with icon indicating no color selection
            previewElement.addClass("sp-clear-display");
          } else {
              var realHex = realColor.toHexString(),
                  realRgb = realColor.toRgbString();

              // Update the replaced elements background color (with actual selected color)
              if (rgbaSupport || realColor.alpha === 1) {
                previewElement.css("background-color", realRgb);
              } else {
                previewElement.css("background-color", "transparent");
                previewElement.css("filter", realColor.toFilter());
              }

              displayColor = realColor.toString(format);
            }
        }

        function updateHelperLocations() {
          var s = currentSaturation;
          var v = currentValue;

          if(allowEmpty && isEmpty) {
            //if selected color is empty, hide the helpers
            alphaSlideHelper.hide();
            slideHelper.hide();
            dragHelper.hide();
          }
          else {
            //make sure helpers are visible
            alphaSlideHelper.show();
            slideHelper.show();
            dragHelper.show();

            // Where to show the little circle in that displays your current selected color
            var dragX = s * dragWidth;
            var dragY = dragHeight - (v * dragHeight);
            dragX = Math.max(
              -dragHelperHeight,
              Math.min(dragWidth - dragHelperHeight, dragX - dragHelperHeight)
            );
            dragY = Math.max(
              -dragHelperHeight,
              Math.min(dragHeight - dragHelperHeight, dragY - dragHelperHeight)
            );
            dragHelper.css({
              "top": dragY + "px",
              "left": dragX + "px"
            });

            var alphaX = currentAlpha * alphaWidth;
            alphaSlideHelper.css({
              "left": (alphaX - (alphaSlideHelperWidth / 2)) + "px"
            });

            // Where to show the bar that displays your current selected hue
            var slideY = (currentHue) * slideHeight;
            slideHelper.css({
              "top": (slideY - slideHelperHeight) + "px"
            });
          }
        }

        function updateOriginalInput(fireCallback) {
          var color = get(),
            displayColor = '',
            hasChanged = !tinycolor.equals(color, colorOnShow);

          if (color) {
            displayColor = color.toString(currentPreferredFormat);
          }

          if (isInput) {
            boundElement.val(displayColor);
          }

          colorOnShow = color;

          if (fireCallback && hasChanged) {
            callbacks.change(color);
            boundElement.trigger('change', [ color ]);
          }
        }

        function reflow() {
          dragWidth = dragger.width();
          dragHeight = dragger.height();
          dragHelperHeight = dragHelper.height();
          slideWidth = slider.width();
          slideHeight = slider.height();
          slideHelperHeight = slideHelper.height();
          alphaWidth = alphaSlider.width();
          alphaSlideHelperWidth = alphaSlideHelper.width();

          if (!flat) {
            container.css("position", "absolute");
            container.offset(getOffset(container, offsetElement));
          }

          updateHelperLocations();
          boundElement.trigger('reflow.spectrum');
        }

        function destroy() {
          boundElement.show();
          offsetElement.unbind("click.spectrum touchstart.spectrum");
          container.remove();
          replacer.remove();
          spectrums[spect.id] = null;
        }

        initialize();

        var spect = {
          show: show,
          hide: hide,
          toggle: toggle,
          reflow: reflow,
          set: function (c) {
            set(c);
            updateOriginalInput();
          },
          get: get,
          destroy: destroy,
          container: container
        };

        spect.id = spectrums.push(spect) - 1;

        return spect;
    }

    /**
    * checkOffset - get the offset below/above and left/right element depending on screen position
    * Thanks https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.datepicker.js
    */
    function getOffset(picker, input) {
      var extraY = 0;
      var dpWidth = picker.outerWidth();
      var dpHeight = picker.outerHeight();
      var inputHeight = input.outerHeight();
      var doc = picker[0].ownerDocument;
      var docElem = doc.documentElement;
      var viewWidth = docElem.clientWidth + $(doc).scrollLeft();
      var viewHeight = docElem.clientHeight + $(doc).scrollTop();
      var offset = input.offset();
      offset.top += inputHeight;

      offset.left -=
        Math.min(offset.left, (offset.left + dpWidth > viewWidth && viewWidth > dpWidth) ?
        Math.abs(offset.left + dpWidth - viewWidth) : 0);

      offset.top -=
        Math.min(offset.top, ((offset.top + dpHeight > viewHeight && viewHeight > dpHeight) ?
        Math.abs(dpHeight + inputHeight - extraY) : extraY));

      return offset;
    }

    /* noop - do nothing */
    function noop() {  }

    /* stopPropagation - makes the code only doing this a little easier to read in line */
    function stopPropagation(e) {
      e.stopPropagation();
    }

    /**
    * Create a function bound to a given object
    * Thanks to underscore.js
    */
    function bind(func, obj) {
      var slice = Array.prototype.slice;
      var args = slice.call(arguments, 2);
      return function () {
        return func.apply(obj, args.concat(slice.call(arguments)));
      };
    }

    /**
    * Lightweight drag helper.  Handles containment within the element, so that
    * when dragging, the x is within [0,element.width] and y is within [0,element.height]
    */
    function draggable(element, onmove, onstart, onstop) {
      onmove = onmove || function () { };
      onstart = onstart || function () { };
      onstop = onstop || function () { };
      var doc = element.ownerDocument || document;
      var dragging = false;
      var offset = {};
      var maxHeight = 0;
      var maxWidth = 0;
      var hasTouch = ('ontouchstart' in window);

      var duringDragEvents = {};
      duringDragEvents["selectstart"] = prevent;
      duringDragEvents["dragstart"] = prevent;
      duringDragEvents["touchmove mousemove"] = move;
      duringDragEvents["touchend mouseup"] = stop;

      function prevent(e) {
        if (e.stopPropagation) {
          e.stopPropagation();
        }
        if (e.preventDefault) {
          e.preventDefault();
        }
        e.returnValue = false;
      }

      function move(e) {
        if (dragging) {
          // Mouseup happened outside of window
          if (IE && document.documentMode < 9 && !e.button) {
            return stop();
          }

          var touches = e.originalEvent.touches;
          var pageX = touches ? touches[0].pageX : e.pageX;
          var pageY = touches ? touches[0].pageY : e.pageY;

          var dragX = Math.max(0, Math.min(pageX - offset.left, maxWidth));
          var dragY = Math.max(0, Math.min(pageY - offset.top, maxHeight));

          if (hasTouch) {
            // Stop scrolling in iOS
            prevent(e);
          }

          onmove.apply(element, [dragX, dragY, e]);
        }
      }

      function start(e) {
        var rightclick = (e.which) ? (e.which == 3) : (e.button == 2);
        var touches = e.originalEvent.touches;

        if (!rightclick && !dragging) {
          if (onstart.apply(element, arguments) !== false) {
            dragging = true;
            maxHeight = $(element).height();
            maxWidth = $(element).width();
            offset = $(element).offset();

            $(doc).bind(duringDragEvents);
            $(doc.body).addClass("sp-dragging");

            if (!hasTouch) {
              move(e);
            }

            prevent(e);
          }
        }
      }

      function stop() {
        if (dragging) {
          $(doc).unbind(duringDragEvents);
          $(doc.body).removeClass("sp-dragging");
          onstop.apply(element, arguments);
        }
        dragging = false;
      }

      $(element).bind("touchstart mousedown", start);
    }

    function throttle(func, wait, debounce) {
      var timeout;
      return function () {
        var context = this, args = arguments;
        var throttler = function () {
          timeout = null;
          func.apply(context, args);
        };
        if (debounce) clearTimeout(timeout);
        if (debounce || !timeout) timeout = setTimeout(throttler, wait);
      };
    }

    /* Define a jQuery plugin */
    var dataID = "spectrum.id";
    $.fn.spectrum = function (opts, extra) {
        if (typeof opts == "string") {
          var returnValue = this;
          var args = Array.prototype.slice.call( arguments, 1 );

          this.each(function () {
            var spect = spectrums[$(this).data(dataID)];
            if (spect) {
              var method = spect[opts];
              if (!method) {
                throw new Error( "Spectrum: no such method: '" + opts + "'" );
              }

              if (opts == "get") {
                returnValue = spect.get();
              }
              else if (opts == "container") {
                returnValue = spect.container;
              }
              else if (opts == "option") {
                returnValue = spect.option.apply(spect, args);
              }
              else if (opts == "destroy") {
                spect.destroy();
                $(this).removeData(dataID);
              }
              else {
                method.apply(spect, args);
              }
            }
          });
          return returnValue;
        }

      // Initializing a new instance of spectrum
      return this.spectrum("destroy").each(function () {
        var options = $.extend({}, opts, $(this).data());
        var spect = spectrum(this, options);
        $(this).data(dataID, spect.id);
      });
    };

    $.fn.spectrum.load = true;
    $.fn.spectrum.loadOpts = {};
    $.fn.spectrum.draggable = draggable;
    $.fn.spectrum.defaults = defaultOpts;

    $.spectrum = { };
    $.spectrum.localization = { };
    $.spectrum.palettes = { };

    $.fn.spectrum.processNativeColorInputs = function () {
      if (!inputTypeColorSupport) {
        $("input[type=color]").spectrum({
          preferredFormat: "hex6"
        });
      }
    };

    // TinyColor v1.0.0
    // https://github.com/bgrins/TinyColor
    // Brian Grinstead, MIT License
    (function() {
    var trimLeft = /^[\s,#]+/,
        trimRight = /\s+$/,
        tinyCounter = 0,
        math = Math,
        mathRound = math.round,
        mathMin = math.min,
        mathMax = math.max,
        mathRandom = math.random;
    var tinycolor = function tinycolor (color, opts) {
        color = (color) ? color : '';
        opts = opts || { };
        // If input is already a tinycolor, return itself
        if (color instanceof tinycolor) {
           return color;
        }
        // If we are called as a function, call using new instead
        if (!(this instanceof tinycolor)) {
            return new tinycolor(color, opts);
        }
        var rgb = inputToRGB(color);
        this._r = rgb.r,
        this._g = rgb.g,
        this._b = rgb.b,
        this._a = rgb.a,
        this._roundA = mathRound(100*this._a) / 100,
        this._format = opts.format || rgb.format;
        this._gradientType = opts.gradientType;
        // Don't let the range of [0,255] come back in [0,1].
        // Potentially lose a little bit of precision here, but will fix issues where
        // .5 gets interpreted as half of the total, instead of half of 1
        // If it was supposed to be 128, this was already taken care of by `inputToRgb`
        if (this._r < 1) { this._r = mathRound(this._r); }
        if (this._g < 1) { this._g = mathRound(this._g); }
        if (this._b < 1) { this._b = mathRound(this._b); }

        this._ok = rgb.ok;
        this._tc_id = tinyCounter++;
    };

    tinycolor.prototype = {
        isValid: function() {
          return this._ok;
        },
        getFormat: function() {
          return this._format;
        },
        toHsv: function() {
          var hsv = rgbToHsv(this._r, this._g, this._b);
          return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
        },
        toHsvString: function() {
          var hsv = rgbToHsv(this._r, this._g, this._b);
          var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
          return (this._a == 1) ?
            "hsv("  + h + ", " + s + "%, " + v + "%)" :
            "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
        },
        toHex: function(allow3Char) {
          return rgbToHex(this._r, this._g, this._b, allow3Char);
        },
        toHexString: function(allow3Char) {
          return '#' + this.toHex(allow3Char);
        },
        toRgb: function() {
          return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
        },
        toRgbString: function() {
          return (this._a == 1) ?
          "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
          "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
        },
        toString: function(format) {
          var formatSet = !!format;
          format = format || this._format;

          var formattedString = false;
          
          if (format === "rgb") {
            formattedString = this.toRgbString();
          }
          if (format === "hex" || format === "hex6") {
            formattedString = this.toHexString();
          }
          if (format === "hex3") {
            formattedString = this.toHexString(true);
          }
          if (format === "hsv") {
            formattedString = this.toHsvString();
          }

          return formattedString || this.toHexString();
        }
    };

    // If input is an object, force 1 into "1.0" to handle ratios properly
    // String input requires "1.0" as input, so 1 will be treated as 1
    tinycolor.fromRatio = function(color, opts) {
      // console.log(11111111);
        if (typeof color == "object") {
            var newColor = {};
            for (var i in color) {
                if (color.hasOwnProperty(i)) {
                    if (i === "a") {
                        newColor[i] = color[i];
                    }
                    else {
                        newColor[i] = convertToPercentage(color[i]);
                    }
                }
            }
            color = newColor;
        }

        return tinycolor(color, opts);
    };

    // Given a string or object, convert that input to RGB
    // Possible string inputs:
    //
    //     "red"
    //     "#f00" or "f00"
    //     "#ff0000" or "ff0000"
    //     "#ff000000" or "ff000000"
    //     "rgb 255 0 0" or "rgb (255, 0, 0)"
    //     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
    //     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
    //     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
    //     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
    //
    function inputToRGB(color) {
        var rgb = { r: 0, g: 0, b: 0 };
        var a = 1;
        var ok = false;
        var format = false;

        if (typeof color == "string") {
            color = stringInputToObject(color);
        }

        if (typeof color == "object") {
            if (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b")) {
                rgb = rgbToRgb(color.r, color.g, color.b);
                ok = true;
                format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
            }
            else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("v")) {
                color.s = convertToPercentage(color.s);
                color.v = convertToPercentage(color.v);
                rgb = hsvToRgb(color.h, color.s, color.v);
                ok = true;
                format = "hsv";
            }

            if (color.hasOwnProperty("a")) {
                a = color.a;
            }
        }

        a = boundAlpha(a);

        return {
            ok: ok,
            format: color.format || format,
            r: mathMin(255, mathMax(rgb.r, 0)),
            g: mathMin(255, mathMax(rgb.g, 0)),
            b: mathMin(255, mathMax(rgb.b, 0)),
            a: a
        };
    }


    // Conversion Functions
    // --------------------

    // `rgbToRgb`
    // Handle bounds / percentage checking to conform to CSS color spec
    // <http://www.w3.org/TR/css3-color/>
    // *Assumes:* r, g, b in [0, 255] or [0, 1]
    // *Returns:* { r, g, b } in [0, 255]
    function rgbToRgb(r, g, b){
        return {
            r: bound01(r, 255) * 255,
            g: bound01(g, 255) * 255,
            b: bound01(b, 255) * 255
        };
    }


    // `rgbToHsv`
    // Converts an RGB color value to HSV
    // *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
    // *Returns:* { h, s, v } in [0,1]
    function rgbToHsv(r, g, b) {
        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, v = max;

        var d = max - min;
        s = max === 0 ? 0 : d / max;

        if(max == min) {
            h = 0; // achromatic
        }
        else {
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h, s: s, v: v };
    }

    // `hsvToRgb`
    // Converts an HSV color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
     function hsvToRgb(h, s, v) {
        h = bound01(h, 360) * 6;
        s = bound01(s, 100);
        v = bound01(v, 100);

        var i = math.floor(h),
            f = h - i,
            p = v * (1 - s),
            q = v * (1 - f * s),
            t = v * (1 - (1 - f) * s),
            mod = i % 6,
            r = [v, q, p, p, t, v][mod],
            g = [t, v, v, q, p, p][mod],
            b = [p, p, t, v, v, q][mod];

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHex`
    // Converts an RGB color to hex
    // Assumes r, g, and b are contained in the set [0, 255]
    // Returns a 3 or 6 character hex
    function rgbToHex(r, g, b, allow3Char) {

        var hex = [
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16))
        ];

        // Return a 3 character hex if possible
        if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
        }

        return hex.join("");
    }

    tinycolor.equals = function (color1, color2) {
        if (!color1 || !color2) { return false; }
        return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
    };

    // Return a valid alpha value [0,1] with all invalid values being set to 1
    function boundAlpha(a) {
        a = parseFloat(a);

        if (isNaN(a) || a < 0 || a > 1) {
            a = 1;
        }

        return a;
    }

    // Take input from [0, n] and return it as [0, 1]
    function bound01(n, max) {
        if (isOnePointZero(n)) { n = "100%"; }

        var processPercent = isPercentage(n);
        n = mathMin(max, mathMax(0, parseFloat(n)));

        // Automatically convert percentage into number
        if (processPercent) {
            n = parseInt(n * max, 10) / 100;
        }

        // Handle floating point rounding errors
        if ((math.abs(n - max) < 0.000001)) {
            return 1;
        }

        // Convert into [0, 1] range if it isn't already
        return (n % max) / parseFloat(max);
    }

    // Force a number between 0 and 1
    function clamp01(val) {
        return mathMin(1, mathMax(0, val));
    }

    // Parse a base-16 hex value into a base-10 integer
    function parseIntFromHex(val) {
        return parseInt(val, 16);
    }

    // Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
    // <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
    function isOnePointZero(n) {
        return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
    }

    // Check to see if string passed in is a percentage
    function isPercentage(n) {
        return typeof n === "string" && n.indexOf('%') != -1;
    }

    // Force a hex value to have 2 characters
    function pad2(c) {
        return c.length == 1 ? '0' + c : '' + c;
    }

    // Replace a decimal with it's percentage value
    function convertToPercentage(n) {
        if (n <= 1) {
            n = (n * 100) + "%";
        }

        return n;
    }

    // Converts a decimal to a hex value
    function convertDecimalToHex(d) {
        return Math.round(parseFloat(d) * 255).toString(16);
    }
    // Converts a hex value to a decimal
    function convertHexToDecimal(h) {
        return (parseIntFromHex(h) / 255);
    }

    var matchers = (function() {

        // <http://www.w3.org/TR/css3-values/#integers>
        var CSS_INTEGER = "[-\\+]?\\d+%?";

        // <http://www.w3.org/TR/css3-values/#number-value>
        var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

        // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
        var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

        // Actual matching.
        // Parentheses and commas are optional, but not required.
        // Whitespace can take the place of commas or opening paren
        var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
        var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

        return {
            rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
            // hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
            hex3: /^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
            hex6: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        };
    })();

    // `stringInputToObject`
    // Permissive string parsing.  Take in a number of formats, and output an object
    // based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
  function stringInputToObject(color) {

    color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
    var named = false;
    var match;
    if ((match = matchers.rgb.exec(color))) {
      return { r: match[1], g: match[2], b: match[3] };
    }
    if ((match = matchers.hex6.exec(color))) {
      return {
        r: parseIntFromHex(match[1]),
        g: parseIntFromHex(match[2]),
        b: parseIntFromHex(match[3]),
        format: named ? "name" : "hex"
      };
    }
    if ((match = matchers.hex3.exec(color))) {
      return {
        r: parseIntFromHex(match[1] + '' + match[1]),
        g: parseIntFromHex(match[2] + '' + match[2]),
        b: parseIntFromHex(match[3] + '' + match[3]),
        format: named ? "name" : "hex"
      };
    }

    return false;
  }

  window.tinycolor = tinycolor;
  })();

  $(function () {
    if ($.fn.spectrum.load) {
      $.fn.spectrum.processNativeColorInputs();
    }
  });
})(window, jQuery);