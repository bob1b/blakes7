""" class for handling objects/items found in the blake's 7 game world """
class FuncItems(object):
    """ TODO """
    items = None

    def __init__(self, blakes7):
        self.items = []
        self.blakes7 = blakes7

    def add_item(self, new_item):
        """ add an item to the internal list """
        self.items.append(new_item)

        return

    def remove_item(self, item_id):
        """ remove an item from the internal list """
        item_index = self._get_item_index_by_id(item_id)
        if item_index > 0:
            self.items.remove(self.items[item_index])
        else: # TODO
            pass
        return

    def _get_item_index_by_id(self, item_id):
        """ look in items list for an item with a matching item_id. If
            found, retrun the index of the item. Otherwise, return -1 """
        for idx, item in enumerate(self.items):
            if item['item_id'] == item_id:
                return idx
        return -1

    def process(self):
        """ process object/item states """
        for item in self.items:
            pass
        return
