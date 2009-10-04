# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.contrib.auth.decorators import user_passes_test


def login_required_json(function=None):
    """
    Decorator for views that checks that the user is logged in
    return json error if not logged in.
    """
    actual_decorator = user_passes_test(
        lambda u: u.is_authenticated(),
        login_url='/json/login',
    )
    if function:
        return actual_decorator(function)
    return actual_decorator

