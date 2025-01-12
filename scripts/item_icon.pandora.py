#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys

from PIL import Image
from optparse import OptionParser

root_dir = os.path.normpath(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
static_root = os.path.join(os.path.dirname(__file__), 'data')


def render_icon(frame, timeline, icon):
    icon_width = 1024
    icon_height = 1024
    icon_image = Image.new('RGBA', (icon_width, icon_height), (0, 0, 0, 0))
    frame_width = icon_width
    frame_ratio = 1
    frame_height = int(round(frame_width / frame_ratio))
    frame_image = Image.open(frame) if frame else Image.new('RGB', (1024, 768), (0, 0, 0))
    frame_image_ratio = frame_image.size[0] / frame_image.size[1]
    if frame_ratio < frame_image_ratio:
        frame_image = frame_image.resize((int(frame_height * frame_image_ratio), frame_height), Image.LANCZOS)
        left = int((frame_image.size[0] - frame_width) / 2)
        frame_image = frame_image.crop((left, 0, left + frame_width, frame_height))
    else:
        frame_image = frame_image.resize((frame_width, int(frame_width / frame_image_ratio)), Image.LANCZOS)
        top = int((frame_image.size[1] - frame_height) / 2)
        frame_image = frame_image.crop((0, top, frame_width, top + frame_height))
    icon_image.paste(frame_image, (0, 0))
    timeline_left = 64
    timeline_top = 832
    timeline_width = 896
    timeline_height = 128
    timeline_image = Image.new('RGB', (timeline_width + 8, timeline_height + 8), (255, 255, 255))
    mask_image = Image.open(os.path.join(static_root, 'iconTimelineOuterMask.png'))
    icon_image.paste(timeline_image, (timeline_left - 4, timeline_top - 4), mask=mask_image)
    timeline_image = Image.open(timeline) if timeline else Image.new('RGB', (timeline_width, timeline_height), (0, 0, 0))
    timeline_image = timeline_image.resize((timeline_width, timeline_height), Image.LANCZOS)
    mask_image = Image.open(os.path.join(static_root, 'iconTimelineInnerMask.png'))
    icon_image.paste(timeline_image, (timeline_left, timeline_top), mask=mask_image)
    # we're using jpegs with border-radius
    # mask_image = Image.open(os.path.join(static_root, 'iconMask.png'))
    # icon_image.putalpha(mask_image)
    if icon.endswith('.jpg'):
        icon_image = icon_image.convert('RGB')
    icon_image.save(icon)

def main():
    parser = OptionParser()
    parser.add_option('-f', '--frame', dest='frame', help='Poster frame (image file to be read)')
    parser.add_option('-l', '--timeline', dest='timeline', help='Timeline (image file to be read)')
    parser.add_option('-i', '--icon', dest='icon', help='Icon (image file to be written)')
    (options, args) = parser.parse_args()
    if options.icon is None:
        parser.print_help()
        sys.exit()
    render_icon(options.frame, options.timeline, options.icon)


if __name__ == "__main__":
    main()
