// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.folderList = function(id) {
    var i = Ox.getPositionById(pandora.site.sectionFolders[pandora.user.ui.section], id),
        that;
    if (pandora.user.ui.section == 'site') {
        that = Ox.TextList({
            columns: [
                {
                    format: function() {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.PATH + 'png/icon16.png'
                            })
                    },
                    id: 'id',
                    operator: '+',
                    unique: true,
                    visible: true,
                    width: 16
                },
                {
                    id: 'title',
                    operator: '+',
                    visible: true,
                    width: pandora.user.ui.sidebarSize - 16
                }
            ],
            items: function(data, callback) {
                var result = {data: {}};
                if (!data.range) {
                    result.data.items = Ox.getObjectById(pandora.site.sectionFolders.site, id).items.length;
                } else {
                    result.data.items = Ox.getObjectById(pandora.site.sectionFolders.site, id).items;
                }
                callback(result);
            },
            max: 1,
            min: 1,
            sort: [{key: '', operator: ''}]
        })
        .bindEvent({
            select: function(event, data) {
                // fixme: duplicated
                $.each(pandora.$ui.folderList, function(id_, $list) {
                    id != id_ && $list.options('selected', []);
                })
                pandora.URL.set((id == 'admin' ? 'admin/' : '' ) + data.ids[0]);
            },
        });
    } else if (pandora.user.ui.section == 'items') {
        that = Ox.TextList({
            columns: [
                {
                    format: function() {
                        return $('<img>').attr({
                            src: Ox.UI.PATH + 'png/icon16.png'
                        });
                    },
                    id: 'user',
                    operator: '+',
                    visible: true,
                    width: 16
                },
                {
                    format: function(value) {
                        return value.split('/').join(': ');
                    },
                    id: 'id',
                    operator: '+',
                    unique: true,
                    visible: id == 'favorite',
                    width: pandora.user.ui.sidebarWidth - 88
                },
                {
                    editable: function(data) {
                        return data.user == pandora.user.username;
                    },
                    id: 'name',
                    input: {
                        autovalidate: pandora.ui.autovalidateListname
                    },
                    operator: '+',
                    visible: id != 'favorite',
                    width: pandora.user.ui.sidebarWidth - 88
                },
                {
                    align: 'right',
                    id: 'items',
                    operator: '-',
                    visible: true,
                    width: 40
                },
                {
                    clickable: function(data) {
                        return data.type == 'smart';
                    },
                    format: function(value) {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImageURL('symbolFind')
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px 2px 1px 2px',
                                opacity: value == 'static' ? 0.1 : 1
                            });
                    },
                    id: 'type',
                    operator: '+',
                    visible: true,
                    width: 16
                },
                {
                    clickable: id == 'personal',
                    format: function(value) {
                        //var symbols = {private: 'Publish', public: 'Publish', featured: 'Star'};
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImageURL(
                                    'symbol' + (value == 'featured' ? 'Star' : 'Publish')
                                )
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px 2px 1px 2px',
                                opacity: value == 'private' ? 0.1 : 1
                            })
                    },
                    id: 'status',
                    operator: '+',
                    visible: true,
                    width: 16
                }
            ],
            items: function(data, callback) {
                var query;
                if (id == 'personal') {
                    query = {conditions: [
                        {key: 'user', value: pandora.user.username, operator: '='},
                        {key: 'status', value: 'featured', operator: '!'}
                    ], operator: '&'};
                } else if (id == 'favorite') {
                    query = {conditions: [
                        {key: 'subscribed', value: true, operator: '='},
                        {key: 'status', value: 'featured', operator: '!'},
                    ], operator: '&'};
                } else if (id == 'featured') {
                    query = {conditions: [{key: 'status', value: 'featured', operator: '='}], operator: '&'};
                }
                return pandora.api.findLists(Ox.extend(data, {
                    query: query
                }), callback);
            },
            max: 1,
            min: 0,
            pageLength: 1000,
            sort: [
                {key: 'position', operator: '+'}
            ],
            sortable: id == 'personal' || id == 'favorite' || pandora.user.level == 'admin'
        })
        .css({
            left: 0,
            top: 0,
            width: pandora.user.ui.sidebarWidth + 'px',
        })
        .bind({
            dragenter: function(e) {
                //Ox.print('DRAGENTER', e)
            }
        })
        .bindEvent({
            click: function(event, data) {
                var $list = pandora.$ui.folderList[id];
                if (data.key == 'type') {
                    pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
                } else if (data.key == 'status') {
                    pandora.api.editList({
                        id: data.id,
                        status: $list.value(data.id, data.key) == 'private' ? 'public' : 'private'
                    }, function(result) {
                        $list.value(result.data.id, 'status', result.data.status);
                    });
                }
            },
            'delete': function(event, data) {
                var $list = pandora.$ui.folderList[id];
                pandora.URL.set('?find=');
                $list.options({selected: []});
                if (id == 'personal') {
                    pandora.api.removeList({
                        id: data.ids[0]
                    }, function(result) {
                        pandora.UI.set(['lists', data.ids[0]].join('|'), null);
                        Ox.print('SHOULD BE DELETED:', pandora.user.ui.lists)
                        Ox.Request.clearCache(); // fixme: remove
                        $list.reloadList();
                    });
                } else if (id == 'favorite') {
                    pandora.api.unsubscribeFromList({
                        id: data.ids[0]
                    }, function(result) {
                        Ox.Request.clearCache(); // fixme: remove
                        $list.reloadList();
                    });
                } else if (id == 'featured' && pandora.user.level == 'admin') {
                    pandora.api.editList({
                        id: data.ids[0],
                        status: 'public'
                    }, function(result) {
                        // fixme: duplicated
                        if (result.data.user == pandora.user.username || result.data.subscribed) {
                            Ox.Request.clearCache(); // fixme: remove
                            pandora.$ui.folderList[
                                result.data.user == pandora.user.username ? 'personal' : 'favorite'
                            ].reloadList();
                        }
                        $list.reloadList();
                    });
                }
            },
            init: function(event, data) {
                pandora.site.sectionFolders[pandora.user.ui.section][i].items = data.items;
                pandora.$ui.folder[i].$content.css({
                    height: data.items * 16 + 'px'
                });
                pandora.$ui.folderList[id].css({
                    height: data.items * 16 + 'px'
                });
                pandora.resizeFolders();
            },
            move: function(event, data) {
                /*
                data.ids.forEach(function(id, pos) {
                    pandora.user.ui.lists[id].position = pos;
                });
                */
                pandora.api.sortLists({
                    section: id,
                    ids: data.ids
                });
            },
            paste: function(event, data) {
                pandora.$ui.list.triggerEvent('paste', data);
            },
            select: function(event, data) {
                if (data.ids.length) {
                    $.each(pandora.$ui.folderList, function(id_, $list) {
                        id != id_ && $list.options('selected', []);
                    })
                    pandora.URL.set('?find=list:' + data.ids[0]);
                } else {
                    pandora.URL.set('?find=');
                }
            },
            submit: function(event, data) {
                data_ = {id: data.id};
                data_[data.key] = data.value;
                pandora.api.editList(data_, function(result) {
                    if (result.data.id != data.id) {
                        pandora.$ui.folderList[id].value(data.id, 'name', result.data.name);
                        pandora.$ui.folderList[id].value(data.id, 'id', result.data.id);
                        pandora.URL.set('?find=list:' + result.data.id);
                    }
                });
            }
        });
    }
    return that;
};
