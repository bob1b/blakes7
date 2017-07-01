// location component for blake's 7 game, shows ship type image, type name, and name

String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

String.prototype.formatArray = function(arr) {
    var formatted = this;
    for (var i = 0; i < arr.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arr[i]);
    }
    return formatted;
};

// gridSize = 11x11, 21x21, 501x501
function mapDistancesToSlots( objects, range, gridSize ){
  var slotSize = range / gridSize;
  var gridCenter = (gridSize - 1)/2;
  for ( i = 0; i < objects.length; i++ ){
    var o = objects[i];
    o.slotX = Math.round(o.distanceX / slotSize / 2);
    o.slotY = Math.round(o.distanceY / slotSize / 2);
    o.gridX = Math.round(o.slotX + gridCenter);
    o.gridY = Math.round(-1 * o.slotY + gridCenter);
  }
}

function gridToTable(grid, model){
  var html = "<h3>Visual Scan</h3><table>";
  for ( var x = 0; x < grid.length; x++ ){
    html += "<tr>";
    for ( var y = 0; y < grid[x].length; y++ ){
      var val = grid[y][x];
      if (typeof(val) === 'undefined'){
        val = '.';
      }
      html += "<td>" + val + "&nbsp;</td>";
    }
    html += "</tr>";
  }
  html +="</table>";

  html += "<div class='info'><div><b>range:</b> <a href='javascript:;'>" + model.range +
          "</a> spacials</div><div><b>grid size:</b> " +
          model.gridSize + "x" + model.gridSize + "</div>" +
          "<div>[ ] - blind spot</div><div>* - scanner contact</div></div>";

  return html;
}

function ScannerComponent( options ){

  var s = options.state;
  this.model = { on:s.on,
                 nearbyObjects:s.nearbyObjects,
                 range:s.range,
                 damageLevel:s.damageLevel,
                 gridSize:s.gridSize || 11,
                 animationFrame:0 } // TODO - not sure if this will be the right way to do this
console.log(this.model.nearbyObjects);

  // define how the model is displayed to the user
  this.views = [
      {
        // returns html to be placed in destination element
        renderer: function(model){
          var gridCenter = Math.round((model.gridSize - 1)/2);

          // create 11x11 (standard) or 15x15 (liberator) grid, 51x51 (base/planet) grid
          var grid = new Array(model.gridSize);
          for ( var i = 0; i < grid.length; i++ ){
            grid[i] = new Array(model.gridSize);
          }

          // convert nearby object locations to slots which will fit into the display
          mapDistancesToSlots( model.nearbyObjects, model.range, model.gridSize );
          for ( i = 0; i < model.nearbyObjects.length; i++ ){
            var oX = model.nearbyObjects[i].gridX;
            var oY = model.nearbyObjects[i].gridY;
            if (typeof(oX) !== 'undefined' && typeof(oY) !== 'undefined' &&
                isFinite(oX) && isFinite(oY)){
              if (oX >= model.gridSize || oY >= model.gridSize || oX < 0 | oY < 0){
                // out of range, ignore
              } else {
                grid[oX][oY] = String(i+1); // TODO - use different letter for type (which is unknown at long range?)
              }
            } else {
              // TODO - throw error
            }
          }

          // TODO - add blindspots to model
          var blindSpots = [{xPerc:0, yPerc:100}, {xPerc:-23, yPerc:-50}];

          for ( i = 0; i < blindSpots.length; i++ ){
            var gX = Math.round(blindSpots[i].xPerc / 100 * (model.gridSize / 2) + gridCenter);
            var gY = Math.round(-1 * blindSpots[i].yPerc / 100 * (model.gridSize / 2) + gridCenter);
            grid[gX][gY] = ' ';
          }
          
          // add center (user's ship) last
          grid[gridCenter][gridCenter] = 'L'; // TODO - use a different letter
          

          // convert grid array to table html
          return gridToTable(grid, model);

        },

        // jquery selector
        destination:options.destination,
        destinationInsertionFunction:"html"
      },

      // scanner list view
      {
        renderer: function(model){
          var i;
          var cols = [ 'id', 'type', 'name', 'vel (spd & dir)', 'distX', 'distY', 'size' ];

          // TODO - convert velocity to TD speed and Direction for Federation ships
          var html = "<table>";
          html = html + "<tr>";
          html = html + (cols.map( function(c){ return "<th>" + c + "</th>"; } ).join(''));;
          html = html + "</tr>";

          for ( i = 0; i < model.nearbyObjects.length; i++ ){

            o = model.nearbyObjects[i];

            var _velo = 'stationary';

            // TODO - convert SB to TD for appropriate scanners
            if (o.speed > 0.0){
              _velo = 'SB'+o.speed+ ' x ' + o.direction;
            }
            var valz= [ i+1, o.type, o.name, _velo, o.distanceX, o.distanceY, '?' ];

            html += "<tr>" + (valz.map( function(v){ return "<td>" + v + "</td>"; } ).join('')) + "</tr>";
          }
          html += "</table>";
//console.log(html);
          return html;
        },

        destination:options.listDestination,
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
