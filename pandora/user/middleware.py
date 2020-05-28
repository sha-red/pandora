# -*- coding: utf-8 -*-
from django.conf import settings
from django.contrib.sessions.models import Session
from django.utils.deprecation import MiddlewareMixin

class UpdateSession(MiddlewareMixin):

    def process_request(self, request):
        if request.user.is_authenticated:
            expire_date = Session.objects.get(session_key=request.session.session_key).expire_date
            if (request.session.get_expiry_date() - expire_date).total_seconds() > settings.SESSION_UPDATE:
                request.session.modified = True

    def process_response(self, request, response):
        return response
