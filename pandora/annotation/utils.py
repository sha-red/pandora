# -*- coding: utf-8 -*-
# ci:si:et:sw=4:sts=4:ts=4
import re
import ox


def html_parser(text, nofollow=True):
    text = text.replace('<i>', '__i__').replace('</i>', '__/i__')
    text = text.replace('<b>', '__b__').replace('</b>', '__/b__')
    #truns links into wiki links, make sure to only take http links
    text = re.sub('<a .*?href="(http.*?)".*?>(.*?)</a>', '[\\1 \\2]', text)
    text = ox.escape(text)
    text = text.replace('__i__', '<i>').replace('__/i__', '</i>')
    text = text.replace('__b__', '<b>').replace('__/b__', '</b>')
    if nofollow:
        nofollow_rel = ' rel="nofollow"'
    else:
        nofollow_rel = ''

    links = re.compile('(\[(http.*?) (.*?)\])').findall(text)
    for t, link, txt in links:
        link = link.replace('http', '__LINK__').replace('.', '__DOT__')
        ll = '<a href="%s"%s>%s</a>' % (link, nofollow_rel, txt)
        text = text.replace(t, ll)
    links = re.compile('(\[(http.*?)\])').findall(text)
    for t, link in links:
        link = link.replace('http', '__LINK__').replace('.', '__DOT__')
        ll = '<a href="%s"%s>%s</a>' % (link, nofollow_rel, link)
        text = text.replace(t, ll)

    text = ox.urlize(text, nofollow=nofollow)

    #inpage links
    text = re.sub('\[(/.+?) (.+?)\]', '<a href="\\1">\\2</a>', text)

    text = text.replace('__LINK__', 'http').replace('__DOT__', '.')
    text = text.replace("\n", '<br />')
    return text
