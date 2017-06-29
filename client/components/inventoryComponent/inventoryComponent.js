String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};


function InventoryComponent( options ){
  function debug(message, debugLevel){
    console.log('PlayerListComponent: ' + message);
  }

  this.model = options.state,

  this.views = [
    {
      renderer: function(model){

        if (typeof(model) !== "undefined" && typeof(model) !== "undefined" && 
            typeof(model.items) !== "undefined" && model.items.length > 0){
          var _html = "<table><tr><th>id</th><th>item type</th><th>description</th></tr>";
          var _templ = String("<tr><td>{0}</td><td>{1}</td><td>{2}</td></tr>");

          for (var i = 0; i < model.items.length; i++){
            var item = model.items[i];
            _html += _templ.format(item.id, item.type, item.description);
          }
        }

        // empty inventory
        else {
          return 'empty';
        }
 
        return _html + "</table>";
      },

      destination:options.destination,
      destinationInsertionFunction:"html"
    }
  ];

  this.adapters = [];
}

