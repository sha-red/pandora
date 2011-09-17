// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.folderList = function(id) {
    var i = Ox.getPositionById(pandora.site.sectionFolders[pandora.user.ui.section], id),
        that;
    if (pandora.user.ui.section == 'items') {
        var columns, items;
        if (id != 'volumes') {
            columns = [
                {
                    format: function() {
                        return $('<img>').attr({
                                src: Ox.UI.getImageURL('symbolIcon')
                            }).css({
                                width: '10px',
                                height: '10px',
                                padding: '3px'
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
                    // fixme: user and name are set to the same width here,
                    // but resizeFolders will set them to different widths
                    width: pandora.user.ui.sidebarWidth - 96
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
                    tooltip: id == 'personal' ? 'Edit Title' : '',
                    visible: id != 'favorite',
                    width: pandora.user.ui.sidebarWidth - 96
                },
                {
                    align: 'right',
                    id: 'items',
                    format: {type: 'number'},
                    operator: '-',
                    visible: true,
                    width: 48
                },
                {
                    clickable: function(data) {
                        return data.type == 'smart' || data.user == pandora.user.username;
                    },
                    format: function(value, data) {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImageURL(value == 'static' ? 'symbolClick' : 'symbolFind')
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px',
                                opacity: data.user == pandora.user.username ? 1 : 0.25
                            });
                    },
                    id: 'type',
                    operator: '+',
                    tooltip: function(data) {
                        return data.type == 'smart'
                            ? (data.user == pandora.user.username ? 'Edit Query' : 'Show Query')
                            : (data.user == pandora.user.username ? 'Edit Default View' : 'Default View: ...');
                    },
                    visible: true,
                    width: 16
                },
                {
                    clickable: id == 'personal',
                    format: function(value) {
                        var symbols = {personal: 'Publish', favorite: 'Like', featured: 'Star'};
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImageURL(
                                    'symbol' + symbols[id]
                                )
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px',
                                opacity: value == 'private' ? 0.25 : 1
                            })
                    },
                    id: 'status',
                    operator: '+',
                    tooltip: id == 'personal' ? function(data) {
                        return data.status == 'private' ? 'Make Public' : 'Make Private';
                    } : null,
                    visible: true,
                    width: 16
                }
            ];
            items = function(data, callback) {
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
            };
        } else {
            columns = [
                {
                    format: function() {
                        return $('<img>').attr({
                                src: Ox.UI.getImageURL('symbolVolume')
                            }).css({
                                width: '10px',
                                height: '10px',
                                padding: '3px'
                            });
                    },
                    id: 'user',
                    operator: '+',
                    visible: true,
                    width: 16
                },
                {
                    editable: true,
                    id: 'name',
                    operator: '+',
                    tooltip: 'Edit Title',
                    unique: true,
                    visible: true,
                    width: pandora.user.ui.sidebarWidth - 96
                },
                {
                    align: 'right',
                    id: 'items',
                    format: {type: 'number'},
                    operator: '-',
                    visible: true,
                    width: 48
                },
                {
                    clickable: function(data) {
                        return data.mounted;
                    },
                    format: function(value, data) {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImageURL(data.mounted ? 'symbolSync' : 'symbolEdit')
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px'
                            });
                    },
                    id: 'path',
                    operator: '+',
                    tooltip: function(data) {
                        return data.mounted ? 'Scan Volume' : 'Edit Path';
                    },
                    visible: true,
                    width: 16
                },
                {
                    clickable: true,
                    format: function(value, data) {
                        return $('<img>')
                            .attr({
                                src: Ox.UI.getImageURL('symbolMount')
                            })
                            .css({
                                width: '10px',
                                height: '10px',
                                padding: '3px 2px 1px 2px',
                                opacity: data.mounted ? 1 : 0.25
                            });
                    },
                    id: 'mounted',
                    operator: '+',
                    tooltip: function(data) {
                        return data.mounted ? 'Unmount Volume' : 'Mount Volume';
                    },
                    visible: true,
                    width: 16
                }
            ];
            items = function(data, callback) {
                var volumes = pandora.user.volumes || [
                    {"name": "Movies A-M", "path": "/Volumes/Movies A-M", "items": 1234},
                    {"name": "Movies N-Z", "path": "/Volumes/Movies N-Z", "items": 987}
                ];
                if (!data.keys) {
                    data = {items: volumes.length};
                } else {
                    data = {items: volumes.map(function(volume) {
                        return Ox.extend({id: volume.name, user: pandora.user.username, mounted: volume.name == 'Movies A-M'}, volume);
                    })};
                }
                // fixme: ridiculous (we're binding to init too late)
                setTimeout(function() {
                    callback({data: data});
                }, 1000);
            };
        }
        that = Ox.TextList({
            columns: columns,
            items: items,
            max: 1,
            min: 0,
            pageLength: 1000,
            selected: pandora.getListData().folder == id ? [pandora.user.ui.list] : [],
            sort: [{key: 'position', operator: '+'}],            
            sortable: id != 'featured' || pandora.user.level == 'admin'
        })
        .css({
            left: 0,
            top: 0,
            width: pandora.user.ui.sidebarWidth + 'px',
        })
        .bindEvent({
            add: function(event) {
                // fixme: this is duplicated,
                // see folder collapse panel menu handler
                var i = ['personal', 'favorite', 'featured'].indexOf(id);
                if (id == 'personal') {
                    if (event.keys == '' || event.keys == 'alt') {
                        pandora.api.addList({
                            name: 'Untitled',
                            status: 'private',
                            type: event.keys == '' ? 'static' : 'smart'
                        }, function(result) {
                            var id = result.data.id;
                            pandora.UI.set(['lists', id].join('|'), pandora.site.user.ui.lists['']); // fixme: necessary?
                            pandora.URL.set('?find=list:' + id)
                            Ox.Request.clearCache(); // fixme: remove
                            that.reloadList().bindEventOnce({
                                load: function(data) {
                                    that.gainFocus()
                                        .options({selected: [id]})
                                        .editCell(id, 'name');
                                }
                            });
                        });
                    }
                } else if (id == 'favorite' || (id == 'featured' && pandora.user.level == 'admin')) {
                    // this makes the button trigger a change event,
                    // which is already being handled in folders.js
                    pandora.$ui.manageListsButton[id].options({selected: true});
                    /*
                    if (!pandora.site.sectionFolders.items[i].showBrowser) {
                        pandora.site.sectionFolders.items[i].showBrowser = true;
                        pandora.$ui.manageListsButton[id].options({selected: true});
                        pandora.$ui.folderList[id].replaceWith(
                            pandora.$ui.folderBrowser[id] = pandora.ui.folderBrowser(id)
                        );
                    }
                    */
                }
            },
            click: function(data) {
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
                } else if (data.key == 'path') {
                    
                } else if (data.key == 'mounted') {
                    alert(JSON.stringify(data));
                }
            },
            'delete': function(data) {
                // fixme: add a confirmation dialog
                var $list = pandora.$ui.folderList[id];
                pandora.URL.set('?find=');
                $list.options({selected: []});
                if (id == 'personal') {
                    pandora.api.removeList({
                        id: data.ids[0]
                    }, function(result) {
                        pandora.UI.set(['lists', data.ids[0]].join('|'), null);
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
            init: function(data) {
                pandora.site.sectionFolders[pandora.user.ui.section][i].items = data.items;
                pandora.$ui.folder[i].$content.css({
                    height: data.items * 16 + 'px'
                });
                pandora.$ui.folderList[id].css({
                    height: data.items * 16 + 'px'
                });
                pandora.resizeFolders();
            },
            move: function(data) {
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
            paste: function(data) {
                pandora.$ui.list.triggerEvent('paste', data);
            },
            select: function(data) {
                if (data.ids.length) {
                    Ox.forEach(pandora.$ui.folderList, function($list, id_) {
                        id != id_ && $list.options('selected', []);
                    });
                    pandora.URL.set('?find=' + (id == 'volumes' ? 'volume' : 'list') + ':' + data.ids[0]);
                } else {
                    pandora.UI.set({list: ''});
                    pandora.URL.set('');
                }
            },
            submit: function(data) {
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
