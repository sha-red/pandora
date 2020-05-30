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
    except:
        country = city = None
    else:
        try:
            location = g.city(ip)
        except django.contrib.gis.geoip2.GeoIP2Exception:
            try:
                location = g.country(s.ip)
            except:
                location = None
        if location:
            country = ox.get_country_name(location['country_code'])
            if location.get('city'):
                city = location['city']
                if isinstance(city, bytes):
                    city = city.decode('latin-1')
    return city, country


def rename_user(u, new):
    import itemlist.models
    import item.models
    import user.models

    old = u.username
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
    u.username = new
    u.save()

def update_groups(model, groups):
    from .models import Group
    if isinstance(groups, list):
        groups = list(filter(lambda g: g.strip(), groups))
        groups = [ox.escape_html(g) for g in groups]
        for g in model.groups.exclude(name__in=groups):
            model.groups.remove(g)
        current_groups = [g.name for g in model.groups.all()]
        for g in list(filter(lambda g: g not in current_groups, groups)):
            group, created = Group.objects.get_or_create(name=g)
            model.groups.add(group)
