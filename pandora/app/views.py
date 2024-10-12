# -*- coding: utf-8 -*-
from datetime import datetime
import base64
import copy

from django.shortcuts import render, redirect
from django.conf import settings
from django.http import HttpResponse

from oxdjango.shortcuts import json_response, render_to_json_response
from oxdjango.decorators import login_required_json

import ox
import ox.geo
from ox.utils import json, ET

from . import models

from user.models import init_user
from user.utils import get_location, get_ip
from changelog.models import add_changelog

from oxdjango.api import actions

def intro(request):
    return render(request, 'intro.html', {'settings': settings})

def index(request):
    title = settings.SITENAME
    if 'tagline' in settings.CONFIG['site']:
        title = settings.CONFIG['site']['tagline']
    text = settings.CONFIG['site']['description']
    page = request.path.split('/')
    if len(page) == 2:
        page = page[1]
    else:
        page = ''
    for p in settings.CONFIG['sitePages']:
        if p['id'] == page:
            title += ' - ' + p['title']
            text, created = models.Page.objects.get_or_create(name=page)
            text = text.text
    return render(request, 'index.html', {
        'base_url': request.build_absolute_uri('/'),
        'settings': settings,
        'text': text,
        'title': title,
    })

def embed(request, id):
    return render(request, 'embed.html', {
        'settings': settings
    })

def redirect_url(request, url):
    try:
        url = base64.decodebytes(url.encode()).decode()
    except Exception:
        pass
    if settings.CONFIG['site'].get('sendReferrer', False):
        return redirect(url)
    else:
        return HttpResponse('<script>document.location.href=%s;</script>' % json.dumps(url))

def opensearch_xml(request):
    osd = ET.Element('OpenSearchDescription')
    osd.attrib['xmlns'] = "http://a9.com/-/spec/opensearch/1.1/"
    e = ET.SubElement(osd, 'ShortName')
    e.text = settings.SITENAME
    e = ET.SubElement(osd, 'Description')
    e.text = settings.SITENAME
    e = ET.SubElement(osd, 'Image')
    e.attrib['height'] = '16'
    e.attrib['width'] = '16'
    e.attrib['type'] = 'image/x-icon'
    e.text = request.build_absolute_uri('/favicon.ico')
    e = ET.SubElement(osd, 'Url')
    e.attrib['type'] = 'text/html'
    e.attrib['method'] = 'GET'
    e.attrib['template'] = "%s*={searchTerms}" % request.build_absolute_uri('/')
    '''
    e = ET.SubElement(osd, 'Url')
    e.attrib['type'] = 'application/x-suggestions+json'
    e.attrib['method'] = 'GET'
    e.attrib['template'] = "%s?q={searchTerms}" % request.build_absolute_uri('/opensearch_suggest')
    '''
    return HttpResponse(
        '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(osd).decode(),
        'application/xml'
    )

def robots_txt(request):
    if settings.CONFIG['site'].get('public'):
        robots_txt = '''User-agent: *
Disallow:
Sitemap: {}
'''.format(request.build_absolute_uri('/sitemap.xml'))
    else:
        robots_txt = '''User-agent: *
Disallow: /
'''
    return HttpResponse(robots_txt, 'text/plain')

def getPage(request, data):
    '''
    Gets the text/html for a given site page (like 'About')
    takes {
        name: string // page id
    }
    returns {
        name: string, // page id
        text: string // text/html
    }
    see: editPage
    '''
    if isinstance(data, str):
        name = data
    else:
        name = data['name']
    page, created = models.Page.objects.get_or_create(name=name, defaults={'text': ''})
    response = json_response({'name': page.name, 'text': page.text})
    return render_to_json_response(response)
actions.register(getPage)


@login_required_json
def editPage(request, data):
    '''
    Edits a site page (like 'About')
    takes {
        name: string, // page id
        text: string // new text/html
    }
    returns {
        name: string, // page id
        text: string // new text/html
    }
    see: getPage
    '''
    if request.user.profile.capability('canEditSitePages'):
        page, created = models.Page.objects.get_or_create(name=data['name'])
        page.text = ox.sanitize_html(data['text'])
        page.save()
        add_changelog(request, data, page.name)
        response = json_response({'name': page.name, 'text': page.text})
    else:
        response = json_response(status=403, text='permission denied')
    return render_to_json_response(response)
actions.register(editPage)


def init(request, data):
    '''
    Makes an init request
    takes {}
    returns {
        site: object, // site data
        user: object // user data
    }
    '''
    response = json_response({})
    config = copy.deepcopy(settings.CONFIG)
    del config['keys']

    if 'HTTP_ACCEPT_LANGUAGE' in request.META:
        response['data']['locale'] = request.META['HTTP_ACCEPT_LANGUAGE'].split(';')[0].split('-')[0].split(',')[0]

    if request.META.get('HTTP_X_PREFIX') == 'NO':
        config['site']['videoprefix'] = ''
        config['site']['mediaprefix'] = ''
    elif settings.CDN_PREFIX:
        try:
            city, country = get_location(get_ip(request))
            info = ox.geo.get_country(country)
            prefix = None
            for key in ('name', 'region', 'continent'):
                location = info.get(key)
                if location in settings.CDN_PREFIX:
                    prefix = settings.CDN_PREFIX[location]
                    break
            if prefix:
                config['site']['videoprefix'] = prefix['video']
                config['site']['mediaprefix'] = prefix['media']
        except:
            pass

    response['data']['site'] = config
    response['data']['user'] = init_user(request.user, request)
    request.session['last_init'] = str(datetime.now())
    return render_to_json_response(response)
actions.register(init)

def embedURL(request, data):
    '''
    Returns HTML to embed a given URL
    takes {
        url: string, // URL
        maxwidth: int, // max width in px
        maxheight: int // max height in px
    }
    returns {
        html: string // HTML
    }
    see: getEmbedDefaults
    '''
    response = json_response({})
    response['data'] = ox.get_embed_code(data['url'], data.get('maxwidth'), data.get('maxheight'))
    return render_to_json_response(response)
actions.register(embedURL)

def getEmbedDefaults(request, data):
    '''
    Returns embed default values
    takes {}
    returns {
        document: string, // first document, sorted by id
        edit: string, // first edit, sorted by name
        editDuration: float, // duration of that edit
        item: string, // first item, sorted by id
        itemDuration: float // duration of that item
        itemRatio: float // video ratio of that item
        list: string // first list, sorted by name
        text: string // first text, sorted by name
        videoRatio: float // pandora.site.video.previewRatio
        videoResolution: int // largest value in pandora.site.video.resolutions
    }
    see: embedURL
    '''
    from document.models import Document
    from item.models import Item
    from itemlist.models import List
    from edit.models import Edit
    from text.models import Text
    response = json_response({})
    qs = Document.objects.filter(uploading=False).order_by('id')
    if qs.exists():
        response['data']['document'] = qs[0].get_id()
    qs = Edit.objects.exclude(status='private').order_by('name')
    if qs.exists():
        e = qs[0].json(keys=['id', 'duration'])
        response['data']['edit'] = e['id']
        response['data']['editDuration'] = e['duration']
    level = settings.CONFIG['capabilities']['canSeeItem']['guest']
    qs = Item.objects.filter(level__lte=level, rendered=True).order_by('sort__public_id')
    if qs.exists():
        i = qs[0].cache
        response['data']['item'] = i['id']
        response['data']['itemDuration'] = i['duration']
        response['data']['itemRatio'] = i.get('videoRatio', settings.CONFIG['video']['previewRatio'])
    qs = List.objects.exclude(status='private').order_by('name')
    if qs.exists():
        i = qs[0].json()
        response['data']['list'] = i['id']
    response['data']['videoRatio'] = settings.CONFIG['video']['previewRatio']
    response['data']['videoResolution'] = max(settings.CONFIG['video']['resolutions'])
    return render_to_json_response(response)
actions.register(getEmbedDefaults)

