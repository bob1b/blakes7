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

    def __init__(self, blakes7):
        """ initialize whatnot """
        self.blakes7 = blakes7

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
        """ Called for every client connecting (after handshake) """
        print "New client connected and was given id %d" % client['id']
        self.blakes7.event_queue.add_event('CLIENT_JOINED',
                                           {'clientId':client['id'],
                                            'clientData':client})


    def client_left(self, client, server):
        """ Called for every client disconnecting """
        print "Client(%d) disconnected" % client['id']
        self.blakes7.event_queue.add_event('CLIENT_LEFT',
                                           {'clientID':client['id']})


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
                self.blakes7.event_queue.add_event(
                   'REQUESTING_PLAYER_NAME',
                   {'clientID':client_id,
                    'clientData':client,
                    'name':message_dict['data']['name'],
                    'password':message_dict['data']['password']})

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
                print "funcServer.send(): could not send message: %s" % \
                      json_message


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

        client_data = self.blakes7.players.get_client_data(client_id)
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
