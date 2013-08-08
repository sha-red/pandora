'use strict';

pandora.ui.makeListPrivateDialog = function(name, subscribers, callback) {

    var that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    id: 'keep',
                    title: Ox._('Keep List Public')
                }).bindEvent({
                    click: function() {
                        that.close();
                        callback(false);
                    }
                }),
                Ox.Button({
                    id: 'make',
                    title: Ox._('Make List Private')
                }).bindEvent({
                    click: function() {
                        that.close();
                        callback(true);
                    }
                })
            ],
            content: Ox._('Are you sure you want to make the list "{0}" private and lose its {1}?',
                [name, subscribers == 1 ? Ox._('subscriber') : Ox._('{0} subscribers', [subscribers])]),
            keys: {enter: 'make', escape: 'keep'},
            title: Ox._('Make List Private')
        });

    return that;

};
