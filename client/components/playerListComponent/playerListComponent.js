// playerList component for blake's 7 game, shows the players connected to the game

String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};


function PlayerListComponent( options ){
  function debug(message, debugLevel){
    console.log('PlayerListComponent: ' + message);
  }

  this.model = { playerList:[] },
  // define how the model is displayed to the user
  this.views = [
    {
      renderer: function(model){
        var _html = "<table><tr><th>id</th><th>name</th><th>approx loc</th></tr>";
        var _templ = String("<tr><td>{0}</td><td>{1}</td><td>{2}</td></tr>");
        var _templHighlight = String("<tr><td class='h'>{0}</td><td class='h'>{1}</td><td class='h'>{2}</td></tr>");

        if (typeof(model) === "undefined" || typeof(model.playerList) === "undefined"){
          debug('renderer(): model or model.playerList is undefined');
        } else {
          for (var i = 0; i < model.playerList.length; i++){
            var p = model.playerList[i];
            if (p.id === model.playerID){
              _html += _templHighlight.format(p.id, p.name, p.iploc);
            } else {
              _html += _templ.format(p.id, p.name, p.iploc);
            }
          }
        }
 
        return _html + "</table>";
      },

      destination:options.destination,
      destinationInsertionFunction:"html"
    }
  ];

  /* by default, model state changes are caught by MVA and the renderer is rerun.
     The adapters here are for UI events that affect the component model state.
       Also, async events can be added 
         TODO - what about streaming data?
         TODO - what about push events (socket.io?)
  */
  this.adapters = [];
}

