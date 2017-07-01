// location component for blake's 7 game, shows ship type image, type name, and name

String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

function LocationComponent( options ){

  this.model = { where:options.state.where,
                 shipLocInfo: {
                   // liberator, fedPursuit, scorpio, libShuttle, cancerShip
                   shipType:options.state.shipLocInfo.shipType || 'unknown',

                   // supplied by server, don't do anything if id is -1
                   shipId:options.state.shipLocInfo.shipId || '-1',

                   name:options.state.shipLocInfo.name || 'unnamed'
                 },

                 planetLocInfo: { roomNum:options.state.planetLocInfo.roomNum }
                }


  // define how the model is displayed to the user
  this.views = [
      {
        // returns html to be placed in destination element
        renderer: function(model){

          if (model.where === 'ship'){
            var ships = [{ type:'cryoCapsule', img:'cryoCapsule.jpg', fancyName:'Cryogenic Capsule' },
                         { type:'fedPursuit2', img:'fedPursuit2.jpg', fancyName:'Federation Pursuit Class' },
                         { type:'fedPursuit', img:'fedPursuit.jpg', fancyName:'Federation Pursuit Class' },
                         { type:'liberator', img:'liberator.jpg', fancyName:'Liberator Class' },
                         { type:'liberatorPod', img:'liberatorPod.jpg', fancyName:'Liberator Escape pod' },
                         { type:'londonShip', img:'londonShip.jpg', fancyName:'London Class' },
                         { type:'protoSpaceAge', img:'protoSpaceAge.jpg', fancyName:'Proto-Space Age Class' },
                         { type:'scorpio', img:'scorpio.jpg', fancyName:'Scorpio Class' },
                         { type:'sleer', img:'sleer.jpg', fancyName:'Sleer Command Class' },
                         { type:'spaceCommand', img:'spaceCommand.jpg', fancyName:'Space Command Base' },
                         { type:'spacePrincess', img:'spacePrincess.jpg', fancyName:'Space Princess Class' }];

            for (var i = 0; i < ships.length; i++){
              if (model.shipLocInfo.shipType === ships[i].type){
                var html = String("<div class='image' style='background-image:url({0})'></div>" +
                                  "<div class='info'>{1}" +
                                    "<div class='name'>\"{2}\"</div></div>")
                            .format('components/locationComponent/media/' + ships[i].img,
                                    ships[i].fancyName,
                                    model.shipLocInfo.name);
                return html;
              }
            }
            return "<div class='info unknown'>Unknown Ship Class</div>";
          }

          else { // planet: where='planet'
            var planets = [{name:'Cygnus Alpha', roomMin:101, roomMax:500,
                            description:'', img:'cygnusAlpha.jpg'}];

            var planetID = -1;
            for (var i = 0; i < planets.length; i++){
              if (model.planetLocInfo.roomNum >= planets[i].roomMin &&
                  model.planetLocInfo.roomNum <= planets[i].roomMax ){
                planetID = i;
                break;
              }
            }

            var _templ = String("<div class='image' style='background-image:url({0})'></div>" +
                              "<div class='info'>{1}" +
                                "<div class='name'>\"{2}\"</div></div>");

            var _html = "";
            if (planetID >= 0){
              _html = _templ.format('components/locationComponent/media/' + planets[i].img,
                                    planets[i].description, 'Planet: ' + planets[i].name);
            } else {
              _html = "<div class='info unknown'>Unknown Planet</div>";
            }

            return _html;
          }
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
