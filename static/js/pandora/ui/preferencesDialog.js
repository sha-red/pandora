pandora.ui.preferencesDialog = function() {

    var tabs = [
        {id: 'account', title: 'Account', selected: true},
        {id: 'settings', title: 'Settings'}
    ];
    var $tabPanel = Ox.TabPanel({
            content: function(id) {
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
                            element: Ox.Element()
                                .css({padding: '16px', overflowY: 'auto'})
                                .html(Ox.repeat(Ox.getObjectById(tabs, id).title + ' ', 200))
                        }
                    ],
                    orientation: 'horizontal'
                });
            },
            tabs: tabs
        })
        .bindEvent({
            change: function(data) {
                $dialog.options({
                    title: Ox.getObjectById(tabs, data.selected).title
                });
            }
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
        height: Math.round((window.innerHeight - 24) * 0.75),
        //maximizeButton: true,
        minHeight: 256,
        minWidth: 640,
        title: 'Preferences',
        width: Math.round(window.innerWidth * 0.75),
    });

    return $dialog;
  
};