// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.folderList = function(id, section) {
    section = section || pandora.user.section;
    var ui = pandora.user.ui,
        i = Ox.getIndexById(pandora.site.sectionFolders[section], id),
        folderItems = pandora.getFolderItems(section),
        folderItem = folderItems.slice(0, -1),
        canEditFeatured = pandora.hasCapability('canEditFeatured' + folderItems),
        $placeholder,
        that;
    var columns, items;
    if (id != 'volumes') {
        columns = [
            {
                clickable: function(data) {
                    return data.user == pandora.user.username
                        || (id == 'featured' && canEditFeatured);
                },
                format: function(value, data) {
                    return $('<img>').attr({
                            src: pandora.getListIcon(section, data.id, '', data.modified)
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
                        || (id == 'featured' && canEditFeatured)
                        ? Ox._('Edit Icon')
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
                visible: id == 'favorite',
                // fixme: user and name are set to the same width here,
                // but resizeFolders will set them to different widths
                width: ui.sidebarWidth - (section != 'texts' ? 96 : 48)
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
                tooltip: id == 'personal' ? Ox._('Edit Title') : '',
                unformat: function(value) {
                    return Ox.decodeHTMLEntities(value);
                },
                visible: id != 'favorite',
                width: ui.sidebarWidth - (section != 'texts' ? 96 : 48)
            },
            {
                align: 'right',
                clickable: true,
                id: 'items',
                format: {type: 'number'},
                operator: '-',
                visible: section != 'texts',
                width: 48
            },
            {
                clickable: function(data) {
                    return section != 'texts' && (
                        data.type == 'smart' || data.user == pandora.user.username
                    );
                },
                format: function(value, data) {
                    return $('<img>')
                        .attr({
                            src: Ox.UI.getImageURL(
                                value == 'static' ? 'symbolClick'
                                : value == 'smart' ? 'symbolFind'
                                : value == 'html' ? 'symbolFile'
                                : 'symbolBook'
                            )
                        })
                        .css({
                            width: '10px',
                            height: '10px',
                            padding: '3px',
                            opacity: section == 'texts' || data.user == pandora.user.username ? 1 : 0.25
                        });
                },
                id: 'type',
                operator: '+',
                tooltip: function(data) {
                    return data.type == 'static'
                        ? (data.user == pandora.user.username ? Ox._('Edit {0}', [Ox._(folderItem)]) : '')
                        : data.type == 'smart'
                        ? (data.user == pandora.user.username ? Ox._('Edit Query') : Ox._('Show Query'))
                        : data.type.toUpperCase();
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
                    return data.status == 'private' ? Ox._('Make Public') : Ox._('Make Private');
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
                    {key: 'status', value: 'featured', operator: '='}
                ], operator: '&'};
            }
            return pandora.api['find' + folderItems](Ox.extend(data, {
                query: query
            }), function(result) {
                if (Ox.isArray(result.data.items)) {
                    pandora.$ui.mainMenu.updateLists(id, result.data.items);
                }
                callback(result);
            });
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
                tooltip: Ox._('Edit Title'),
                visible: true,
                width: ui.sidebarWidth - 96
            },
            {
                align: 'right',
                clickable: true,
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
                    return data.mounted ? Ox._('Scan Volume') : Ox._('Edit Path');
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
                    return data.mounted ? Ox._('Unmount Volume') : Ox._('Mount Volume');
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
        droppable: id != 'volumes',
        items: items,
        keys: ['modified'].concat(section != 'texts'
            ? ['query', 'name', 'view'] : ['rightslevel']),
        max: 1,
        min: 0,
        pageLength: 1000,
        // works when switching back from browser, but won't work on load, since
        // getListData relies on $folderList, so selectList is called in init handler
        selected: pandora.getListData().folder == id
            ? [ui[ui.section == 'items' ? '_list' : ui.section.slice(0, -1)]]
            : [],
        sort: [{key: 'position', operator: '+'}],
        sortable: id != 'featured' || canEditFeatured,
        unique: id != 'volumes' ? 'id' : 'name'
    })
    .css({
        left: 0,
        top: 0,
        width: ui.sidebarWidth + 'px'
    })
    .bindEvent({
        add: function(event) {
            if (id == 'personal') {
                if (event.keys == '' || event.keys == 'alt') {
                    if (section != 'texts') {
                        pandora.addFolderItem(section, event.keys == 'alt', false);
                    } else {
                        pandora.addText({type: event.keys == '' ? 'html' : 'pdf'});
                    }
                }
            } else if (id == 'favorite' || (id == 'featured' && canEditFeatured)) {
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
            if (data.key == 'items') {
                select(section, data.id);
            } else if (data.key == 'user') {
                pandora.$ui.listDialog = pandora.ui.listDialog('icon').open();
            } else if (data.key == 'type') {
                if (that.value(data.id, 'type') == 'smart') {
                    pandora.$ui.listDialog = pandora.ui.listDialog('query').open();
                } else {
                    pandora.$ui.listDialog = pandora.ui.listDialog('general').open();
                }
            } else if (data.key == 'status') {
                var status = that.value(data.id, data.key) == 'private' ? 'public' : 'private';
                pandora.changeFolderItemStatus(data.id, status, function(result) {
                    that.value(result.data.id, 'status', result.data.status);
                });
            } else if (data.key == 'path') {
                // ...
            } else if (data.key == 'mounted') {
                // ...
            }
        },
        'delete': function(data) {
            if (id == 'personal') {
                pandora.ui.deleteListDialog(data.ids[0]).open();
            } else if (id == 'favorite') {
                that.options({selected: []});
                pandora.api['unsubscribeFrom' + folderItem]({
                    id: data.ids[0]
                }, function(result) {
                    Ox.Request.clearCache('find' + folderItems);
                    that.reloadList();
                });
            } else if (id == 'featured' && canEditFeatured) {
                that.options({selected: []});
                pandora.api['edit' + folderItem]({
                    id: data.ids[0],
                    status: 'public'
                }, function(result) {
                    Ox.Request.clearCache('find' + folderItems);
                    // fixme: duplicated
                    if (result.data.user == pandora.user.username || result.data.subscribed) {
                        pandora.$ui.folderList[
                            result.data.user == pandora.user.username ? 'personal' : 'favorite'
                        ].reloadList();
                    }
                    that.reloadList();
                });
            }
        },
        init: function(data) {
            if (pandora.site.sectionFolders[section][i]) {
                pandora.site.sectionFolders[section][i].items = data.items;
                pandora.$ui.folder[i].$content.css({
                    height: (data.items || 1) * 16 + 'px'
                });
                pandora.$ui.folderList[id].css({
                    height: data.items * 16 + 'px'
                })[data.items ? 'show' : 'hide']();
                pandora.$ui.folderPlaceholder[id].updateText(id)[data.items ? 'hide' : 'show']();
            }
            pandora.resizeFolders();
        },
        key_control_d: function() {
            if (that.options('selected').length) {
                pandora.addFolderItem(ui.section, ui._list);
            }
        },
        key_control_e: function() {
            if (
                that.options('selected').length
                && (id == 'personal' || (id == 'featured' && canEditFeatured))
            ) {
                pandora.ui.listDialog().open();
            }
        },
        move: function(data) {
            pandora.api['sort' + folderItems]({
                section: id,
                ids: data.ids
            }, function() {
                Ox.Request.clearCache('find' + folderItems);
            });
        },
        paste: function() {
            pandora.$ui.list.triggerEvent('paste');
        },
        select: function(data) {
            var list = data.ids.length ? data.ids[0] : '';
            if (list) {
                Ox.forEach(pandora.$ui.folderList, function($list, id_) {
                    id != id_ && $list.options('selected', []);
                });
            }
            select(section, list);
        },
        submit: function(data) {
            var data_ = {id: data.id};
            data_[data.key] = data.value;
            pandora.api['edit' + folderItem](data_, function(result) {
                if (result.data.id != data.id) {
                    Ox.Request.clearCache();
                    pandora.renameList(data.id, result.data.id, result.data.name, id);
                    pandora.$ui.info.updateListInfo();
                }
            });
        }
    });

    function select(section, list) {
        if (section == 'items') {
            pandora.UI.set({
                find: {
                    conditions: list ? [
                        {key: 'list', value: list, operator: '=='}
                    ] : [],
                    operator: '&'
                },
                listView: list
                    ? pandora.user.ui.lists[list]
                        ? pandora.user.ui.lists[list].view
                        : that.value(list).view
                    : void 0
            });
        } else if (section == 'documents') {
            pandora.UI.set({
                findDocuments: {
                    conditions: list ? [
                        {key: 'collection', value: list, operator: '=='}
                    ] : [],
                    operator: '&'
                },
                collectionView: list
                    ? pandora.user.ui.collections[list]
                        ? pandora.user.ui.collections[list].view
                        : that.value(list).view
                    : void 0
            });
        } else {
            pandora.UI.set(section.slice(0, -1), list);
        }
    }

    return that;
};
