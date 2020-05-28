# -*- coding: utf-8 -*-
from django.utils.deprecation import MiddlewareMixin

from .shortcuts import HttpErrorJson, render_to_json_response

class ExceptionMiddleware(MiddlewareMixin):

    def process_exception(self, request, exception):
        if isinstance(exception, HttpErrorJson):
            return render_to_json_response(exception.response)
        return None

class ChromeFrameMiddleware(MiddlewareMixin):

    def process_response(self, request, response):
        response['X-UA-Compatible'] = 'chrome=1'
        return response
