""" Ship function processing and creation """

import math
import pprint

pp = pprint.PrettyPrinter(indent=4)

class FuncShips(object):
    """ bookkeeping for ships state """
    blakes7 = None

    _shipInternal = {
      'prevTick':None,
      'ships':[],
      'nextShipID':0
    }

    # initial ship state/settings
    ship_model = {
      'shipType':'unknown',
      'navigation': {'position':{'x':0, 'y':0}, # based on character?
                     'speed':1,
                     'direction':45,
                     'destination':None},
      'powerCells':{},  # probably fully charged unless ship has history
      'scanner':{'active':True, 'range':500}, # TODO: initially set scanner
                                              # range to half of maximum?
      'damage':{'systems':[]} # probably no damage unless ship has history
    }

    # ship prototype (ie. limits, what it can do, not the state)
    # The corresponding prototype for a ship is copied to ship['proto']
    ship_types = {
      'cryoCapsule': {
        'fancyName':'Cryogenic Capsule',
        'navigation': {'maxSpeed':1.1},
        'powerCells':{
          'cells':[{'maxCap':700}],
          'baseRecharge':0
        },
        'scanner':{'maxRange':200},
        'damage':{'maxDamageNum':50},
        'hasForceWall': False,
        'weapons': {}
      },
      'spaceMaster': {
        'fancyName':'Space Master',
        'navigation':{'maxSpeed':2.5},
        'powerCells':{
          'cells':[{'maxCap':900}],
          'baseRecharge':10
        },
        'scanner':{'maxRange':300},
        'damage':{'maxDamageNum':60},
        'hasForceWall': False,
        'weapons':{}
      },
      'fedPursuit2':{
        'fancyName':'Federation Pursuit Class',
        'navigation':{'maxSpeed':5.7632},
        'powerCells':{
          'cells':[{'maxCap':1000}, {'maxCap':1000}, {'maxCap':1000}],
          'baseRecharge':30
        },
        'scanner':{'maxRange':550},
        'damage':{'maxDamageNum':100},
        'hasForceWall':False,
        'weapons': {'hasPlasmaBolts':True}
      },
      'fedPursuit':{
        'fancyName':'Federation Pursuit Class',
        'navigation':{'maxSpeed':5.2789},
        'powerCells':{
          'cells':[{'maxCap':1000}, {'maxCap':1000}, {'maxCap':200}],
          'baseRecharge':22
        },
        'scanner':{'maxRange':500},
        'damage':{'maxDamageNum':75},
        'hasForceWall':False,
        'weapons':{'hasPlasmaBolts':True}
      },
      'liberator':{
        'fancyName':'Liberator Class',
        'navigation':{'maxSpeed':12},
        'hasTeleport':True,
        'powerCells':{
          'cells':[{'maxCap':1000}, {'maxCap':1000}, {'maxCap':1000},
                   {'maxCap':1000}, {'maxCap':1000}, {'maxCap':1000},
                   {'maxCap':1000}, {'maxCap':1000}],
          'baseRecharge':66
        },
        'scanner':{'maxRange':1000},
        'damage':{'maxDamageNum':200},
        'hasForceWall':True,
        'weapons':{'hasNeutronBlasters':True}
      },
      'liberatorPod':{
        'fancyName':'Liberator Escape pod',
        'navigation':{'maxSpeed':0},
        'affectedByGravity':True,
        'powerCells':{
          'cells':[{'maxCap':100}],
          'baseRecharge':2
        },
        'scanner':{'maxRange':500},
        'damage':{'maxDamageNum':10},
        'hasForceWall':False,
        'weapons':{}
      },
      'londonShip':{
        'fancyName':'London Class',
        'navigation':{'maxSpeed':3.4569},
        'powerCells':{
          'cells':[{'maxCap':100}, {'maxCap':100}, {'maxCap':100},
                   {'maxCap':100}, {'maxCap':100}, {'maxCap':100},
                   {'maxCap':100}, {'maxCap':100}, {'maxCap':100}],
          'baseRecharge':3
        },
        'scanner':{'maxRange':300},
        'damage':{'maxDamageNum':50},
        'weapons':{}
      },
      'protoSpaceAge':{
        'fancyName':'Proto-Space Age Class',
        'navigation':{'maxSpeed':0.25},
        'powerCells':{
          'cells':[{'maxCap':200}],
          'baseRecharge':1.7
        },
        'scanner':{'maxRange':50},
        'damage':{'maxDamageNum':10},
        'weapons':{}
      },
      'scorpio':{
        'fancyName':'Scorpio Class',
        'navigation':{'maxSpeed':3.731}, # 6.692 (star drive)
        'powerCells':{
          'cells':[{'maxCap':400}, {'maxCap':400}, {'maxCap':400},
                   {'maxCap':400}, {'maxCap':400}, {'maxCap':400}],
          'baseRecharge':27
        },
        'scanner':{'maxRange':650},
        'damage':{'maxDamageNum':100},
        'weapons':{}
      },
      'sleer':{
        'fancyName':'Sleer Command Class',
        'navigation':{'maxSpeed':5.765},
        'powerCells':{
          'cells':[{'maxCap':600}, {'maxCap':600}, {'maxCap':500},
                   {'maxCap':500}, {'maxCap':500}, {'maxCap':200}],
          'baseRecharge':28
        },
        'scanner':{'maxRange':650},
        'damage':{'maxDamageNum':120},
        'weapons':{'hasPlasmaBolts':True}
      },
      'spaceCommand':{
        'fancyName':'Space Command Base',
        'navigation':{'maxSpeed':0},
        'powerCells':{
          'cells':[{'maxCap':10000}, {'maxCap':10000},
                   {'maxCap':10000}, {'maxCap':10000}],
          'baseRecharge':333
        },
        'scanner':{'maxRange':1500},
        'damage':{'maxDamageNum':120},
        'weapons':{}
      },
      'spacePrincess':{
        'fancyName':'Space Princess Class',
        'navigation':{'maxSpeed':4},
        'powerCells':{
          'cells':[{'maxCap':1000}, {'maxCap':1000}],
          'baseRecharge':100
        },
        'scanner':{'maxRange':500},
        'damage':{'maxDamageNum':240},
        'weapons':{}
      }
    }

    def __init__(self, blakes7):
        """ initialize whatnot """
        self.blakes7 = blakes7

    def process(self):
        """ time-based processing for ships in the game, damage fixing,
            recharge, etc """

        for property, value in vars(self.blakes7.util).iteritems():
            print property, ": ", value

        elapsed = self.blakes7.util.elapsed_ticks( \
                    self._shipInternal)  # milliseconds

        if elapsed <= 0:
            return  # process next time when we can get a valid elapsed time

        # process ship function according to elapsed milliseconds
        for ship in self._shipInternal['ships']:
            self.process_ship(elapsed, ship)

        return


    def get_ship_by_id(self, ship_id):
        """ looks for ship dict with given ship_id, returns dict or None """
        for ship in self._shipInternal['ships']:
            if ship['shipID'] == ship_id:
                return ship
        print """funcShips.get_ship_by_id(): could not find shipID (%d)
                 in ships list""" % (ship_id)
        return None


    def create_ship(self, ship_type, player_id):
        """ creates a ship based on ship_type and assigns if to a player
            if player_id is given """
        print 'funcShips.create_ship(): type = %s, player_id = %d' % \
              (ship_type, player_id or -1)
    #   print ship_types.keys()

        if ship_type in self.ship_types:
            # TODO - assign ship type based on player type?
            ship_proto = self.ship_types[ship_type]
        else:
            print """funcShips.create_ship(): could not find ship_type = %s
                     in ship_types dict""" % ship_type
            return None

        ship_id = self._next_ship_id()
        ship = {
            'shipID':ship_id,
            'shipType':ship_type, # type name (for client-side)
           'proto':ship_proto,   # ship type limits/proto
        }

        ship = self._setup_ship_model(ship, ship_proto)
        self._shipInternal['ships'].append(ship)

        # TODO - maybe move to calling function
        self.blakes7.players.assign_ship_to_player(player_id, ship)


    def _setup_ship_model(self, ship, ship_proto):
        """ add base model to 'ship', then later add to model based on
            ship features """
        new_ship_model = dict(ship.items() + self.ship_model.items())
        pp.pprint(ship)

        # power cells
        num_cells = len(ship_proto['powerCells']['cells'])
        new_ship_model['powerCells']['cells'] = [None] * num_cells
        for i in range(0, num_cells):
            new_ship_model['powerCells']['cells'][i] = \
                {'power':ship_proto['powerCells']['cells'][i]['maxCap']}

        return new_ship_model



    def remove_ship(self, ship_id):
        """ remove ship from ships list """
        #TODO
        return


    def _next_ship_id(self):
        """ return the ship_id for the next ship created, increment next_id """
        next_id = self._shipInternal['nextShipID']
        self._shipInternal['nextShipID'] = next_id + 1
        return next_id


    def _move_ship(self, elapsed, ship):
        """ move a ship based on elapsed time and current course/speed """
        nav = ship['navigation']
        if nav['speed'] > 0:
            # speed times seconds since last calculation = distance?
            spacials_traveled = float(nav['speed']) * (elapsed / 1000) * 1.6
            print "spacials_traveled = %f" % (spacials_traveled)
            position = nav['position']

            direc = nav['direction']
            direction_radians = math.radians(90.0 - direc)

            x_dist = round(spacials_traveled * math.cos(direction_radians), 3)
            y_dist = round(spacials_traveled * math.sin(direction_radians), 3)

            ship['navigation']['position'] = {'x':position['x'] + x_dist,
                                              'y':position['y'] + y_dist}

    def _power_cell_change_per_second(self, ship):
        """ return the charge/drain power per second for a ship """
        charge_rate = 0

        # base charge rate
        charge_rate = charge_rate + ship['proto']['powerCells']['baseRecharge']

        # star proximity charge rate (if ship has feature)
        # TODO

        # scanner
        if ship['scanner']['active']:
            scanner_range = ship['scanner']['range']
            charge_rate = charge_rate - (scanner_range/25)

        # drive system
        speed = ship['navigation']['speed']

        # autorepair # based on ship size

        # force wall # based on ship size
        # neutron blasters cleared
        # radiation flare shield
        return


    def _charge_ship(self, elapsed, ship):
        """ handle charging and draining based on active systems """
        charge_delta = self._power_cell_change_per_second(ship)
        # TODO
        return


    def _autorepair_ship(self, elapsed, ship):
        """ if ship has autorepair, fix systems according to elapsed time """
        return


    def _check_collisions(self, elapsed, ship):
        """ # compare ship vs all other ships/planets
            # check if distance between ship and ship/planet is less
                than D1 + D2 """
        return


    def process_ship(self, elapsed, ship):
        """ perform all processing for a ship: movement, drain/charge, etc """

        self._move_ship(elapsed, ship)
        self._charge_ship(elapsed, ship)
        self._autorepair_ship(elapsed, ship)
        self._check_collisions(elapsed, ship)

        # send to all players on this ship
        player_ids = self.blakes7.players.players_on_ship(ship['shipID'])
        for player_id in player_ids:
            self.send_ship_data(ship, player_id)
        return


    def _send_ship(self, ship_id, message_dict):
        """ send data message to all players in a given ship """
        return


    def launch_liberator_pod(self, ship, liberator_ship, players_on_pod):
        """ set a pod in motion given the departure ship and the players
            on board (should really just be one play to a pod) """
        return


    def change_ship_speed(self, ship):
        """ player has requested to change speed of his ship """
        return


    def change_ship_destination(self, ship):
        """ player has requested to change destination of his ship """
        return


    def raise_force_wall(self, ship):
        """ player has requested to raise the force wall of his ship """
        return


    def lower_force_wall(self, ship):
        """ player has requested to lower the force wall of his ship """
        return


    def raise_radiation_flare_shield(self, ship):
        """ player has requested to raise the flare shield of his ship """
        return


    def lower_radiation_flare_shield(self, ship):
        """ player has requested to lower the flare shield of his ship """
        return


    def clear_neutron_blasters(self, ship):
        """ player has requested to clear the blasters of his ship """
        return


    def lock_target(self, ship):
        """ player has requested to lock onto a target  """
        return


    def fire_neutron_blasters(self, ship):
        """ player has requested to fire blasters at a target  """
        return


    def fire_plasma_bolt(self, ship):
        """ player has requested to fire plasma bolt at a target  """
        return


    def send_ship_data(self, ship, player_id):
        """ send ship information to a given player  """
        # ship components
        # - ship status
        # - ship power

        message = {'type':'MODEL_UPDATE',
                   'modelName':'SHIP',
                   'data':{'model':ship,
                           'proto':ship['proto']}}

        # send message or add to send queue
        # send to player

        self.blakes7.server.send(player_id, message)
