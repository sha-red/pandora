# -*- coding: utf-8 -*-
try:
    from django.contrib.auth.decorators import wraps
except:
    from django.utils.functional import wraps
from oxdjango.shortcuts import render_to_json_response, json_response

def capability_required_json(capability):
    def capability_required(function=None):
        def _wrapped_view(request, *args, **kwargs):
            if request.user.is_authenticated and \
                request.user.profile.capability(capability):
                return function(request, *args, **kwargs)
            return render_to_json_response(json_response(status=403, text='permission denied'))
        return wraps(function)(_wrapped_view)
    return capability_required
