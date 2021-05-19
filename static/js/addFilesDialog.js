'use strict';

pandora.ui.addFilesDialog = function(options) {

    var $button = Ox.Button({
        id: 'add',
        title: Ox._(Ox.toTitleCase(options.action))
    }).bindEvent({
        click: function() {
            $button.options({disabled: true});
            that.disableCloseButton()
            var $screen = Ox.LoadingScreen({
                size: 16
            });
            that.options({content: $screen.start()});
            (options.action == 'upload' ? uploadVideos : importVideos)(function() {
                that.close();
                pandora.ui.tasksDialog({
                    tasks: options.action == 'import' ? 'all' : 'uploads'
                }).open();
            });
        }
    });

    var $list = Ox.TableList({
        columns: [
            {
                id: 'id',
                title: Ox._('ID')
            },
            {
                id: 'index',
                title: Ox._('Index')
            },
            {
                format: function(value) {
                    return Ox.encodeHTMLEntities(value);
                },
                id: 'title',
                title: Ox._('Title'),
                visible: true,
                width: 256
            },
            {
                format: function(value, data) {
                    return data.width && data.height
                        ? data.width + ' × ' + data.height + ' px'
                        : Ox._('unknown')
                },
                id: 'resolution',
                title: Ox._('Resolution'),
                align: 'right',
                visible: true,
                width: 128
            },
            {
                format: function(value) {
                    return value ? Ox.formatDuration(value) : Ox._('unknown');
                },
                id: 'duration',
                title: Ox._('Duration'),
                align: 'right',
                visible: true,
                width: 128
            },
            {
                format: function(value) {
                    return value ? Ox.formatValue(value, 'B') : Ox._('unknown');
                },
                id: 'size',
                title: Ox._('Size'),
                align: 'right',
                visible: true,
                width: 128 - Ox.SCROLLBAR_SIZE
            },
            {
                id: 'width',
                title: Ox._('Width')
            },
            {
                id: 'height',
                title: Ox._('Height')
            }
        ],
        columnsResizable: true,
        columnsVisible: true,
        items: options.items.map(function(value, index) {
            return Ox.extend(value, {index: index})
        }),
        scrollbarVisible: true,
        sort: [{key: 'index', operator: '+'}],
        sortable: true
    }).css({
        height: '320px',
        width: '640px'
    });

    var that = Ox.Dialog({
        buttons: [$button],
        closeButton: true,
        content: $list,
        height: 320,
        removeOnClose: true,
        title: Ox._('{0} Video Files', [Ox.toTitleCase(options.action)]),
        width: 640
    });

    var selectItems = [];
    if (pandora.user.ui.item && options.editable) {
        selectItems.push({
            id: 'add',
            title: Ox._(
                'Add to current {0}',
                [pandora.site.itemName.singular.toLowerCase()]
            )
        });
    }
    if (options.items.length > 1) {
        selectItems.push({
            id: 'multiple',
            title: Ox._(
                'Create multiple {0}',
                [pandora.site.itemName.plural.toLowerCase()]
            )
        });
    }
    selectItems.push({
        id: 'one',
        title: Ox._(
            options.items.length > 1 ? 'Create new {0} with multiple parts' : 'Create new {0}',
            [pandora.site.itemName.singular.toLowerCase()]
        )
    });
    var $select = Ox.Select({
        items: selectItems,
        width: 256
    }).css({
        display: selectItems.length > 1 ? 'block' : 'none',
        margin: '4px'
    });
    $($select.find('.OxButton')[0]).css({margin: '-1px'});
    $button.parent().parent().append($select);

    function getNewOrEmptyItem(data, callback) {
        pandora.api.find({
            query: {
                conditions: [
                    {key: 'title', value: data.title, operator: '=='}
                ]
            },
            keys: ['id']
        }, function(result) {
            if (!result.data.items.length) {
                pandora.api.add(data, callback)
            } else {
                var isNew = true
                Ox.serialForEach(result.data.items, function(item, index, items, next) {
                    isNew && pandora.api.findMedia({
                        query: {
                            conditions: [
                                {key: 'id', value: item.id, operator: '=='}
                            ]
                        },
                        keys: ['id']
                    }, function(result) {
                        if (!result.data.items.length) {
                            isNew = false
                            callback({
                                data: {
                                    title: data.title,
                                    id: item.id
                                }
                            })
                        }
                        next()
                    })
                }, function() {
                    if (isNew) {
                        pandora.api.add(data, callback)
                    }
                })

            }
        })
    }

    function importVideos(callback) {
        var id, title;
        ($select.value() == 'add' ? pandora.api.get : Ox.noop)({
            id: pandora.user.ui.item,
            keys: ['title']
        }, function(result) {
            if ($select.value() == 'add') {
                title = result.data.title;
            }
            Ox.serialForEach(options.items, function(item, index, items, callback) {
                var isNewItem = index == 0 || $select.value() == 'multiple';
                if ($select.value() == 'add') {
                    id = pandora.user.ui.item;
                    isNewItem = false;
                } else {
                    title = items[$select.value() == 'one' ? 0 : index].title;
                }
                (isNewItem ? getNewOrEmptyItem : Ox.noop)({
                    title: title
                }, function(result) {
                    if (isNewItem) {
                        id = result.data.id;
                    }
                    (isNewItem ? pandora.api.edit : Ox.noop)(Ox.extend(
                        Ox.filter(item, function(value, key) {
                            return key != 'title' &&
                                Object.keys(pandora.site.importMetadata).indexOf(key) > -1;
                        }),
                        {'id': id}
                    ), function(result) {
                        pandora.api.addMediaUrl({
                            url: item.url,
                            referer: item.referer,
                            item: id
                        }, callback);
                    });
                });
            }, callback);
        });
    }

    function uploadVideos(callback) {
        var id, title;
        ($select.value() == 'add' ? pandora.api.get : Ox.noop)({
            id: pandora.user.ui.item,
            keys: ['title']
        }, function(result) {
            if ($select.value() == 'add') {
                title = result.data.title;
            }
            Ox.serialForEach(options.items, function(item, index, items, callback) {
                var isNewItem = index == 0 || $select.value() == 'multiple';
                if ($select.value() == 'add') {
                    id = pandora.user.ui.item;
                    isNewItem = false;
                } else {
                    title = items[$select.value() == 'one' ? 0 : index].title;
                }
                (isNewItem ? getNewOrEmptyItem : Ox.noop)({
                    title: title
                }, function(result) {
                    if (isNewItem) {
                        id = result.data.id;
                    }
                    pandora.uploadQueue.add(Ox.extend(item, {
                        item: {
                            id: id,
                            title: title
                        } 
                    }));
                    callback();
                })
            }, callback);
        });
    }

    return that;

};
