// vim: et:ts=4:sw=4:sts=4:ft=js

pandora.ui.accountDialog = function(action) {
    var that = new Ox.Dialog($.extend({
            height: 256,
            id: 'accountDialog',
            minHeight: 256,
            minWidth: 384,
            width: 384
        }, pandora.ui.accountDialogOptions(action)))
        .bindEvent({
            resize: function(event, data) {
                var width = data.width - 32;
                app.$ui.accountForm.items.forEach(function(item) {
                    item.options({width: width});
                });
            }
        });
    return that;
};

pandora.ui.accountDialogOptions = function(action, value) {
    //Ox.print('ACTION', action)
    app.$ui.accountForm && app.$ui.accountForm.removeElement();
    var buttons = {
            login: ['register', 'reset'],
            register: ['login'],
            reset: ['login'],
            resetAndLogin: []
        },
        buttonTitle = {
            login: 'Login',
            register: 'Register',
            reset: 'Reset Password',
            resetAndLogin: 'Reset Password and Login'
        },
        dialogText = {
            login: 'To login to your account, please enter your username and password.',
            register: 'To create a new account, please choose a username and password, and enter your e-mail address.',
            reset: 'To reset your password, please enter either your username or your e-mail address.',
            resetAndLogin: 'To login to your account, please choose a new password, and enter the code that we have just e-mailed to you.'
        },
        dialogTitle = {
            login: 'Login',
            register: 'Register',
            reset: 'Reset Password',
            resetAndLogin: 'Reset Password'
        };
    function button(type) {
        if (type == 'cancel') {
            return new Ox.Button({
                id: 'cancel' + Ox.toTitleCase(action),
                title: 'Cancel'
            }).bindEvent('click', function() {
                app.$ui.accountDialog.close();
            });
        } else if (type == 'submit') {
            return new Ox.Button({
                disabled: true,
                id: 'submit' + Ox.toTitleCase(action),
                title: buttonTitle[action]
            }).bindEvent('click', function() {
                app.$ui.accountForm.submit();
            });
        } else {
            return new Ox.Button({
                id: type,
                title: buttonTitle[type] + '...'
            }).bindEvent('click', function() {
                //Ox.print('CLICK EVENT', type)
                app.$ui.accountDialog.options(ui.accountDialogOptions(type));
            });
        }
    }
    return {
        buttons: [
            $.map(buttons[action], function(type) {
                return button(type);
            }),
            [button('cancel'), button('submit')]
        ],
        content: new Ox.Element()
            .append(
                new Ox.Element()
                    .addClass('OxText')
                    .html(dialogText[action] + '<br/><br/>')
            )
            .append(
                app.$ui.accountForm = pandora.ui.accountForm(action, value)
            ),
        keys: {
            enter: 'submit' + Ox.toTitleCase(action),
            escape: 'cancel' + Ox.toTitleCase(action)
        },
        title: dialogTitle[action]
    };
};

pandora.ui.accountForm = function(action, value) {
    if (app.$ui.accountForm) {
        app.$ui.accountForm.items.forEach(function(item) {
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
            'login': ['username', 'password'],
            'register': ['newUsername', 'password', 'email'],
            'reset': ['usernameOrEmail'],
            'resetAndLogin': ['oldUsername', 'newPassword', 'code']
        },
        $items = $.map(items[action], function(v) {
            return item(v, value);
        }),
        that = new Ox.Form({
            id: 'accountForm' + Ox.toTitleCase(action),
            items: $items,
            submit: function(data, callback) {
                if (action == 'login') {
                    pandora.api.signin(data, function(result) {
                        if (!result.data.errors) {
                            app.$ui.accountDialog.close();
                            pandora.login(result.data);
                        } else {
                            callback([{id: 'password', message: 'Incorrect password'}]);
                        }
                    });
                } else if (action == 'register') {
                    pandora.api.signup(data, function(result) {
                        if (!result.data.errors) {
                            app.$ui.accountDialog.close();
                            pandora.login(result.data);
                            pandora.ui.accountWelcomeDialog().open();
                        } else {
                            callback([{id: 'password', message: result.data.errors.toString()}]); // fixme
                        }
                    });
                } else if (action == 'reset') {
                    var usernameOrEmail = data.usernameOrEmail,
                        key = usernameOrEmail[0].id;
                    data = {};
                    data[key] = usernameOrEmail[1];
                    pandora.api.requestToken(data, function(result) {
                        if (!result.data.errors) {
                            app.$ui.accountDialog.options(ui.accountDialogOptions('resetAndLogin', result.data.username));
                        } else {
                            callback([{id: 'usernameOrEmail', message: 'Unknown ' + (key == 'username' ? 'username' : 'e-mail address')}])
                        }
                    });
                } else if (action == 'resetAndLogin') {
                    pandora.api.resetPassword(data, function(result) {
                        if (!result.data.errors) {
                            app.$ui.accountDialog.close();
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
                app.$ui.accountDialog[
                    (data.valid ? 'enable' : 'disable') + 'Button'
                ]('submit' + Ox.toTitleCase(action));
            }
        });
    that.items = $items;
    function item(type, value) {
        if (type == 'code') {
            return new Ox.Input({
                autovalidate: autovalidateCode,
                id: 'code',
                label: 'Code',
                labelWidth: 120,
                validate: function(value, callback) {
                    callback({
                        message: 'Missing code',
                        valid: !!value.length
                    });
                },
                width: 352
            });
        } else if (type == 'email') {
            return new Ox.Input({
                autovalidate: autovalidateEmail,
                id: 'email',
                label: 'E-Mail Address',
                labelWidth: 120,
                type: 'email',
                validate: pandora.validateUser('email'),
                width: 352
            });
        } else if (type == 'newPassword') {
            return new Ox.Input({
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
                width: 352
            });
        } else if (type == 'newUsername') {
            return new Ox.Input({
                autovalidate: pandora.autovalidateUsername,
                id: 'username',
                label: 'Username',
                labelWidth: 120,
                validate: pandora.validateUser('username'),
                width: 352
            });
        } else if (type == 'oldUsername') {
            return new Ox.Input({
                disabled: true,
                id: 'username',
                label: 'Username',
                labelWidth: 120,
                value: value,
                width: 352
            });
        } else if (type == 'password') {
            return new Ox.Input({
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
                width: 352
            });
        } else if (type == 'username') {
            return new Ox.Input({
                autovalidate: pandora.autovalidateUsername,
                id: 'username',
                label: 'Username',
                labelWidth: 120,
                validate: pandora.validateUser('username', true),
                width: 352
            });    
        } else if (type == 'usernameOrEmail') {
            return new Ox.FormElementGroup({
                id: 'usernameOrEmail',
                elements: [
                    app.$ui.usernameOrEmailSelect = new Ox.Select({
                            id: 'usernameOrEmailSelect',
                            items: [
                                {id: 'username', title: 'Username'},
                                {id: 'email', title: 'E-Mail Address'},
                            ],
                            overlap: 'right',
                            width: 120
                        })
                        .bindEvent({
                            change: function(event, data) {
                                var selected = data.selected[0].id;
                                app.$ui.usernameOrEmailInput.options({
                                    autovalidate: selected == 'username' ? pandora.autovalidateUsername : autovalidateEmail,
                                    validate: validateUser(selected, true),
                                    value: ''
                                }).focus();
                            }
                        }),
                    app.$ui.usernameOrEmailInput = new Ox.Input({
                        autovalidate: pandora.autovalidateUsername,
                        id: 'usernameOrEmailInput',
                        validate: pandora.validateUser('username', true),
                        width: 232
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

pandora.ui.accountLogoutDialog = function() {
    var that = new Ox.Dialog({
            buttons: [
                new Ox.Button({
                    id: 'cancel',
                    title: 'Cancel'
                }).bindEvent('click', function() {
                    that.close();
                    app.$ui.mainMenu.getItem('loginlogout').toggleTitle();
                }),
                new Ox.Button({
                    id: 'logout',
                    title: 'Logout'
                }).bindEvent('click', function() {
                    that.close();
                    pandora.api.signout({}, function(result) {
                        pandora.logout(result.data);
                    });
                })
            ],
            content: new Ox.Element().html('Are you sure you want to logout?'),
            height: 160,
            keys: {enter: 'logout', escape: 'cancel'},
            title: 'Logout',
            width: 300
        });
    return that;
}; 
pandora.ui.accountWelcomeDialog = function() {
    var that = new Ox.Dialog({
            buttons: [
                [
                    new Ox.Button({
                        id: 'preferences',
                        title: 'Preferences...'
                    }).bindEvent('click', function() {
                        that.close();
                    })
                ],
                [
                    new Ox.Button({
                        id: 'close',
                        title: 'Close'
                    }).bindEvent('click', function() {
                        that.close();
                    })
                ]
            ],
            content: new Ox.Element().html('Welcome, ' + app.user.username + '!<br/><br/>Your account has been created.'),
            height: 160,
            keys: {enter: 'close', escape: 'close'},
            title: 'Welcome to ' + app.config.site.name,
            width: 300
        });
    return that;
};

