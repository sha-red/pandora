// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.deleteListDialog = function() {

    var listData = pandora.getListData(),
        $folderList = pandora.$ui.folderList[listData.folder],
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'cancel',
                    title: 'Cancel'
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    id: 'delete',
                    title: 'Delete'
                }).bindEvent({
                    click: function() {
                        that.close();
                        pandora.api.removeList({
                            id: listData.id
                        }, function(result) {
                            Ox.Request.clearCache('findLists');
                            Ox.Request.clearCache(listData.id);
                            $folderList
                                .options({selected: []})
                                .bindEventOnce({
                                    load: function() {
                                        pandora.UI.set('lists.' + listData.id, null);
                                        pandora.UI.set({
                                            find: pandora.site.user.ui.find
                                        });
                                    }
                                })
                                .reloadList();
                        });
                    }
                })
            ],
            content: $('<div>')
                .css({margin: '16px'})
                .html('Do you want to delete the list "' + listData.id + '"?'),
            height: 128,
            keys: {enter: 'delete', escape: 'cancel'},
            title: 'Delete List',
            width: 304
        });

    return that;

}