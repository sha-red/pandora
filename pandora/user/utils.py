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


def rename_user(user, new):
    import itemlist.models
    import item.models
    import user.models

    old = user.username
    old_prefix = old + ':'
    new_prefix = new + ':'

    # update list queries matching user
    for l in itemlist.models.List.objects.filter(query__contains=old_prefix):
        changed = False
        for q in l.query['conditions']:
            if old_prefix in q['value']:
                q['value'] = q['value'].replace(old_prefix, new_prefix)
                changed = True
        if changed:
            l.save()

    # update profile settings matching user
    for p in user.models.UserProfile.objects.all():
        changed = False
        lists = list(p.ui.get('lists', {}))
        for name in lists:
            if name.startswith(old_prefix):
                nname = name.replace(old_prefix, new_prefix)
                p.ui['lists'][nname] = p.ui['lists'].pop(name)
                changed = True
        collections = list(p.ui.get('collections', {}))
        for name in collections:
            if name.startswith(old_prefix):
                nname = name.replace(old_prefix, new_prefix)
                p.ui['collections'][nname] = p.ui['collections'].pop(name)
                changed = True
        if changed:
            p.save()

    # update user item find
    item.models.ItemFind.objects.filter(key='user', value=old).update(value=new)
    user.username = new
