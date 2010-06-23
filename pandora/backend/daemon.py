from carrot.connection import DjangoBrokerConnection
from carrot.messaging import Consumer, Publisher
from django.conf import settings

import load
import models

def send_bg_message(msg):
    conn = DjangoBrokerConnection()
    publisher = Publisher(connection=conn, exchange="pandora-bg",
                                           routing_key="pandora-bg")
    publisher.send(msg)
    publisher.close()

def run():
    conn = DjangoBrokerConnection()

    consumer = Consumer(connection=conn, queue="pandora-bg",
                                         exchange="pandora-bg",
                                         routing_key="pandora-bg")
    def handle_background_tasks_callback(data, message):
        print("Got bg message")
        print data
        if 'loadIMDb' in data:
            imdbId = data['loadIMDb']
            load.loadIMDb(imdbId)
        elif 'findMovie' in data:
			f = models.File.objects.get(pk=data['findMovie'])
			f.findMovie()
        message.ack()
    consumer.register_callback(handle_background_tasks_callback)
    consumer.wait() # Go into the consumer loop.

