# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import absolute_import

from django.conf import settings

from kombu import Connection, Exchange, Queue
from kombu.mixins import ConsumerMixin

from . import daemon, key


queue = Queue('websocket', Exchange(key, type='direct'), routing_key=key)

class Worker(ConsumerMixin):

    def __init__(self, connection):
        self.connection = connection

    def get_consumers(self, Consumer, channel):
        return [Consumer(queues=queue,
                         accept=['pickle', 'json'],
                         callbacks=[self.process_task])]

    def process_task(self, body, message):
        if body['task'] == 'trigger_event':
            daemon.trigger_event(*body['args'])
        message.ack()

def run():
    with Connection(settings.BROKER_URL) as conn:
        try:
            worker = Worker(conn)
            worker.run()
        except KeyboardInterrupt:
            print('shutting down...')
