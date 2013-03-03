'use strict';

pandora.ui.makeListPrivateDialog = function(name, subscribers, callback) {

    var that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    id: 'keep',
                    title: 'Keep List Public'
                }).bindEvent({
                    click: function() {
                        that.close();
                        callback(false);
                    }
                }),
                Ox.Button({
                    id: 'make',
                    title: 'Make List Private'
                }).bindEvent({
                    click: function() {
                        that.close();
                        callback(true);
                    }
                })
            ],
            keys: {enter: 'make', escape: 'keep'},
            text: 'Are you sure you want to make the list "'
                + name + '" private and lose its '
                + (subscribers == 1 ? 'subscriber' : subscribers + ' subscribers')
                + '?',
            title: 'Make List Private'
        });

    return that;

};