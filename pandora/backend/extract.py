# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
# GPL 2010
from __future__ import division
import re
import os
from os.path import abspath, join, dirname, exists
import shutil
import time
import warnings
import subprocess

import oxlib
import Image
import simplejson as json


img_extension='jpg'

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
        return os.path.join(baseFolder, "%s.%s.%s" % (oxlib.ms2time(position*1000), size, img_extension))

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
