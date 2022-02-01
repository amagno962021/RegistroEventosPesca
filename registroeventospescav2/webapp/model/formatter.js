sap.ui.define([], function () {
    "use strict";
  
    return {
  
      // formatter method contains the formatting logic
      // parameter iValue gets passed from the view ...
      // ... that uses the formatter
      eliminaCeroHora: function(hora){
          var newValue = "";
          if(hora == "00:00"){
            newValue = "";
          }else{
            newValue = hora;
          }
          return newValue;
      }
      
      
    };
  
  });