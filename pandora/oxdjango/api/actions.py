# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement
import inspect
import sys

from django.conf import settings

from ..shortcuts import render_to_json_response, json_response

def autodiscover():
    # Register api actions from all installed apps
    from importlib import import_module
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
    properties = {}
    versions = {}
    def __init__(self):

        def api(request, data):
            '''
            Returns a list of all api actions
            takes {
                code: boolean, // if true, return source code (optional)
                docs: boolean // if true, return doc strings (optional)
            }
            returns {
                actions: {
                    name: {
                        cache: boolean, // if false, don't cache results
                        code: string, // source code
                        doc: string // doc strings
                    },
                    ... // more actions
                }
            }
            '''
            docs = data.get('docs', False)
            code = data.get('code', False)
            version = getattr(request, 'version', None)
            if version:
                _actions = self.versions.get(version, {}).keys()
                _actions = list(set(_actions + self.keys()))
            else:
                _actions = self.keys()
            _actions.sort()
            actions = {}
            for a in _actions:
                actions[a] = self.properties[a]
                if docs:
                    actions[a]['doc'] = self.doc(a, version)
                if code:
                    actions[a]['code'] = self.code(a, version)
            response = json_response({'actions': actions})
            return render_to_json_response(response)
        self.register(api)

    def doc(self, name, version=None):
        if version:
            f = self.versions[version].get(name, self.get(name))
        else:
            f = self[name]
        return trim(f.__doc__)

    def code(self, name, version=None):
        if version:
            f = self.versions[version].get(name, self.get(name))
        else:
            f = self[name]
        if name != 'api' and hasattr(f, 'func_closure') and f.func_closure:
            fc = filter(lambda c: hasattr(c.cell_contents, '__call__'), f.func_closure)
            f = fc[len(fc)-1].cell_contents
        info = f.func_code.co_filename[len(settings.PROJECT_ROOT)+1:]
        info = u'%s:%s' % (info, f.func_code.co_firstlineno)
        return info, trim(inspect.getsource(f))

    def register(self, method, action=None, cache=True, version=None):
        if not action:
            action = method.func_name
        if version:
            if not version in self.versions:
                self.versions[version] = {}
            self.versions[version][action] = method
        else:
            self[action] = method
        self.properties[action] = {'cache': cache}

    def unregister(self, action):
        if action in self:
            del self[action]

actions = ApiActions()

def error(request, data):
    '''
    This action is used to test API error codes. It should return a 503 error.
    '''
    success = error_is_success
    return render_to_json_response({})
actions.register(error)
