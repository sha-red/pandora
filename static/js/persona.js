'use strict';

pandora.persona = {};

pandora.persona.init = function(callback) {

    (!navigator.id ? Ox.getFile : Ox.noop)(
        'https://login.persona.org/include.js',
        function() {
            navigator.id.watch({
              loggedInUser: pandora.user.email ? pandora.user.email : null,
              onlogin: onlogin,
              onlogout: onlogout
            });
            callback && callback();
        }
    );

    function getUsername(callback) {
        pandora.$ui.accountDialog = pandora.ui.accountDialog('username').open();
        pandora.$ui.accountForm.bindEvent({
            submit: function(data) {
                callback(data.values.username);
                pandora.$ui.accountDialog.close();
            }
        });
        return pandora.$ui.accountDialog;
    }

    function onlogin(assertion, username) {
        pandora.api.signin({
            assertion: assertion,
            username: username
        }, function(result) {
            if (!result.data.errors && result.status.code == 200) {
                pandora.signin(result.data);
            } else if (!username
                       && result.data.errors && result.data.errors.username) {
                getUsername(function(username) {
                    onlogin(assertion, username);
                });
            } else {
                onlogout();
                //fixme: show some error
            }
        });
    }

    function onlogout() {
        pandora.UI.set({page: ''});
        pandora.api.signout({}, function(result) {
            pandora.signout(result.data);
        });
    }

};

pandora.persona.signin = function() {
    
    navigator.id.request();

};

pandora.persona.signout = function() {

    navigator.id.logout();

};

pandora.ui.personaButton = function() {

    var isGuest = pandora.user.level == 'guest',
        that = Ox.Element({
                tooltip: Ox._(
                    isGuest ? 'Click to sign with Persona'
                    : 'Click to open preferences or doubleclick to sign out'
                )
            })
            .css({marginLeft: '3px'})
            .bindEvent({
                singleclick: function() {
                    isGuest
                        ? pandora.persona.signin()
                        : pandora.UI.set({page: 'preferences'});
                },
                doubleclick: function() {
                    pandora.UI.set({page: isGuest ? 'signin' : 'signout'});
                }
            });

    pandora.persona.init();
    $('<div>')
        .addClass('OxLight')
        .css({
            float: 'left',
            marginTop: '2px',
            fontSize: '9px'
        })
        .html(
            isGuest ? Ox._('Sign in')
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
