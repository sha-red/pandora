# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement
import os
from glob import glob

import Image

import ox

def getTiles(timeline_prefix, height=64):
    files = glob('%s%sp*.png' % (timeline_prefix, height))
    return sorted(filter(lambda f: f!='%s%sp.png' % (timeline_prefix, height), files))
    
def loadTimeline(timeline_prefix, height=64):
    files = getTiles(timeline_prefix, height)
    f = Image.open(files[0])
    width = f.size[0]
    f = Image.open(files[-1])
    duration = f.size[0] + (len(files)-1)*width
    timeline = Image.new("RGB", (duration, height))
    pos = 0
    for f in files:
        part = Image.open(f)
        timeline.paste(part, (pos, 0, pos + part.size[0], height))
        pos += part.size[0]
    return timeline

def makeTiles(timeline_prefix, height=16, width=3600):
    files = getTiles(timeline_prefix, 64)
    fps = 25
    part_step = 60
    output_width = width
    width = len(files) * part_step
    timeline = Image.new("RGB", (width, height))

    pos = 0
    for f in sorted(files):
        part = Image.open(f)
        part_width = int(part.size[0] / fps) 
        part = part.resize((part_width, height), Image.ANTIALIAS)
        timeline.paste(part, (pos, 0, pos+part_width, height))
        pos += part_width

    timeline = timeline.crop((0, 0, pos, height))

    pos = 0
    i = 0
    while pos < timeline.size[0]:
      end = min(pos+output_width, timeline.size[0])
      timeline.crop((pos, 0, end, timeline.size[1])).save('%s%sp%04d.png' % (timeline_prefix, timeline.size[1], i))
      pos += output_width
      i += 1

def makeTimelineOverview(timeline_prefix, width, inpoint=0, outpoint=0, duration=-1, height=16):
    input_scale = 25
    
    timeline_file = '%s%sp.png' % (timeline_prefix, height)
    if outpoint > 0:
        timeline_file = '%s%sp.%d-%d.png' % (timeline_prefix, height, inpoint, outpoint)

    timeline = loadTimeline(timeline_prefix)
    duration = timeline.size[0]

    if inpoint<=0:
        inpoint = 0
    else:
        inpoint = inpoint * input_scale
    if outpoint<=0:
        outpoint = duration
    else:
        outpoint = outpoint * input_scale

    timeline = timeline.crop((inpoint, 0, outpoint, timeline.size[1])).resize((width, height), Image.ANTIALIAS)
    timeline.save(timeline_file)

def join_timelines(timelines, prefix):
    height = 64
    width = 1500

    ox.makedirs(os.path.dirname(prefix))
    for f in glob('%s*'%prefix):
        os.unlink(f)

    tiles = [] 
    for timeline in timelines:
        tiles += getTiles(timeline, height)

    timeline = Image.new("RGB", (2 * width, height))

    pos = 0
    i = 0
    for tile in tiles:
        tile = Image.open(tile)
        timeline.paste(tile, (pos, 0, pos+tile.size[0], height))
        pos += tile.size[0]
        if pos >= width:
            timeline_name = '%s%sp%04d.png' % (prefix, height, i)
            timeline.crop((0, 0, width, height)).save(timeline_name)
            i += 1
            if pos > width:
                t = timeline.crop((width, 0, pos, height))
                timeline.paste(t, (0, 0, t.size[0], height))
            pos -= width
    if pos:
       timeline_name = '%s%sp%04d.png' % (prefix, height, i)
       timeline.crop((0, 0, pos, height)).save(timeline_name)

    makeTiles(prefix, 16, 3600)
    makeTimelineOverview(prefix, 1920, height=16)
    makeTimelineOverview(prefix, 1920, height=64)

