'use strict';

pandora.ui.preferencesDialog = function() {

    var tabs = [
            {id: 'account', title: Ox._('Account')},
            {id: 'appearance', title: Ox._('Appearance')},
            {id: 'advanced', title: Ox._('Advanced')}
        ];
    Ox.getObjectById(tabs, pandora.user.ui.part.preferences || 'account').selected = true;
    var $tabPanel = Ox.TabPanel({
            content: function(id) {
                var $content = Ox.Element()
                    .css({overflowY: 'auto'})
                    .append(
                        $('<img>')
                            .attr({src: '/static/png/icon.png'})
                            .css({
                                position: 'absolute',
                                left: '16px',
                                top: '16px',
                                width: '64px',
                                height: '64px'
                            })
                    );
                if (id == 'account') {
                    $content.append(
                        Ox.Form({
                            items: [
                                Ox.Input({
                                    disabled: true,
                                    id: 'username',
                                    label: Ox._('Username'),
                                    labelWidth: 120,
                                    value: pandora.user.username,
                                    width: 320
                                }),
                                Ox.Input({
                                        autovalidate: /.+/,
                                        id: 'password',
                                        label: Ox._('New Password'),
                                        labelWidth: 120,
                                        type: 'password',
                                        validate: pandora.validateNewPassword,
                                        width: 320
                                    })
                                    .bindEvent({
                                        validate: function(data) {
                                            data.valid && pandora.api.editPreferences({password: data.value});
                                        }
                                    }),
                                Ox.Input({
                                        autovalidate: pandora.autovalidateEmail,
                                        id: 'email',
                                        label: Ox._('E-Mail Address'),
                                        labelWidth: 120,
                                        validate: pandora.validateNewEmail,
                                        value: pandora.user.email,
                                        width: 320
                                    })
                                    .bindEvent({
                                        validate: function(data) {
                                            if (data.valid && data.value != pandora.user.email) {
                                                pandora.user.email = data.value;
                                                pandora.api.editPreferences({email: data.value});
                                            }
                                        }
                                    }),
                                Ox.Input({
                                    disabled: true,
                                    id: 'level',
                                    label: Ox._('Level'),
                                    labelWidth: 120,
                                    value: Ox.toTitleCase(pandora.user.level),
                                    width: 320
                                }),
                                Ox.Checkbox({
                                        id: 'newsletter',
                                        label: Ox._('Newsletter'),
                                        labelWidth: 120,
                                        title: pandora.user.newsletter ? Ox._('Subscribed') : Ox._('Unsubscribed'),
                                        value: pandora.user.newsletter,
                                        width: 320
                                    })
                                    .bindEvent({
                                        change: function(data) {
                                            pandora.user.newsletter = data.value;
                                            this.options({
                                                title: pandora.user.newsletter ? Ox._('Subscribed') : Ox._('Unsubscribed')
                                            });
                                            pandora.api.editPreferences({
                                                newsletter: pandora.user.newsletter 
                                            });
                                        }
                                    })
                                
                            ]
                        })
                        .css({position: 'absolute', left: '96px', top: '16px'})
                    );
                } else if (id == 'appearance') {
                    $content.append(
                        Ox.Form({
                            items: [
                                Ox.Select({
                                        id: 'theme',
                                        items: pandora.site.themes.map(function(theme) {
                                            return {id: theme, title: Ox.Theme.getThemeData(theme).themeName}
                                        }),
                                        label: Ox._('Theme'),
                                        labelWidth: 120,
                                        value: pandora.user.ui.theme,
                                        width: 320
                                    })
                                    .bindEvent({
                                        change: function(data) {
                                            pandora.UI.set({theme: data.value});
                                            pandora.setTheme(data.value);
                                        }
                                    }),
                                Ox.Select({
                                        disabled: pandora.user.level != 'admin',
                                        id: 'locale',
                                        items: Object.keys(Ox.LOCALE_NAMES).map(function(locale) {
                                            return {id: locale, title: Ox.LOCALE_NAMES[locale]}
                                        }),
                                        label: Ox._('Language'),
                                        labelWidth: 120,
                                        value: pandora.user.ui.locale,
                                        width: 320
                                    })
                                    .bindEvent({
                                        change: function(data) {
                                            pandora.UI.set({locale: data.value});
                                            pandora.setLocale(data.value, function() {
                                                $dialog.remove();
                                                pandora.$ui.appPanel.reload();
                                            });
                                        }
                                    })
                            ]
                        })
                        .css({position: 'absolute', left: '96px', top: '16px'})
                    );
                } else if (id == 'advanced') {
                    $content.append(
                        Ox.Button({
                            title: Ox._('Reset UI Settings...'),
                            width: 160
                        })
                        .bindEvent({
                            click: function() {
                                pandora.$ui.resetUIDialog = pandora.ui.resetUIDialog().open();
                            }
                        })
                        .css({position: 'absolute', left: '96px', top: '16px'})
                    ).append(
                        Ox.Button({
                            title: Ox._('Run Script on Load...'),
                            width: 160
                        })
                        .bindEvent({
                            click: function() {
                                pandora.$ui.onloadDialog = pandora.ui.onloadDialog().open();
                            }
                        })
                        .css({position: 'absolute', left: '96px', top: '40px'})
                    );
                }
                return $content;
            },
            tabs: tabs
        })
        .bindEvent({
            change: function(data) {
                pandora.UI.set({'part.preferences': data.selected});
            }
        }),

        $dialog = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'signout',
                    title: Ox._('Sign Out...')
                }).bindEvent({
                    click: function() {
                        pandora.UI.set({page: 'signout'});
                    }
                }),
                {},
                Ox.Button({
                    id: 'done',
                    title: Ox._('Done')
                }).bindEvent({
                    click: function() {
                        $dialog.close();
                    }
                })
            ],
            closeButton: true,
            content: $tabPanel,
            height: 192,
            minHeight: 192,
            minWidth: 432,
            title: Ox._('Preferences'),
            width: 432
        })
        .bindEvent({
            close: function() {
                pandora.user.ui.page == 'preferences' && pandora.UI.set({page: ''});
            },
            'pandora_part.preferences': function(data) {
                if (pandora.user.ui.page == 'preferences') {
                    $tabPanel.select(data.value == '' ? 'account' : data.value);
                }
            }
        });

    return $dialog;

};
