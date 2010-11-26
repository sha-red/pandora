# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import re

from ox.utils import json
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q, Manager
 
import models

class DateManager(Manager):
    def get_query_set(self):
        return super(DateManager, self).get_query_set()

    def find(self, q=''):
        qs = self.get_query_set()
        qs = qs.filter(Q(name_find__icontains=q))
        return qs
