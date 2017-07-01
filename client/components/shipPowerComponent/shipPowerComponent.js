// power component for blake's 7 game, shows ship cell charge

function secondsToMinsOrHours(seconds){
  if (seconds > 3600){
    return (seconds / 3600).toFixed(1) + " hours";
  }

  if (seconds > 60){
    return (seconds / 60).toFixed(2) + " minutes";
  }

  return seconds.toFixed(1) + " seconds";
}


function ShipPowerComponent( options ){

  this.model = options.model;

  // define how the model is displayed to the user
  this.views = [
      {
        // returns html to be placed in destination element
        renderer: function(model){

          if (model == undefined || $.isEmptyObject(model)){
            return;
          }

          var _html = "<ul>";
          var fullSamp  = "████████████████████████████████████████████████";
          var emptySamp = "⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕⎕";
          var width = 20;
          var netChargeRate = (model.baseRecharge - model.drainRate).toFixed(3);
          var timeLeft = 0;
          var totalPower = 0;
          var totalCapacity = 0;

          for (var i = 0; i < model.powerCells.cells.length; i++){
            totalPower += model.powerCells.cells[i].power;
            totalCapacity += model.powerCells.cells[i].maxCap;
          }

          // draining
          if ( netChargeRate < 0 ){
            timeLeft = Math.round( totalPower / netChargeRate * -1 );
          }

          // charging
          else {
            timeLeft = Math.round( (totalCapacity - totalPower) / netChargeRate );
          }

          for ( var i = 0; i < model.powerCells.cells.length; i++ ){
            var c = model.powerCells.cells[i];              // model
            var protoC = model.proto.cells[i];   // prototype (maxCap)
            var perc = Math.round(c.power / protoC.maxCap * 100 * 100) / 100;

            var dots = Math.round(c.power / 100 * width);
            var currPwr = Math.round(c.power / 100) * 100;
            _html += "<li>cell&nbsp;" + (i+1) + ":<span class='graph'>" + fullSamp.substr(0, dots) +
                     emptySamp.substr(0, width-dots);
            _html += "</span>" + perc + "% ";
            _html += "<span class='power'>(" + currPwr + " of " + protoC.maxCap +
                    " gigawatts)</span></li>\n";
          }
          _html += "</ul>";
          _html += "<ul class='info'><li><b>recharge rate:</b> " + model.baseRecharge + " GW per sec</li>";
          _html += "<li><b>drainage rate:</b> " + model.drainRate + " GW per sec</li>";
          _html += "<li><b>net charge rate:</b> " + netChargeRate + " GW per sec</li>";

          if (netChargeRate < 0){
            _html += "<li><b>Cells drained in approx:</b> " + secondsToMinsOrHours(timeLeft) + "</li>";
          } else {
            _html += "<li><b>Cells charged in approx:</b> " + secondsToMinsOrHours(timeLeft) + "</li>";
          }

          _html += "</ul>";
 
          return _html;
        },

        // jquery selector
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
