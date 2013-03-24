// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.filesDialog = function() {

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        itemWidth = 256,

        $findSelect = Ox.Select({
                items: [
                    {id: 'all', title: 'Find: All'},
                    {id: 'user', title: 'Find: Username'},
                    {id: 'file', title: 'Find: Filename'}
                ],
                overlap: 'right',
                type: 'image'
            })
            .bindEvent({
                change: function(data) {
                    $findInput.value() && updateList();
                    $findInput.options({placeholder: data.title});
                }
            }),

        $findInput = Ox.Input({
                changeOnKeypress: true,
                clear: true,
                placeholder: 'Find: All',
                width: 192
            })
            .bindEvent({
                change: updateList
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
                        id: 'user',
                        operator: '+',
                        title: 'Username',
                        visible: true,
                        width: 128
                    },
                    {
                        align: 'right',
                        id: 'name',
                        operator: '+',
                        title: 'Filename',
                        visible: true,
                        width: 256
                    },
                    {
                        id: 'extension',
                        operator: '+',
                        title: 'Extension',
                        visible: true,
                        width: 64
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return Ox.formatValue(value, 'B');
                        },
                        id: 'size',
                        operator: '-',
                        title: 'Size',
                        visible: true,
                        width: 64
                    },
                    {
                        align: 'right',
                        id: 'matches',
                        operator: '-',
                        title: 'Matches',
                        visible: true,
                        width: 64
                    },
                    {
                        id: 'description',
                        operator: '+',
                        title: 'Description',
                        visible: true,
                        width: 256
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return Ox.formatDate(value, '%F %T');
                        },
                        id: 'created',
                        operator: '-',
                        title: 'Created',
                        visible: true,
                        width: 144
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return Ox.formatDate(value, '%F %T');
                        },
                        id: 'modified',
                        operator: '-',
                        title: 'Modified',
                        visible: true,
                        width: 144
                    }
                ],
                columnsVisible: true,
                items: pandora.api.findFiles,
                keys: ['ratio'],
                query: {conditions: [], operator: '&'},
                scrollbarVisible: true,
                sort: [{key: 'user', operator: '+'}],
                unique: 'id'
            })
            .bindEvent({
                init: function(data) {
                    $status.html(
                        Ox.formatNumber(data.items)
                        + ' file' + (data.items == 1 ? '' : 's')
                    );
                },
                select: function(data) {
                    selectFile(data.ids[0]);
                }
            }),

        $itemLabel = Ox.Label({
                textAlign: 'center',
                title: 'No file selected',
                width: 248
            })
            .css({margin: '4px'}),

        $item = Ox.Element().css({overflowY: 'scroll'}),

        $preview,

        $form,

        $itemToolbar = Ox.Bar({size: 24}),

        $deleteButton = Ox.Button({
                title: 'Delete File...',
                width: 96
            })
            .css({float: 'left', margin: '4px'})
            .hide()
            .bindEvent({
                click: deleteFile
            })
            .appendTo($itemToolbar),

        $uploadButton = Ox.FileButton({
                maxFiles: 1,
                title: 'Upload File...',
                width: 96
            })
            .css({float: 'right', margin: '4px'})
            .bindEvent({
                click: uploadFile
            })
            .appendTo($itemToolbar),

        $content = Ox.SplitPanel({
            elements: [
                {
                    element: Ox.SplitPanel({
                        elements: [
                            {
                                element: Ox.Bar({size: 24})
                                    .append($findElement),
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
                                        .append($itemLabel),
                                    size: 24
                                },
                                {
                                    element: $item
                                },
                                {
                                    element: $itemToolbar,
                                    size: 24
                                }
                            ],
                            orientation: 'vertical'
                        })
                        .bindEvent({
                            resize: setWidth
                        }),
                    resizable: true,
                    resize: [256, 384, 512],
                    size: 256
                }
            ],
            orientation: 'horizontal'
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
                content: $content,
                height: dialogHeight,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                padding: 0,
                removeOnClose: true,
                title: 'Manage Users',
                width: dialogWidth
            }),

        $status = $('<div>')
            .css({
                position: 'absolute',
                top: '4px',
                left: '128px',
                right: '384px',
                bottom: '4px',
                paddingTop: '2px',
                fontSize: '9px',
                textAlign: 'center'
            })
            .appendTo(that.find('.OxButtonsbar'));

    that.superClose = that.close;
    that.close = function() {
        Ox.Request.clearCache('findFiles');
        that.superClose();
    };

    function deleteFile() {
        pandora.ui.deleteFileDialog($list.options('selected')[0], function() {
            Ox.Request.clearCache('findFiles');
            $list.reloadList();
        }).open();
    }

    function getFormItemById(id) {
        var ret;
        Ox.forEach((
            $formButton.value() == 'edit' ? $editForm : $mailForm
        ).options('items'), function($item) {
            if ($item.options('id') == id) {
                ret = $item;
                return false;
            }
        });
        return ret;
    };

    function renderForm(id) {
        var file = $list.value(id),
            editable = file.user == pandora.user.username
                || pandora.site.capabilities.canEditFiles[pandora.user.level];
        return Ox.Form({
            items: [
                Ox.Input({
                    disabled: true,
                    id: 'username',
                    label: 'Username',
                    labelWidth: 80,
                    value: file.user,
                    width: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE
                }),
                Ox.Input({
                    disabled: !editable,
                    id: 'name',
                    label: 'Filename',
                    labelWidth: 80,
                    value: file.name,
                    width: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE
                }),
                Ox.Input({
                    disabled: true,
                    id: 'extension',
                    label: 'Extension',
                    labelWidth: 80,
                    value: file.extension,
                    width: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE
                }),
                Ox.Input({
                    disabled: true,
                    id: 'size',
                    label: 'Size',
                    labelWidth: 80,
                    value: Ox.formatValue(file.size, 'B'),
                    width: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE
                }),
                Ox.Input({
                    disabled: !editable,
                    height: dialogHeight - 184,
                    id: 'description',
                    placeholder: 'Description',
                    type: 'textarea',
                    value: file.description,
                    width: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE
                })
            ],
            width: 240
        })
        .css({margin: '12px 8px 8px 8px'})
        .bindEvent({
            change: function(event) {
                var data = Ox.extend({id: file.id}, event.id, event.data.value);
                pandora.api.editFile(data, function(result) {
                    $list.value(result.data.id, event.id, result.data[event.id]);
                    if (event.id == 'name') {
                        $list.value(file.id, 'id', result.data.id);
                    }
                    Ox.Request.clearCache('findFiles');
                });
            }
        });
    }

    function renderPreview(id) {
        var isImage = Ox.contains(['jpg', 'png'], id.split('.').pop()),
            src = '/files/' + id + (isImage ? '' : '.jpg'),
            width = itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE,
            height = Math.round(width / $list.value(id, 'ratio'))
        return Ox.ImageElement({
                height: height,
                src: src,
                width: width
            })
            .css({
                margin: '4px',
                borderRadius: '8px'
            });
    }

    function selectFile(id) {
        var file = $list.value(id),
            editable = file.user == pandora.user.username
                || pandora.site.capabilities.canEditFiles[pandora.user.level];
        setLabel(id);
        $item.empty();
        if (id) {
            $preview = renderPreview(id).appendTo($item);
            $form = renderForm(id).appendTo($item);
            $deleteButton.options({disabled: !editable}).show();
        } else {
            $deleteButton.hide();
        }
    }

    function setLabel(id) {
        $itemLabel.options({
            title: id
                ? id.split(':').slice(1).join(':')
                : 'No file selected'
        });
    }

    function setWidth() {
        itemWidth = $content.size(1);
        $itemLabel.options({width: itemWidth - 8});
        $preview && $preview.css({
            maxWidth: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE,
            maxHeight: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE
        });
        $form && $form.options('items').forEach(function($item) {
            $item.options({width: itemWidth - 16 - Ox.UI.SCROLLBAR_SIZE});
        });
        $status.css({right: itemWidth + 128 + 'px'});
    }

    function updateList() {
        var key = $findSelect.value(),
            value = $findInput.value(),
            query = {
                conditions: value
                    ? [].concat(
                        key != 'name' ? [{key: 'user', value: value, operator: '='}] : [],
                        key != 'user' ? [{key: 'name', value: value, operator: '='}] : []
                    )
                    : [],
                operator: '|'
            };
        $list.options({query: query});
    }

    function uploadFile(data) {
        pandora.ui.uploadFileDialog(data.files[0], function(file) {
            Ox.Request.clearCache('findFiles');
            pandora.api.findFiles({
                ids: [file.id],
                query: $list.options.query,
                sort: $list.options.sort,
            }, function(data) {
                $list.bindEventOnce({
                    load: function() {
                        list.options({selected: [file.id]});
                        // selectFile(file.id);
                    }
                });
                if (data.positions[file.id] > -1) {
                    $list.reloadList();
                } else {
                    $list.options({
                        query: {conditions: [], operator: '&'}
                    });
                }
            });
        }).open();
    }

    return that;

};

