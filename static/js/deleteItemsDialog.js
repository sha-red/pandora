// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.deleteItemsDialog = function(options) {
    options = Ox.extend({
        items: []
    }, options || {});

    var that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    id: 'keep',
                    title: Ox._('Keep {0}', [Ox._(pandora.site.itemName[options.items.length == 1 ? 'singular':'plural'])])
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    id: 'delete',
                    title: Ox._('Delete {0}', [Ox._(pandora.site.itemName[options.items.length == 1 ? 'singular':'plural'])])
                }).bindEvent({
                    click: function() {
                        that.close();
                        Ox.serialForEach(options.items, function(item, index, items, callback) {
                            pandora.api.remove({
                                id: item.id
                            }, function(result) {
                                callback();
                            });
                        }, function() {
                            Ox.Request.clearCache();
                            if (pandora.user.ui.item) {
                                pandora.UI.set({item: ''});
                            } else {
                                pandora.UI.set({listSelection: []});
                                pandora.reloadList();
                            }
                        });
                    }
                })
            ],
            content: options.items.length == 1 ? Ox._('Are you sure you want to delete the {0} "{1}"?'
                    + '<br><br>All data will be removed.',
                    [Ox._(pandora.site.itemName.singular), options.items[0].title])
                : Ox._('Are you sure you want to delete {0} {1}?'
                        + '<br><br>All data will be removed.',
                        [options.items.length, Ox._(pandora.site.itemName.plural)]),
            keys: {enter: 'delete', escape: 'keep'},
            title: Ox._('Delete {0}', [Ox._(pandora.site.itemName[options.items.length == 1 ? 'singular':'plural'])])
        });

    return that;

};
