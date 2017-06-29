""" Created this class to help prevent race conditions, since the websocket
    part of the game is somewhat asynchronous. Instead asynchronous code
    doing the processing itself, events are saved in a list and processed
    in order all at one time """

class EventQueue(object):
    """ simple class for adding and processing events as a queue. This can
        be used to prevent clobbering in asynchronous piece of code """
    events = None
    blakes7 = None
    event_handlers = None

    def __init__(self, blakes7):
        self.events = []
        self.blakes7 = blakes7
        self.event_handlers = {}

    def add_event(self, the_type, data):
        """ add an event (type and data) to the end of a list/queue """
        new_event = {'type':the_type, 'data':data}
        print 'adding event of type: ' + str(the_type)
        self.events.append(new_event)

    def register_event_handler(self, the_type, function):
        """ TODO - this function will run the supplied function when a
                   given event type is encountered in the queue. Essentially,
                   classes can supply code that will be run for their
                   associated events """

        # TODO - add some error checking here
        self.event_handlers[the_type] = function
        return


    def process_events(self):
        """ pop and process each saved event. Not sure if the code run
            for a particular event should be kept here, since it is
            not really to do with events, but rather game logic """
        print "in FuncEventQueue.process_events()"
        while self.events:
            event = self.events.pop(0)

            print 'processing event, type = ' + str(event['type'])


            # TODO - remove
            if event['type'] == 'CLIENT_LEFT':
                client_id = event['data']['clientID']
                player = self.blakes7.players.client_id_to_player(client_id)

                # TODO - remove player or set status to inactive,
                #         if has a user/pass
                if player:
                    player['clientID'] = None
                    player['clientData'] = None
                    player['status'] = 'INACTIVE'

                # remove from clients list
                self.blakes7.players.client_left(client_id)

                # send broadcast message of new player list
                self.blakes7.players.broadcast_player_list()
