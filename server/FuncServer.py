""" This code handles basic client/server transactions in he blake's 7 game """

# from https://github.com/Pithikos/python-websocket-server
from websocket_server import WebsocketServer
import pprint
import json
import requests

pp = pprint.PrettyPrinter(indent=4)


class FuncServer(object):
    """ handles all server-related duties - mainly communication stuff """
    server = {'PORT':9001,
              'stagedDataMessages':[]} # model data messages to be sent later
                                       # to each player by ID
    blakes7 = None
    clients = None

    def __init__(self, blakes7):
        """ initialize whatnot """
        self.blakes7 = blakes7
        self.clients = []

    def get_ip_location_string(self, ip_address):
        """ use remote api to get region and country for a given IP addr """
        freegeopip_url = 'http://freegeoip.net/json/'
        url = '{}{}'.format(freegeopip_url, ip_address)

        print "funcServer().getIPlocString(): url = " + str(url)

        response = requests.get(url)
        response.raise_for_status()

        the_json = response.json()

        try:
            ret_string = "%s, %s, %s" % (the_json['city'], \
                                         the_json['region_name'], \
                                         the_json['country_name'])
        except Exception:
            print """functServer().getIPlocString(): unable to get IP location
                   string from json: """ + str(the_json)
            ret_string = "unknown location"

        return ret_string


    def client_joined(self, client, server):
        """ Called for every client connecting (after handshake)
             A client joined the game. Add to list of clients """
        print "New client connected and was given id %d" % client['id']

        self.clients.append({'id':client['id'], 'data':client})
        self.blakes7.server.send_client(client['id'], {'type':'CONNECTED'})


    def client_requesting_name(self, client_id, name, password, iploc):
        """ client has connected and is requesting a player name """

        ## TODO - ensure client is not already in the players list
        player_id = self.blakes7.players.assign_player_id_to_client(
            client_id, name, password
        )
        values = {'client_id':client_id,
                  'player_id':player_id,
                  'name':name,
                  'password':password,
                  'iploc':iploc}
        self.blakes7.players.player_joined(values)



    def client_left(self, client, server):
        """ Called when a client disconnects """
        print "Client (id = %d) disconnected" % client['id']

        client_id = client['id']

        # remove player or set to inactive
        self.blakes7.players.player_left(client_id)

        # remove from clients list
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
        print """FuncServer.get_client_data(): unable to get client
                 data for clientID = %d""" % (client_id)
        return None


    def message_received(self, client, server, message):
        """ message was received from a client, decide what to do """

        if len(message) > 200:
            message = message[:200]+'..'
            print "message from client (%d) is over 200 bytes long" % \
                  (client['id'])

        client_id = client['id']
        print "from client %d: %s" % (client_id, message)

        # attempt to serialize json
        try:
            message_dict = json.loads(message)
        except Exception:
            print """could not convert json to dict, message from client (%d),
                     message = %s""" % (client_id, message)
            return None


        # handle received messages
        if message_dict:
            if message_dict['type'] == 'REQUESTING_PLAYER_NAME':
                name = message_dict['data']['name'],
                password = message_dict['data']['password']
                iploc = self.blakes7.server.get_ip_location_string(
                    client['address'][0]
                )
                self.client_requesting_name( \
                    client['id'], name, password, iploc)

            # check for messages to do with different model updates
            player = self.blakes7.players.client_id_to_player(client_id)

            player_id = None
            if player and 'player_id' in player:
                player_id = player['player_id']

            self.blakes7.ships.process_message(client['id'], player_id, message_dict)


        return message_dict


    def send_all(self, server, message):
        """ sends a message to all players """
        self.blakes7.players.send_player(-1, message)


    def send(self, player_id, message_dict):
        """ converts the message dict to JSON and sends to a player given by
            player id """
        try:
            json_message = json.dumps(message_dict) # , ensure_ascii=False)
        except Exception:
            print """funcServer.send(): could not dump message_dict
                     to json. Message dict:"""
            pp.pprint(message_dict)
            return
        if player_id < 0:
            self.server['ws'].send_message_to_all(json_message)
        else:
            client_data = self.blakes7.players.player_id_to_client(player_id)
            if client_data is not None:
                print "funcServer.send(): sending to client %d, json = %s" % \
                      (player_id, json_message)
                self.server['ws'].send_message(client_data, json_message)
            else:
                print """funcServer.send(): No client info! Could not send
                         message: %s""" % json_message


    # TODO - merge code with send()?
    def send_client(self, client_id, message_dict):
        """ sends to a given client (based on port) rather than to a
            particular player """
        try:
            json_message = json.dumps(message_dict) # , ensure_ascii=False)
        except Exception:
            print """funcServer.send_client(): could not dump message_dict
                     to json. Message dict:"""
            pp.pprint(message_dict)

        client_data = self.get_client_data(client_id)
        if client_data is not None:
            self.server['ws'].send_message(client_data, json_message)
        else:
            print "funcServer.send_client(): could not send message: %s" % \
                  json_message


    def start_server(self):
        """ entry-point for the websocket part of the server """
         # not adding 0.0.0.0 listens only for local connections
        self.server['ws'] = WebsocketServer(self.server['PORT'], '0.0.0.0')

        self.server['ws'].set_fn_new_client(self.client_joined)
        self.server['ws'].set_fn_client_left(self.client_left)
        self.server['ws'].set_fn_message_received(self.message_received)

        print "starting websocket listener"
        self.server['ws'].run_forever()


    def stage_data_message(self, player_id, model):
        """ receive models as a parameter, which will later be sent all
            at once """
        # TODO
        return


    def send_staged_data_messages(self):
        """ send aggregated data model to players """
        # TODO
        return
