#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys

from PIL import Image
from PIL import ImageDraw
from optparse import OptionParser
from ox.image import drawText, wrapText

root_dir = os.path.normpath(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
static_root = os.path.join(os.path.dirname(__file__), 'data')


def render_list_icon(frames, icon):
    icon_width = 256
    icon_height = 256
    icon_image = Image.new('RGBA', (icon_width, icon_height))
    frame_height = int(icon_height / 2)
    frame_ratio = 1
    frame_width = int(round(frame_height * frame_ratio))
    for i, frame in enumerate(frames):
        frame_image = Image.open(frame)
        frame_image_ratio = frame_image.size[0] / frame_image.size[1]
        frame_width_ = frame_width + (1 if i % 2 == 1 else 0)
        if frame_ratio < frame_image_ratio:
            frame_image = frame_image.resize((int(frame_height * frame_image_ratio), frame_height), Image.LANCZOS)
            left = int((frame_image.size[0] - frame_width_) / 2)
            frame_image = frame_image.crop((left, 0, left + frame_width_, frame_height))
        else:
            frame_image = frame_image.resize((frame_width_, int(frame_width_ / frame_image_ratio)), Image.LANCZOS)
            top = int((frame_image.size[1] - frame_height) / 2)
            frame_image = frame_image.crop((0, top, frame_width_, top + frame_height))
        icon_image.paste(frame_image, (i % 2 * frame_width + (1 if i % 2 == 2 else 0),
                                       int(i / 2) * frame_height))
    mask_image = Image.open(os.path.join(static_root, 'iconMask.png'))
    mask_image = mask_image.resize((icon_width, icon_height))
    icon_image.putalpha(mask_image)
    if icon.endswith('.jpg'):
        icon_image = icon_image.convert('RGB')
    icon_image.save(icon)

def main():
    parser = OptionParser()
    parser.add_option('-f', '--frames', dest='frames', help='Poster frames (image files to be read)', default='')
    parser.add_option('-o', '--icon', dest='icon', help='Icon (image file to be written)')
    (options, args) = parser.parse_args()
    if options.icon is None:
        parser.print_help()
        sys.exit()

    frames = options.frames.replace(', ', ',').split(',')

    render_list_icon(frames, options.icon)


if __name__ == "__main__":
    main()
