'use strict';

pandora.ui.userButton = function() {

    var isGuest = pandora.user.level == 'guest',
        that = Ox.Element().css({marginLeft: '3px'});

    $('<div>')
        .addClass('OxLight')
        .css({
            float: 'left',
            marginTop: '2px',
            fontSize: '9px'
        })
        .html(
            isGuest ? 'not signed in'
            : Ox.encodeHTMLEntities(pandora.user.username)
        )
        .appendTo(that);

    Ox.Button({
            style: 'symbol',
            title: 'user',
            tooltip: Ox._(
                isGuest ? 'Click to sign up or doubleclick to sign in'
                : 'Click to open preferences or doubleclick to sign out'
            ),
            type: 'image'
        })
        .css({
            float: 'left'
        })
        .bindEvent({
            singleclick: function() {
                pandora.UI.set({page: isGuest ? 'signup' : 'preferences'});
            },
            doubleclick: function() {
                pandora.UI.set({page: isGuest ? 'signin' : 'signout'});
            }
        })
        .appendTo(that);

    return that;

};