""" handles planets and space stations in the blake's 7 game """

class FuncPlanets(object):
    """ planets processing, creation, deletion """
    planets = None
    blakes7 = None

    def __init__(self, blakes7):
        """ initialize list of planets """
        self.planets = []
        self.blakes7 = blakes7

    def process(self):
        """ handle state changes in planets """
        for planet in self.planets:
            pass
        return

    def add_planet(self, new_planet):
        """ create a new planet """
        self.planets.append(new_planet)
        return

    def remove_planet(self, planet_id):
        """ remove an existing planet """
        planet_index = self._get_planet_index_by_id(planet_id)
        if planet_index > 0:
            self.planets.remove(self.planets[planet_index])
        else: # TODO
            pass
        return

    def _get_planet_index_by_id(self, planet_id):
        """ finds a planet by its id in the planets list. Returns
            -1 if no planet is found """

        for idx, planet in enumerate(self.planets):
            if planet['planet_id'] == planet_id:
                return idx
        return -1
