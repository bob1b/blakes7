// look component for blake's 7 game: text description of room, local items, people, directions of movement

String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

var rooms = { '101': { desc:'You are at a large, locked wooden door, the entrance to a small castle. ' +
                            'A wooden plaque next to the door has the shape of a hand burnt into it. ' +
                            'Below this, an inscription reads "Only from his hand comes life".',
                       paths:[ { 'south': { roomNum:'101' } } ],
                       items:[ { itemID:20, itemDescription:'crude wooden cross' } ],
                       people:[ { playerID:1 } ] }, // TODO
              '102': {} };


function LookComponent( options ){

  this.model = { roomNum:options.state.roomNum },

  this.views = [
    {
      // returns html to be placed in destination element
      renderer: function(model){

        var roomNum = 101;
        var r = rooms[roomNum];
        var description = rooms[String(roomNum)].desc;
        var items = "<b>Items present:</b> " +
                   r.items.map(
                     function(x){
                       return "<a href='javascript:;'>" + x.itemDescription + "</a>"
                     }
                   ).join(', ');
        var paths = "<b>Directions in which you can travel:</b> " +
                   r.paths.map(
                     function(x){
                       return "<a href='javascript:;'>" + Object.keys(x) + '</a>';
                     }
                   ).join(', ');

        var html = String("<p class='lookDesc'>{0}</p><p class='items'>{1}</p><p class='paths'>{2}</p>")
                            .format(description, items, paths);
        return html;
      },

      // jquery selector
      destination:options.destination,
      destinationInsertionFunction:"html"
    }
  ];

  // TODO - movement, pickup/drop items, interaction with people, etc
  this.adapters = [];
}
