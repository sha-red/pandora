// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.filter = function(list) {
    var that = Ox.Filter({
            findKeys: Ox.merge(Ox.map(pandora.site.itemKeys, function(key) {
                return {
                    autocomplete: key.autocomplete,
                    autocompleteSortKey: key.autocompleteSortKey,
                    format: key.format,
                    id: key.id,
                    title: key.title,
                    type: key.type == 'layer' ? Ox.getObjectById(
                        pandora.site.layers, key.id
                    ).type : key.type
                };
            }), {
                id: 'list',
                title: 'List',
                type: 'list'
            }),
            query: list ? list.query : pandora.user.ui.query,
            sortKeys: pandora.site.sortKeys,
            viewKeys: pandora.site.listViews
        })
        .css({padding: '16px'})
        .bindEvent({
            change: function(data) {
                if (list) {
                    pandora.api.editList({
                        id: list.id,
                        query: data.query
                    }, function(result) {
                        Ox.Request.clearCache(list.id);
                        //Ox.Request.clearCache();
                        pandora.$ui.groups.forEach(function($group) {
                            $group.reloadList();
                        });
                        pandora.$ui.list
                            .bindEventOnce({
                                init: function(data) {
                                    Ox.print('NUMBER OF ITEMS:', data.items);
                                    pandora.$ui.folderList[
                                        pandora.getListData().folder
                                    ].value(list.id, 'items', data.items);
                                }
                            })
                            .reloadList();
                    });
                }
            }
        });
    return that;
};

