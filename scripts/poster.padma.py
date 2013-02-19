#!/usr/bin/python
# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import os

root_dir = os.path.normpath(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# using virtualenv's activate_this.py to reorder sys.path
activate_this = os.path.join(root_dir, 'bin', 'activate_this.py')
execfile(activate_this, dict(__file__=activate_this))

import Image
import ImageDraw
from optparse import OptionParser
from ox.image import drawText, wrapText
import sys

static_root = os.path.join(os.path.dirname(__file__), 'data')

def render_poster(id, title, frame, timeline, poster):
    poster_width = 640
    poster_height = 1024
    poster_ratio = poster_width / poster_height
    poster_color = (255, 255, 0)
    poster_image = Image.new('RGB', (poster_width, poster_height))
    font_file = os.path.join(static_root, 'DejaVuSansCondensedBold.ttf')
    font_size = 48

    # timeline
    timeline_height = 64
    timeline_lines = 16
    if timeline:
        timeline_image = Image.open(timeline)
        timeline_image = timeline_image.resize((10240, timeline_height), Image.ANTIALIAS)
        for i in range(timeline_lines):
            line_image = timeline_image.crop((i * poster_width, 0, (i + 1) * poster_width, 64))
            poster_image.paste(line_image, (0, i * timeline_height))

    # id
    text = 'Pad.ma/' + id
    text_image = Image.new('RGB', (1, 1))
    text_size = drawText(text_image, (0, 0), text, font_file, font_size, poster_color)
    text_width = poster_width
    text_height = timeline_height
    text_left = int((poster_width - text_width) / 2)
    text_top = 14 * timeline_height
    for y in range(text_top, text_top + text_height):
        for x in range(text_left, text_left + text_width):
            if y < text_top + 4 or y >= text_top + text_height - 4: 
                poster_image.putpixel((x, y), poster_color)
            else:
                pixel = list(poster_image.getpixel((x, y)))
                for c in range(3):
                    pixel[c] = int((pixel[c] + poster_color[c]) / 4)
                poster_image.putpixel((x, y), tuple(pixel))
    drawText(poster_image, ((poster_width - text_size[0]) / 2, text_top + (text_height - text_size[1]) / 2), text, font_file, font_size, poster_color)
    poster_image.save(poster)

def main():
    parser = OptionParser()
    parser.add_option('-o', '--oxdbid', dest='oxdb_id', help='0xDB Id')
    parser.add_option('-i', '--id', dest='id', help='Item Id')
    parser.add_option('-t', '--title', dest='title', help='Title', default='')
    parser.add_option('-d', '--director', dest='director', help='Director', default='')
    parser.add_option('-y', '--year', dest='year', help='Year', default='')
    parser.add_option('-f', '--frame', dest='frame', help='Poster frame (image file to be read)')
    parser.add_option('-l', '--timeline', dest='timeline', help='Timeline (image file to be read)')
    parser.add_option('-p', '--poster', dest='poster', help='Poster (image file to be written)')
    (options, args) = parser.parse_args()
    if options.oxdb_id and not options.id:
        options.id = options.oxdb_id
    if None in (options.id, options.poster):
        parser.print_help()
        sys.exit()
    opt = {}
    for key in ('id', 'title', 'frame', 'timeline', 'poster'):
        opt[key] = getattr(options, key)
        
    opt['title'] = opt['title'].decode('utf-8')

    render_poster(**opt)

if __name__ == "__main__":
    main()

