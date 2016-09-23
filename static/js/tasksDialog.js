'use strict';

pandora.ui.tasksDialog = function(options) {
    options = Ox.extend({
        tasks: 'all'
    }, options || {});

    var canceling = [],

        clientItems = [], serverItems = [], listItems = [],

        clientTimeout, serverTimeout,

        $list = Ox.TableList({
            columns: [
                {
                    id: 'id',
                    title: Ox._('ID'),
                    visible: false
                },
                {
                    format: function(value) {
                        return Ox.encodeHTMLEntities(value);
                    },
                    id: 'user',
                    operator: '+',
                    title: Ox._('User'),
                    visible: false,
                    width: 144
                },
                {
                    format: function(value) {
                        return Ox.encodeHTMLEntities(value);
                    },
                    id: 'title',
                    operator: '+',
                    title: Ox._('Title'),
                    visible: true,
                    width: 288
                },
                {
                    format: function(value) {
                        return Ox.formatDate(value, '%Y-%m-%d %H:%M:%S');
                    },
                    id: 'started',
                    operator: '-',
                    title: Ox._('Started'),
                    visible: true,
                    width: 144
                },
                {
                    format: function(value) {
                        return value
                            ? Ox.formatDate(value, '%Y-%m-%d %H:%M:%S')
                            : '';
                    },
                    id: 'ended',
                    operator: '-',
                    sort: function(value, data) {
                        return value || 1e13 + data.started;
                    },
                    title: Ox._('Ended'),
                    visible: true,
                    width: 144
                },
                {
                    format: function(value, data) {
                        return {
                            'pending': 'Uploading (Queued)',
                            'uploading': 'Uploading' + (
                                data.progress === void 0 ? '' : ' (' + (
                                    data.progress === 0 ? 'Queued'
                                    : data.progress + '%'
                                ) + ')'
                            ),
                            'queued': $tasksSelect.value() == 'all'
                                ? 'Processing (Queued)'
                                : 'Finished',
                            'processing': 'Processing',
                            'canceled': 'Canceled',
                            'failed': 'Failed',
                            'finished': 'Finished'
                        }[value] || value;
                    },
                    id: 'status',
                    operator: '+',
                    sort: function(value) {
                        return [
                            'pending', 'uploading', 'queued', 'processing',
                            'canceled', 'failed', 'finished'
                        ].indexOf(value);
                    },
                    title: Ox._('Status'),
                    visible: true,
                    width: 176
                },
                {
                    id: 'progress',
                    title: Ox._('Progress'),
                    visible: false
                }
            ],
            columnsVisible: true,
            items: listItems,
            scrollbarVisible: true,
            sort: [{key: 'ended', operator: '-'}],
            unique: 'id'
        }).bindEvent({
            select: updateButton,
            open: function(data) {
                var item;
                if (data.ids.length == 1) {
                    item = listItems.filter(function(item) {
                        return item.id == data.ids[0];
                    })[0];
                    if (item && item.item) {
                        that.close();
                        pandora.UI.set({
                            item: item.item,
                            itemView: 'info'
                        });
                    }
                }
            }
        }),

        $sidebar = Ox.Element().css({
            margin: '4px'
        }),

        $tasksSelect = Ox.Select({
            items: [
                {id: 'uploads', title: Ox._('Show Uploads')},
                {id: 'all', title: Ox._('Show All Tasks')}
            ],
            value: options.tasks,
            width: 128
        }).css({
            margin: '4px'
        }).bindEvent({
            change: updateList
        })
        .appendTo($sidebar),

        $usersSelect = Ox.Select({
            items: [
                {id: 'my', title: Ox._('Show My Tasks')},
                {id: 'all', title: Ox._('Show All Users')}
            ],
            width: 128
        }).css({
            display: pandora.site.capabilities.canSeeAllTasks[
                pandora.user.level
            ] ? 'block' : 'none',
            margin: '8px 4px 4px 4px'
        }).bindEvent({
            change: function(data) {
                $list[data.value == 'all' ? 'addColumn' : 'removeColumn']('user');
                $list.resizeColumn('title', data.value == 'all' ? 144 : 288);
                setTimeout(updateList);
            }
        })
        .appendTo($sidebar),

        $button = Ox.Button({
            disabled: true,
            title: Ox._('Cancel Task'),
            width: 128
        }).css({
            margin: '4px',
        }).bindEvent({
            click: function() {
                $button.options({disabled: true});
                var ids = $list.options('selected').filter(canBeCanceled);
                canceling.push(ids);
                ids.forEach(function(id) {
                    if (Ox.contains(
                        ['pending', 'uploading'], $list.value(id, 'status')
                    )) {
                        pandora.uploadQueue.remove(id);
                    }
                })
                pandora.api.cancelTask({
                    id: ids
                }, function() {
                    canceling = canceling.filter(function(id) {
                        return !Ox.contains(ids, id);
                    });
                    getServerItems();
                });
            }
        }).appendTo($sidebar),

        $panel = Ox.SplitPanel({
            elements: [
                {
                    element: $list,
                    size: 752
                },
                {
                    element: $sidebar,
                }
            ],
            orientation: 'horizontal'
        }),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'done',
                    title: Ox._('Done')
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: $panel,
            height: 384,
            removeOnClose: true,
            title: Ox._('Tasks'),
            width: 896
        })
        .bindEvent({
            close: function() {
                clientTimeout && clearTimeout(clientTimeout);
                serverTimeout && clearTimeout(serverTimeout);
            },
            open: function() {
                getClientItems();
                getServerItems();
            }
        });

    function canBeCanceled(id) {
        return !Ox.contains(
            ['cancelled', 'failed', 'finished'],
            $list.value(id, 'status')
        ) && !Ox.contains(canceling, id);
    }

    function getClientItems(callback) {
        clearTimeout(clientTimeout);
        var uploads = pandora.uploadQueue.get();
        var uploadsById = {};
        uploads.forEach(function(upload) {
            uploadsById[upload.item.id] = (
                uploadsById[upload.item.id] || []
            ).concat(upload);
        });
        clientItems = []
        Ox.forEach(uploadsById, function(uploads, id) {
            // FIXME: include upload.file.size
            var progress = Math.round(Ox.sum(uploads.map(function(upload) {
                return upload.data.progress / uploads.length;
            })) * 100);
            var status = uploads.map(function(upload) {
                return upload.data.status;
            });
            clientItems.push({
                ended: uploads.every(function(upload) {
                    return upload.data.ended;
                }) ? Ox.max(uploads.map(function(upload) {
                    return upload.data.ended;
                })) : '',
                id: id,
                progress: progress,
                started: Ox.min(uploads.map(function(upload) {
                    return upload.data.started;
                })),
                status: Ox.contains(status, 'uploading') ? 'uploading'
                    : Ox.contains(status, 'pending') ? 'pending'
                    : Ox.contains(status, 'canceled') ? 'canceled'
                    : 'queued',
                title: uploads[0].item.title,
                user: pandora.user.username
            });
        });
        clientTimeout = setTimeout(getClientItems, 1000);
        updateValues();
        callback && callback();
    }

    function getListItems() {
        var allTasks = $tasksSelect.value() == 'all',
            uploading = allTasks
                ? ['pending', 'uploading']
                : ['pending', 'uploading', 'queued'],
            items = clientItems.filter(function(item) {
                return Ox.contains(uploading, item.status);
            }),
        items = serverItems.filter(function(item) {
            return allTasks ? (
                Ox.getIndex(items, 'id', item.item) == -1
                || item.user != pandora.user.username
            ) : (
                Ox.getIndex(items, 'id', item.item) == -1
                && Ox.getIndex(clientItems, 'id', item.item) > -1
            );
        }).concat(items);
        return items;
    }

    function getServerItems(callback) {
        clearTimeout(serverTimeout);
        pandora.api.getTasks($usersSelect.value() == 'all' ? {} : {
            user: pandora.user.username
        }, function(result) {
            serverItems = result.data.items;
            serverTimeout = setTimeout(getServerItems, 10000);
            getClientItems(callback);
        });
    }

    function updateButton() {
        var ids = $list.options('selected').filter(canBeCanceled);
        $button.options({
            disabled: ids.length == 0,
            title: ids.length < 2 ? 'Cancel Task' : 'Cancel Tasks'
        });
    }

    function updateList() {
        getServerItems(function() {
            listItems= getListItems();
            $list.options({items: listItems});
            updateButton();
        });
    }

    function updateValues() {
        var currentListItems = getListItems(),
            hasNewItems = currentListItems.length != listItems.length;
        !hasNewItems && currentListItems.forEach(function(item) {
            if (Ox.getIndexById(listItems, item.id) == -1) {
                hasNewItems = true;
            } else if (!hasNewItems) {
                ['progress', 'status'].concat(
                    item.ended ? ['ended'] : []
                ).forEach(function(key) {
                    $list.value(item.id, key, item[key]);
                });
            }
        });
        hasNewItems && updateList();
    }

    return that;
  
};
