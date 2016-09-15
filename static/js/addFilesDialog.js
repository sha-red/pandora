'use strict';

pandora.ui.addFilesDialog = function(options) {

    var $button = Ox.Button({
        id: 'add',
        title: Ox._(Ox.toTitleCase(options.action))
    }).bindEvent({
        click: function() {
            $button.options({disabled: true});
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
                width: 128
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
        scrollbarsVisible: true,
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

    var $select = Ox.Select({
        items: [
            {
                id: 'one',
                title: Ox._(
                    'Create one {0} with multiple parts',
                    [pandora.site.itemName.singular.toLowerCase()]
                )
            },
            {
                id: 'multiple',
                title: Ox._(
                    'Create multiple {0}',
                    [pandora.site.itemName.plural.toLowerCase()]
                )
            }
        ],
        width: 256
    }).css({
        display: options.items.length > 1 ? 'block' : 'none',
        margin: '4px'
    });
    $($select.find('.OxButton')[0]).css({margin: '-1px'});
    $button.parent().parent().append($select);

    function importVideos(callback) {
        var id;
        Ox.serialForEach(options.items, function(item, index, items, callback) {
            var isNewItem = index == 0 || $select.value() == 'multiple';
            (isNewItem ? pandora.api.add : Ox.noop)({
                title: item.title
            }, function(result) {
                if (isNewItem) {
                    id = result.data.id;
                }
                (isNewItem ? pandora.api.edit : Ox.noop)(Ox.extend(
                    Ox.filter(item, function(value, key) {
                        return key != 'title';
                    }),
                    {'id': id}
                ), function(result) {
                    pandora.api.addMediaUrl({
                        url: item.url,
                        item: id
                    }, callback);
                });
            });            
        }, callback);
    }

    function uploadVideos(callback) {
        var id;
        Ox.serialForEach(options.items, function(item, index, items, callback) {
            var isNewItem = index == 0 || $select.value() == 'multiple';
            var title = items[$select.value() == 'one' ? 0 : index].title;
            (isNewItem ? pandora.api.add : Ox.noop)({
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
            });            
        }, callback);
    }

    return that;

};
