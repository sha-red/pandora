'use strict';

pandora.ui.errorlogsDialog = function() {

    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = Math.round(window.innerWidth * 0.9),

        $reloadButton = Ox.Button({
                disabled: true,
                title: 'redo',
                tooltip: Ox._('Reload'),
                type: 'image'
            })
            .css({float: 'left', margin: '4px'})
            .bindEvent({
                click: function() {
                    $reloadButton.options({disabled: true});
                    Ox.Request.clearCache('findErrorLogs');
                    $list.reloadList(true);
                }
            }),

        findFields = [
            {id: 'all', title: Ox._('Find: All')},
            {id: 'user', title: Ox._('Find: User')},
            {id: 'url', title: Ox._('Find: URL')},
            {id: 'text', title: Ox._('Find: Text')}
        ],
        findFieldKeys = findFields.slice(1).map(function(f) { return f.id; }),
        $findSelect = Ox.Select({
                items: findFields,
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
                placeholder: Ox._('Find: All'),
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

        $list = Ox.TableList({
                columns: [
                    {
                        id: 'id',
                        title: Ox._('ID'),
                        visible: false
                    },
                    {
                        format: function(value) {
                            return Ox.formatDate(value, "%Y-%m-%d %H:%M:%S");
                        },
                        id: 'created',
                        operator: '-',
                        title: Ox._('Date'),
                        visible: true,
                        width: 160
                    },
                    {
                        format: function(value) {
                            return Ox.encodeHTMLEntities(value);
                        },
                        id: 'user',
                        operator: '+',
                        title: Ox._('User'),
                        visible: true,
                        width: 160
                    },
                    {
                        format: function(value, data) {
                            return formatURL(value, data.line);
                        },
                        id: 'url',
                        operator: '+',
                        title: Ox._('URL'),
                        visible: true,
                        width: 320
                    },
                    {
                        format: function(value) {
                            return Ox.encodeHTMLEntities(value);
                        },
                        id: 'text',
                        operator: '+',
                        title: Ox._('Text'),
                        visible: true,
                        width: 640
                    },
                ],
                columnsMovable: true,
                columnsResizable: true,
                columnsVisible: true,
                items: pandora.api.findErrorLogs,
                keys: ['line'],
                scrollbarVisible: true,
                sort: [{key: 'created', operator: '-'}],
                unique: 'id'
            })
            .bindEvent({
                init: function(data) {
                    $status.html(Ox.toTitleCase(
                        Ox.formatCount(data.items, 'entry', 'entries')
                    ));
                },
                'delete': function(data) {
                    pandora.api.removeErrorLogs({ids: data.ids}, function(result) {
                        Ox.Request.clearCache('findErrorLogs');
                        $list.reloadList();
                    });
                },
                load: function() {
                    $reloadButton.options({disabled: false});
                },
                open: function(data) {
                    var value = $list.value(Ox.last(data.ids)),
                        $dialog;
                    $dialog = Ox.Dialog({
                        buttons: [
                            Ox.Button({
                                id: 'close',
                                title: Ox._('Close')
                            })
                            .bindEvent({
                                click: function() {
                                    $dialog.close();
                                }
                            })
                        ],
                        closeButton: true,
                        content: $('<code>').append(
                            $('<pre>')
                                .addClass('OxSelectable')
                                .css({margin: '16px'})
                                .text(value.text)
                        ),
                        height: height - 48,
                        keys: {enter: 'close', escape: 'close'},
                        maximizeButton: true,
                        removeOnClose: true,
                        title: formatURL(value.url, value.line),
                        width: width - 48
                    })
                    .open();
                }
            }),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                        id: 'done',
                        title: Ox._('Done'),
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
                            .append($reloadButton)
                            .append($findElement),
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
            title: Ox._('Error Logs'),
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
                textAlign: 'center'
            })
            .appendTo(that.find('.OxButtonsbar'));

    that.superClose = that.close;
    that.close = function() {
        Ox.Request.clearCache('findErrorLogs');
        that.superClose();
    };

    function formatURL(url, line) {
        return Ox.encodeHTMLEntities(url.split('?')[0]) + ':' + line;
    }

    function updateList(key, value) {
        var keys = key == 'all' ? findFieldKeys : [key];
        var query = {
                conditions: keys.map(function(k) {
                    return {key: k, value: value, operator: '='};
                }),
                operator: '|'
            };
        $list.options({
            items: function(data, callback) {
                return pandora.api.findErrorLogs(Ox.extend(data, {
                    query: query
                }), callback);
            }
        });
    }

    return that;

};
