# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4

from django.contrib.auth.models import User
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from django.template import RequestContext
from django.utils import simplejson as json

from ox.django.shortcuts import render_to_json_response
from ox.django.decorators import login_required_json

import models


def login(request):
    from django.contrib.auth import authenticate, login
    response = {'status': 403, 'message': 'login required'}
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(username=username, password=password)
    if user is not None:
        if user.is_active:
            user_json = {} #FIXME: preferences etc should be in here
            login(request, user)
            response = {'status': 200, 'message': 'You are logged in.', 'user': user_json}
        else:
            response = {'status': 403, 'message': 'Your account is disabled.'}
            print "Your account has been disabled!"
    else:
        response = {'status': 403, 'message': 'Your username and password were incorrect.'}
    return render_to_json_response(response)

def logout(request):
    response = {'status': 200}
    if request.user.is_authenticated():
        request.user.logout()
    return render_to_json_response(response)
    
def register(request):
    response = {'status': 500, 'message': 'registration failed'}
    return render_to_json_response(response)

def recover(request):
    username = request.POST.get('username', None)
    user = None
    q = User.objects.filter(username=username)
    if q.count() > 0:
        user = q[0]
    else:
        q = User.objects.filter(email=email)
        if q.count() > 0:
            user = q[0]
    if user:
        user.sendmail(...) #FIXME: send recovery mail
        response = {'status': 200, 'message': 'recovert email sent.'}
    else:
        response = {'status': 500, 'message': 'user or email not found.'}
    return render_to_json_response(response)

'''
GET  preferences/             //get all keys
GET  preferences/?key=        //get key
GEt  preferences/?key=&value= //set key
'''
@login_required_json
def preferences(request):
    response = {'status': 200}
    key = request.GET.get('key', None)
    value = request.GET.get('value', None)
    user = request.user
    if not key: # return all preferences for current user
        for p in models.Preference.objects.filter(user=user):
            response['preferences'][p.key] = p.value
        response['preferences']['email'] = user.email
    elif value == None: #return one preference
        p, created = models.Preference.objects.get_or_create(user=user, key=key)
        response['preferences'][key] = p.value
    else: # set preference
        response['message'] = '%s saved.' % key
        if key == 'password':
            user.set_password(value)
            user.save()
        elsif key == 'email':
            user.email = vaule
            user.save()
        else:
            p, created = models.Preference.objects.get_or_create(user=user, key=key)
            p.value = value
            p.save()
    return render_to_json_response(response)

