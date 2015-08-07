# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.conf import settings
from django.contrib.sessions.models import Session

class UpdateSession(object):
    def process_request(self, request):
        if request.user.is_authenticated():
            expire_date = Session.objects.get(session_key=request.session.session_key).expire_date
            if (request.session.get_expiry_date() - expire_date).total_seconds() > settings.SESSION_UPDATE:
                request.session.modified = True

    def process_response(self, request, response):
        return response