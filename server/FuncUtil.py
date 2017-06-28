""" general utility functions for blake's 7 game """

import time

class Util(object):
    """ utility functions, wrapped in class because of elapsed
        tick """
    blakes7 = None

    def __init__(self, blakes7):
        """ initialize whatnot """
        self.blakes7 = blakes7

    def elapsed_ticks(self, _internal):
        """ returns the elapsed milliseconds since last call and updates
            the previous tick saved elsewhere """
        millisec = int(round(time.time()*1000.0))
        # TODO - perhaps save prevTick in this file
        prev_tick = _internal['prevTick']
        if prev_tick is None:
            _internal['prevTick'] = millisec
            return -1

        elapsed = millisec - prev_tick
    #   print "elapsed tick = " + str(elapsed)
        _internal['prevTick'] = millisec
        return elapsed
