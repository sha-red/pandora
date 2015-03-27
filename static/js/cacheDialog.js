pandora.ui.cacheDialog = function() {

    var ui = pandora.user.ui,
        cachedVideos,

        $list = Ox.TableList({
            columns: [
                {
                    id: 'id',
                    title: Ox._('ID'),
                    visible: false,
                    width: 8
                },
                {
                    id: 'item',
                    title: Ox._('Item'),
                    visible: true,
                    width: 48
                },
                {
                    id: 'title',
                    operator: '+',
                    removable: false,
                    title: Ox._('Title'),
                    visible: true,
                    width: 192
                },
                {
                    id: 'resolution',
                    align: 'right',
                    operator: '+',
                    title: Ox._('Resolution'),
                    visible: true,
                    width: 72
                },
                {
                    id: 'size',
                    align: 'right',
                    operator: '-',
                    title: Ox._('Size'),
                    format: {type: 'value', args: ['B']},
                    visible: true,
                    width: 64
                },
                {
                    id: 'added',
                    operator: '+',
                    title: Ox._('Added'),
                    format: {"type": "date", "args": ["%Y-%m-%d %H:%M:%S"]},
                    visible: true,
                    width: 128
                },
                {
                    id: 'progress',
                    align: 'right',
                    operator: '+',
                    title: Ox._('Progress'),
                    format: function(data) {
                        return (data == 1 ? '100' : Ox.formatNumber(data * 100, 2)) + ' %';
                    },
                    visible: true,
                    width: 96
                }
            ],
            columnsVisible: true,
            items: function(data, callback) {
               cachedVideos 
                    ? cachedVideos(data, callback)
                    : getCachedVideos(function(files) {
                        cachedVideos = Ox.api(files);
                        cachedVideos(data, callback);
                    });
            },
            keys: ['author'],
            scrollbarVisible: true,
            sort: [{key: 'progress', operator: '+'}],
            unique: 'id'
        }).bindEvent({
            'delete': function(data) {
                Ox.print('remove items', data.ids, data);
                removeVideos(data.ids);
            },
            select: function(data) {
                $cancelButton.options({
                    disabled: !data.ids.length
                });
            }
        }),

        $status = $('<div>')
            .css({
                width: '100%',
                marginTop: '2px',
                fontSize: '9px',
                textAlign: 'center',
                textOverflow: 'ellipsis'
            }),

        $statusbar = Ox.Bar({size: 16}).append($status),

        $panel = Ox.SplitPanel({
            elements: [
                {element: $list},
                {element: $statusbar, size: 16}
            ],
            orientation: 'vertical'
        }),

        $item = Ox.Element(),

        $cacheButton = Ox.Button({
                title: 'Cache Video...',
                width: 128,
                disabled: pandora.user.ui.section != 'items'
                    || pandora.user.ui.item == ''
                    || !!pandora.fs.getVideoURL(pandora.user.ui.item, pandora.user.ui.videoResolution, 1)
            })
            .css({
                margin: '8px'
            })
            .bindEvent({
                click: function() {
                    $cacheButton.options({disabled: true});
                    pandora.fs.cacheVideo(pandora.user.ui.item);
                    setTimeout(function() {
                        getCachedVideos(function(files) {
                            cachedVideos = Ox.api(files);
                            $list.reloadList(true);
                        });
                    }, 50);
                }
            })
            .appendTo($item),

        $fileButton = Ox.FileButton({
                title: 'Select Video...',
                width: 128,
                disabled: pandora.user.ui.section != 'items'
                    || pandora.user.ui.item == ''
                    || !!pandora.fs.getVideoURL(pandora.user.ui.item, pandora.user.ui.videoResolution, 1)
            })
            .css({
                margin: '8px'
            })
            .bindEvent({
                click: selectVideo
            })
            .appendTo($item),

        $cacheListButton = Ox.Button({
                title: 'Cache List...',
                width: 128,
                disabled: !pandora.user.ui._list || pandora.user.ui.section != 'items'
            })
            .css({
                margin: '8px'
            })
            .bindEvent({
                click: function() {
                    $cacheListButton.options({disabled: true});
                    pandora.api.find({
                        query: {
                            conditions: [
                                {'key': 'list', 'value': pandora.getListData().id}
                            ],
                            operator: '&'
                        },
                        range: [0, pandora.getListData().items],
                        keys: ['id']
                    }, function(result) {
                        result.data.items.forEach(function(item) {
                            pandora.fs.cacheVideo(item.id);
                        });
                        setTimeout(function() {
                            getCachedVideos(function(files) {
                                cachedVideos = Ox.api(files);
                                $list.reloadList(true);
                            });
                        }, 50);
                    })
                }
            })
            .appendTo($item),

        $cacheEditButton = Ox.Button({
                title: 'Cache Edit...',
                width: 128,
                disabled: !pandora.user.ui.edit || pandora.user.ui.section != 'edits'
            })
            .css({
                margin: '8px'
            })
            .bindEvent({
                click: function() {
                    $cacheEditButton.options({disabled: true});
                    pandora.api.getEdit({
                        id: pandora.user.ui.edit,
                        keys: ['id', 'clips']
                    }, function(result) {
                        Ox.unique(result.data.clips.map(function(clip) {
                            return clip.item;
                        })).forEach(function(item) {
                            var update = false;
                            pandora.fs.cacheVideo(item, function(data) {
                                if (!update) {
                                    update = true;
                                    getCachedVideos(function(files) {
                                        cachedVideos = Ox.api(files);
                                        $list.reloadList(true);
                                    });
                                }
                            });
                        });
                    })
                }
            })
            .appendTo($item),

        $cancelButton = Ox.Button({
                title: 'Remove...',
                width: 128,
                disabled: !($list.options('selected') || []).length
            })
            .css({
                margin: '8px'
            })
            .bindEvent({
                click: function() {
                    removeVideos($list.options('selected') || []);
                }
            })
            .appendTo($item),

        $content = Ox.SplitPanel({
            elements: [
                {element: $panel},
                {element: $item, size: 160}
            ],
            orientation: 'horizontal'
        }),

        that = Ox.Dialog({
                buttons: [
                    Ox.Button({
                        id: 'done',
                        title: Ox._('Done')
                    })
                    .bindEvent({
                        click: function() {
                            that.close();
                        }
                    })
                ],
                closeButton: true,
                content: $content,
                height: 384,
                title: Ox._('Manage Cached Videos'),
                width: 768
            })
            .bindEvent({
                close: function() {
                    clearInterval(self.update);
                }
            });

    self.update = setInterval(updateActiveDownloads, 1000);

    function getCachedVideos(callback) {
        pandora.fs.getVideos(function(files) {
            var items = Ox.unique(files.map(function(file) {
                return file.item;
            }));
            pandora.api.find({
                query: {
                    conditions: items.map(function(item) {
                        return {
                            key: 'id',
                            operator: '==',
                            value: item
                        }
                    }),
                    operator: '|'
                },
                keys: ['title', 'id'],
                range: [0, items.length]
            }, function(result) {

                files.forEach(function(file) {
                    file.title = result.data.items.filter(function(item) {
                        return item.id == file.item;
                    })[0].title;
                });
                callback(files);
            });
        });
    }

    function removeVideos(items) {
        var ids = Ox.unique(items).map(function(id) {
            return id.split('::')[0];
        }), done = 0;
        ids.forEach(function(id) {
            pandora.fs.removeVideo(id, function() {
                ++done == ids.length && getCachedVideos(function(files) {
                    cachedVideos = Ox.api(files);
                    $list.reloadList(true);
                });
            });
        });
    }

    function selectVideo(data) {
        var blob = data.files[0],
            name = pandora.fs.getVideoName(pandora.user.ui.item, pandora.user.ui.videoResolution, 1);
        pandora.fs.storeBlob(blob, name, function() {
            getCachedVideos(function(files) {
                cachedVideos = Ox.api(files);
                cachedVideos(data, callback);
            });
        });
    }

    function updateActiveDownloads() {
        pandora.fs.getVideos(function(files) {
            files.forEach(function(file) {
                var current = $list.value(file.id);
                if (!Ox.isEmpty(current) && current.progress != file.progress) {
                    $list.value(file.id, 'progress', file.progress);
                }
            });
            updateStatus();
        });
    }
    function updateStatus() {
        navigator.webkitPersistentStorage.queryUsageAndQuota(function(usage, quota) {
            $status.html(
                Ox.formatValue(usage, 'B', true) + ' of ' + Ox.formatValue(quota, 'B', true)
            );

        })
    
    }

    return that;
    
};
