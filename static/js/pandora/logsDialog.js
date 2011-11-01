// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.logsDialog = function() {

    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = Math.round(window.innerWidth * 0.9),
        numberOfLogs = 0,

        $findSelect = Ox.Select({
                items: [
                    {id: 'all', title: 'Find: All', checked: true},
                    {id: 'url', title: 'Find: Url'},
                    {id: 'user', title: 'Find: User'}
                ],
                overlap: 'right',
                type: 'image'
            })
            .bindEvent({
                change: function(data) {
                    var key = data.selected[0].id,
                        value = $findInput.value();
                    value && updateList(key, value);
                    $findInput.options({
                        placeholder: data.selected[0].title
                    });
                }
            }),

        $findInput = Ox.Input({
                changeOnKeypress: true,
                clear: true,
                placeholder: 'Find: All',
                width: 192
            })
            .bindEvent({
                change: function(data) {
                    var key = $findSelect.value(),
                        value = data.value;
                    updateList(key, value);
                }
            }),

        $findElement = Ox.FormElementGroup({
                elements: [
                    $findSelect,
                    $findInput
                ]
            })
            .css({float: 'right', margin: '4px'}),

        $list = Ox.TextList({
                columns: [
                    {
                        id: 'id',
                        title: 'ID',
                        unique: true,
                        visible: false,
                    },
                    {
                        id: 'url',
                        title: 'URL',
                        operator: '+',
                        visible: true,
                        width: 420
                    },
                    {
                        id: 'line',
                        title: 'Line',
                        operator: '+',
                        visible: true,
                        width: 48 
                    },
                    {
                        format: function(value) {
                            return value.replace(/[TZ]/g, ' ');
                        },
                        align: 'right',
                        id: 'created',
                        operator: '-',
                        title: 'Date',
                        visible: true,
                        width: 128
                    },
                    {
                        id: 'user',
                        title: 'User',
                        visible: false,
                        width: 128
                    },
                    {
                        id: 'text',
                        title: 'Text',
                        visible: false,
                        width: 300
                    },
                ],
                columnsRemovable: true,
                columnsVisible: true,
                items: pandora.api.findLogs,
                keys: ['text'],
                scrollbarVisible: true,
                sort: [
                    {key: 'created', operator: '-'}
                ]
            })
            .bindEvent({
                init: function(data) {
                    numberOfLogs = data.items;
                    $status.html(
                        Ox.formatNumber(numberOfLogs)
                        + ' log ' + (numberOfLogs == 1 ? 'entry' : 'entries')
                    );
                },
                select: function(data) {
                    var values;
                    $log.empty();
                    if (data.ids.length) {
                        values = $list.value(data.ids[0]);
                        $logLabel.options({
                            title: values.url
                        });
                        $log.append(renderLog(values));
                    } else {
                        $logLabel.options({title: 'No logs selected'});
                    }
                },
                'delete': function(data) {
                    pandora.api.removeLogs({ids: data.ids}, function(result) {
                        $list.reloadList();
                    });
                }
            }),

        $logLabel = Ox.Label({
                textAlign: 'center',
                title: 'No logs selected',
                width: 604
            })
            .css({margin: '4px'}),

        $log = Ox.Element({}),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                        id: 'done',
                        title: 'Done',
                        width: 48
                    }).bindEvent({
                        click: function() {
                            that.close();
                        }
                    })
            ],
            closeButton: true,
            content: Ox.SplitPanel({
                elements: [
                    {
                        element: Ox.SplitPanel({
                            elements: [
                                {
                                    element: Ox.Bar({size: 24})
                                        .append($status)
                                        .append(
                                            $findElement
                                        ),
                                    size: 24
                                },
                                {
                                    element: $list
                                }
                            ],
                            orientation: 'vertical'
                        })
                    },
                    {
                        element: Ox.SplitPanel({
                            elements: [
                                {
                                    element: Ox.Bar({size: 24})
                                        .append($logLabel),
                                    size: 24
                                },
                                {
                                    element: $log
                                }
                            ],
                            orientation: 'vertical'
                        }),
                        size: 612 
                    }
                ],
                orientation: 'horizontal'
            }),
            height: height,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            padding: 0,
            title: 'Manage Logs',
            width: width
        }),

        $status = $('<div>')
            .css({
                position: 'absolute',
                top: '4px',
                left: '4px',
                right: '256px',
                bottom: '4px',
                paddingTop: '2px',
                fontSize: '9px',
                textAlign: 'center',
            })
            .appendTo(that.$element.find('.OxButtonsbar'));


    function renderLog(logData) {
        var $checkbox;
        return Ox.Element()
            .css({
                padding: '8px'
            })
            .append($('<pre>').html(logData.text));
    }

    function updateList(key, value) {
        var query = {
                conditions: Ox.merge(
                    key != 'url' ? [{key: 'user', value: value, operator: '='}] : [],
                    key != 'user' ? [{key: 'url', value: value, operator: '='}] : []
                ),
                operator: key == 'all' ? '|' : '&'
            };
        $list.options({
            items: function(data, callback) {
                return pandora.api.findLogs(Ox.extend(data, {
                    query: query
                }), callback);
            }
        });
    }

    return that;

};

