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

  this.model = {
    speed:0,
    loc:{x:0, y:0},
    forceWallActive:true,
    radiationFlareShieldActive:true,
    neutronBlastersCleared:true,
    showSettings:false
  };

  this.model_server_sync_keys = [
    "speed", "loc", "forceWallActive", "radiationFlareShieldActive", "neutronBlastersCleared"
  ];
/* TODO 
  this.model_server_sync_all_but_these_keys = [ 'settingsVisible' ];
*/

  function generate_server_message( vals ){
    var obj = { type:"shipStatus", data:vals };
    return JSON.stringify( obj );
  };

  this.model_server_sync_send = function( vals ){
    var message = generate_server_message( vals );
    store.webSocket.send(message);
  };

  this.model_server_sync_receive = function( setComponentState ){
  };

  function _format_speed(model, type){
	  var _spd = 'stopped';
      var speed_num  = 0;
	  var proto = model.proto;

      // convert standard-by for non-liberator and non-scorpio class ships
      if (type === "current_speed"){
		  if (typeof(model.speed) !== "undefined" && model.speed !== 'unknown'){
            speed_num = model.speed;
          } else {
            speed_num = 0;
          }
      } else { // type = max speed
          if (typeof(model.proto) !== "undefined" &&
              typeof(model.proto.navigation) !== "undefined" && 
              typeof(model.proto.navigation.maxSpeed) !== "undefined" && 
              model.proto.navigation.maxSpeed !== "unknown"){
            speed_num = model.proto.navigation.maxSpeed;
          } else {
            speed_num = 0;
          }
      }

      // TODO - perhaps convert ship types to ids instead of names
	  if (typeof(proto) !== 'undefined' && proto.shipType !== 'liberator' && proto.shipType !== 'scorpio'){
		  _spd = "<span title='time distort'>TD</span>" + SBtoTD(speed_num);
      } else {
		  _spd = "<span title='standard by'>SB</span>" + speed_num;
      }

	  return _spd;
  }

  // define how the model is displayed to the user
  this.views = [
      {
        // returns html to be placed in destination element
        renderer: function(model){
          var html;

          if (model == undefined || $.isEmptyObject(model)){
            return;
          }

          var _spd = _format_speed(model, "current_speed");
          var _max_speed = _format_speed(model, "max_speed");
          var _dmg = "none"; // TODO
          var _loc = round2(model.loc.x) + " x " + round2(model.loc.y);


          var mainTempl = String("<ul class='info'>" +
                                 "<li><b>Location:</b> {0}</li>" +
                                 "<li><b>Speed:</b>" +
                                   "<a class='showSpeedSelector' href='javascript:;'>{1}</a>" +
                                 "</li>" +
                                 "<li><b>Force wall:</b> <a class='toggleFW' href='javascript:;'>{2}</a></li>" +
                                 "<li><b>Radiation flare shield:</b> <a class='toggleFS' href='javascript:;'>{3}</a></li>" +
                                 "<li><b>Neutron blasters cleared:</b> <a class='toggleNB' href='javascript:;'>{4}</a></li>" +
								 "<li><b>Damaged systems:</b> {5}</li>"); // TODO joined list of general systems

           var speedTempl = String("<div class='settingsFrame'>" +
                                   "<ul><li><b>Current speed:</b> {0}</li>" +
                                       "<li><b>Maximum speed:</b> {1}</li>" +
                                       "<li><b>New speed:</b><input type='text' class='new_speed' /></li>" +
                                       "<li><a class='cancel' href='javascript:;'>Cancel</a></li>");

          if ( !model.showSettings ){
              html = String(mainTempl).format(_loc,
                                              _spd,
                                              model.forceWallActive,
                                              model.radiationFlareShieldActive,
                                              model.neutronBlastersCleared,
                                              _dmg);
          } else if ( model.showSettings === "speed" ){
console.log(model);
              html = String(speedTempl).format(_spd, _max_speed);
          }
 
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
  this.adapterz = [
    {
      type:'jquery-click',
      selector:'.shipStatusComponent a.showSpeedSelector',
      callback:function(args){ // args: model (a copy), setComponentState
          args.model.showSettings = "speed";
          args.setComponentState(args.model);
      }
    },
    {
      type:'jquery-click',
      selector:'.shipStatusComponent a.cancel',
      callback:function(args){
          args.model.showSettings = false;
          args.setComponentState(args.model);
      }
    },
    {
      type:'jquery-click',
      selector:'.shipStatusComponent a.toggleFW',
      callback:function(args){
          args.model.forceWallActive = !args.model.forceWallActive;
          args.setComponentState(args.model);
      }
    },
    {
      type:'jquery-click',
      selector:'.shipStatusComponent a.toggleFS',
      callback:function(args){
          args.model.radiationFlareShieldActive = !args.model.radiationFlareShieldActive;
          args.setComponentState(args.model);
      }
    },
    {
      type:'jquery-click',
      selector:'.shipStatusComponent a.toggleNB',
      callback:function(args){
          args.model.neutronBlastersCleared = !args.model.neutronBlastersCleared;
          args.setComponentState(args.model);
      }
    }
  ];

}
