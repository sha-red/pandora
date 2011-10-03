// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.usersDialog = function() {
    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = Math.round(window.innerWidth * 0.9),
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'done',
                    title: 'Done'
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: Ox.SplitPanel({
                elements: [
                    {
                        element: Ox.SplitPanel({
                            elements: [
                                {
                                    element: Ox.Bar({size: 24})
                                        .append(
                                            Ox.Button({
                                                    title: 'Export E-Mail Addresses'
                                                })
                                                .css({margin: '4px'})
                                        )
                                        .append(
                                            Ox.Input({
                                                    clear: true,
                                                    placeholder: 'Find',
                                                    width: 192
                                                })
                                                .css({float: 'right', margin: '4px'})
                                                .bindEvent({
                                                    submit: function(data) {
                                                        
                                                    }
                                                })
                                        ),
                                    size: 24
                                },
                                {
                                    element: Ox.TextList({
                                        columns: [
                                            {
                                                id: 'username',
                                                title: 'Username',
                                                operator: '+',
                                                visible: true,
                                                unique: true,
                                                width: 120
                                            },
                                            {
                                                id: 'email',
                                                title: 'E-Mail Address',
                                                operator: '+',
                                                visible: true,
                                                width: 180
                                            },
                                            {
                                                id: 'level',
                                                title: 'Level',
                                                format: function(value) {
                                                    return Ox.toTitleCase(value);
                                                },
                                                operator: '+',
                                                visible: true,
                                                width: 60
                                            },
                                            {
                                                id: 'numberoflists',
                                                title: 'Lists',
                                                align: 'right',
                                                operator: '-',
                                                visible: true,
                                                width: 60
                                            },
                                            {
                                                id: 'timesseen',
                                                title: 'Times Seen',
                                                align: 'right',
                                                operator: '-',
                                                visible: true,
                                                width: 90
                                            },
                                            {
                                                id: 'firstseen',
                                                title: 'First Seen',
                                                align: 'right',
                                                operator: '-',
                                                visible: true,
                                                width: 150
                                            },
                                            {
                                                id: 'lastseen',
                                                title: 'Last Seen',
                                                align: 'right',
                                                operator: '-',
                                                visible: true,
                                                width: 150
                                            },
                                            {
                                                id: 'ip',
                                                title: 'IP Address',
                                                align: 'right',
                                                operator: '-',
                                                visible: true,
                                                width: 120
                                            },
                                            {
                                                id: 'screensize',
                                                title: 'Screen Size',
                                                align: 'right',
                                                operator: '-',
                                                visible: true,
                                                width: 90
                                            },
                                            {
                                                id: 'windowsize',
                                                title: 'Window Size',
                                                align: 'right',
                                                operator: '-',
                                                visible: true,
                                                width: 90
                                            },
                                            {
                                                id: 'useragent',
                                                title: 'User Agent',
                                                operator: '-',
                                                visible: true,
                                                width: 720
                                            }
                                        ],
                                        columnsVisible: true,
                                        items: function(data, callback) {
                                            // pandora.api.findUsers(data, callback);
                                            pandora.api.findUsers(data, function(result) {
                                                if (Ox.isArray(result.data.items)) {
                                                    result.data.items = result.data.items.map(function(item) {
                                                        return Ox.extend({
                                                            firstseen: '2011-10-01 15:05:25',
                                                            lastseen: '2011-10-03 05:53:06',
                                                            ip: '91.22.155.104',
                                                            screensize: '1280 x 800',
                                                            windowsize: '1024 x 720',
                                                            useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_1) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.186 Safari/535.1'
                                                        }, item);
                                                    });
                                                }
                                                callback(result);
                                            });
                                        },
                                        keys: [],
                                        scrollbarVisible: true,
                                        sort: [
                                            {key: 'username', operator: '+'}
                                        ]
                                    })
                                }
                            ],
                            orientation: 'vertical'
                        })      
                    },
                    {
                        element: Ox.SplitPanel({
                            elements: [
                                {
                                    element: Ox.Bar({size: 24})
                                        .append(
                                            Ox.Label({
                                                textAlign: 'center',
                                                title: 'No user selected',
                                                width: 248
                                            })
                                            .css({margin: '4px'})
                                        ),
                                    size: 24
                                },
                                {
                                    element: Ox.Element()
                                }
                            ],
                            orientation: 'vertical'
                        }),
                        size: 256
                    }
                ],
                orientation: 'horizontal'
            }),
            height: height,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            padding: 0,
            title: 'Manage Users',
            width: width
        });
    return that;
};

