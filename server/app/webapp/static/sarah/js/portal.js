!function ($) {
  
  // ------------------------------------------
  //  REGISTER
  // ------------------------------------------
  
  var register = function(){
    
    // Packery
    registerPackery();
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

      $.SARAH.ajax('/plugin/sort', { 'ids' : ids, 'xPos' : xPos, 'yPos' : yPos });
    });
    
    // Drag and Drop
    $portal.find('.portlet').each( function( i, portlet ) {
      var drag = new Draggabilly( portlet , { 'handle' : '.portlet-header, .portlet-handle' });
      $portal.packery( 'bindDraggabillyEvents', drag );
    });
  }
  
  
  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------
  
  // Plugin initialization on DOM ready
  $(document).ready(function() {
    register();
  });
  
}(jQuery);
