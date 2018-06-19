# -*- coding: utf-8 -*-
from __future__ import division, with_statement

import time

from .models import Settings


def limit_rate(key, timeout):
    key = 'limit.%s.last' % key
    last_cronjob = Settings.get(key, 0)
    current_time = time.time()
    if (current_time - last_cronjob) > timeout:
        Settings.set(key, current_time)
        return True
    return False
