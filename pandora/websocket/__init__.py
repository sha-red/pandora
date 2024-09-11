# -*- coding: utf-8 -*-

from django.conf import settings
from app.celery import app


key = 'websocket'

def trigger_event(event, data):
    if settings.WEBSOCKET:
        app.send_task('trigger_event', [event, data], exchange=key, routing_key=key)
