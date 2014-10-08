!function ($) {
  
  // ------------------------------------------
  //  REGISTER
  // ------------------------------------------
  
  var register = function(){
    $(document).on('click', 'A[data-dl]', function(event){
      event.preventDefault();
      var $e = $(event.currentTarget);
      getStats($e.attr('data-dl'), function(stat){
        
        $e.attr('title', stat);
        $e.tooltip('show');
      })
    });
  }
  
  var getStats = function(shorten, callback){
    if (!shorten){ return; }
    $.getJSON('https://www.googleapis.com/urlshortener/v1/url?projection=FULL&shortUrl='+shorten, function(data) {
      var stat = data.analytics.allTime.shortUrlClicks + ' (' + data.analytics.month.shortUrlClicks+')';
      callback(stat);
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
