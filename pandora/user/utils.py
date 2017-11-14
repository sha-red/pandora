from django.contrib.gis.geoip2 import GeoIP2

import ox


def get_ip(request):
    if 'HTTP_X_FORWARDED_FOR' in request.META:
        ip = request.META['HTTP_X_FORWARDED_FOR'].split(',')[0]
    else:
        ip = request.META['REMOTE_ADDR']
    if ip.startswith('::ffff:'):
        ip = ip[len('::ffff:'):]
    return ip


def get_location(ip):
    country = city = None
    try:
        g = GeoIP2()
        location = g.city(ip)
        if location:
            country = ox.get_country_name(location['country_code'])
            if location['city']:
                city = location['city']
                if isinstance(city, bytes):
                    city = city.decode('latin-1')
    except:
        country = city = None
    return city, country
