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
            content: pandora.$ui.usersElement = Ox.TextList({
                    columns: [
                        {
                            id: 'username',
                            title: 'Name',
                            operator: '+',
                            visible: true,
                            unique: true,
                            width: 256
                        },
                        {
                            id: 'level',
                            operator: '+',
                            visible: true,
                            width: 256
                        }
                    ],
                    items: function(data, callback) {
                        pandora.api.findUsers(data, callback);
                    },
                    keys: [],
                    sort: [
                        {key: 'username', operator: '+'}
                    ]
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

