# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from django.db.models import Q, Manager


class PlaceManager(Manager):

    def get_query_set(self):
        return super(PlaceManager, self).get_query_set()

    def find(self, q='', south=-180.0, west=-180.0, north=180.0, east=180.0):
        qs = self.get_query_set()
        qs = qs.filter(Q(
            Q(Q(south__gt=south)|Q(south__lt=north)|Q(west__gt=west)|Q(west__lt=east)) &
            Q(Q(south__gt=south)|Q(south__lt=north)|Q(west__lt=east)|Q(east__gt=east)) &
            Q(Q(north__gt=south)|Q(north__lt=north)|Q(west__gt=west)|Q(west__lt=east)) &
            Q(Q(north__gt=south)|Q(north__lt=north)|Q(east__gt=west)|Q(east__lt=east))
        ))
        if q:
            qs = qs.filter(name_find__icontains=q)
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
