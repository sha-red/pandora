# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import sys

from django.conf import settings

from ox.django.shortcuts import render_to_json_response, json_response


def autodiscover():
    #register api actions from all installed apps
    from django.utils.importlib import import_module
    from django.utils.module_loading import module_has_submodule
    for app in settings.INSTALLED_APPS:
        if app != 'api':
            mod = import_module(app)
            try:
                import_module('%s.views'%app)
            except:
                if module_has_submodule(mod, 'views'):
                    raise 


def trim(docstring):
    if not docstring:
        return ''
    # Convert tabs to spaces (following the normal Python rules)
    # and split into a list of lines:
    lines = docstring.expandtabs().splitlines()
    # Determine minimum indentation (first line doesn't count):
    indent = sys.maxint
    for line in lines[1:]:
        stripped = line.lstrip()
        if stripped:
            indent = min(indent, len(line) - len(stripped))
    # Remove indentation (first line is special):
    trimmed = [lines[0].strip()]
    if indent < sys.maxint:
        for line in lines[1:]:
            trimmed.append(line[indent:].rstrip())
    # Strip off trailing and leading blank lines:
    while trimmed and not trimmed[-1]:
        trimmed.pop()
    while trimmed and not trimmed[0]:
        trimmed.pop(0)
    # Return a single string:
    return '\n'.join(trimmed)

class ApiActions(dict):
    def __init__(self):
        def api(request):
            '''
                returns list of all known api action
                return {'status': {'code': int, 'text': string},
                        'data': {actions: ['api', 'hello', ...]}}
            '''
            actions = self.keys()
            actions.sort()
            return render_to_json_response(json_response({'actions': actions}))
        self['api'] = api

        def apidoc(request):
            '''
                returns array of actions with documentation
            '''
            actions = self.keys()
            actions.sort()
            docs = {}
            for f in actions:
                docs[f] = self.doc(f)
            return render_to_json_response(json_response({'actions': docs}))

        self['apidoc'] = apidoc

    def doc(self, f):
        return trim(self[f].__doc__)

    def register(self, method, action=None):
        if not action:
            action = method.func_name
        self[action] = method

    def unregister(self, action):
        if action in self:
            del self[action]

actions = ApiActions()
