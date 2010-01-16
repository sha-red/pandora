from carrot.connection import DjangoBrokerConnection
from carrot.messaging import Consumer, Publisher
from django.conf import settings

import load
import models

def send_bg_message(msg):
    conn = DjangoBrokerConnection()
    publisher = Publisher(connection=conn, exchange="oxdb-bg",
                                           routing_key="oxdb-bg")
    publisher.send(msg)
    publisher.close()

def run():
    conn = DjangoBrokerConnection()

    consumer = Consumer(connection=conn, queue="oxdb-bg",
                                         exchange="oxdb-bg",
                                         routing_key="oxdb-bg")
    def handle_background_tasks_callback(data, message):
        print("Got feed import message")
        print data
        if 'loadIMDb' in data:
            imdbId = message_data['loadIMDb']
            load.loadIMDb(imdbId)
        elif 'findMovie' in data:
            f = models.File.objects.get(pk=data['findMovie'])
            f.findMovie()
        message.ack()
    consumer.register_callback(handle_background_tasks_callback)
    consumer.wait() # Go into the consumer loop.

