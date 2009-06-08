#!/usr/bin/env python
# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
#
import errno
import os
import sys
import re
import hashlib

import oxlib
import oxlib.iso
from oxlib.normalize import normalizeName

def oxid(title, director, year='', seriesTitle='', episodeTitle='', season=0, episode=0):
    oxid_value = u"\n".join([title, director, year])
    oxid = hashlib.sha1(oxid_value.encode('utf-8')).hexdigest()
    if seriesTitle:
        oxid_value = u"\n".join([seriesTitle, "%02d" % season])
        oxid = hashlib.sha1(oxid_value.encode('utf-8')).hexdigest()[:20]
        oxid_value = u"\n".join(["%02d" % episode, episodeTitle, director, year])
        oxid += hashlib.sha1(oxid_value.encode('utf-8')).hexdigest()[:20]
    return u"0x" + oxid

