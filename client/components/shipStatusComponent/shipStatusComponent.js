// location component for blake's 7 game, shows ship type image, type name, and name

// converts standard-by to time-distort using SB2 = TD3 and SB10 = TD10
// from http://www.hermit.org/b7/SevenCyc/S.html#speed
function SBtoTD(sb){ return (0.06250*sb*sb) + (1.375 * sb); }

String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

function round2(num){
  return Math.round(num * 100) / 100;
}


function ShipStatusComponent( options ){

  this.model = options.model;

  // define how the model is displayed to the user
  this.views = [
      {
        // returns html to be placed in destination element
        renderer: function(model){

          if (model == undefined || $.isEmptyObject(model)){
            return;
          }

          var _spd = 'stopped';
          var proto = model.proto;

          if (model.speed && model.speed !== 'unknown'){
            // convert standard-by for non-liberator and non-scorpio class ships

            // TODO - perhaps convert ship types to ids instead of names
            if (proto.shipType !== 'liberator' && proto.shipType !== 'scorpio'){
              _spd = "<span title='time distort'>TD</span>" + SBtoTD(model.speed);
            } else {
              _spd = "<span title='standard by'>SB</span>" + model.speed;
            }
          }

          var _dmg = "none"; // TODO
          var _loc = round2(model.loc.x) + " x " + round2(model.loc.y);

          var speedMenuHTML = "<div class='speedSelector {0}'>asdfasdf</div>"
            .format( (model.speedSelectVisible ? 'visible' : '') );


          var templ = String("<ul class='info'>" +
                                "<li><b>Location:</b> {0}</li>" +
                                "<li><b>Speed:</b>" +
                                  "<a class='showSpeedSelector' href='javascript:;'>{1}</a>" +
                                  "{2}" +
                                "</li>" +
                                "<li><b>Force wall:</b> <a href='javascript:;'>{3}</a></li>" +
                                "<li><b>Radiation flare shield:</b> <a href='javascript:;'>{4}</a></li>" +
                                "<li><b>Neutron blasters cleared:</b> <a href='javascript:;'>{5}</a></li>" +
                                "<li><b>Damaged systems:</b> {6}</li>"); // TODO joined list of general systems

          var html = String(templ).format(_loc, // calced above
                                          _spd, // calculated above
                                          speedMenuHTML,
                                          model.forceWallActive,
                                          model.radiationFlareShieldActive,
                                          model.neutronBlastersCleared,
                                          _dmg); // calced above
 
          return html;
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
  this.adapters = [
    // TODO - abstract this and move the actual jquery on() call to mva.js

    // clicked on speed, show speed selector
    function(componentID, views, model, setComponentState){
//      { componentID:componentID, views:views, model:model, setComponentState:setComponentState },
      $('body').on('click', '.shipStatusComponent a.showSpeedSelector',
        function( event ){
console.log('click!');
console.log(event);
          var speedSelectVisible = model.speedSelectVisible;
          var newModel = model;
          if (!speedSelectVisible){
            newModel.speedSelectVisible = true;
          } else {
            newModel.speedSelectVisible = false;
          }
console.log('new speedSelectVisible state = ' + newModel.speedSelectVisible);
// TODO - BOB
          setComponentState(newModel);
        }
      );
$('.shipStatusComponent a.showSpeedSelector').click();
    }
  ];
}
