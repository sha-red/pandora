// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.accountDialog = function(action) {
    var that = Ox.Dialog($.extend({
            fixedSize: true,
            height: 192,
            id: 'accountDialog',
            width: 432
        }, pandora.ui.accountDialogOptions(action)))
        .bindEvent({
            resize: function(event, data) {
                var width = data.width - 32;
                pandora.$ui.accountForm.items.forEach(function(item) {
                    item.options({width: width});
                });
            }
        });
    return that;
};

pandora.ui.accountDialogOptions = function(action, value) {
    //Ox.print('ACTION', action)
    pandora.$ui.accountForm && pandora.$ui.accountForm.removeElement();
    var buttons = {
            signin: ['signup', 'reset'],
            signup: ['signin'],
            reset: ['signin'],
            resetAndSignin: []
        },
        buttonTitle = {
            signin: 'Sign In',
            signup: 'Sign Up',
            reset: 'Reset Password',
            resetAndSignin: 'Reset Password and Sign In'
        },
        dialogText = {
            signin: 'To sign in to your account, please enter your username and password.',
            signup: 'To sign up for an account, please choose a username and password, and enter your e-mail address.',
            reset: 'To reset your password, please enter either your username or your e-mail address.',
            resetAndSignin: 'To sign in to your account, please choose a new password, and enter the code that we have just e-mailed to you.'
        },
        dialogTitle = {
            signin: 'Sign In',
            signup: 'Sign Up',
            reset: 'Reset Password',
            resetAndSignin: 'Reset Password'
        };
    function button(type) {
        if (type == 'cancel') {
            return Ox.Button({
                id: 'cancel' + Ox.toTitleCase(action),
                title: 'Cancel'
            }).bindEvent('click', function() {
                pandora.$ui.accountDialog.close();
            });
        } else if (type == 'submit') {
            return Ox.Button({
                disabled: true,
                id: 'submit' + Ox.toTitleCase(action),
                title: buttonTitle[action]
            }).bindEvent('click', function() {
                pandora.$ui.accountForm.submit();
            });
        } else {
            return Ox.Button({
                id: type,
                title: buttonTitle[type] + '...'
            }).bindEvent('click', function() {
                //Ox.print('CLICK EVENT', type)
                pandora.$ui.accountDialog.options(pandora.ui.accountDialogOptions(type));
            });
        }
    }
    return {
        buttons: Ox.merge($.map(buttons[action], function(type) {
                return button(type);
            }), [{}, button('cancel'), button('submit')]),
        content: Ox.Element()
            .append(
                $('<img>')
                    .attr({src: '/static/png/icon64.png'})
                    .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
            )
            .append(
                Ox.Element()
                    .css({position: 'absolute', left: '96px', top: '16px', width: '320px'})
                    .append(
                        Ox.Element()
                            .addClass('OxText')
                            .html(dialogText[action] + '<br/><br/>')
                    )
                    .append(
                        pandora.$ui.accountForm = pandora.ui.accountForm(action, value)
                    )
            ),
        keys: {
            enter: 'submit' + Ox.toTitleCase(action),
            escape: 'cancel' + Ox.toTitleCase(action)
        },
        title: dialogTitle[action]
    };
};

pandora.ui.accountForm = function(action, value) {
    if (pandora.$ui.accountForm) {
        pandora.$ui.accountForm.items.forEach(function(item) {
            if (item.options('id') == 'usernameOrEmail') {
                //Ox.print('REMOVING')
                //Ox.Event.unbind('usernameOrEmailSelect')
                //Ox.Event.unbind('usernameOrEmailSelectMenu')
                //Ox.Event.unbind('usernameOrEmailInput')
            }
            //Ox.print('REMOVING ITEM', item.options('id'));
            item.removeElement();
        });
    }
    var items = {
            'signin': ['username', 'password'],
            'signup': ['newUsername', 'password', 'email'],
            'reset': ['usernameOrEmail'],
            'resetAndSignin': ['oldUsername', 'newPassword', 'code']
        },
        $items = $.map(items[action], function(v) {
            return item(v, value);
        }),
        that = Ox.Form({
            id: 'accountForm' + Ox.toTitleCase(action),
            items: $items,
            submit: function(data, callback) {
                if (action == 'signin') {
                    pandora.api.signin(data, function(result) {
                        if (!result.data.errors) {
                            pandora.$ui.accountDialog.close();
                            pandora.signin(result.data);
                        } else {
                            callback([{id: 'password', message: 'Incorrect password'}]);
                        }
                    });
                } else if (action == 'signup') {
                    pandora.api.signup(data, function(result) {
                        if (!result.data.errors) {
                            pandora.$ui.accountDialog.close();
                            pandora.signin(result.data);
                            pandora.ui.accountWelcomeDialog().open();
                        } else {
                            callback([{id: 'password', message: result.data.errors.toString()}]); // fixme
                        }
                    });
                } else if (action == 'reset') {
                    Ox.print('DATA???', data)
                    var usernameOrEmail = data.usernameOrEmail,
                        key = usernameOrEmail[0];
                    data = {};
                    data[key] = usernameOrEmail[1];
                    pandora.api.requestToken(data, function(result) {
                        if (!result.data.errors) {
                            pandora.$ui.accountDialog.options(pandora.ui.accountDialogOptions('resetAndSignin', result.data.username));
                        } else {
                            callback([{id: 'usernameOrEmail', message: 'Unknown ' + (key == 'username' ? 'username' : 'e-mail address')}])
                        }
                    });
                } else if (action == 'resetAndSignin') {
                    pandora.api.resetPassword(data, function(result) {
                        if (!result.data.errors) {
                            pandora.$ui.accountDialog.close();
                            pandora.login(result.data);
                        } else {
                            callback([{id: 'code', message: 'Incorrect code'}]);
                        }
                    })
                }
            }
        }).bindEvent({
            submit: function(event, data) {
        
            },
            validate: function(event, data) {
                //Ox.print('FORM VALIDATE', data)
                pandora.$ui.accountDialog[
                    (data.valid ? 'enable' : 'disable') + 'Button'
                ]('submit' + Ox.toTitleCase(action));
            }
        });
    that.items = $items;
    function item(type, value) {
        if (type == 'code') {
            return Ox.Input({
                autovalidate: pandora.autovalidateCode,
                id: 'code',
                label: 'Code',
                labelWidth: 120,
                validate: function(value, callback) {
                    callback({
                        message: 'Missing code',
                        valid: !!value.length
                    });
                },
                width: 320
            });
        } else if (type == 'email') {
            return Ox.Input({
                autovalidate: pandora.autovalidateEmail,
                id: 'email',
                label: 'E-Mail Address',
                labelWidth: 120,
                type: 'email',
                validate: pandora.validateUser('email'),
                width: 320
            });
        } else if (type == 'newPassword') {
            return Ox.Input({
                autovalidate: /.+/,
                id: 'password',
                label: 'New Password',
                labelWidth: 120,
                type: 'password',
                validate: function(value, callback) {
                    callback({
                        message: 'Missing password',
                        valid: value.length > 0
                    });
                },
                width: 320
            });
        } else if (type == 'newUsername') {
            return Ox.Input({
                autovalidate: pandora.autovalidateUsername,
                id: 'username',
                label: 'Username',
                labelWidth: 120,
                validate: pandora.validateUser('username'),
                width: 320
            });
        } else if (type == 'oldUsername') {
            return Ox.Input({
                disabled: true,
                id: 'username',
                label: 'Username',
                labelWidth: 120,
                value: value,
                width: 320
            });
        } else if (type == 'password') {
            return Ox.Input({
                autovalidate: /.+/,
                id: 'password',
                label: 'Password',
                labelWidth: 120,
                type: 'password',
                validate: function(value, callback) {
                    callback({
                        message: 'Missing Password',
                        valid: value.length > 0
                    });
                },
                width: 320
            });
        } else if (type == 'username') {
            return Ox.Input({
                autovalidate: pandora.autovalidateUsername,
                id: 'username',
                label: 'Username',
                labelWidth: 120,
                validate: pandora.validateUser('username', true),
                width: 320
            });    
        } else if (type == 'usernameOrEmail') {
            return Ox.FormElementGroup({
                id: 'usernameOrEmail',
                elements: [
                    pandora.$ui.usernameOrEmailSelect = Ox.Select({
                            id: 'usernameOrEmailSelect',
                            items: [
                                {id: 'username', title: 'Username'},
                                {id: 'email', title: 'E-Mail Address'},
                            ],
                            overlap: 'right',
                            width: 128
                        })
                        .bindEvent({
                            change: function(event, data) {
                                var selected = data.selected[0].id;
                                pandora.$ui.usernameOrEmailInput.options({
                                    autovalidate: selected == 'username' ? pandora.autovalidateUsername : autovalidateEmail,
                                    validate: validateUser(selected, true),
                                    value: ''
                                }).focus();
                            }
                        }),
                    pandora.$ui.usernameOrEmailInput = Ox.Input({
                        autovalidate: pandora.autovalidateUsername,
                        id: 'usernameOrEmailInput',
                        validate: pandora.validateUser('username', true),
                        width: 192
                    })
                ],
                separators: [
                    {title: '', width: 0}
                ]
            });
        }
    }
    return that;            
};

pandora.ui.accountSignoutDialog = function() {
    var that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'cancel',
                    title: 'Cancel'
                }).bindEvent('click', function() {
                    that.close();
                    pandora.$ui.mainMenu.getItem('signinsignout').toggleTitle();
                }),
                Ox.Button({
                    id: 'signout',
                    title: 'Sign Out'
                }).bindEvent('click', function() {
                    that.close();
                    pandora.api.signout({}, function(result) {
                        pandora.signout(result.data);
                    });
                })
            ],
            content: Ox.Element()
                .append(
                    $('<img>')
                        .attr({src: '/static/png/icon64.png'})
                        .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
                )
                .append(
                    $('<div>')
                        .css({position: 'absolute', left: '96px', top: '16px', width: '192px'})
                        .html('Are you sure you want to sign out?')
                ),
            fixedSize: true,
            height: 128,
            keys: {enter: 'signout', escape: 'cancel'},
            title: 'Sign Out',
            width: 304
        });
    return that;
};

pandora.ui.accountWelcomeDialog = function() {
    var that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'preferences',
                    title: 'Preferences...'
                }).bindEvent('click', function() {
                    that.close();
                    pandora.$ui.preferencesDialog = pandora.ui.preferencesDialog().open();
                }),
                {},
                Ox.Button({
                    id: 'close',
                    title: 'Close'
                }).bindEvent('click', function() {
                    that.close();
                })
            ],
            content: Ox.Element()
                .append(
                    $('<img>')
                        .attr({src: '/static/png/icon64.png'})
                        .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
                )
                .append(
                    Ox.Element()
                        .css({position: 'absolute', left: '96px', top: '16px', width: '192px'})
                        .html('Welcome, ' + pandora.user.username + '!<br/><br/>Your account has been created.')
                ),
            fixedSize: true,
            height: 128,
            keys: {enter: 'close', escape: 'close'},
            title: 'Welcome to ' + pandora.site.site.name,
            width: 304
        });
    return that;
};

