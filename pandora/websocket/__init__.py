# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from celery.execute import send_task
from django.conf import settings


key = 'websocket'

def trigger_event(event, data):
    if settings.WEBSOCKET:
        send_task('trigger_event', [event, data], exchange=key, routing_key=key)
