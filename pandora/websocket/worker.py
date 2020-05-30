# -*- coding: utf-8 -*-
import logging

from django.conf import settings

from kombu import Connection, Exchange, Queue
from kombu.mixins import ConsumerMixin

from . import daemon, key

logger = logging.getLogger('pandora.websocket')

queue = Queue('websocket', Exchange(key, type='direct'), routing_key=key)

class Worker(ConsumerMixin):

    def __init__(self, connection):
        self.connection = connection

    def get_consumers(self, Consumer, channel):
        return [Consumer(queues=queue,
                         accept=['pickle', 'json'],
                         callbacks=[self.process_task])]

    def process_task(self, body, message):
        try:
            if body['task'] == 'trigger_event':
                daemon.trigger_event(*body['args'])
        except:
            logger.error('faild to trigger event %s', body, exc_info=True)
        message.ack()

def run():
    with Connection(settings.CELERY_BROKER_URL) as conn:
        try:
            worker = Worker(conn)
            worker.run()
        except KeyboardInterrupt:
            print('shutting down...')
