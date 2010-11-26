# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
import re

from ox.utils import json
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q, Manager
 
import models

class PlaceManager(Manager):
    def get_query_set(self):
        return super(PlaceManager, self).get_query_set()

    def find(self, q='', f="globe", sw_lat=-180.0, sw_lng=-180.0, ne_lat=180.0, ne_lng=180.0):
        qs = self.get_query_set()
        qs = qs.filter(Q(
            Q(Q(sw_lat__gt=sw_lat)|Q(sw_lat__lt=ne_lat)|Q(sw_lng__gt=sw_lng)|Q(sw_lng__lt=ne_lng)) & 
            Q(Q(sw_lat__gt=sw_lat)|Q(sw_lat__lt=ne_lat)|Q(sw_lng__lt=ne_lng)|Q(ne_lng__gt=ne_lng)) &
            Q(Q(ne_lat__gt=sw_lat)|Q(ne_lat__lt=ne_lat)|Q(sw_lng__gt=sw_lng)|Q(sw_lng__lt=ne_lng)) &
            Q(Q(ne_lat__gt=sw_lat)|Q(ne_lat__lt=ne_lat)|Q(ne_lng__gt=sw_lng)|Q(ne_lng__lt=ne_lng))
        ))
        if q:
            qs = qs.filter(name_find__icontains, q)
        return qs
        '''
        #only return locations that have layers of videos visible to current user
        if not identity.current.anonymous:
            user = identity.current.user
            if not user.in_group('admin'):
                query = AND(query,
                  id == Layer.q.locationID, Layer.q.videoID == Video.q.id,
                  OR(Video.q.public == True, Video.q.creatorID == user.id)
                )
        else:
            query = AND(query,
              id == Layer.q.locationID, Layer.q.videoID == Video.q.id,
              Video.q.public == True)
        '''
