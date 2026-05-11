/**
 * TelePrompter v1.2.2 - Browser-based TelePrompter with Remote Control
 * (c) 2023 Peter Schmalfeldt
 * License: https://github.com/manifestinteractive/teleprompter/blob/master/LICENSE
 */
var TelePrompter = (function() {
  /**
   * ==================================================
   * TelePrompter App Settings
   * ==================================================
   */

  /* DOM Elements used by App */
  var $elm = {};

  /* App Settings */
  var debug = false,
    initialized = false,
    isPlaying = false,
    scrollDelay,
    modalOpen = false,
    timeout,
    timer,
    timerExp = 10,
    timerURL,
    version = 'v1.2.2';

  /* Default App Settings */
  var defaultConfig = {
    backgroundColor: '#141414',
    dimControls: true,
    flipX: false,
    flipY: false,
    fontSize: 60,
    pageSpeed: 35,
    pageScrollPercent: 0,
    textColor: '#ffffff'
  };

  /* Custom App Settings */
  var config = Object.assign({}, defaultConfig);

  /**
   * ==================================================
   * TelePrompter Init Functions
   * ==================================================
   */

  /**
   * Bind Events to DOM Elements
   */
  function bindEvents() {
    // Cache DOM Elements
    $elm.article = $('article');
    $elm.backgroundColor = $('#background-color');
    $elm.body = $('body');
    $elm.buttonDimControls = $('.button.dim-controls');
    $elm.buttonFlipX = $('.button.flip-x');
    $elm.buttonFlipY = $('.button.flip-y');
    $elm.buttonPlay = $('.button.play');
    $elm.buttonRemote = $('.button.remote');
    $elm.buttonReset = $('.button.reset');
    $elm.closeModal = $('.close-modal');
    $elm.fontSize = $('.font_size');
    $elm.header = $('header');
    $elm.headerContent = $('header h1, header nav');
    $elm.markerOverlay = $('.marker, .overlay');
    $elm.modal = $('#modal');
    $elm.remoteID = $('.remote-id');
    $elm.remoteURL = $('.remote-url');
    $elm.remoteControlModal = $('#remote-control-modal');
    $elm.speed = $('.speed');
    $elm.softwareUpdate = $('#software-update');
    $elm.teleprompter = $('#teleprompter');
    $elm.textColor = $('#text-color');
    $elm.window = $(window);

    // Bind Events
    $elm.backgroundColor.on('change.teleprompter', handleBackgroundColor);
    $elm.buttonDimControls.on('click.teleprompter', handleDim);
    $elm.buttonFlipX.on('click.teleprompter', handleFlipX);
    $elm.buttonFlipY.on('click.teleprompter', handleFlipY);
    $elm.buttonPlay.on('click.teleprompter', handlePlay);

    $elm.buttonReset.on('click.teleprompter', handleReset);
    $elm.closeModal.on('click.teleprompter', handleCloseModal);
    $elm.textColor.on('change.teleprompter', handleTextColor);

    // Listen for Key Presses
    $elm.teleprompter.keyup(updateTeleprompter);
    $elm.body.keydown(navigate);
  }

  /**
   * Initialize TelePrompter App
   */
  function init() {
    // Exit if already started
    if (initialized) {
      return;
    }

    // Startup App
    bindEvents();
    initSettings();
    initUI();


    // Track that we've started TelePrompter
    initialized = true;

    if (debug) {
      console.debug('[TP]', 'TelePrompter Initialized');
    }
  }

  /**
   * Initialize Settings ( Pull from URL First, then Local Storage )
   */
  function initSettings() {
    // Check if there are already URL Params
    var urlParams = getUrlVars();
    if (urlParams) {
      // Update Background Color if Present, otherwise Set to Default since Not Present
      if (urlParams.backgroundColor) {
        config.backgroundColor = decodeURIComponent(urlParams.backgroundColor);
        localStorage.setItem('teleprompter_background_color', config.backgroundColor);
      } else {
        config.backgroundColor = defaultConfig.backgroundColor;
        localStorage.removeItem('teleprompter_background_color');
      }

      // Update Dim Controls if Present, otherwise Set to Default since Not Present
      if (urlParams.dimControls) {
        config.dimControls = (decodeURIComponent(urlParams.dimControls) === 'true');
        localStorage.setItem('teleprompter_dim_controls', config.dimControls);
      } else {
        config.dimControls = defaultConfig.dimControls;
        localStorage.removeItem('teleprompter_dim_controls');
      }

      // Update Flip X if Present, otherwise Set to Default since Not Present
      if (urlParams.flipX) {
        config.flipX = (decodeURIComponent(urlParams.flipX) === 'true');
        localStorage.setItem('teleprompter_flip_x', config.flipX);
      } else {
        config.flipX = defaultConfig.flipX;
        localStorage.removeItem('teleprompter_flip_x');
      }

      // Update Flip Y if Present, otherwise Set to Default since Not Present
      if (urlParams.flipY) {
        config.flipY = (decodeURIComponent(urlParams.flipY) === 'true');
        localStorage.setItem('teleprompter_flip_y', config.flipY);
      } else {
        config.flipY = defaultConfig.flipY;
        localStorage.removeItem('teleprompter_flip_y');
      }

      // Update Font Size if Present, otherwise Set to Default since Not Present
      if (urlParams.fontSize) {
        config.fontSize = parseInt(decodeURIComponent(urlParams.fontSize));
        localStorage.setItem('teleprompter_font_size', config.fontSize);
      } else {
        config.fontSize = defaultConfig.fontSize;
        localStorage.removeItem('teleprompter_font_size');
      }

      // Update Page Speed if Present, otherwise Set to Default since Not Present
      if (urlParams.pageSpeed) {
        config.pageSpeed = parseInt(decodeURIComponent(urlParams.pageSpeed));
        localStorage.setItem('teleprompter_speed', config.pageSpeed);
      } else {
        config.pageSpeed = defaultConfig.pageSpeed;
        localStorage.removeItem('teleprompter_speed');
      }

      // Update Text Color if Present, otherwise Set to Default since Not Present
      if (urlParams.textColor) {
        config.textColor = decodeURIComponent(urlParams.textColor);
        localStorage.setItem('teleprompter_text_color', config.textColor);
      } else {
        config.textColor = defaultConfig.textColor;
        localStorage.removeItem('teleprompter_text_color');
      }
    }

    // Check if we've been here before and made changes
    if (localStorage.getItem('teleprompter_background_color')) {
      config.backgroundColor = localStorage.getItem('teleprompter_background_color');

      // Update UI with Custom Background Color
      $elm.backgroundColor.val(config.backgroundColor);
      $elm.article.css('background-color', config.backgroundColor);
      $elm.body.css('background-color', config.backgroundColor);
      $elm.teleprompter.css('background-color', config.backgroundColor);
    } else {
      cleanTeleprompter();
    }

    if (localStorage.getItem('teleprompter_dim_controls')) {
      config.dimControls = localStorage.getItem('teleprompter_dim_controls') === 'true';

      // Update Indicator
      if (config.dimControls) {
        $elm.buttonDimControls.removeClass('icon-eye-open').addClass('icon-eye-close');
      } else {
        $elm.buttonDimControls.removeClass('icon-eye-close').addClass('icon-eye-open');
      }
    }

    if (localStorage.getItem('teleprompter_flip_x')) {
      config.flipX = localStorage.getItem('teleprompter_flip_x') === 'true';

      // Update Indicator
      if (config.flipX) {
        $elm.buttonFlipX.addClass('active');
      }
    }

    if (localStorage.getItem('teleprompter_flip_y')) {
      config.flipY = localStorage.getItem('teleprompter_flip_y') === 'true';

      // Update Indicator
      if (config.flipY) {
        $elm.buttonFlipY.addClass('active');
      }
    }

    if (localStorage.getItem('teleprompter_font_size')) {
      config.fontSize = localStorage.getItem('teleprompter_font_size');
    }

    if (localStorage.getItem('teleprompter_speed')) {
      config.pageSpeed = localStorage.getItem('teleprompter_speed');
    }

    if (localStorage.getItem('teleprompter_text')) {
      $elm.teleprompter.html(localStorage.getItem('teleprompter_text'));
    }

    if (localStorage.getItem('teleprompter_text_color')) {
      config.textColor = localStorage.getItem('teleprompter_text_color');
      $elm.textColor.val(config.textColor);
      $elm.teleprompter.css('color', config.textColor);
    }

    if (debug) {
      console.debug('[TP]', 'Settings Initialized', urlParams ? urlParams : '( No URL Params )');
    }

  }

  /**
   * Initialize UI
   */
  function initUI() {
    // Create Timer
    timer = $('.clock').timer({
      stopVal: 10000,
      onChange: function(time) {}
    });

    // Update Flip text if Present
    if (config.flipX && config.flipY) {
      $elm.teleprompter.addClass('flip-xy');
    } else if (config.flipX) {
      $elm.teleprompter.addClass('flip-x');
    } else if (config.flipY) {
      $elm.teleprompter.addClass('flip-y');
    }

    // Setup GUI
    $elm.article.stop().animate({
      scrollTop: 0
    }, 100, 'linear', function() {
      $elm.article.clearQueue();
    });

    // Set Overlay and TelePrompter Defaults
    $elm.markerOverlay.fadeOut(0);
    $elm.teleprompter.css({
      'padding-bottom': Math.ceil($elm.window.height() - $elm.header.height()) + 'px'
    });

    // Create Font Size Slider
    $elm.fontSize.slider({
      min: 12,
      max: 200,
      value: config.fontSize,
      orientation: 'horizontal',
      range: 'min',
      animate: true,
      slide: function() {
        updateFontSize(true);
      },
      change: function() {
        updateFontSize(true);
      }
    });

    // Create Speed Slider
    $elm.speed.slider({
      min: 0,
      max: 50,
      value: config.pageSpeed,
      orientation: 'horizontal',
      range: 'min',
      animate: true,
      slide: function() {
        updateSpeed(true);
      },
      change: function() {
        updateSpeed(true);
      }
    });

    // Run initial configuration on sliders
    if (config.fontSize !== defaultConfig.fontSize) {
      updateFontSize(false);
    }

    if (config.pageSpeed !== defaultConfig.pageSpeed) {
      updateSpeed(false);
    }

    // Clean up Empty Paragraph Tags
    $('p:empty', $elm.teleprompter).remove();

    // Update UI with Ready Class
    $elm.teleprompter.addClass('ready');

    if (debug) {
      console.debug('[TP]', 'UI Initialized');
    }
  }

  /**
   * ==================================================
   * Core Functions
   * ==================================================
   */

  /**
   * Clean Teleprompter
   */
  function cleanTeleprompter() {
    var text = $elm.teleprompter.html();
    text = text.replace(/<br>+/g, '@@').replace(/@@@@/g, '</p><p>');
    text = text.replace(/@@/g, '<br>');
    text = text.replace(/([a-z])\. ([A-Z])/g, '$1.&nbsp;&nbsp; $2');
    text = text.replace(/<p><\/p>/g, '');

    if (text && text.substr(0, 3) !== '<p>') {
      text = '<p>' + text + '</p>';
    }

    $elm.teleprompter.html(text);
    $('p:empty', $elm.teleprompter).remove();
  }

  /**
   * Get App Config
   * @param {String} key
   * @returns Object
   */
  function getConfig(key) {
    return key ? config[key] : config;
  }

  /**
   * Get URL Params
   */
  function getUrlVars() {
    var paramCount = 0;
    var vars = {};

    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
      paramCount++;
      vars[key] = value;
    });

    if (debug) {
      console.debug('[TP]', 'URL Params:', paramCount > 0 ? vars : null);
    }

    return (paramCount > 0) ? vars : null;
  }

  /**
   * Handle Background Color
   */
  function handleBackgroundColor() {
    config.backgroundColor = $elm.backgroundColor.val();

    $elm.teleprompter.css('background-color', config.backgroundColor);
    $elm.article.css('background-color', config.backgroundColor);
    $elm.body.css('background-color', config.backgroundColor);
    localStorage.setItem('teleprompter_background_color', config.backgroundColor);

    if (debug) {
      console.debug('[TP]', 'Background Color Changed:', config.backgroundColor);
    }

    // Update URL Params
    clearTimeout(timerURL);
    timerURL = setTimeout(updateURL, timerExp);
    updateURL();
  }

  /**
   * Handle Closing Modal
   */
  function handleCloseModal() {
    // Reset Focus on Remote Button if needed
    if ($elm.remoteControlModal.is(':visible')) {
      $elm.buttonRemote.focus();
    }

    $elm.modal.hide();
    $elm.remoteControlModal.hide();
    $elm.softwareUpdate.hide();

    modalOpen = false;
  }

  /**
   * Handle Dimming Layovers
   * @param {Object} evt
   * @param {Boolean} skipUpdate
   */
  function handleDim(evt, skipUpdate) {
    if (config.dimControls) {
      config.dimControls = false;
      $elm.buttonDimControls.removeClass('icon-eye-close').addClass('icon-eye-open');
      $elm.headerContent.fadeTo('slow', 1);
      $elm.markerOverlay.fadeOut('slow');
    } else {
      config.dimControls = true;
      $elm.buttonDimControls.removeClass('icon-eye-open').addClass('icon-eye-close');

      if (isPlaying) {
        $elm.headerContent.fadeTo('slow', 0.15);
        $elm.markerOverlay.fadeIn('slow');
      }
    }

    localStorage.setItem('teleprompter_dim_controls', config.dimControls);

    if (debug) {
      console.debug('[TP]', 'Dim Control Changed:', config.dimControls);
    }

    // Update URL Params
    clearTimeout(timerURL);
    timerURL = setTimeout(updateURL, timerExp);
  }

  /**
   * Handle Flipping Text Horizontally
   * @param {Object} evt
   * @param {Boolean} skipUpdate
   */
  function handleFlipX(evt, skipUpdate) {
    timer.resetTimer();

    // Remove Flip Classes
    $elm.teleprompter.removeClass('flip-x').removeClass('flip-xy');

    if (config.flipX) {
      config.flipX = false;

      $elm.buttonFlipX.removeClass('active');
    } else {
      config.flipX = true;

      $elm.buttonFlipX.addClass('active');

      if (config.flipY) {
        $elm.teleprompter.addClass('flip-xy');
      } else {
        $elm.teleprompter.addClass('flip-x');
      }
    }

    localStorage.setItem('teleprompter_flip_x', config.flipX);

    if (debug) {
      console.debug('[TP]', 'Flip X Changed:', config.flipX);
    }

    // Update URL Params
    clearTimeout(timerURL);
    timerURL = setTimeout(updateURL, timerExp);
    updateURL();
  }

  /**
   * Handle Flipping Text Vertically
   * @param {Object} evt
   * @param {Boolean} skipUpdate
   */
  function handleFlipY(evt, skipUpdate) {
    timer.resetTimer();

    // Remove Flip Classes
    $elm.teleprompter.removeClass('flip-y').removeClass('flip-xy');

    if (config.flipY) {
      config.flipY = false;

      $elm.buttonFlipY.removeClass('active');
    } else {
      config.flipY = true;

      $elm.buttonFlipY.addClass('active');

      if (config.flipX) {
        $elm.teleprompter.addClass('flip-xy');
      } else {
        $elm.teleprompter.addClass('flip-y');
      }
    }

    localStorage.setItem('teleprompter_flip_y', config.flipY);

    if (config.flipY) {
      $elm.article.stop().animate({
        scrollTop: $elm.teleprompter.height() + 100
      }, 250, 'swing', function() {
        $elm.article.clearQueue();
      });
    } else {
      $elm.article.stop().animate({
        scrollTop: 0
      }, 250, 'swing', function() {
        $elm.article.clearQueue();
      });
    }

    if (debug) {
      console.debug('[TP]', 'Flip Y Changed:', config.flipY);
    }

    // Update URL Params
    clearTimeout(timerURL);
    timerURL = setTimeout(updateURL, timerExp);
    updateURL();
  }

  /**
   * Handle Updating Text Color
   */
  function handleTextColor() {
    config.textColor = $elm.textColor.val();

    $elm.teleprompter.css('color', config.textColor);
    localStorage.setItem('teleprompter_text_color', config.textColor);

    if (debug) {
      console.debug('[TP]', 'Text Color Changed:', config.textColor);
    }

    // Update URL Params
    clearTimeout(timerURL);
    timerURL = setTimeout(updateURL, timerExp);
    updateURL();
  }

  /**
   * Handle Play Button Press
   */
  function handlePlay() {
    if (!isPlaying) {
      startTeleprompter();
    } else {
      stopTeleprompter();
    }
  }

  /**
   * Handle Reset Button Press
   */
  function handleReset() {
    stopTeleprompter();
    timer.resetTimer();

    config.pageScrollPercent = 0;

    $elm.article.stop().animate({
      scrollTop: 0
    }, 100, 'linear', function() {
      $elm.article.clearQueue();
    });

    if (debug) {
      console.debug('[TP]', 'Reset Button Pressed');
    }
  }

  /**
   * Listen for Keyboard Navigation
   * @param {Object} evt
   * @returns Boolean
   */
  function navigate(evt) {
    var space = 32,
      escape = 27,
      left = 37,
      up = 38,
      right = 39,
      down = 40,
      page_up = 33,
      page_down = 34,
      b_key = 66,
      f5_key = 116,
      period_key = 190,
      tab = 9,
      speed = $elm.speed.slider('value'),
      font_size = $elm.fontSize.slider('value');

    // Allow text edit if we're inside an input field or tab key press
    if (evt.target.id === 'teleprompter' || evt.keyCode === tab) {
      return;
    }

    // Check if Escape Key and Modal Open
    if (evt.keyCode == escape && modalOpen) {
      if ($elm.remoteControlModal.is(':visible')) {
        $elm.buttonRemote.focus();
      }

      $elm.modal.hide();
      modalOpen = false;
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }

    // Skip if UI element or Modal Open
    if (modalOpen || evt.target.nodeName === 'INPUT' || evt.target.nodeName === 'BUTTON' || evt.target.nodeName === 'A' || evt.target.nodeName === 'SPAN') {
      return;
    }

    // Reset GUI
    if (evt.keyCode == escape) {
      $elm.buttonReset.trigger('click');
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
    // Start Stop Scrolling
    else if (evt.keyCode == space || [b_key, f5_key, period_key].includes(evt.keyCode)) {
      $elm.buttonPlay.trigger('click');
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
    // Decrease Speed
    else if (evt.keyCode == left || evt.keyCode == page_up) {
      $elm.speed.slider('value', speed - 1);
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
    // Decrease Font Size
    else if (evt.keyCode == down) {
      $elm.fontSize.slider('value', font_size - 1);
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
    // Increase Font Size
    else if (evt.keyCode == up) {
      $elm.fontSize.slider('value', font_size + 1);
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
    // Increase Speed
    else if (evt.keyCode == right || evt.keyCode == page_down) {
      $elm.speed.slider('value', speed + 1);
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
  }

  /**
   * Manage Scrolling Teleprompter
   */
  function pageScroll() {
    var offset = 1;
    var animate = 0;

    if (config.pageSpeed == 0) {
      $elm.article.stop().clearQueue();
      clearTimeout(scrollDelay);
      scrollDelay = setTimeout(pageScroll, 500);
      return;
    }

    clearTimeout(scrollDelay);
    scrollDelay = setTimeout(pageScroll, Math.floor(50 - config.pageSpeed));

    if ($elm.teleprompter.hasClass('flip-y')) {
      $elm.article.stop().animate({
        scrollTop: '-=' + offset + 'px'
      }, animate, 'linear', function() {
        $elm.article.clearQueue();
      });

      // We're at the bottom of the document, stop
      if ($elm.article.scrollTop() === 0) {
        stopTeleprompter();
        setTimeout(function() {
          $elm.article.stop().animate({
            scrollTop: $elm.teleprompter.height() + 100
          }, 500, 'swing', function() {
            $elm.article.clearQueue();
          });
        }, 500);
      }
    } else {
      $elm.article.stop().animate({
        scrollTop: '+=' + offset + 'px'
      }, animate, 'linear', function() {
        $elm.article.clearQueue();
      });

      // We're at the bottom of the document, stop
      if ($elm.article.scrollTop() >= (($elm.article[0].scrollHeight - $elm.window.height()) - 100)) {
        stopTeleprompter();
        setTimeout(function() {
          $elm.article.stop().animate({
            scrollTop: 0
          }, 500, 'swing', function() {
            $elm.article.clearQueue();
          });
        }, 500);
      }
    }

    // Update pageScrollPercent
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      $elm.win = $elm.article[0];
      var scrollHeight = $elm.win.scrollHeight;
      var scrollTop = $elm.win.scrollTop;
      var clientHeight = $elm.win.clientHeight;

      config.pageScrollPercent = Math.round(((scrollTop / (scrollHeight - clientHeight)) + Number.EPSILON) * 100);

    }, animate);
  }

  /**
   * Create Random String for Remote
   * @returns string
   */
  function randomString() {
    var chars = '3456789ABCDEFGHJKLMNPQRSTUVWXY';
    var length = 6;
    var string = '';

    for (var i = 0; i < length; i++) {
      var num = Math.floor(Math.random() * chars.length);
      string += chars.substring(num, num + 1);
    }

    return string;
  }

  /**
   * Connect to Remote
   * @param {String} currentRemote Current Remote ID
   */
  function remoteConnect(currentRemote) {
    if (typeof io === 'undefined') {
      $elm.buttonRemote.removeClass('active');
      localStorage.removeItem('teleprompter_remote_id');
      return;
    }
  }

  /**
   * Handle Updates from Remote
   * @param {Object} oldConfig
   * @param {Object} newConfig
   */
  function remoteUpdate(oldConfig, newConfig) {
    if (debug) {
      console.debug('[IO]', 'Remote Update');
      console.debug('[IO]', 'Old Config:', oldConfig);
      console.debug('[IO]', 'New Config:', newConfig);
    }

    if (oldConfig.dimControls !== newConfig.dimControls) {
      handleDim(null, true);
    }

    if (oldConfig.flipX !== newConfig.flipX) {
      handleFlipX(null, true);
    }

    if (oldConfig.flipY !== newConfig.flipY) {
      handleFlipY(null, true);
    }

    if (oldConfig.fontSize !== newConfig.fontSize) {
      $elm.fontSize.slider('value', newConfig.fontSize);
      updateFontSize(true, true);
    }

    if (oldConfig.pageSpeed !== newConfig.pageSpeed) {
      $elm.speed.slider('value', newConfig.pageSpeed);
      updateSpeed(true, true);
    }

    if (oldConfig.pageScrollPercent !== newConfig.pageScrollPercent) {
      config.pageScrollPercent = newConfig.pageScrollPercent;

      stopTeleprompter();

      $elm.win = $elm.article[0];
      var scrollHeight = $elm.win.scrollHeight;
      var clientHeight = $elm.win.clientHeight;

      var maxScrollStop = (scrollHeight - clientHeight);
      var percent = parseInt(config.pageScrollPercent) / 100;
      var newScrollTop = maxScrollStop * percent

      $elm.article.stop().animate({
        scrollTop: newScrollTop + 'px'
      }, 0, 'linear', function() {
        $elm.article.clearQueue();
      });
    }

    // Update URL Params
    clearTimeout(timerURL);
    timerURL = setTimeout(updateURL, timerExp);
    updateURL();
  }

  /**
   * Start Teleprompter
   */
  function startTeleprompter() {
    // Check if Already Playing
    if (isPlaying) {
      return;
    }

    $elm.teleprompter.attr('contenteditable', false);
    $elm.body.addClass('playing');
    $elm.buttonPlay.removeClass('icon-play').addClass('icon-pause');

    if (config.dimControls) {
      $elm.headerContent.fadeTo('slow', 0.15);
      $elm.markerOverlay.fadeIn('slow');
    }

    timer.startTimer();

    pageScroll();

    isPlaying = true;

    if (debug) {
      console.debug('[TP]', 'Starting TelePrompter');
    }

  }

  /**
   * Stop Teleprompter
   */
  function stopTeleprompter() {
    // Check if Already Stopped
    if (!isPlaying) {
      return;
    }

    clearTimeout(scrollDelay);
    $elm.teleprompter.attr('contenteditable', true);

    if (config.dimControls) {
      $elm.headerContent.fadeTo('slow', 1);
      $elm.markerOverlay.fadeOut('slow');
    }

    $elm.buttonPlay.removeClass('icon-pause').addClass('icon-play');
    $elm.body.removeClass('playing');

    timer.stopTimer();

    isPlaying = false;

    if (debug) {
      console.debug('[TP]', 'Stopping TelePrompter');
    }

  }

  /**
   * Manage Font Size Change
   * @param {Boolean} save
   * @param {Boolean} skipUpdate
   */
  function updateFontSize(save, skipUpdate) {
    config.fontSize = $elm.fontSize.slider('value');

    $elm.teleprompter.css({
      'font-size': config.fontSize + 'px',
      'line-height': Math.ceil(config.fontSize * 1.5) + 'px',
      'padding-bottom': Math.ceil($elm.window.height() - $elm.header.height()) + 'px'
    });

    $('p', $elm.teleprompter).css({
      'padding-bottom': Math.ceil(config.fontSize * 0.25) + 'px',
      'margin-bottom': Math.ceil(config.fontSize * 0.25) + 'px'
    });

    $('label.font_size_label > span').text('(' + config.fontSize + ')');

    if (save) {
      localStorage.setItem('teleprompter_font_size', config.fontSize);
    }

    if (debug) {
      console.debug('[TP]', 'Font Size Changed:', config.fontSize);
    }


    // Update URL Params
    clearTimeout(timerURL);
    timerURL = setTimeout(updateURL, timerExp);
    updateURL();
  }

  /**
   * Manage Speed Change
   * @param {Boolean} save
   * @param {Boolean} skipUpdate
   */
  function updateSpeed(save, skipUpdate) {
    config.pageSpeed = $elm.speed.slider('value');
    $('label.speed_label > span').text('(' + $elm.speed.slider('value') + ')');

    if (save) {
      localStorage.setItem('teleprompter_speed', $elm.speed.slider('value'));
    }

    if (debug) {
      console.debug('[TP]', 'Page Speed Changed:', config.pageSpeed);
    }

    // Update URL Params
    clearTimeout(timerURL);
    timerURL = setTimeout(updateURL, timerExp);
    updateURL();
  }

  /**
   * Update Teleprompter Text
   * @param {Object} evt
   * @returns Boolean
   */
  function updateTeleprompter(evt) {
    if (evt.keyCode == 27) {
      $elm.teleprompter.blur();
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }

    localStorage.setItem('teleprompter_text', $elm.teleprompter.html());
    $('p:empty', $elm.teleprompter).remove();

    if (debug) {
      console.debug('[TP]', 'TelePrompter Text Updated');
    }

  }

  /**
   * Push Config Params into URL for Sharable Configuration
   */
  function updateURL() {
    var custom = Object.assign({}, config);
    var keys = Object.keys(custom);

    keys.forEach(function(key) {
      // Remove Default Settings from URL
      if (custom[key] === defaultConfig[key]) {
        delete custom[key];
      }
    });

    if (Object.keys(custom).length > 0) {
      var urlParams = new URLSearchParams(custom);
      window.history.pushState(custom, 'TelePrompter', '/?' + urlParams);
    } else {
      window.history.pushState(null, 'TelePrompter', '/');
    }

    if (debug) {
      console.debug('[TP]', 'URL Updated:', custom);
    }
  }

  /* Expose Select Control to Public TelePrompter Object */
  return {
    version: version,
    init: init,
    getConfig: getConfig,
    start: startTeleprompter,
    stop: stopTeleprompter,
    reset: handleReset,
    setDebug: function(bool) {
      debug = !!bool;
      return this;
    },
    setSpeed: function(speed) {
      speed = Math.min(50, Math.max(0, speed));
      $elm.speed.slider('value', parseInt(speed));
      return this;
    },
    setFontSize: function(size) {
      size = Math.min(100, Math.max(12, size));
      $elm.fontSize.slider('value', parseInt(size));
      return this;
    },
    setDim: function(bool) {
      config.dimControls = !bool;
      handleDim();
      return this;
    },
    setFlipX: function(bool) {
      config.flipX = !bool;
      handleFlipX();
      return this;
    },
    setFlipY: function(bool) {
      config.flipY = !bool;
      handleFlipY();
      return this;
    },
    increaseSpeed: function(amount) {
      let speed = $elm.speed.slider('value')
      $elm.speed.slider('value', speed + amount);
      //return this;
    },
    decreaseSpeed: function(amount) {
      let speed = $elm.speed.slider('value')
      $elm.speed.slider('value', speed - amount);
      
      //return this;
    },
    increaseFont: function(amount) {
      let font_size = $elm.fontSize.slider('value');
      $elm.fontSize.slider('value', font_size + 1);
      //return this;
    },
    decreaseFont: function(amount) {
      let font_size = $elm.fontSize.slider('value');
      $elm.fontSize.slider('value', font_size - 1);
      //return this;
    },
    playPause: function(){
      handlePlay();
      //return this;
    },
    resetPageScroll: async function(){
      stopTeleprompter();
      
      config.pageScrollPercent = 0;

      await $elm.article.stop().animate({
        scrollTop: 0
      }, 100, 'linear', function() {
        $elm.article.clearQueue();
        startTeleprompter();
      });
    }
  }
})();
