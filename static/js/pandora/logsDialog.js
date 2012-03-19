// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.logsDialog = function() {
    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = Math.round(window.innerWidth * 0.9),
        numberOfLogs = 0,

        $findSelect = Ox.Select({
                items: [
                    {id: 'all', title: 'Find: All'},
                    {id: 'user', title: 'Find: User'},
                    {id: 'url', title: 'Find: URL'},
                    {id: 'text', title: 'Find: Text'}
                ],
                overlap: 'right',
                type: 'image',
                value: 'all'
            })
            .bindEvent({
                change: function(data) {
                    var key = data.value,
                        value = $findInput.value();
                    value && updateList(key, value);
                    $findInput.options({
                        placeholder: data.title
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
                        format: function(value) {
                            return Ox.encodeHTMLEntities(value);
                        },
                        id: 'user',
                        operator: '+',
                        title: 'User',
                        visible: true,
                        width: 72
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return value.replace(/[TZ]/g, ' ');
                        },
                        id: 'created',
                        operator: '-',
                        title: 'Date',
                        visible: true,
                        width: 144
                    },
                    {
                        format: function(value, data) {
                            return formatURL(value, data.line);
                        },
                        id: 'url',
                        operator: '+',
                        title: 'URL',
                        visible: true,
                        width: 320
                    },
                    {
                        format: function(value) {
                            return Ox.encodeHTMLEntities(value);
                        },
                        id: 'text',
                        operator: '+',
                        title: 'Text',
                        visible: true,
                        width: 640
                    },
                ],
                columnsMovable: true,
                columnsResizable: true,
                columnsVisible: true,
                items: pandora.api.findLogs,
                keys: ['line'],
                scrollbarVisible: true,
                sort: [
                    {key: 'created', operator: '-'}
                ]
            })
            .bindEvent({
                init: function(data) {
                    numberOfLogs = data.items;
                    $status.html(
                        Ox.formatNumber(numberOfLogs) + ' '
                        + (numberOfLogs == 1 ? 'entry' : 'entries')
                    );
                },
                'delete': function(data) {
                    pandora.api.removeLogs({ids: data.ids}, function(result) {
                        Ox.Request.clearCache('findLogs');
                        $list.reloadList();
                    });
                },
                open: function(data) {
                    var value = $list.value(Ox.last(data.ids)),
                        $dialog;
                    if (/^Traceback/.test(value.text)) {
                        $dialog = Ox.Dialog({
                            buttons: [
                                Ox.Button({
                                    id: 'close',
                                    title: 'Close'
                                })
                                .bindEvent({
                                    click: function() {
                                        $dialog.close();
                                    }
                                })
                            ],
                            closeButton: true,
                            content: $('<code>').append($('<pre>').css({
                                margin: '16px',
                                MozUserSelect: 'text',
                                WebkitUserSelect: 'text'
                            }).text(value.text)),
                            height: height - 48,
                            keys: {enter: 'close', escape: 'close'},
                            maximizeButton: true,
                            removeOnClose: true,
                            title: formatURL(value.url, value.line),
                            width: width - 48
                        })
                        .open();
                    }
                }
            }),

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
            }),
            height: height,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            padding: 0,
            removeOnClose: true,
            title: 'Manage Logs',
            width: width
        }),

        $status = $('<div>')
            .css({
                position: 'absolute',
                top: '4px',
                left: '128px',
                right: '128px',
                bottom: '4px',
                paddingTop: '2px',
                fontSize: '9px',
                textAlign: 'center',
            })
            .appendTo(that.$element.find('.OxButtonsbar'));

    that.superClose = that.close;
    that.close = function() {
        Ox.Request.clearCache('findLogs');
        that.superClose();
    };

    function formatURL(url, line) {
        return Ox.encodeHTMLEntities(url.split('?')[0]) + ':' + line;
    }

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

