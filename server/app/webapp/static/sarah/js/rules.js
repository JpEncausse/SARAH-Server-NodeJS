!function ($) {

  // ------------------------------------------
  //  REGISTER
  // ------------------------------------------
  
  var register = function(){
    $(document).on('switchChange.bootstrapSwitch', '.switch', function(event, state){
      var $elm = $(event.currentTarget);
      $elm.parents('TD').find('INPUT[type=hidden]').attr('value', !state);
      prepareSave();
    });
    
    $(document).on('click', '.rule-add', function(event){
      event.preventDefault();
      var $t = $('#rule-template');
      $('<tr></tr>').html($t.html()).insertBefore($t).find(".switch-template").bootstrapSwitch();
      prepareSave();
    });
    
    $(document).on('change', '.form-control', prepareSave);
    $(document).on('shown.bs.modal',  '.modal', openEditor);
    $(document).on('hidden.bs.modal', '.modal', closeEditor);
  }
  
  var prepareSave = function(){
    $('#opSave').addClass('btn-danger');
  }
  
  // ------------------------------------------
  //  EDITOR
  // ------------------------------------------
  
  var editor = false;
  var openEditor = function(event){
    editor = CodeMirror.fromTextArea($('#codearea')[0], { 
      'mode': 'javascript', 
      'tabSize' : 2, 
      'lineNumbers': true 
    });
    
    var $trigger = $.MODAL.$trigger;
    var $hidden  = $trigger.next('INPUT[type=hidden]');
    editor.setValue(decode($hidden.attr('value')));
  }
  
  var closeEditor = function(event){
    var $trigger = $.MODAL.$trigger;
    var $hidden  = $trigger.next('INPUT[type=hidden]');
    $hidden.attr('value', encode(editor.getValue()) + ' ');
    prepareSave();
  }
  
  var encode = function(str){
    return str.replace(/"/g, '&quote;').replace(/\n/g, '&#10;').trim();
  }
  
  var decode = function(str){
    return str.replace(/&quote;/g, '"').replace(/&#10;/g, '\n').trim();
  }
  
  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------
  
  // Plugin initialization on DOM ready
  $(document).ready(function() {
    register();
  });
  
}(jQuery);
