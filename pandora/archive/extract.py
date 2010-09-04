# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import os
from os.path import abspath, join, dirname, exists

import fractions
import subprocess
import sys
import shutil
import tempfile
import time
import re
import math
from glob import glob

import numpy as np
import Image
import ox
from ox.utils import json


img_extension='jpg'

FFMPEG2THEORA = 'ffmpeg2theora'

class AspectRatio(fractions.Fraction):
    def __new__(cls, numerator, denominator=None):
        if not denominator:
            ratio = map(int, numerator.split(':'))
            if len(ratio) == 1: ratio.append(1)
            numerator = ratio[0]
            denominator = ratio[1]
            #if its close enough to the common aspect ratios rather use that
            if abs(numerator/denominator - 4/3) < 0.03:
                numerator = 4
                denominator = 3
            elif abs(numerator/denominator - 16/9) < 0.02:
                numerator = 16
                denominator = 9
        return super(AspectRatio, cls).__new__(cls, numerator, denominator)

    @property
    def ratio(self):
        return "%d:%d" % (self.numerator, self.denominator)

def stream(video, target, profile, info):
    if not os.path.exists(target):
        fdir = os.path.dirname(target)
        if not os.path.exists(fdir):
            os.makedirs(fdir)

    dar = AspectRatio(info['video'][0]['display_aspect_ratio'])
    '''
        WebM look into
            lag
            mb_static_threshold
            qmax/qmin
            rc_buf_aggressivity=0.95
            token_partitions=4
            level / speedlevel
            bt?
        H264, should bitrates be a bit lower? other stuff possible?
    '''
    profile, format = profile.split('.')

    if profile == '1080p':
        height = 1080

        audiorate = 48000
        audioquality = 6
        audiobitrate = None
        audiochannels = None
    if profile == '720p':
        height = 720

        audiorate = 48000
        audioquality = 5
        audiobitrate = None
        audiochannels = None
    if profile == '480p':
        height = 480

        audiorate = 44100
        audioquality = 2
        audiobitrate = None
        audiochannels = 2
    elif profile == '360p':
        height = 360

        audiorate = 44100
        audioquality = 1
        audiobitrate = None
        audiochannels = 1
    elif profile == '270p':
        height = 270

        audiorate = 44100
        audioquality = 0
        audiobitrate = None
        audiochannels = 1
    else:
        height = 96

        audiorate = 22050
        audioquality = -1
        audiobitrate = '22k'
        audiochannels = 1

    bpp = 0.17
    fps = AspectRatio(info['video'][0]['framerate'])

    width  = int(dar * height)
    width += width % 2 

    bitrate = height*width*fps*bpp/1000
    aspect = dar.ratio
    #use 1:1 pixel aspect ratio if dar is close to that
    if abs(width/height - dar) < 0.02:
        aspect = '%s:%s' % (width, height)

    if info['audio']:
        audio_settings = ['-ar', str(audiorate), '-aq', str(audioquality)]
        if audiochannels and 'channels' in info['audio'][0] and info['audio'][0]['channels'] > audiochannels:
            audio_settings += ['-ac', str(audiochannels)]
        if audiobitrate:
            audio_settings += ['-ab', audiobitrate]
        if format == 'mp4':
            audio_settings += ['-acodec', 'libfaac']
        else:
            audio_settings += ['-acodec', 'libvorbis']
    else:
        audio_settings = ['-an']

    if info['video']:
        video_settings = [
            '-vb', '%dk'%bitrate, '-g', '%d' % int(fps*2),
            '-s', '%dx%d'%(width, height),
            '-aspect', aspect,
        ]
        if format == 'mp4':
            video_settings += [
                '-vcodec', 'libx264',
                '-flags', '+loop+mv4',
                '-cmp', '256',
                '-partitions', '+parti4x4+parti8x8+partp4x4+partp8x8+partb8x8',
                '-me_method', 'hex',
                '-subq', '7',
                '-trellis', '1',
                '-refs', '5',
                '-bf', '3',
                '-flags2', '+bpyramid+wpred+mixed_refs+dct8x8',
                '-coder', '1',
                '-me_range', '16',
                '-keyint_min', '25', #FIXME: should this be related to fps?
                '-sc_threshold','40',
                '-i_qfactor', '0.71',
                '-qmin', '10', '-qmax', '51',
                '-qdiff', '4'
            ]
    else:
        video_settings = ['-vn']

    ffmpeg = FFMPEG2THEORA.replace('2theora', '')
    cmd = [ffmpeg, '-y', '-threads', '2', '-i', video] \
          + audio_settings \
          + video_settings

    if format == 'mp4':
        cmd += ["%s.mp4"%target]
    else:
        cmd += ['-f','webm', target]

    print cmd
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    p.wait()
    if format == 'mp4':
        cmd = ['qt-faststart',  "%s.mp4"%target, target]
        print cmd
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        p.wait()
        os.unlink("%s.mp4"%target)

def run_command(cmd, timeout=10):
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    while timeout > 0:
        time.sleep(0.2)
        timeout -= 0.2
        if p.poll() != None:
            return p.returncode
    if p.poll() == None:
        os.kill(p.pid, 9)
        killedpid, stat = os.waitpid(p.pid, os.WNOHANG)
    return p.returncode

def frame(videoFile, position, baseFolder, width=128, redo=False):
    '''
        params:
            videoFile
            position as float in seconds
            baseFolder to write frames to
            width of frame
            redo boolean to extract file even if it exists
    '''
    def frame_path(size):
        return os.path.join(baseFolder, "%s.%s.%s" % (ox.ms2time(position*1000), size, img_extension))

    #not using input file, to slow to extract frame right now
    base_size = 320
    frame = frame_path(base_size)

    if exists(videoFile):
        if redo or not exists(frame):
            if not exists(baseFolder):
                os.makedirs(baseFolder)
            cmd = ['oggThumb', '-t', str(position), '-n', frame, '-s', '%dx0'%base_size, videoFile]
            run_command(cmd)
    if width != base_size:
        frame_base = frame
        frame = frame_path(width)
        if not exists(frame):
            resize_image(frame_base, frame, width)
    return frame

def resize_image(image_source, image_output, width):
    if exists(image_source):
        source = Image.open(image_source)
        source_width = source.size[0]
        source_height = source.size[1]

        height = int(width / (float(source_width) / source_height))
        height = height - height % 2

        if width < source_width:
            resize_method = Image.ANTIALIAS
        else:
            resize_method = Image.BICUBIC
        output = source.resize((width, height), resize_method)
        output.save(image_output)

def timeline(video, prefix):
    cmd = ['oxtimeline', '-i', video, '-o', prefix]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    p.wait()

#stats based on timeline images
def average_color(prefix):
    height = 64
    width = 1500
    frames = 0
    pixels = []
    color = np.asarray([0, 0, 0], dtype=np.float32)

    for image in sorted(glob("%s.%d.*.png" % (prefix, height))):
        timeline = Image.open(image)
        frames += timeline.size[0]
        p = np.asarray(timeline, dtype=np.float32)
        p = np.sum(p, axis=0) / height               #average color per frame
        pixels.append(p)

    for i in range(0, len(pixels)):
        p = np.sum(pixels[i], axis=0) / frames
        color += p
    return list(color)

def get_distance(rgb0, rgb1):
    dst = math.sqrt(pow(rgb0[0] - rgb1[0], 2) + pow(rgb0[0] - rgb1[0], 2) + pow(rgb0[0] - rgb1[0], 2))
    return dst / math.sqrt(3 * pow(255, 2))

def cuts(prefix):
    cuts = []
    fps = 25
    frames = 0
    height = 64
    width = 1500
    pixels = []
    for image in sorted(glob("%s.%d.*.png" % (prefix, height))):
        timeline = Image.open(image)
        frames += timeline.size[0]
        pixels.append(timeline.load())
    for frame in range(0, frames):
        x = frame % width
        if frame > 0:
            dst = 0
            image0 = int((frame - 1) / width)
            image1 = int(frame / width)
            for y in range(0, height):
                rgb0 = pixels[image0][(x - 1) % width, y]
                rgb1 = pixels[image1][x, y]
                dst += get_distance(rgb0, rgb1) / height
            #print frame / fps, dst
            if dst > 0.1:
                cuts.append(frame / fps)
    return cuts

