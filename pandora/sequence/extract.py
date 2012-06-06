# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division
import Image
import os

ZONE_INDEX = []
for pixel_index in range(64):
    x, y = pixel_index % 8, int(pixel_index / 8)
    ZONE_INDEX.append(int(x / 2) + int(y / 4) * 4)

def get_hash(image, mode, debug=False):
    if mode == 'color':
        # divide the image into 8 zones:
        # 0 0 1 1 2 2 3 3
        # 0 0 1 1 2 2 3 3
        # 0 0 1 1 2 2 3 3
        # 0 0 1 1 2 2 3 3
        # 4 4 5 5 6 6 7 7
        # 4 4 5 5 6 6 7 7
        # 4 4 5 5 6 6 7 7
        # 4 4 5 5 6 6 7 7
        image_data = image.getdata()
        image_hash = 0
        zone_values = []
        for zone_index in range(8):
            zone_values.append([])
        for pixel_index, pixel_value in enumerate(image_data):
            zone_values[ZONE_INDEX[pixel_index]].append(pixel_value)
        for zone_index, pixel_values in enumerate(zone_values):
            # get the mean for each color channel
            mean = map(lambda x: int(round(sum(x) / 8)), zip(*pixel_values))
            # store the mean color of each zone as an 8-bit value:
            # RRRGGGBB
            color_index = sum((
                int(mean[0] / 32) << 5,
                int(mean[1] / 32) << 2,
                int(mean[2] / 64)
            ))
            image_hash += color_index * pow(2, zone_index * 8)
    elif mode == 'shape':
        image_data = image.convert('L').getdata()
        image_mean = sum(image_data) / 64
        image_hash = 0
        for pixel_index, pixel_value in enumerate(image_data):
            if pixel_value > image_mean:
                image_hash += pow(2, pixel_index)
    #return hash as 16 character hex string
    h = hex(image_hash)[2:].upper()
    if h.endswith('L'): h = h[:-1]
    return '0' * (16-len(h)) + h

def get_sequences(path):
    modes = ['color', 'shape']
    sequences = {}
    for mode in modes:
        sequences[mode] = []
    fps = 25
    position = 0
    file_names = filter(lambda x: 'timelinedata8p' in x, os.listdir(path))
    file_names = sorted(file_names, key=lambda x: int(x[14:-4]))
    file_names = map(lambda x: path + x, file_names)
    for file_name in file_names:
        timeline_image = Image.open(file_name)
        timeline_width = timeline_image.size[0]
        for x in range(0, timeline_width, 8):
            frame_image = timeline_image.crop((x, 0, x + 8, 8))
            for mode in modes:
                frame_hash = get_hash(frame_image, mode)
                if position == 0 or frame_hash != sequences[mode][-1]['hash']:
                    if position > 0:
                        sequences[mode][-1]['out'] = position
                    sequences[mode].append({'in': position, 'hash': frame_hash})
            position += 1 / fps
    for mode in modes:
        if sequences[mode]:
            sequences[mode][-1]['out'] = position
    return sequences

