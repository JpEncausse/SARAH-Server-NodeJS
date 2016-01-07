!function ($) {
  
  $.fn.exists = function(){ return this.length  > 0;}
  
  /**
   * Serialize a Form to JSON using underlaying jQuery function and fill the gap.
   * @param filter a subset of keys to retrieve
   * @unittest js/tests/jalios/core/jalios-common.html
   */
   $.fn.serializeObject = function(filter) {
     var o = {};
     var a = this.serializeArray(); 
  
     $.each(a, function() {
       if (filter && filter[this.name] === undefined){ return; } // Filter
       if (o[this.name] !== undefined) {
         if (!o[this.name].push) {
             o[this.name] = [o[this.name]];
         }
         o[this.name].push(this.value || '');
       } else {
         o[this.name] = this.value || '';
       }
     });
     
     return $.extend(true, {}, filter, o);
   };
  
  /**
   * Return an array of specified attributes  
   */
  $.fn.attrSpecified = function(){
    var list = {};
    $(this).each(function() {
      $.each(this.attributes, function() {
        if(this.specified) { list[this.name] = this.value; }
      });
    });
    return list;
  }
  
  // ------------------------------------------
  //  REGISTER
  // ------------------------------------------
  
  var register = function(){
    
    // Set currenttime
    $('#time-now').html(moment().format("HH:mm"));
    
    registerTabs();
    registerConfirm();
    registerModal();
    registerAjax();
    registerSwitch();
    registerTokenField();
    registerDate();
    registerSortable();
    registerDropDown();
  }
  
  // ------------------------------------------
  //  TOKENFIELD
  // ------------------------------------------
  
  var registerTokenField = function(){
    setupTokens();
    $(document).on('ajax:refresh', function(event){
      setupTokens(event.refresh.$target);
    });
  }
  
  var ajaxTypeahead = function($this, query, syncResults, asyncResults){
    
    var keyword = $this.attr('data-keywords');
    if (!keyword){ return; }
    if (keyword.indexOf(',') > 0){ return syncResults(keyword.split(',')); }
    
    ajax(keyword, { 'search' : query  }, function(html){
      var json = JSON.parse(html);
      asyncResults(json.suggestion);
    });
  }
  
  var setupTokens = function($wrapper){
    var $wrapper = $wrapper || $(document);
    $wrapper.find('.tokenfield').each(function(){
      var $this = $(this);
      $this.tokenfield({
        typeahead: [null, { source: function(q, sy, asy){ ajaxTypeahead($this, q, sy, asy); }, async: true }]
      });
    })
  }
  
  // ------------------------------------------
  //  SORTABLE
  // ------------------------------------------
  
  var registerSortable = function(){
    $("OL.drag-x, OL.drag-y").sortable({ vertical : true, nested : false, exclude : '.switch' });
    
    $(document).on('ajax:refresh', function(event){
      event.refresh.$target.find("OL.drag-x, OL.drag-y").sortable({ vertical : true, nested : false, exclude : '.switch' });
    });
  }
  
  // ------------------------------------------
  //  SWITCH
  // ------------------------------------------
  
  var registerSwitch = function(){
    setupSwitch();
    $(document).on('ajax:refresh', function(event){
      setupSwitch(event.refresh.$target);
    });
  }
  
  var setupSwitch = function($wrapper){
    var $wrapper = $wrapper || $(document);
    $wrapper.find(".switch").bootstrapSwitch();
  }
  
  // ------------------------------------------
  //  TABS
  // ------------------------------------------
  
  var registerTabs = function(){
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
      
      var $elm  = $(e.target); 
      var $list = $elm.parents('.nav-tabs');
      if (!$list.attr('id')) return;
      
      localStorage.setItem('tab_'+$list.attr('id'), $elm.attr('href'));
    });
  
    $('.nav-tabs').each(function(){
      var $elm = $(this);
      if (!$elm.attr('id')) return;
      
       var tab = localStorage.getItem('tab_'+$elm.attr('id'));
       $('[href='+tab+']').tab('show');
    });
  }
  
  // ------------------------------------------
  //  CONFIRM
  // ------------------------------------------
  
  var registerConfirm = function(){
    $(document).on('click', '.confirm', openConfirm);
  };
  
  var openConfirm = function(event){
    
    // Confrm tricks
    if (event.custom && event.custom.bypass == 'confirm'){
      return;
    }
    
    // Prevent event
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // Retrive parameters
    var $trigger = $(event.currentTarget);
    var msg = $trigger.attr('title') || '';

    open('/confirm?msg='+msg, function(state){
      var evt = $.Event('click');
      evt.which = 1;
      evt.custom = {};
      evt.custom.bypass = 'confirm';
      $trigger.trigger(evt);
    }, $trigger);
  }
  
  // ------------------------------------------
  //  MODAL
  // ------------------------------------------
  
  $.MODAL = {};
  
  var registerModal = function(){
    $(document).on('click', 'BUTTON[data-action=modal],  A[data-action=modal]',  openModal);
    $(document).on('click', 'BUTTON[data-confirm=modal], A[data-confirm=modal]', function(){
      $modal.modal('hide');
      if ($.MODAL.callback){ $.MODAL.callback(true); }
    });
  }
  
  var openModal = function(event){
    // Prevent event
    event.preventDefault();
    
    // Retrive parameters
    var $trigger = $(event.currentTarget);
    var url = $trigger.attr('href') || $trigger.attr('data-url'); 
    open(url, undefined, $trigger);
  }
  
  var $modal = false;
  var open = function(url, callback, $trigger){  
    
    // Always set last callback
    $.MODAL.callback = callback;
    $.MODAL.$trigger = $trigger;
    
    // Create a common modal
    if (!$modal){
      $modal = $('<div id="sarah-modal" class="modal fade responsive ajax-body" role="dialog" aria-labelledby="modalLabel" aria-hidden="true"></div>').appendTo('BODY');
      $modal.modal({ keyboard: true, backdrop: 'static' });
    }

    // Refresh modal
    refresh(url, {}, $modal, function(){
      $modal.modal('show');
    });
  }
  
  // ------------------------------------------
  //  DROPDOWN
  // ------------------------------------------
  
  var registerDropDown = function(){
    
    var $placeholder = $('<ul class="dropdown-menu proxy" role="menu" id="menu-placeholder"></ul>');
    $(document).on('shown.bs.dropdown', function(event){
      var $target = $(event.target)
      var $menu   = $target.find('UL');
      var offset = $target.offset();
      
      $placeholder.css('left', offset.left).css('top', offset.top + 30);
      $placeholder.html($menu.html());
      $placeholder.data('parent-proxy', $menu);
      $placeholder.show();
      $menu.addClass('hide');
    });
    
    $(document).on('hide.bs.dropdown', function(event){ 
      $(event.target).find('UL').removeClass('hide');
      $placeholder.hide(); 
      // $placeholder.removeData('parent-proxy');
    });
    $('BODY').append($placeholder);
  }
  
  $.fn.proxyParents = function(){
    var $proxy  = this.parents('.proxy');
    var $parent = $proxy.data('parent-proxy');

    if ($proxy.exists() && $parent){
      return $parent.parents.apply($parent, arguments);
    }
    
    return this.parents.apply(this, arguments);
  }
  
  // ------------------------------------------
  //  DATEPICKER
  // ------------------------------------------
  
  var registerDate = function(){
    setupDateChooser();
    $(document).on('ajax:refresh', setupDateChooser);
  }
  
  var setupDateChooser = function(){
    $('DIV[data-field-date]').each(function(){
      var $elm = $(this);
      $elm.datetimepicker({ pickTime: false })
      $elm.data("DateTimePicker").setDate($elm.attr('data-field-date'));
    });
  }
  
  // ------------------------------------------
  //  AJAX
  // ------------------------------------------
  
  var registerAjax = function(){
    $(document).on('click', 'BUTTON[data-action=ajax], A[data-action=ajax]', openAjax);
  }
  
  var openAjax = function(event){
    // Prevent event
    event.preventDefault();
    
    // Retrive parameters
    var trigger  = event.currentTarget;
    var $trigger = $(trigger);
    var url = $trigger.attr('href') || $trigger.attr('data-url');
    var method = 'GET';
    var params = {'ajax' : 'true'};

    // Handle forms
    if (!url && trigger.form){
      var $form = $(trigger.form);
      url = $form.attr('action');
      method = $form.attr('method') || method;
      $.extend(true, params, $form.serializeObject());
      if (trigger.form){
        params[$trigger.attr('name')] = $trigger.attr('value');
      }
    }
    
    var $target = $($trigger.attr('data-target'));
        $target = $target.exists() ? $target : $trigger.closest('.ajax-body');
     // $target = $target.exists() ? $target : undefined;
        
    refresh(url, params, $target, function(){}, method);
  }
  
  var refresh = function(url, params, target, callback, method){
    // Handle Response
    ajax(url, params, function(html){

      if (!target){ return; }
      
      var $target = $(target);
      if (!$target.exists()){
        location.reload(); 
        return; 
      }

      var content = clean(html);
      if (content){
        $target.html(content.body);
        
        var attributes = content.$wrapper.attrSpecified();
        for (var key in attributes){
          console.log(key,'=>',attributes[key]);
          var attr = (key == 'class') ? attributes[key].replace('fade','fade in') : attributes[key];
          $target.attr(key, attr);
        }
      }
      
      // Fire pseudo event
      var event = $.Event("ajax:refresh");
      event.refresh         = {};
      event.refresh.$target = $target;
      $(document).trigger(event);
      
      if (callback) callback();
    }, method);
  }
  
  var ajax = function(url, params, callback, method){
    // Build Request
    var request = $.ajax({
      url: url, 
      data: params,
      type: method || 'GET', 
      traditional: true
    });
    
    // Handle Response
    request.done(function(html) {
      if (callback) callback(html);
    });
    
    // Handle Error
    request.fail(function( jqXHR, textStatus, errorThrown ) {
      console.log(textStatus, errorThrown);
    });
  }
  
  var clean = function(html){
    html = html.trim();
    var patternDIV = new RegExp('^(<div[^>]*ajax-body[^>]*>)(.*)','gi');
    var mtch = patternDIV.exec(html);
    if (!mtch){ return false; }

    var $wrap = $(mtch[1]+'</div>');
    
    html = html.replace(patternDIV, '$2');
    html = html.substring(0, html.lastIndexOf("</div>"));
    return { 'body' : html , '$wrapper' : $wrap };
  }

  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------
  
  // Plugin initialization on DOM ready
  $(document).ready(function() {
    register();
  });
  
  $.SARAH = $.SARAH || {};
  $.SARAH.ajax = ajax;
  $.SARAH.refresh = refresh;
  
}(jQuery);
    