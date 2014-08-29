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
  
  // ------------------------------------------
  //  REGISTER
  // ------------------------------------------
  
  var register = function(){
    
    // Packery
    registerPackery();
    
    // Modal
    registerModal();
    
    // Ajax
    registerAjax();
  }
  
  // ------------------------------------------
  //  PACKERY
  // ------------------------------------------
  
  var registerPackery = function(){
    var $portal = $('.portal');
    // Create a packery
    $portal.packery({
      itemSelector: '.portlet',
      isInitLayout: false,
      gutter: 20,  columnWidth: 160,  rowHeight: 120
    });
    
    // Bind cleanup
    $portal.packery( 'once', 'layoutComplete', function(pckry, laidOutItems) {
      var elems  = pckry.getItemElements();
      for (var i = 0 ; i < elems.length ; i++){
        //var item = pckry.getItem( elems[i] );
        var $elm = $(elems[i]);
        var x = (parseInt($elm.attr('data-grid-x'))-1) * (160+20);
        var y = (parseInt($elm.attr('data-grid-y'))-1) * (120+20);
        pckry.fit(elems[i], x, y);
      }
    });
    
    // Layout
    $portal.packery();
    
    // Handle drop position
    $portal.packery( 'on', 'dragItemPositioned', function( pckry, draggedItem ) {
      var ids = []; var xPos = []; var yPos = [];
      var elems  = pckry.getItemElements();
      for (var i = 0 ; i < elems.length ; i++){
        var item = pckry.getItem( elems[i] );
        ids.push($(elems[i]).attr('id'));
        xPos.push(item.position.x / (160+20));
        yPos.push(item.position.y / (120+20));
      }

      ajax('/plugin/sort', { 'ids' : ids, 'xPos' : xPos, 'yPos' : yPos });
    });
    
    // Drag and Drop
    $portal.find('.portlet').each( function( i, portlet ) {
      var drag = new Draggabilly( portlet , { 'handle' : '.portlet-header' });
      $portal.packery( 'bindDraggabillyEvents', drag );
    });
  }
  
  // ------------------------------------------
  //  MODAL
  // ------------------------------------------
  
  var registerModal = function(){
    $(document).on('click', 'BUTTON[data-action=modal], A[data-action=modal]', openModal);
  }
  
  var openModal = function(event){
    // Prevent event
    event.preventDefault();
    
    // Retrive parameters
    var $trigger = $(event.currentTarget);
    var url = $trigger.attr('href') || $trigger.attr('data-url'); 
    open(url);
  }
  
  var $modal = false;
  var open = function(url){  
    
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
    var params = {};

    // Handle forms
    if (!url && trigger.form){
      var $form = $(trigger.form);
      url = $form.attr('action');
      method = $form.attr('method') || method;
      $.extend(true, params, $form.serializeObject());
    }
    
    var $target = $trigger.closest('.ajax-body');
    refresh(url, params, $target, function(){}, method);
  }
  
  var refresh = function(url, params, target, callback, method){ console.log(url);
    // Handle Response
    ajax(url, params, function(html){
      if (!target){ return; }
      
      var $target = $(target);
      if (!$target.exists()){ return; }
      
      var html = clean(html);
      $target.html(html);
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
  }
  
  var clean = function(html){
    html = html.trim();
    var patternDIV = new RegExp('^(<div[^>]*ajax-body[^>]*>)(.*)','gi');
    var mtch = patternDIV.exec(html);
    if (!mtch){ return ''; }

    $wrap = $(mtch[1]+'</div>');
    html = html.replace(patternDIV, '$2');
    html = html.substring(0, html.lastIndexOf("</div>"));
    return html;
  }

  
  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------
  
  // Plugin initialization on DOM ready
  $(document).ready(function() {
    register();
  });
  
}(jQuery);
