'use strict';

pandora.ui.tasksDialog = function() {

    var canceling = [],

        timeout,

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
                    id: 'title',
                    operator: '+',
                    title: Ox._('Title'),
                    visible: true,
                    width: 256
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
                    format: function(value) {
                        return Ox.toTitleCase(value);
                    },
                    id: 'status',
                    operator: '+',
                    sort: function(value) {
                        return [
                            'queued', 'uploading', 'importing', 'processing',
                            'canceled', 'failed', 'finished'
                        ].indexOf(value);
                    },
                    title: Ox._('Status'),
                    visible: true,
                    width: 96
                }
            ],
            columnsVisible: true,
            items: [],
            sort: [{key: 'ended', operator: '-'}],
            unique: 'id'
        }).bindEvent({
            select: updateButton
        }),

        $sidebar = Ox.Element().css({
            margin: '4px'
        }),

        $checkbox = Ox.Checkbox({
            title: Ox._('Show All Tasks')
        }).css({
            display: true || pandora.site.capabilities.canSeeAllTasks[
                pandora.user.level
            ] ? 'block' : 'none',
            margin: '4px'
        }).bindEvent({
            change: getItems
        })
        .appendTo($sidebar),

        $button = Ox.Button({
            disabled: true,
            title: Ox._('Cancel Task'),
            width: 112
        }).css({
            margin: '4px',
        }).bindEvent({
            click: function() {
                var ids = $list.options('selected').filter(canBeCanceled);
                canceling.push(ids);
                $button.options({disabled: true});
                pandora.api.cancelTask({
                    id: ids
                }, function() {
                    canceling = [];
                    getItems();
                });
            }
        }).appendTo($sidebar),

        $panel = Ox.SplitPanel({
            elements: [
                {
                    element: $list,
                    size: 640
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
            title: Ox._('Tasks'),
            width: 768
        })
        .bindEvent({
            close: function() {
                clearTimeout(timeout);
            },
            open: getItems
        });

    function canBeCanceled(id) {
        return !Ox.contains(
            ['cancelled', 'failed', 'finished'],
            $list.value(id, 'status')
        ) && !Ox.contains(canceling, id);
    }

    function getItems() {
        clearTimeout(timeout);
        pandora.api.getTasks($checkbox.value() ? {} : {
            user: pandora.user.username
        }, function(result) {
            $list.options({items: result.data.items})
            updateButton()
        });
        timeout = setTimeout(getItems, 15000);
    }

    function updateButton() {
        var ids = $list.options('selected').filter(canBeCanceled);
        $button.options({
            disabled: ids.length == 0,
            title: ids.length < 2 ? 'Cancel Task' : 'Cancel Tasks'
        });
    }

    return that;
  
};
