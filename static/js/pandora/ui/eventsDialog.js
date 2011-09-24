// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.eventsDialog = function() {
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
            content: pandora.$ui.eventsElement = Ox.TextList({
                    columns: [
                        {
                            id: 'id',
                            title: 'ID',
                            operator: '+',
                            unique: true,
                            visible: false,
                            width: 16 
                        },
                        {
                            id: 'name',
                            title: 'Name',
                            operator: '+',
                            visible: true,
                            width: 256
                        },
                        {
                            id: 'start',
                            operator: '+',
                            visible: true,
                            width: 256
                        },
                        {
                            id: 'end',
                            operator: '+',
                            visible: true,
                            width: 256
                        }
                    ],
                    items: function(data, callback) {
                        pandora.api.findEvents(data, callback);
                    },
                    keys: ['name', 'start', 'end'],
                    sort: [
                        {key: 'name', operator: '+'}
                    ]
                }),
            height: height,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            padding: 0,
            title: 'Manage Events',
            width: width
        });
    return that;
};

