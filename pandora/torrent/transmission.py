# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import with_statement
import os
import time
import base64
from subprocess import Popen

from django.conf import settings
import oxlib.torrent
import transmissionrpc

def connect():
    return transmissionrpc.Client(settings.TRANSMISSON_HOST,
                                  port=settings.TRANSMISSON_PORT,
                                  user=settings.TRANSMISSON_USER,
                                  password=settings.TRANSMISSON_PASSWORD)

def remove(info_hash):
    if settings.DEBUG:
        print 'remove', info_hash
    if info_hash:
        try:
            tc = connect()
            tc.remove(info_hash.lower())
        except:
            if DEBUG:
                import traceback
                traceback.print_exc()
        
def add(torrent_file):
    download_dir = os.path.dirname(torrent_file)
    with open(torrent_file) as f:
        torrent_data = base64.b64encode(f.read())
    info_hash = oxlib.torrent.getInfoHash(torrent_file)
    try:
        tc = connect()
        if not is_seeding(info_hash):
            tc.add(torrent_data, download_dir=download_dir)
    except:
        if settings.DEBUG:
            import traceback
            traceback.print_exc()

def is_seeding(info_hash):
    info_hash = info_hash.lower()
    try:
        tc = connect()
        torrents = tc.info(info_hash)
    except:
        torrents = False
        if settings.DEBUG:
            import traceback
            traceback.print_exc()
    if torrents:
        return True
    return False

def start_daemon():
    try:
        tc = connect()
    except:
        Popen(['transmission-daemon',
            '-a', '127.0.0.1',
            '-r', '127.0.0.1',
            '-p', str(settings.TRANSMISSON_PORT),
            '--auth',
            '-u', settings.TRANSMISSON_USER,
            '-v', settings.TRANSMISSON_PASSWORD,
            '-w', settings.MEDIA_ROOT,
        ])
        time.sleep(1)

