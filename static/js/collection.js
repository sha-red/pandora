'use strict';


pandora.ui.collection = function() {

    var that,
        ui = pandora.user.ui,
        view = ui.collectionView,
        keys = [
            'description', 'dimensions', 'extension', 'id', 'title', 'ratio', 'size', 'user', 'entities', 'modified',
            'editable'
        ];

    if (view == 'list') {
        that = Ox.TableList({
            keys: keys,
            items: function(data, callback) {
                pandora.api.findDocuments(Ox.extend(data, {
                    query: ui.findDocuments
                }), callback);
                return Ox.clone(data, true);
            },
            selected: ui.collectionSelection,
            sort: ui.collectionSort.concat([
                {key: 'extension', operator: '+'},
                {key: 'title', operator: '+'}
            ]),
            unique: 'id',
            columns: pandora.site.documentSortKeys.filter(function(key) {
                return !key.capability
                    || pandora.hasCapability(key.capability);
            }).map(function(key) {
                var position = ui.collectionColumns.indexOf(key.id);
                return {
                    addable: key.id != 'random',
                    align: ['string', 'text'].indexOf(
                        Ox.isArray(key.type) ? key.type[0]: key.type
                    ) > -1 ? 'left' : key.type == 'list' ? 'center' : 'right',
                    defaultWidth: key.columnWidth,
                    format: (function() {
                        return function(value, data) {
                            return pandora.formatDocumentKey(key, data);
                        }
                    })(),
                    id: key.id,
                    operator: pandora.getDocumentSortOperator(key.id),
                    position: position,
                    removable: !key.columnRequired,
                    title: Ox._(key.title),
                    type: key.type,
                    visible: position > -1,
                    width: ui.collectionColumnWidth[key.id] || key.columnWidth
                };
            }),
            columnsVisible: true,
            scrollbarVisible: true,
        })
        .bindEvent({
            columnchange: function(data) {
                var columnWidth = {};
                pandora.UI.set({collectionColumns: data.ids});
                /*
                data.ids.forEach(function(id) {
                    columnWidth[id] =
                        ui.collections[ui.collection].columnWidth[id]
                        || Ox.getObjectById(pandora.site.sortKeys, id).width
                });
                pandora.UI.set({collectionColumnWidth: columnWidth});
                */
            },
            columnresize: function(data) {
                pandora.UI.set('collectionColumnWidth.' + data.id, data.width);
            },
            sort: function(data) {
                pandora.UI.set({
                    collectionSort: [{key: data.key, operator: data.operator}]
                });
            }
        });

    } else if (view == 'grid') {
        that = Ox.IconList({
            borderRadius: 0,
            defaultRatio: 640/1024,
            draggable: true,
            id: 'list',
            item: function(data, sort, size) {
                var sortKey = sort[0].key,
                    infoKey = sortKey == 'title' ? 'extension' : sortKey,
                    key = Ox.getObjectById(pandora.site.documentKeys, infoKey),
                    info = pandora.formatDocumentKey(key, data, size),
                    size = size || 128;
                return {
                    height: Math.round(data.ratio > 1 ? size / data.ratio : size),
                    id: data.id,
                    info: info,
                    title: data.title,
                    url: pandora.getMediaURL('/documents/' + data.id + '/256p.jpg?' + data.modified),
                    width: Math.round(data.ratio > 1 ? size : size * data.ratio)
                };
            },
            items: function(data, callback) {
                pandora.api.findDocuments(Ox.extend(data, {
                    query: ui.findDocuments
                }), callback);
                return Ox.clone(data, true);
            },
            keys: keys,
            selected: ui.collectionSelection,
            size: 128,
            sort: ui.collectionSort.concat([
                {key: 'extension', operator: '+'},
                {key: 'title', operator: '+'}
            ]),
            unique: 'id'
        })
        .addClass('OxMedia');
    }

    if (['list', 'grid'].indexOf(view) > -1) {
        // react to the resize event of the split panel
        that.bindEvent({
            resize: function(data) {
                that.size();
            },
            pandora_showbrowser: function(data) {
                that.size();
            }
        });
    }

    if (['list', 'grid'].indexOf(view) > -1) {

        //fixme

        pandora.enableDragAndDrop(that, true);

        that.bindEvent({
            closepreview: function(data) {
                pandora.$ui.previewDialog.close();
                delete pandora.$ui.previewDialog;
            },
            copy: function(data) {
                pandora.clipboard.copy(data.ids, 'document');
            },
            copyadd: function(data) {
                pandora.clipboard.add(data.ids, 'document');
            },
            cut: function(data) {
                var listData = pandora.getListData();
                if (listData.editable && listData.type == 'static') {
                    pandora.clipboard.copy(data.ids, 'document');
                    pandora.doHistory('cut', data.ids, ui._collection, function() {
                        pandora.UI.set({collectionSelection: []});
                        pandora.reloadList();
                    });
                }
            },
            cutadd: function(data) {
                var listData = pandora.getListData();
                if (listData.editable && listData.type == 'static') {
                    pandora.clipboard.add(data.ids, 'document');
                    pandora.doHistory('cut', data.ids, ui._collection, function() {
                        pandora.UI.set({collectionSelection: []});
                        pandora.reloadList();
                    });
                }
            },
            'delete': function(data) {
                var listData = pandora.getListData();
                if (listData.editable && listData.type == 'static') {
                    //fixme use history
                    //pandora.doHistory('delete', data.ids, ui._collection, function() {
                    pandora.api.removeCollectionItems({
                        collection: ui._collection,
                        items: data.ids

                    }, function() {
                        pandora.UI.set({collectionSelection: []});
                        pandora.reloadList();
                    });
                } else if (pandora.user.ui._collection == '' && data.ids.every(function(item) {
                    return pandora.$ui.list.value(item, 'editable');
                })) {
                    pandora.ui.deleteDocumentDialog(
                        data.ids.map(function(id) {
                            return pandora.$ui.list.value(id);
                        }),
                        function() {
                            Ox.Request.clearCache();
                            if (ui.document) {
                                pandora.UI.set({document: ''});
                            } else {
                                pandora.$ui.list.reloadList()
                            }
                        }
                    ).open();
                }
            },
            init: function(data) {
                var folder, list;
                if (data.query.conditions.length == 0) {
                    pandora.$ui.allItems.update(data.items);
                } else if (
                    data.query.conditions.length == 1
                    && data.query.conditions[0].key == 'document'
                    && data.query.conditions[0].operator == '=='
                ) {
                    list = data.query.conditions[0].value;
                    folder = pandora.getListData(list).folder;
                    if (pandora.$ui.folderList[folder]
                        && !Ox.isEmpty(pandora.$ui.folderList[folder].value(list))) {
                        pandora.$ui.folderList[folder].value(
                            list, 'items', data.items
                        );
                    }
                }
                pandora.$ui.statusbar.set('total', data);
                data = [];
                pandora.site.totals.forEach(function(v) {
                    data[v.id] = 0;
                });
                pandora.$ui.statusbar.set('selected', data);
            },
            open: function(data) {
                var set = {document: data.ids[0]};
                pandora.UI.set(set);
            },
            openpreview: function(data) {
                /*
                if (!pandora.$ui.previewDialog) {
                    pandora.$ui.previewDialog = pandora.ui.previewDialog()
                        .open()
                        .bindEvent({
                            close: function() {
                                that.closePreview();
                                delete pandora.$ui.previewDialog;
                            }
                        });
                } else {
                    pandora.$ui.previewDialog.update();
                }
                */
            },
            paste: function(data) {
                var items = pandora.clipboard.paste();
                if (items.length && pandora.clipboard.type() == 'document' && pandora.getListData().editable) {
                    //fixme use history
                    //pandora.doHistory('paste', items, ui._collection, function() {
                    pandora.api.addCollectionItems({
                        collection: ui._collection,
                        items: items

                    }, function() {
                        pandora.UI.set({collectionSelection: items});
                        pandora.reloadList();
                    });
                }
            },
            select: function(data) {
                var query;
                pandora.UI.set('collectionSelection', data.ids);
                if (data.ids.length == 0) {
                    pandora.$ui.statusbar.set('selected', {items: 0});
                } else {
                    if (Ox.isUndefined(data.rest)) {
                        query = {
                            conditions: data.ids.map(function(id) {
                                return {
                                    key: 'id',
                                    value: id,
                                    operator: '=='
                                }
                            }),
                            operator: '|'
                        };
                    } else {
                        query = {
                            conditions: [ui.find].concat(
                                data.rest.map(function(id) {
                                    return {
                                        key: 'id',
                                        value: id,
                                        operator: '!='
                                    };
                                })
                            ),
                            operator: '&'
                        };
                    }
                    pandora.api.find({
                        query: query
                    }, function(result) {
                        pandora.$ui.statusbar.set('selected', result.data);
                    });
                }
            },

            pandora_collectionsort: function(data) {
                that.options({sort: data.value});
            },
            pandora_showdocument: function(data) {
                isItemView && that.toggleElement(1);
            }
        });

    }

    return that;

};
