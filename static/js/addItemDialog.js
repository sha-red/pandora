'use strict';

pandora.ui.addItemDialog = function(options) {
    options = options || {};

    var input = '';

    var selected = options.selected ? options.selected
        : !pandora.site.itemRequiresVideo && !pandora.user.ui.item ? 'add' : 'upload';

    var $button;

    var $panel = Ox.TabPanel({
        content: function(id) {
            var $content = Ox.Element().css({padding: '8px'});
            var $input = Ox.Input({
                changeOnKeypress: true,
                disabled: id == 'upload',
                label: Ox._(id == 'add' ? 'Title' : id == 'upload' ? 'File': 'URL'),
                labelWidth: 64,
                placeholder: id == 'import' ? Ox._('YouTube, Vimeo, etc.') : '',
                width: 512
            }).css({
                margin: '8px'
            }).bindEvent({
                change: function(data) {
                    $button.options({disabled: !data.value});
                    input = data.value;
                }
            }).appendTo($content);
            return $content;
        },
        tabs: [
            {
                id: 'add',
                title: Ox._('Add {0}', [pandora.site.itemName.singular]),
                disabled: pandora.site.itemRequiresVideo,
                selected: selected == 'add'
            },
            {
                id: 'upload',
                title: Ox._('Upload Video Files'),
                selected: selected == 'upload'
            },
            {
                id: 'import',
                title: Ox._('Import Video Files'),
                disabled: !pandora.hasCapability('canImportItems'),
                selected: selected == 'import'
            }
        ]
    }).bindEvent({
        change: function(data) {
            selected = data.selected;
            that.options({buttons: [createButton()]});
        }
    });

    var $screen = Ox.LoadingScreen({
        size: 16
    });

    var that = Ox.Dialog({
        buttons: [createButton()],
        closeButton: true,
        content: $panel,
        height: 72,
        removeOnClose: true,
        title: Ox._('Add {0}', [pandora.site.itemName.singular]),
        width: 544
    });
    if (options.files) {
        that.options({content: $screen.start()});
        $button.options({disabled: true});
        Ox.serialMap(options.files, function(file, index, files, callback) {
            getFileInfo(file, function(info) {
                callback(Ox.extend(info, {file: file}));
            });
        }, onInfo);
    }

    function createButton() {
        $button = Ox[selected == 'upload' ? 'FileButton' : 'Button']({
            disabled: selected != 'upload',
            id: selected,
            title: selected == 'add'
                ? Ox._('Add {0} Without Video Files', [pandora.site.itemName.singular])
                : selected == 'upload' ? Ox._('Select Video Files')
                : Ox._('Import Video Files'),
            width: selected == 'add' ? 192 : 128
        }).bindEvent({
            click: function(data) {
                if (selected == 'add') {
                    that.options({content: $screen.start()});
                    $button.options({disabled: true});
                    pandora.api.add({title: input}, function(result) {
                        Ox.Request.clearCache('find');
                        $screen.stop();
                        that.close();
                        pandora.UI.set({
                            item: result.data.id,
                            itemView: 'info'
                        });
                    });
                } else if (selected == 'upload' && data.files.length > 0) {
                    that.options({content: $screen.start()});
                    $button.options({disabled: true});
                    Ox.serialMap(data.files, function(file, index, files, callback) {
                        getFileInfo(file, function(info) {
                            callback(Ox.extend(info, {file: file}));
                        });
                    }, onInfo);
                } else {
                    that.options({content: $screen.start()});
                    $button.options({disabled: true});
                    pandora.api.getMediaUrlInfo({
                        url: input
                    }, function(result) {
                        if (result.data.items.length) {
                            onInfo(result.data.items.map(getVideoInfo));
                        } else {
                            $screen.stop();
                            that.close();
                            var error = Ox.Dialog({
                                buttons: [
                                    {},
                                    Ox.Button({
                                        id: 'close',
                                        title: Ox._('Close')
                                    }).bindEvent({
                                        click: function() {
                                            error.close();
                                        }
                                    })
                                ],
                                closeButton: true,
                                content: Ox.Element().css({padding: '32px'}).html('Import failed'),
                                height: 96,
                                keys: {escape: 'close'},
                                removeOnClose: true,
                                title: Ox._('Import Error'),
                                width: 192
                            }).open()
                        }
                    });
                }
            }
        });
        return $button;
    }

    function getFileInfo(file, callback) {
        var done = false;
        Ox.oshash(file, function(oshash) {
            var $video = $('<video>'),
                url = URL.createObjectURL(file),
                info = {
                    audio: [],
                    direct: false,
                    oshash: oshash,
                    name: file.name,
                    size: file.size,
                    title: file.name.split('.').slice(0, -1).join('.'),
                    video: []
                };
            $video.one('error', function(event) {
                if (!done) {
                    done = true;
                    $video[0].src = ''
                    URL.revokeObjectURL(url);
                    callback(info);
                }
            });
            $video.one('loadedmetadata', function(event) {
                if (!done) {
                    done = true;
                    info.duration = $video[0].duration;
                    if ($video[0].videoHeight > 0) {
                        info.width = $video[0].videoWidth;
                        info.height = $video[0].videoHeight;
                    }
                    if (info.duration) {
                        info.bitrate = info.size * 8 / info.duration / 1000;
                    }
                    $video[0].src = ''
                    URL.revokeObjectURL(url);
                    callback(info);
                }
            });
            $video[0].muted = true;
            $video[0].src = url;
        });
    }

    function getVideoInfo(info) {
        var values = Ox.map(pandora.site.importMetadata, function(value, key) {
            var isArray = Ox.isArray(
                Ox.getObjectById(pandora.site.itemKeys, key).type
            );
            if (isArray && value == '{tags}') {
                value = info.tags;
            } else {
                [
                    'date', 'description', 'id', 'tags',
                    'title', 'uploader', 'url'
                ].forEach(function(infoKey) {
                    var infoValue = info[infoKey] || '';
                    if (key == 'year' && infoKey == 'date') {
                        infoValue = infoValue.substr(0, 4);
                    }
                    if (infoKey == 'tags') {
                        infoValue = infoValue.join(', ');
                    }
                    value = value.replace(
                        new RegExp('\{' + infoKey + '\}', 'g'), infoValue
                    );
                });
                // For example: director -> uploader
                if (isArray) {
                    value = [value];
                }
            }
            return value;
        });
        values.url = info.url;
        values.referer = info.referer;
        return Ox.extend(info, values);
    }

    function onInfo(items) {
        // FIXME: what about pending/aborted uploads
        pandora.api.findMedia({
            keys: ['id', 'item', 'url'],
            range: [0, items.length],
            query: {
                conditions: selected == 'upload' ? items.map(function(item) {
                    return {key: 'oshash', operator: '==', value: item.oshash};
                }) : items.map(function(item) {
                    return {key: 'url', operator: '==', value: item.url};
                }),
                operator: '|'
            }
        }, function(result) {
            if (result.data.items.length) {
                Ox.serialMap(result.data.items, function(item, index, items, callback) {
                    pandora.api.get({
                        id: item.item,
                        keys: ['id', 'title']
                    }, function(result) {
                        callback(Ox.extend(item, {
                            itemID: result.data.id,
                            itemTitle: result.data.title
                        }));
                    })
                }, function(media) {
                    media = media.map(function(media) {
                        return Ox.extend(media, Ox.getObject(
                            items,
                            selected == 'upload' ? 'oshash' : 'url',
                            media[selected == 'upload' ? 'id' : 'url']
                        ));
                    });
                    $screen.stop();
                    that.close();
                    pandora.ui.mediaExistsDialog({
                        action: selected,
                        media: media,
                        items: items
                    }).open();
                });
            } else {
                $screen.stop();
                that.close();
                (pandora.user.ui.item ? pandora.api.get : Ox.noop)({
                    id: pandora.user.ui.item,
                    keys: ['editable']
                }, function(result) {
                    pandora.ui.addFilesDialog({
                        action: selected,
                        items: items,
                        editable: pandora.user.ui.item && result.data.editable
                    }).open();
                })
            }
        })
    }

    return that;

};
