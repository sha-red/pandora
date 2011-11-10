// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.filterForm = function(list) {
    var that = Ox.Filter({
            findKeys: Ox.merge(Ox.map(pandora.site.itemKeys, function(itemKey) {
                var key = Ox.clone(itemKey);
                key.type = key.type == 'layer'
                    ? Ox.getObjectById(pandora.site.layers, key.id).type
                    : key.type;
                return key;
            }), {
                id: 'list',
                title: 'List',
                type: 'string'
            }),
            list: list ? null : {
                sort: pandora.user.ui.listSort,
                view: pandora.user.ui.listView
            },
            query: Ox.clone(list ? list.query : pandora.user.ui.find, true),
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
                        pandora.$ui.list
                            .bindEventOnce({
                                init: function(data) {
                                    pandora.$ui.folderList[
                                        pandora.getListData().folder
                                    ].value(list.id, 'items', data.items);
                                }
                            })
                            .reloadList();
                        pandora.$ui.filters.forEach(function($filter) {
                            $filter.reloadList();
                        });
                    });
                } else {
                    Ox.Log('FIND', 'change form', data.query, pandora.user.ui.find)
                    pandora.UI.set({find: Ox.clone(data.query, true)});
                }
            }
        });
    return that;
};

