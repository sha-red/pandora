'use strict';

pandora.ui.userButton = function() {

    var isGuest = pandora.user.level == 'guest',
        that = Ox.Element({
                tooltip: Ox._(
                    isGuest ? 'Click to sign up or doubleclick to sign in'
                    : 'Click to open preferences or doubleclick to sign out'
                )
            })
            .css({marginLeft: '3px'})
            .bindEvent({
                singleclick: function() {
                    pandora.UI.set({page: isGuest ? 'signup' : 'preferences'});
                },
                doubleclick: function() {
                    pandora.UI.set({page: isGuest ? 'signin' : 'signout'});
                }
            });

    $('<div>')
        .addClass('OxLight')
        .css({
            float: 'left',
            marginTop: '2px',
            fontSize: '9px'
        })
        .html(
            isGuest ? Ox._('not signed in')
            : Ox.encodeHTMLEntities(pandora.user.username)
        )
        .appendTo(that);

    Ox.Button({
            style: 'symbol',
            title: 'user',
            type: 'image'
        })
        .css({float: 'left'})
        .appendTo(that);

    return that;

};