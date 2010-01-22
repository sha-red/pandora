from carrot.connection import DjangoBrokerConnection
from carrot.messaging import Consumer, Publisher
from django.conf import settings

import load
import models

def send_encoder_message(msg):
    conn = DjangoBrokerConnection()
    publisher = Publisher(connection=conn, exchange="oxdb-encoder",
                                           routing_key="oxdb-encoder")
    publisher.send(msg)
    publisher.close()

def run():
    conn = DjangoBrokerConnection()

    consumer = Consumer(connection=conn, queue="oxdb-encoder",
                                         exchange="oxdb-encoder",
                                         routing_key="oxdb-encoder")
    def handle_background_tasks_callback(data, message):
        print("Got encoder message")
        print data
        if 'extract' in data:
            '''
                update file stuff
                create derivates and other related stuff for a file
            '''
            fileId = data['fileId']
            f = models.File.objects.get(pk=fileId)
            f.extract()
        elif 'updateMovie' in data:
            '''
                update movie
                create proxy stream and other related files extracted from movieFiles
            '''
            movieId = data['movieId']
            m = models.Movie.objects.get(pk=fileId)
            m.extract()
        message.ack()
    consumer.register_callback(handle_background_tasks_callback)
    consumer.wait() # Go into the consumer loop.

