pandora.ui.preferencesDialog = function() {

    var tabs = [
        {id: 'account', title: 'Account', selected: true},
        {id: 'settings', title: 'Settings'}
    ];
    var $tabPanel = Ox.TabPanel({
            content: function(id) {
                var $content = Ox.Element()
                    .css({overflowY: 'auto'})
                    .append(
                        $('<img>')
                            .attr({src: '/static/png/icon64.png'})
                            .css({position: 'absolute', left: '16px', top: '16px'})
                    );
                if (id == 'account') {
                    $content.append(
                        Ox.Form({
                            items: [
                                Ox.Input({
                                    disabled: true,
                                    id: 'username',
                                    label: 'Username',
                                    labelWidth: 120,
                                    value: pandora.user.username,
                                    width: 320
                                }),
                                Ox.Input({
                                        autovalidate: /.+/,
                                        id: 'password',
                                        label: 'New Password',
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
                                        label: 'E-Mail Address',
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
                                    label: 'Level',
                                    labelWidth: 120,
                                    value: Ox.toTitleCase(pandora.user.level),
                                    width: 320
                                })
                            ]
                        })
                        .css({position: 'absolute', left: '96px', top: '16px'})
                        .bindEvent({
                            change: function(data) {
                                return;
                                var preferences = {};
                                preferences[data.id] = data.data.value;
                                pandora.api.editPreferences(preferences, function(result) {
                                    if (data.id == 'email') {
                                        pandora.user.email = data.data.value;
                                    }
                                });
                            }
                        })
                    );
                } else {
                    $content.append(
                        Ox.Button({
                            title: 'Reset UI Settings',
                            width: 150
                        })
                        .bindEvent({
                            click: function() {
                                pandora.UI.reset();
                                pandora.$ui.appPanel.reload();
                            }
                        })
                        .css({position: 'absolute', left: '96px', top: '16px'})
                    );
                    /*
                    content.append(Ox.FormElementGroup({
                        elements: [
                            Ox.Checkbox({
                                checked: true ,
                                id: 'showEpisodes',
                                title: 'Show Episodes',
                                width: 320
                            }),
                            Ox.Checkbox({
                                checked: true ,
                                id: 'newsletter',
                                title: 'Receive Newsletter',
                                width: 320
                            })
                            ]
                    }));
                    */
                }
                return $content;
            },
            tabs: tabs
        });
    var $dialog = Ox.Dialog({
        buttons: [
            Ox.Button({
                id: 'done',
                title: 'Done'
            }).bindEvent({
                click: function() {
                    $dialog.close();
                    pandora.URL.update();
                }
            })
        ],
        //closeButton: true,
        content: $tabPanel,
        height: 192,
        //maximizeButton: true,
        minHeight: 192,
        minWidth: 432,
        title: 'Preferences',
        width: 432
    });

    return $dialog;

};
