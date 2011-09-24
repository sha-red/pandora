pandora.ui.preferencesDialog = function() {

    var tabs = [
        {id: 'account', title: 'Account', selected: true},
        {id: 'settings', title: 'Settings'}
    ];
    var $tabPanel = Ox.TabPanel({
            content: function(id) {
                var content = Ox.Element().css({padding: '16px', overflowY: 'auto'});
                if (id == 'account') {
                    content.append(Ox.FormElementGroup({
                        elements: Ox.values(Ox.map(pandora.user.preferences, function(v, k) { 
                            return Ox.Input({
                                id: k,
                                width: 400,
                                label: Ox.toTitleCase(k),
                                value: v 
                            });
                        }))
                    }));
                } else {
                    content.append(Ox.FormElementGroup({
                        elements: [
                            Ox.Checkbox({
                                checked: true ,
                                id: 'showEpisodes',
                                title: 'Show Episodes',
                                width: 400
                            }),
                            Ox.Checkbox({
                                checked: true ,
                                id: 'newsletter',
                                title: 'Receive Newsletter',
                                width: 400
                            })
                            ]
                    }));
                }
                return Ox.SplitPanel({
                    elements: [
                        {
                            element: Ox.Element()
                                .css({padding: '16px'})
                                .append(
                                    $('<img>')
                                        .attr({src: '/static/png/logo256.png'})
                                        .css({width: '128px'})
                                ),
                            size: 144
                        },
                        {
                            element: content
                        }
                    ],
                    orientation: 'horizontal'
                });
            },
            tabs: tabs
        });
    var $dialog = Ox.Dialog({
        buttons: [
            Ox.Button({
                id: 'close',
                title: 'Close'
            }).bindEvent({
                click: function() {
                    $dialog.close();
                }
            })
        ],
        //closeButton: true,
        content: $tabPanel,
        height: Math.round((window.innerHeight - 24) * 0.5),
        //maximizeButton: true,
        minHeight: 256,
        minWidth: 640,
        title: 'Preferences',
        width: Math.round(window.innerWidth * 0.5),
    });

    return $dialog;
  
};
