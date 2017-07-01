/*
 _   _     _           ___ 
| |_| |___| |_ ___ ___|_  |
| . | | .'| '_| -_|_ -| | |
|___|_|__,|_,_|___|___| |_|
                           
*/
var GAMESTATE = { NOTCONNECTED:0,
                  CONNECTED:   1,
                  PLAYER:      2 };

var store = {
  gameState: GAMESTATE.NOTCONNECTED,

  webSocket:undefined,

  location: {
  where:'planet',  // or 'planet'
    shipLocInfo: { shipType:'fedPursuit',
                 shipId:1,
                   name:'Pursuit 1' },
    planetLocInfo: { roomNum:101 }
  },

  inventory: {
    items: [
      { id:1,  type:'teleport bracelet',  description:'required for teleport' },
      { id:10, type:'federation sidearm', description:'black metal frame, effective for freeing rogue nations' }
    ]
  },

  playerList:{ players:[0] },

  shipStatus:
  { loc: '10 x 34', // grid reference
    speed:2, // speed in standard-by, convert to time-distort for non-liberator
    damage:[], // array of affected systems (this is server-driven)
    forceWallActive:true,
    radiationFlareShieldActive:false,
    neutronBlastersCleared:false,
     shipType:'scorpio' },

  scanner:
  { on:true,
    nearbyObjects:[
    {type:'planet', name:'Earth', speed:0.0, direction:120, distanceX:240, distanceY:-400},
    {type:'federation pursuit type 2', name:'Pursuit2', speed:0.0, direction:120, distanceX:-100, distanceY:100},
    {type:'deep space vehicle', name:'Liberator', speed:0.0, direction:120, distanceX:-50, distanceY:-50},
    {type:'london class', name:'London', speed:0.0, direction:120, distanceX:499, distanceY:-500},
    {type:'federation command proto', name:'Sleer1', speed:0.0, direction:120, distanceX:0, distanceY:499},
    {type:'space station', name:'Space Command 1', speed:0.0, direction:120, distanceX:250, distanceY:25},
    {type:'luxury cruise class', name:'Space Princess', speed:0.0, direction:120, distanceX:225, distanceY:25}
    ],
    range:500, // spacials
    damageLevel:0,
    gridSize:15,
    animationFrame:0
  },

  shipPower:
    { cells:[ { power:100, maxCap:1000 },
              { power:10,  maxCap:1000 },
              { power:80,  maxCap:1000 },
              { power:34,  maxCap:1000 },
              { power:100, maxCap:1000 },
              { power:100, maxCap:1000 },
              { power:84,  maxCap:1000 },
              { power:2,   maxCap:1000 } ] }
};

function setGameState(newState, message){
  // NOTCONNECTED - not connected to server, no player
  // CONNECTED - connected to server, no player
  // ACTIVE - connected to server, player assigned

  store.gameState = newState;

  switch (newState){
    case 'NOTCONNECTED':
      $('body').removeClass();
      $('body').addClass('notConnected');
      break;
    case 'WAITING_FOR_NAME':
      $('body').removeClass();
      $('body').addClass('waitingForName');
      break;
    case 'ACTIVE':
      $('body').removeClass();
      $('body').addClass('gameActive');
      break;
    default:
      console.log('setGameState(): "' + newState + '" is not a valid state');
  }
}

$( document ).ready(function() {
    $('#loginForm').submit( function(e){
      // TODO - submit
      var playerName = $('#loginForm input[name="name"]').val();
      var password = $('#loginForm input[name="password"]').val();
      var messageObj = { 'type':'REQUESTING_PLAYER_NAME',
                         'data':{'name':playerName, 'password':password} };

      try {
        theJSON = JSON.stringify(messageObj);
      } catch(e){
        console.log('login(): could not stringify login message to json');
        return;
      }

      store.webSocket.send(theJSON)
    });

    
    /* websocket stuff */
    function initWS() {
      store.webSocket = new WebSocket("ws://70.32.24.233:9001");

      // event handlers
      store.webSocket.onopen = function(){
        store.gameState = GAMESTATE.CONNECTED; 
      };
      store.webSocket.onclose = function(){
        store.gameState = GAMESTATE.NOTCONNECTED;
        setGameState('NOTCONNECTED');
      };
      store.webSocket.onerror   = function(e) {
console.log('on error');
        $('.connectionError').html('The connection to the server failed. The server may not be running'); 
        setGameState('NOTCONNECTED');
        console.log(e);
       };
      store.webSocket.onmessage = function(e) { onReceive(e.data); };
    }
    
    // TODO - change function to send messages to server
/*  function onSubmit() {
      var input = document.getElementById("input");
      store.webSocket.send(input.value);
      console.log("send: " + input.value);
      input.value = "";
      input.focus();
    } */

    function onReceive( data ) {
//    console.log("received: " + data);
      var obj;
      try {
        obj = JSON.parse(data);
      } catch(e){
        console.log('onReceive(): could not parse json to data. json = ' + data);
        return;
      }

      if (typeof(obj) === "undefined"){
        console.log("onReceive(): received empty object from JSON message: '" + data + "'");
        return;
      }

      if (typeof(obj.type) === "undefined"){
        console.log("onReceive(): received message has no type: '" + data + "'");
        return;
      }

      // TODO - can component state updates be abstracted and handled somewhat via mva.js?
      switch(obj.type){
        case 'PLAYER_LIST':
          store.playerList = obj.data;
          mva.setComponentState(playerListComponent, { playerList:store.playerList, playerID:store.playerID });
          break;

        case 'MODEL_UPDATE':
         var model = obj.data.model;
         var proto = obj.data.proto;
          if (obj.modelName){
            switch(obj.modelName){
              case 'SHIP':
                var mNav = model.navigation;

                var shipStatus = {
                  loc:mNav.position,
                  speed:mNav.speed,
                  destination:mNav.destination,
                  direction:mNav.direction,
                  forceWallActive:false,
                  neutronBlastersCleared:false,
                  radiationFlareShield:false,

                  proto: {
                    'shipType':'liberator',  // TODO
                    'fancyName':'Liberator Class',
                    'navigation': {'maxSpeed':12 },
                    'hasTeleport':true,
                    'damage':{ 'maxDamageNum':200 },
                    'hasForceWall':true,
                    'weapons': { 'hasNeutronBlasters':true} 
                  }
                };
                mva.setComponentState(shipStatusComponent, shipStatus);
                    
                var shipPower = {
                  'powerCells':model.powerCells,
                  'baseRecharge':66, // TODO
                  'drainRate':2, // TODO
                  'proto':proto.powerCells
                };

                mva.setComponentState(shipPowerComponent, shipPower);
                break;

              case 'SCANNER':
                mva.setComponentState(scannerComponent, obj.data);
                break;

              case 'LOCATION':
                mva.setComponentState(locationComponent, obj.data);
                break;

              case 'INVENTORY':
                mva.setComponentState(inventoryComponent, obj.data);
                break;

              case 'SHIP_POWER':


              default:
                console.log('received MODEL_UPDATE message, but type is not understood: ' +
                            obj.modelName);
            }
          }
          break;

        case 'CONNECTED': // connected to server, send name
          setGameState('WAITING_FOR_NAME');
          break;

        case 'SET_PLAYER_ID': // server has given player an id
          store.playerID = obj.data;
          setGameState('ACTIVE');
          break;
      }
    }

    initWS();
    /* end websocket stuff */


    // initialize mva controller
    window.mva = new MVA( { watchTimeout:15000 } );

    // construct the setup for new components, pass options to the constructor 
    var locationConstructor = new LocationComponent( { state:store.location,
                                                       destination:".locationComponent" } );

    var lookConstructor = new LookComponent( { state:store.location,
                                               destination:".lookComponent" } );

    var inventoryConstructor = new InventoryComponent( { state:store.inventory,
                                                         destination:".inventoryComponent" } );

    var playerListConstructor = new PlayerListComponent( { state:store.playerList,
                                                           destination:".playerListComponent" } );

    var shipStatusConstructor = new ShipStatusComponent( { state:store.shipStatus,
                                                           destination:'.shipStatusComponent'} );

    var scannerConstructor = new ScannerComponent( { state: store.scanner, 
                                                     destination:'.scannerComponent',
                                                     listDestination:'.scannerComponentList' } );

    var shipPowerConstructor = new ShipPowerComponent( { state:store.shipPower,
                                                         destination:'.shipPowerComponent'} );

    // add components to the MVA controller, TODO - move component return vals to b7 obj
    var locationComponent   = mva.addComponent( locationConstructor );
    var lookComponent       = mva.addComponent( lookConstructor );
    var inventoryComponent  = mva.addComponent( inventoryConstructor );
    var playerListComponent = mva.addComponent( playerListConstructor );
    var shipStatusComponent = mva.addComponent( shipStatusConstructor );
    var scannerComponent    = mva.addComponent( scannerConstructor );
    var shipPowerComponent  = mva.addComponent( shipPowerConstructor );

});
