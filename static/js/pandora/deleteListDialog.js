// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.deleteListDialog = function(list) {

    var ui = pandora.user.ui,
        folderItems = ui.section == 'items' ? 'Lists' : Ox.toTitleCase(ui.section),
        folderItem = folderItems.slice(0, -1),
        listData = pandora.getListData(list),
        $folderList = pandora.$ui.folderList[listData.folder],

        that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    id: 'keep',
                    title: 'Keep ' + folderItem
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    id: 'delete',
                    title: 'Delete ' + folderItem
                }).bindEvent({
                    click: function() {
                        that.close();
                        pandora.api['remove' + folderItem]({
                            id: listData.id
                        }, function(result) {
                            Ox.Request.clearCache('find' + folderItems);
                            Ox.Request.clearCache(listData.id);
                            $folderList
                                .options({selected: []})
                                .bindEventOnce({
                                    load: function() {
                                        if (ui.section == 'items') {
                                            pandora.UI.set('lists.' + listData.id, null);
                                            pandora.UI.set({
                                                find: pandora.site.user.ui.find
                                            });
                                        } else {
                                            pandora.UI.set(folderItem.toLowerCase(), '');
                                        }
                                    }
                                })
                                .reloadList();
                        });
                    }
                })
            ],
            keys: {enter: 'delete', escape: 'keep'},
            text: 'Are you sure you want to delete the ' + folderItem.toLowerCase() + ' "' + listData.name + '"?',
            title: 'Delete ' + folderItem
        });

    return that;

};
