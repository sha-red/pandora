# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

import json
from threading import Thread

from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.web import Application
from tornado.websocket import WebSocketHandler

import logging
logger = logging.getLogger('pandora.websocket')

sockets = []


class Daemon(Thread):
    def __init__(self, port, address):
        self.port = port
        self.address = address
        Thread.__init__(self)
        self.daemon = True
        self.start()

    def join(self):
        self.main.stop()

    def run(self):

        options = {
            'debug': False,
            'gzip': False
        }
        handlers = [
            (r'/(.*)', Handler),
        ]
        self.http_server = HTTPServer(Application(handlers, **options))
        self.main = IOLoop.instance()
        self.http_server.listen(self.port, self.address)
        self.main.start()


class Handler(WebSocketHandler):
    '''
    def check_origin(self, origin):
        # bypass same origin check
        return True
    '''

    def open(self, path):
        if self not in sockets:
            sockets.append(self)

    #websocket calls
    def on_close(self):
        if self in sockets:
            sockets.remove(self)

    def on_message(self, message):
        pass
        #logger.debug('got message %s', message)

    def post(self, event, data):
        message = json.dumps([event, data])
        main = IOLoop.instance()
        main.add_callback(lambda: self.write_message(message))

def trigger_event(event, data):
    logger.debug('trigger event %s %s to %s clients', event, data, len(sockets))
    main = IOLoop.instance()
    message = json.dumps([event, data])
    for ws in sockets:
        try:
            main.add_callback(lambda: ws.write_message(message))
        except:
            logger.debug('failed to send to ws %s %s %s', ws, event, data, exc_info=1)
