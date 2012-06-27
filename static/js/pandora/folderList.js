// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.folderList = function(id) {
    var i = Ox.getIndexById(pandora.site.sectionFolders[pandora.user.ui.section], id),
        canEditFeaturedLists = pandora.site.capabilities.canEditFeaturedLists[pandora.user.level],
        that;
    if (pandora.user.ui.section == 'items') {
        var columns, items;
        if (id != 'volumes') {
            columns = [
                {
                    clickable: function(data) {
                        return data.user == pandora.user.username || (id == 'featured' && canEditFeaturedLists);
                    },
                    format: function(value, data) {
                        return $('<img>').attr({
                                src: '/list/' + data.id + '/icon.jpg'
                            }).css({
                                width: '14px',
                                height: '14px',
                                borderRadius: '4px',
                                margin: '0 0 0 -3px'
                            });
                    },
                    id: 'user',
                    operator: '+',
                    tooltip: function(data) {
                        return data.user == pandora.user.username
                            || (id == 'featured' && canEditFeaturedLists)
                            ? 'Edit Icon'
                            : '';
                    },
                    visible: true,
                    width: 16
                },
                {
                    format: function(value) {
                        return Ox.encodeHTMLEntities(value.split(':').join(': '));
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
                    format: function(value) {
                        return Ox.encodeHTMLEntities(value);
                    },
                    id: 'name',
                    input: {
                        autovalidate: pandora.ui.autovalidateListname
                    },
                    operator: '+',
                    tooltip: id == 'personal' ? 'Edit Title' : '',
                    unformat: function(value) {
                        return Ox.decodeHTMLEntities(value);
                    },
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
                            });
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
                        {key: 'user', value: pandora.user.username, operator: '=='},
                        {key: 'status', value: 'featured', operator: '!='}
                    ], operator: '&'};
                } else if (id == 'favorite') {
                    query = {conditions: [
                        {key: 'subscribed', value: true, operator: '='},
                        {key: 'status', value: 'featured', operator: '!='}
                    ], operator: '&'};
                } else if (id == 'featured') {
                    query = {conditions: [
                        {key: 'status', value: 'featured', operator: '='} // fixme: '==' performs better
                    ], operator: '&'};
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
                var volumes = pandora.user.volumes || [];
                if (!data.keys) {
                    data = {items: volumes.length};
                } else {
                    data = {items: volumes.map(function(volume) {
                        return Ox.extend({id: volume.name, user: pandora.user.username}, volume);
                    })};
                }
                // fixme: ridiculous (we're binding to init too late)
                setTimeout(function() {
                    callback({data: data});
                }, 1000);
            };
        }
        that = Ox.TableList({
            columns: columns,
            items: items,
            keys: ['query'],
            max: 1,
            min: 0,
            pageLength: 1000,
            //selected: pandora.getListData().folder == id ? [pandora.user.ui._list] : [],
            sort: [{key: 'position', operator: '+'}],
            sortable: id != 'featured' || canEditFeaturedLists
        })
        .css({
            left: 0,
            top: 0,
            width: pandora.user.ui.sidebarWidth + 'px'
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
                            pandora.UI.set({
                                find: {
                                    conditions: [{key: 'list', value: id, operator: '=='}],
                                    operator: '&'
                                }
                            });
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
                } else if (id == 'favorite' || (id == 'featured' && canEditFeaturedLists)) {
                    // this makes the button trigger a change event,
                    // which is already being handled in folders.js
                    pandora.$ui.manageListsButton[id].options({value: true});
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
                //var $list = pandora.$ui.folderList[id];
                if (data.key == 'user') {
                    pandora.$ui.listDialog = pandora.ui.listDialog('icon').open();
                } else if (data.key == 'type') {
                    if (that.value(data.id, 'type') == 'smart') {
                        pandora.$ui.listDialog = pandora.ui.listDialog('query').open();
                    }
                } else if (data.key == 'status') {
                    var status = that.value(data.id, data.key) == 'private' ? 'public' : 'private';
                    pandora.changeListStatus(data.id, status, function(result) {
                        that.value(result.data.id, 'status', result.data.status);
                    });
                } else if (data.key == 'path') {
                    
                } else if (data.key == 'mounted') {
                    alert(JSON.stringify(data));
                }
            },
            'delete': function(data) {
                if (id == 'personal') {
                    pandora.ui.deleteListDialog(data.ids[0]).open();
                } else if (id == 'favorite') {
                    that.options({selected: []});
                    pandora.api.unsubscribeFromList({
                        id: data.ids[0]
                    }, function(result) {
                        Ox.Request.clearCache(); // fixme: remove
                        that.reloadList();
                    });
                } else if (id == 'featured' && canEditFeaturedLists) {
                    that.options({selected: []});
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
                        that.reloadList();
                    });
                }
            },
            /*
            edit: function() {
                pandora.ui.listDialog().open();
            },
            */
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
                var list = data.ids.length ? data.ids[0] : '';
                if (list) {
                    Ox.forEach(pandora.$ui.folderList, function($list, id_) {
                        id != id_ && $list.options('selected', []);
                    });
                }
                pandora.UI.set({
                    find: {
                        conditions: list ? [
                            {key: 'list', value: data.ids[0], operator: '=='}
                        ] : [],
                        operator: '&'
                    }
                });
            },
            submit: function(data) {
                var data_ = {id: data.id};
                data_[data.key] = data.value;
                pandora.api.editList(data_, function(result) {
                    if (result.data.id != data.id) {
                        pandora.renameList(data.id, result.data.id, result.data.name, id);
                        pandora.$ui.info.updateListInfo();
                    }
                });
            }
        });
    }
    return that;
};
