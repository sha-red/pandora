// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.filterDialog = function(list) {
    var that = Ox.Dialog({
        buttons: [
            Ox.Button({
                    id: 'done',
                    title: 'Done'
                })
                .bindEvent({
                    click: function() {
                        var list = pandora.$ui.filterForm.$filter.getList();
                        that.close();
                        if (list.save) {
                            pandora.api.addList({
                                name: list.name,
                                query: list.query,
                                status: 'private',
                                type: 'smart'
                            }, function(result) {
                                var $list = pandora.$ui.folderList.personal,
                                    id = result.data.id;
                                pandora.UI.set({
                                    find: {
                                        conditions: [{key: 'list', value: id, operator: '=='}],
                                        operator: '&'
                                    }
                                });
                                Ox.Request.clearCache(); // fixme: remove
                                $list.reloadList().bindEventOnce({
                                    load: function(data) {
                                        $list.gainFocus()
                                            .options({selected: [id]});
                                    }
                                });
                            });
                        }
                    }
                })
        ],
        content: pandora.$ui.filterForm = pandora.ui.filterForm(list),
        maxWidth: 648 + Ox.UI.SCROLLBAR_SIZE,
        minHeight: 264,
        minWidth: 648 + Ox.UI.SCROLLBAR_SIZE,
        height: 264,
        // keys: {enter: 'save', escape: 'cancel'},
        removeOnClose: true,
        title: list ? 'Smart List - ' + list.name : 'Advanced Find',
        width: 648 + Ox.UI.SCROLLBAR_SIZE
    });
    return that;
};

