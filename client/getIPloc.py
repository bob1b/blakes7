import requests

FREEGEOPIP_URL = 'http://freegeoip.net/json/'

def get_geolocation_for_ip(ip):
    url = '{}{}'.format(FREEGEOPIP_URL, ip)

    response = requests.get(url)
    response.raise_for_status()

    return response.json()

json = get_geolocation_for_ip('96.18.179.67')
print json['city'] + ", " + json['region_name'] + ", " + json['country_name']
#{u'city': u'Chino Valley', u'region_code': u'AZ', u'region_name': u'Arizona', u'ip': u'96.18.179.67', u'time_zone': u'America/Phoenix', u'longitude': -112.4564, u'metro_code': 753, u'latitude': 34.7706, u'country_code': u'US', u'country_name': u'United States', u'zip_code': u'86323'}

