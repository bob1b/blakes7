""" simple websocket python server for a Blake's 7 game """

from threading import Timer

from FuncEventQueue import EventQueue
from FuncPlanets import FuncPlanets
from FuncItems import FuncItems
from FuncServer import FuncServer
from FuncShips import FuncShips
from FuncPlayers import FuncPlayers
from FuncUtil import Util


class B7(object):
    """ entry point for blakes 7 internet game """
    event_queue = None
    planets = None
    items = None
    server = None
    ships = None
    players = None
    util = None

    def __init__(self):
        """ instantiate imported modules """
        self.event_queue = EventQueue(self)
        self.planets = FuncPlanets(self)
        self.items = FuncItems(self)
        self.ships = FuncShips(self)
        self.players = FuncPlayers(self)
        self.server = FuncServer(self)
        self.util = Util(self) # TODO - might not need to pass self

        # start book keeping function at interval
        Timer(10.0, self.processor).start()

        # server runs forever: async callbacks append to event queue which
        # prevents async data handling problems
        self.server.start_server()

    # processor (book-keeping) function, loops every second
    def processor(self):
        """ This run at intervals and performs all of the game processing """
        self.event_queue.process_events()
        self.items.process()
        self.planets.process()

        self.ships.process()
        self.players.process()
        Timer(10.0, self.processor).start() #continue the interval

    def stop(self):
        """ stops the game server """
        return

blakes7 = B7()
print "exiting"
