""" handle adding/removing players and managing player state """
import pprint

pp = pprint.PrettyPrinter(indent=4)

class FuncPlayers(object):
    """ blakes 7 player management class """
    players = None
    clients = None
    blakes7 = None

    def __init__(self, blakes7):
        """ initialize players and clients lists """
        self.clients = []
        self.players = []
        self.blakes7 = blakes7

    def process(self):
        """ process time-based state changes in players """
        for player in self.players:
            pass


    def client_id_to_player(self, client_id):
        """ look for a player dict corresponding to a given client id,
            return it """
        for player in self.players:
            if player['client_id'] == client_id:
                return player
        print """client_id_to_player(): could not find clientID (%d) in
                 players list""" % (client_id)
        return None


    def player_id_to_client(self, player_id):
        """ look for a client dict corresponding to a given player id and return
            it. Otherwise return None. This will usually be used for sending
            messages to a client (port) given by referencing the player's id """
        for player in self.players:
            if player['player_id'] == player_id:
                return player['client_data']
        print """player_id_to_client(): could not find player_id (%d) in
                 players list""" % (player_id)
        return None


    def client_joined(self, client_id, client_data):

        # TODO - add client to clients[]
        # TODO - map clientID to playerID
        # TODO - add player to game model
        # TODO - process new player
        # TODO - notify all players that a new player joined

        """ a client (websocket port) joined the game. Add to list
            of clients """
        self.clients.append({'id':client_id, 'data':client_data})
        pp.pprint(self.clients)


    def client_left(self, client_id):
        # TODO - get playerID from clientID
        # TODO - remove client from []
        # TODO - remove player from game model
        # TODO - process new player
        # TODO - notify all players that player left

        """ a client left, remove the client id from the list """
        # TODO - will need to deal with player info
        for i in range(0, len(self.clients)):
            if self.clients[i] and self.clients[i]['id'] == client_id:
                print "removing client, ID = " + str(client_id)
                del self.clients[i]
                # TODO - remove empty array elements
        pp.pprint(self.clients)


    def get_client_data(self, client_id):
        """ for a given client_id, return the client data from the internal
            list. This will be mainly used for sending messages to clients """
        for i in range(0, len(self.clients)):
            if self.clients[i] and self.clients[i]['id'] == client_id:
                return self.clients[i]['data']
        print """funcPlayers.get_client_data(): unable to get client
                 data for clientID = %d""" % (client_id)
        return None


    def get_player_by_id(self, player_id):
        """ look for a player dict matching the given player_id and return it,
            otherwise, return None """
        for player in self.players:
            if player['player_id'] == player_id:
                return player
        print """funcPlayers.get_player_by_id(): could not find player_id (%d)
                 in players list""" % (player_id)
        return None


    def assign_player_id_to_client(self, options):
        """ options = { client_id, client_data, name, password, iploc)
            Creates a new player dict and id for a new client """
        ## TODO - might want to move some of this into another function
        ### (update player model(s))

        # TODO - if name/pass matches old playerID, use that playerID
        new_player_id = options['client_id']
        self.players.append({'player_id':new_player_id,
                             'client_id':options['client_id'],
                             'client_data':options['client_data'],
                             'status':'ACTIVE',
                             'name':options['name'],
                             'password':options['password'],
                             'iploc':options['iploc']})

        # send message to client telling about the new player ID
        self.blakes7.server.send(new_player_id, {'type':'SET_PLAYER_ID',
                                                 'data':new_player_id})

        # create new ship for player
        self.blakes7.ships.create_ship('liberator', new_player_id)

        # TODO - if player is respawned, use existing ship

        # send location data (ship/planet)  TODO - use model for this data
        self.send_player_data(new_player_id)

        # send scanner data # TODO
        scanner_data = {
          'on':True,
          'nearbyObjects':[
            {'type':'planet', 'name':'Earth', 'speed':0.0, 'direction':120,
             'distanceX':240, 'distanceY':-400},
            {'type':'federation pursuit type 2', 'name':'Pursuit2', 'speed':0.0,
             'direction':120, 'distanceX':-100, 'distanceY':100},
            {'type':'deep space vehicle', 'name':'Liberator', 'speed':0.0,
             'direction':120, 'distanceX':-50, 'distanceY':-50},
            {'type':'london class', 'name':'London', 'speed':0.0,
             'direction':120, 'distanceX':499, 'distanceY':-500},
            {'type':'federation command proto', 'name':'Sleer1', 'speed':0.0,
             'direction':120, 'distanceX':0, 'distanceY':499},
            {'type':'space station', 'name':'Space Command 1', 'speed':0.0,
             'direction':120, 'distanceX':250, 'distanceY':25},
            {'type':'luxury cruise class', 'name':'Space Princess', 'speed':0.0,
             'direction':120, 'distanceX':225, 'distanceY':25}
          ],
          'range':500, # spacials
          'damageLevel':0,
          'gridSize':15,
          'animationFrame':0
        }
        self.blakes7.server.send(new_player_id, {'type':'MODEL_UPDATE',
                                                 'modelName':'SCANNER',
                                                 'data':scanner_data})

        # send inventory data: had to put array in items object member or
        # else javascript uses '0' and '1' as keys in an object
        inventory_data = {'items': [
          {'id':1,
           'type':'teleport bracelet',
           'description':'required for teleport'},
          {'id':10,
           'type':'federation sidearm',
           'description':'''black metal frame, effective for freeing
                         rogue nations!'''}
        ]}
        self.blakes7.server.send(new_player_id, {'type':'MODEL_UPDATE',
                                                  'modelName':'INVENTORY',
                                                  'data':inventory_data})


        # ship power data # TODO
        ship_power_data = {
          'cells':[{'power':50, 'maxCap':1000},
                   {'power':50, 'maxCap':1000},
                   {'power':50, 'maxCap':1000},
                   {'power':50, 'maxCap':1000},
                   {'power':50, 'maxCap':1000},
                   {'power':50, 'maxCap':1000},
                   {'power':50, 'maxCap':1000},
                   {'power':50, 'maxCap':1000}],
          'rechargeRate':2, # gigawatts per second
          'drainRate':2.341 # gigawatts per second
        }
        self.blakes7.server.send(new_player_id, {'type':'MODEL_UPDATE',
                                                 'modelName':'SHIP_POWER',
                                                 'data':ship_power_data})

        # send ship status data
        ship_status_data = {
         'loc': '10 x 32',             # grid reference
         'speed':0,                    # speed in standard-by units, will
                                       #  convert to time-distort for
                                       #  non-liberator/scorpio
         'damage':[],                  # array of affected systems (this
                                       #  is server-driven)
         'forceWallActive':True,
         'radiationFlareShieldActive':False,
         'neutronBlastersCleared':False,
         'shipType':'scorpio'
        }
        self.blakes7.server.send(new_player_id, {'type':'MODEL_UPDATE',
                                                 'modelName':'SHIP_STATUS',
                                                 'data':ship_status_data})


        # TODO - namespace the different component models so we can send
        # multiple models at one time


        # send broadcast message of new player list
        self.broadcast_player_list()

        return


    def players_on_ship(self, ship_id):
        """ returns a list of player IDs on a ship identified by id """
        player_ids = []
        for player in self.players:
            if player['where'] == 'ship' and \
               player['shipLocInfo'] and \
               player['shipLocInfo']['shipID'] == ship_id:
                player_ids.append(player['player_id'])
        return player_ids


    def assign_ship_to_player(self, player_id, ship):
        """ assigns a player, if exists, to a ship """
        if player_id is not None:
            player = self.get_player_by_id(player_id)
            if player is not None:
                player['where'] = 'ship'
                player['shipLocInfo'] = {'shipID':ship['shipID'],
                                         'shipType':ship['shipType']}
            else:
                print """funcPlayers.assign_ship_to_player(): could not assign
                      "ship to player. ShipID = %d, player_id = %d""" % \
                      (ship['ship_id'], player_id)
        return


    def generate_player_list(self):
        """ creates list of active players for sending as a 'Player List' to
            all players """

        def is_active(player):
            """ is this player active? """
            return player['status'] == 'ACTIVE'

        player_list = []
        for player in self.players:
            if is_active(player):
                player_list.append({'id':player['player_id'],
                                    'name':player['name'],
                                    'status':player['status'],
                                    'iploc':player['iploc']})
        return player_list


    def broadcast_player_list(self):
        """ sends a list of players to all players """
        self.blakes7.server.send(-1, {'type':'PLAYER_LIST',
                                      'data':self.generate_player_list()})


    def create_player(self, client_id):
        """ create a new player """
        return


    def remove_player(self, player_id):
        """ remove an existing player """
        return


    def send_player_data(self, player_id):
        """ send message to player giving details about his player """
        player = self.get_player_by_id(player_id)

        if not player:
            # TODO
            print """FuncPlayers.send_player_data(): could not get player
                     info by ID = %d""" % player_id
            return

        # player is on a ship
        pp.pprint(player)

        message = {'PLAYER':{'model':player,
                             'proto':{}}}  # TODO

        self.blakes7.server.send(player_id, message)

# if (player['where'] == 'ship' and player['shipLocInfo']['shipID']):
#   ship = getShipByID(player['shipLocInfo']['shipID'])
#   locData = { 'where':'ship',
#               'shipLocInfo': {
#                 'shipType':ship['shipType'],
#                 'shipID':shipID, 'name':'Liberator#TODO' } }
#   funcServer.send(player_id, { 'type':'MODEL_UPDATE',
#                                'modelName':'LOCATION', 'data':locData} )
#
# # player is on a planet or space station
# else:
#   #TODO
#   locData = { 'where':'planet',
#               'shipLocInfo': {
#                 'shipType':'planet',
#                 'planetID':1, 'name':'Earth' },
#                 'planetLocInfo': { 'roomNum':101 } }
#   funcServer.send(player_id, { 'type':'MODEL_UPDATE',
#            'modelName':'LOCATION', 'data':locData} )
