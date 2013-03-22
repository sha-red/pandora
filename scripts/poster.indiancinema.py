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
from ox.image import getRGB, drawText, wrapText
import sys

static_root = os.path.join(os.path.dirname(__file__), 'data')

def render_poster(title, director, year, frame, timeline, poster):

    poster_width = 704
    poster_height = 1024
    frame_height = 512
    frame_ratio = poster_width / frame_height
    timeline_height = 64
    text_margin = 16
    text_width = poster_width - 2 * text_margin
    poster_image = Image.new('RGB', (poster_width, poster_height))
    draw = ImageDraw.Draw(poster_image)
    font_file = os.path.join(static_root, 'SourceSansProSemibold.ttf')
    font_size = {'cinema': 117, 'director': 32, 'title': 48, 'year': 426}
    font_lightness = {'cinema': 0.7, 'director': 0.8, 'title': 0.8, 'year': 0.6}
    poster_lightness = {'image': 0.2, 'text': 0.4}

    if year:
        hue = int(year) % 100 / 100 * 360
        saturation = 1
    else:
        hue = 0
        saturation = 0

    # background
    draw.rectangle(
        [(0, frame_height), (poster_width, poster_height - timeline_height)],
        fill=getRGB((hue, saturation, poster_lightness['text']))
    )

    # year
    if year:
        drawText(
            poster_image,
            (-93, poster_height - timeline_height - font_size['year'] + 6),
            year,
            font_file,
            font_size['year'],
            getRGB((hue, saturation, font_lightness['year']))
        )

    # cinema
    for y in [-1, 1]:
        for x in [-1, 1]:
            drawText(
                poster_image,
                (-10 + x, poster_height - timeline_height - font_size['cinema'] + 1 + y),
                'Indiancine.ma',
                font_file,
                font_size['cinema'],
                getRGB((hue, saturation, poster_lightness['text']))
            )
    drawText(
        poster_image,
        (-10, poster_height - timeline_height - font_size['cinema'] + 1),
        'Indiancine.ma',
        font_file,
        font_size['cinema'],
        getRGB((hue, saturation, font_lightness['cinema']))
    )
    
    # director and title
    offset_top = frame_height + text_margin
    if not director:
        title_max_lines = 7
    else:
        title_max_lines = min(len(wrapText(
            title,
            text_width,
            0,
            font_file,
            font_size['title']
        )), 6)
        director_max_lines = 9 - int((title_max_lines * 3 - 1) / 2)

    # director
    if director:
        lines = wrapText(
            director,
            text_width,
            director_max_lines,
            font_file,
            font_size['director']
        )
        for line in lines:
            size = drawText(
                poster_image,
                (text_margin, offset_top),
                line,
                font_file,
                font_size['director'],
                getRGB((hue, saturation, font_lightness['director']))
            )
            offset_top += font_size['director'] + 2
        offset_top += size[1] - font_size['director'] - 2

    # title
    lines = wrapText(
        title,
        text_width,
        title_max_lines,
        font_file,
        font_size['title']
    )
    for line in lines:
        for y in [-1, 1]:
            for x in [-1, 1]:
                drawText(
                    poster_image,
                    (text_margin + x, offset_top + y),
                    line,
                    font_file,
                    font_size['title'],
                    getRGB((hue, saturation, poster_lightness['text']))
                )
        drawText(
            poster_image,
            (text_margin, offset_top),
            line,
            font_file,
            font_size['title'],
            getRGB((hue, saturation, font_lightness['title']))
        )
        offset_top += font_size['title'] + 3

    # frame
    if frame:
        frame_image = Image.open(frame)
        frame_image_ratio = frame_image.size[0] / frame_image.size[1]
        if frame_ratio < frame_image_ratio:
            frame_image = frame_image.resize(
                (int(frame_height * frame_image_ratio), frame_height),
                Image.ANTIALIAS
            )
            left = int((frame_image.size[0] - poster_width) / 2)
            frame_image = frame_image.crop(
                (left, 0, left + poster_width, frame_height)
            )
        else:
            frame_image = frame_image.resize(
                (poster_width, int(poster_width / frame_image_ratio)),
                Image.ANTIALIAS
            )
            top = int((frame_image.size[1] - frame_height) / 2)
            frame_image = frame_image.crop(
                (0, top, poster_width, top + frame_height)
            )
        poster_image.paste(frame_image, (0, 0))
    else:
        draw.rectangle(
            [(0, 0), (poster_width, frame_height)],
            fill=getRGB((hue, saturation, poster_lightness['image']))
        )

    # timeline
    if timeline:
        timeline_image = Image.open(timeline)
        timeline_image = timeline_image.resize(
            (poster_width, timeline_height),
            Image.ANTIALIAS
        )
        poster_image.paste(timeline_image, (0, poster_height - timeline_height))
    else:
        draw.rectangle(
            [(0, poster_height - timeline_height), (poster_width, poster_height)],
            fill=getRGB((hue, saturation, poster_lightness['image']))
        )

    poster_image.save(poster, quality=100)

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
    if None in (options.title, options.poster):
        parser.print_help()
        sys.exit()
    opt = {}
    for key in ('title', 'director', 'year', 'frame', 'timeline', 'poster'):
        opt[key] = getattr(options, key)
        
    opt['title'] = opt['title'].decode('utf-8')
    opt['director'] = opt['director'].decode('utf-8')

    render_poster(**opt)

if __name__ == "__main__":
    main()

