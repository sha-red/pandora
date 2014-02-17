// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.filterForm = function(options) {
    // mode can be find, list, embed
    var list = options.list,
        mode = options.mode,
        that = Ox.Element();
    pandora.api.findLists({
        query: {
            conditions: [{key: 'type', value: 'static', operator: '='}],
            operator: '&'
        },
        keys: ['id'],
        range: [0, 1000],
        sort: [{key: 'user', operator: '+'}, {key: 'name', operator: '+'}]
    }, function(result) {
        that.append(
            that.$filter = Ox.Filter({
                findKeys: pandora.site.itemKeys.map(function(itemKey) {
                    var key = Ox.clone(itemKey, true);
                    key.title = Ox._(key.title);
                    key.type = key.type == 'layer'
                        ? Ox.getObjectById(pandora.site.layers, key.id).type
                        : key.type;
                    if (key.format && key.format.type == 'ColorPercent') {
                        key.format.type = 'percent';
                    }
                    return key;
                }).concat([{
                    id: 'list',
                    title: Ox._('List'),
                    type: 'list',
                    values: result.data.items.map(function(item) {
                        return item.id;
                    })
                }]),
                list: mode == 'find' ? {
                    sort: pandora.user.ui.listSort,
                    view: pandora.user.ui.listView
                } : null,
                sortKeys: pandora.site.sortKeys,
                value: Ox.clone(mode == 'list' ? list.query : pandora.user.ui.find, true),
                viewKeys: pandora.site.listViews
            })
            .css(mode == 'embed' ? {} : {padding: '16px'})
            .bindEvent({
                change: function(data) {
                    if (mode == 'find') {
                        if (pandora.user.ui.updateAdvancedFindResults) {
                            that.updateResults();
                        }
                    } else if (mode == 'list') {
                        pandora.api.editList({
                            id: list.id,
                            query: data.value
                        }, function(result) {
                            if (pandora.user.ui.updateAdvancedFindResults) {
                                that.updateResults();
                            }
                        });
                    }
                    that.triggerEvent('change', data);
                }
            })
        );
        that.getList = that.$filter.getList;
    });
    that.updateResults = function() {
        if (mode == 'list') {
            Ox.Request.clearCache(list.id);
            if (pandora.user.ui.section == 'edits') {
                pandora.$ui.folderList[
                    pandora.getListData().folder
                ].value(list.id, 'query', that.$filter.options('value'));
                pandora.api.editEdit({
                    id: list.id,
                    query: that.$filter.options('value')
                }, function(result) {
                    pandora.$ui.editPanel.updatePanel();
                });
            } else {
                pandora.$ui.list && pandora.$ui.list.bindEventOnce({
                    init: function(data) {
                        pandora.$ui.folderList[
                            pandora.getListData().folder
                        ].value(list.id, 'query', that.$filter.options('value'));
                    }
                })
                .reloadList();
                pandora.$ui.filters && pandora.$ui.filters.forEach(function($filter) {
                    $filter.reloadList();
                });
            }
        } else {
            pandora.UI.set({find: Ox.clone(that.$filter.options('value'), true)});
            pandora.$ui.findElement.updateElement();
        }
    };
    return that;
};

