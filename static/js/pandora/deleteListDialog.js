// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.deleteListDialog = function(list) {

    var listData = pandora.getListData(list),
        $folderList = pandora.$ui.folderList[listData.folder],
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'keep',
                    title: 'Keep List'
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    id: 'delete',
                    title: 'Delete List'
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
            content: Ox.Element()
                .append(
                    $('<img>')
                        .attr({src: '/static/png/icon64.png'})
                        .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
                )
                .append(
                    $('<div>')
                        .css({position: 'absolute', left: '96px', top: '16px', width: '192px'})
                        .html('Are you sure you want to delete the list "' + listData.name + '"?')
                ),
            height: 128,
            keys: {enter: 'delete', escape: 'keep'},
            title: 'Delete List',
            width: 304
        });

    return that;

}