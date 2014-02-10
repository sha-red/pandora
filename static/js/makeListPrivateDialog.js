// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.makeListPrivateDialog = function(name, subscribers, callback) {

    var ui = pandora.user.ui,
        folderItem = ui.section == 'item' ? 'List' : 'Edit',
        that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    id: 'keep',
                    title: Ox._('Keep {0} Public', [folderItem])
                }).bindEvent({
                    click: function() {
                        that.close();
                        callback(false);
                    }
                }),
                Ox.Button({
                    id: 'make',
                    title: Ox._('Make {0} Private', [folderItem])
                }).bindEvent({
                    click: function() {
                        that.close();
                        callback(true);
                    }
                })
            ],
            content: Ox._('Are you sure you want to make the {0} "{1}" private and lose its {2}?', [
                folderItem.toLowerCase(),
                name,
                subscribers == 1 ? Ox._('subscriber') : Ox._('{0} subscribers', [subscribers])
            ]),
            keys: {enter: 'make', escape: 'keep'},
            title: Ox._('Make {0} Private', [folderItem])
        });

    return that;

};
