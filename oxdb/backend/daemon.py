from carrot.connection import DjangoBrokerConnection
from carrot.messaging import Consumer


def run():
    conn = DjangoBrokerConnection()

    consumer = Consumer(connection=conn, queue="oxdb-bg",
                                         exchange="oxdb-bg",
                                         routing_key="oxdb-bg")
    def handle_background_tasks_callback(message_data, message):
        print("Got feed import message")
        print message_data
        if 'loadIMDb' in message_data:
            imdbId = message_data['loadIMDb']
            load.loadIMDb(imdbId)
        message.ack()
    consumer.register_callback(handle_background_tasks_callback)
    consumer.wait() # Go into the consumer loop.

