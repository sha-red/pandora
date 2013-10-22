# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import ox.geo

colors = {
    'system': {
        'Android': [0, 255, 0],
        'BlackBerry': [64, 64, 64],
        'BSD': [255, 0, 0],
        'iOS': [0, 128, 255],
        'Java': [128, 128, 128],
        'Linux': [255, 128, 0],
        'Mac OS X': [0, 255, 255],
        'Nokia': [255, 0, 255],
        'PlayStation': [192, 192, 192],
        'RIM Tablet OS': [64, 64, 64],
        'Unix': [255, 255, 0],
        'Wii': [192, 192, 192],
        'Windows Phone': [0, 0, 128], #has to be before 'Windows'
        'Windows': [0, 0, 255]
    },
    'browser': {
        'Camino': [192, 192, 192],
        'Chrome Frame': [255, 255, 0], #has to be before 'Chrome'
        'Chrome': [0, 255, 0],
        'Chromium': [128, 255, 0],
        'Epiphany': [128, 128, 128],
        'Firefox': [255, 128, 0],
        'Internet Explorer': [0, 0, 255],
        'Konqueror': [64, 64, 64],
        'Nokia Browser': [255, 0, 255],
        'Opera': [255, 0, 0],
        'Safari': [0, 255, 255],
        'WebKit': [0, 255, 128]
    }
}

def get_name(key, version):
    for name in colors[key]:
        if version.startswith(name):
            return name
    return ''

class Statistics(dict):

    def __init__(self):
        
        for mode in ['all', 'registered']:
            self[mode] = {
                 "year": {},
                 "month": {},
                 "day": {},
                 "weekday": {},
                 "hour": {},
                 "continent": {},
                 "region": {},
                 "country": {},
                 "city": {},
                 "system": {},
                 "browser": {},
                 "systemandbrowser": {},
                 "systemversion": {},
                 "browserversion": {},
                 "systemandbrowserversion": {}
            }

    def _increment(self, d, key, add=1, base=0):
        if not key in d:
            d[key] = base
        d[key] += add

    def add(self, item):
        for mode in ['all', 'registered']:
            if mode == 'all' or item['level'] != 'guest':
                for key in ['firstseen', 'lastseen']:
                    year = '%s-%s' % (item[key].strftime('%Y'), key)
                    month = '%s-%s' % (item[key].strftime('%Y-%m'), key)
                    day = '%s-%s' % (item[key].strftime('%Y-%m-%d'), key)
                    weekday = item[key].strftime('%u')
                    hour = item[key].strftime('%H')

                    if not year in self[mode]['year']:
                        self[mode]['year'][year] = {}
                    self._increment(self[mode]['year'][year], month, 1)

                    self._increment(self[mode]['month'], month, 1)

                    if key == 'firstseen':
                        if not day in self[mode]['day']:
                            self[mode]['day'][day] = {}
                        self._increment(self[mode]['day'][day], hour, 1)

                        if not weekday in self[mode]['weekday']:
                            self[mode]['weekday'][weekday] = {}
                        self._increment(self[mode]['weekday'][weekday], hour, 1)

                        self._increment(self[mode]['hour'], hour)

                if item['location']:
                    split = ox.geo.split_geoname(item['location'])
                    if len(split) == 1:
                        split.insert(0, None)
                    city, country = split

                    country_data = ox.geo.get_country(country)
                    continent = country_data.get('continent','')
                    region = ', '.join([continent, country_data.get('region', '')])
                    country = ', '.join([region, country])
                    city = ', '.join(country, city) if city else ''

                    self._increment(self[mode]['continent'], continent,)
                    self._increment(self[mode]['region'], region)
                    self._increment(self[mode]['country'], country)
                    if city:
                        self._increment(self[mode]['city'], city)

                name = {}
                for key in ['system', 'browser']:
                    version = item[key];
                    if version:
                        name[key] = get_name(key, version)
                        if name[key]:
                            self._increment(self[mode][key], name[key])

                            key = key + 'version';
                            self._increment(self[mode][key], version)

                if name['system'] and name['browser']:
                    name = name['system'] + ' / ' + name['browser']
                    self._increment(self[mode]['systemandbrowser'], name)
                    
                    name = item['system'] + ' / ' + item['browser']
                    self._increment(self[mode]['systemandbrowserversion'], name)

