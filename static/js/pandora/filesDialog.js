// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.filesDialog = function() {

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        formWidth = 272 + Ox.UI.SCROLLBAR_SIZE,

        $findSelect = Ox.Select({
                items: [
                    {id: 'all', title: 'Find: All'},
                    {id: 'username', title: 'Find: Username'},
                    {id: 'filename', title: 'Find: Filename'}
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
                        id: 'username',
                        operator: '+',
                        title: 'Username',
                        visible: true,
                        width: 128
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return value.split('.').slice(0, -1).join('.')
                        },
                        id: 'filename',
                        operator: '+',
                        title: 'Filename',
                        visible: true,
                        width: 192
                    },
                    {
                        format: function(value) {
                            return value.split('.').pop();
                        },
                        id: 'extension',
                        operator: '+',
                        title: 'Extension',
                        visible: true,
                        width: 64
                    },
                    {
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
                        id: 'description',
                        operator: '+',
                        title: 'Description',
                        visible: true,
                        width: 192
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
                    },
                    {
                        align: 'right',
                        id: 'matches',
                        operator: '-',
                        title: 'Matches',
                        visible: true,
                        width: 64
                    }
                ],
                columnsVisible: true,
                items: pandora.api.findFiles,
                query: {
                    conditions: pandora.user.ui.showAllFiles ? [] : [
                        {key: 'username', value: pandora.user.username, operator: '=='}
                    ],
                    operator: '&'
                },
                scrollbarVisible: true,
                sort: [{key: 'username', operator: '+'}],
                unique: 'id'
            })
            .bindEvent({
                init: function(data) {
                    $status.html(
                        Ox.formatNumber(data.items)
                        + ' file' + (data.items == 1 ? '' : 's')
                    );
                },
                select: selectFile
            }),

        $formLabel = Ox.Label({
                textAlign: 'center',
                title: 'No file selected',
                width: 212
            })
            .css({float: 'left', margin: '4px 2px 4px 4px'}),

        $formElement = Ox.Element().css({overflowY: 'scroll'}),

        $form,

        $formToolbar = Ox.Bar({size: 24}),

        $deleteButton = Ox.Button({
                title: 'Delete File...'
            })
            .css({margin: '4px'})
            .hide()
            .bindEvent({
                click: deleteFile
            })
            .appendTo($formToolbar),

        $uploadButton = Ox.FileButton({
                maxFiles: 1,
                title: 'Upload File...'
            })
            .css({align: 'right', margin: '4px'})
            .bindEvent({
                click: uploadFile
            })
            .appendTo($formToolbar)

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
                                        .append($formLabel),
                                    size: 24
                                },
                                {
                                    element: $form
                                },
                                {
                                    element: $toolbar,
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
            })
            .bindEvent({
                resize: setHeight
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
        pandora.ui.deleteFileDialog(function() {
            // ...
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
            editable = file.username == pandora.user.username
                || pandora.site.capabilities.canEditFiles[pandora.user.level];
        return Ox.Form({
            items: [
                Ox.Input({
                    disabled: true,
                    id: 'username',
                    label: 'Username',
                    labelWidth: 80,
                    value: file.username,
                    width: formWidth - 16
                }),
                Ox.Input({
                    disabled: !editable,
                    id: 'filename',
                    label: 'Filename',
                    labelWidth: 80,
                    value: file.filename,
                    width: formWidth - 16
                }),
                Ox.Input({
                    disabled: true,
                    id: 'extension',
                    label: 'Extension',
                    labelWidth: 80,
                    value: file.extension,
                    width: formWidth - 16
                }),
                Ox.Input({
                    disabled: true,
                    id: 'size',
                    label: 'Size',
                    labelWidth: 80,
                    value: Ox.formatValue(file.size, 'B'),
                    width: formWidth - 16
                }),
                Ox.Input({
                    disabled: !editable,
                    height: dialogHeight - 184,
                    id: 'description',
                    placeholder: 'Description',
                    type: 'textarea',
                    value: file.description,
                    width: formWidth - 16
                })
            ],
            width: 240
        })
        .css({margin: '8px'})
        .bindEvent({
            change: function(event) {
                var data = Ox.extend({id: file.id}, event.id, event.data.value);
                pandora.api.editFile(data, function(result) {
                    $list.value(result.data.id, event.id, result.data[event.id]);
                    if (event.id == 'filename') {
                        $list.value(file.id, 'id', result.data.id);
                    }
                    Ox.Request.clearCache('findFiles');
                });
            }
        });
    }

    function renderPreview(id) {
        var isImage = Ox.contains(['jpg', 'png'], id.split('.').pop());
        return $('<img>')
            .attr({
                src: '/files/' + id + (isImage ? '' : '.jpg')
            })
            .css({
                maxWidth: formWidth - 16 + 'px',
                maxHeight: formWidth - 16 + 'px',
            });
    }

    function selectFile(id) {
        var editable = file.username == pandora.user.username
            || pandora.site.capabilities.canEditFiles[pandora.user.level];
        setLabel(id);
        if (id) {
            $preview = renderPreview(id).appendTo($formElement);
            $form = renderForm(id).appendTo($formElement);
            $deleteButton.options({disabled: !editable}).show();
        } else {
            $formElement.empty();
            $deleteButton.hide();
        }
    }

    function setHeight(data) {
        var $item = getFormItemById('description');
        $item && $item.options({height: data.height - 160)});
    }

    function setLabel(id) {
        $formLabel.options({
            title: id
                ? id.split(':').slice(1).join(':')
                : 'No file selected'
        });
    }

    function setWidth() {
        formWidth = $content.size(1);
        $formLabel.options({width: formWidth - 44});
        $form && $form.options('items').forEach(function($item) {
            $item.options({width: formWidth - 16});
        });
        $status.css({right: formWidth + 128 + 'px'});
    }

    function updateList() {
        var key = $findSelect.value(),
            value = $findInput.value(),
            query = {
                conditions: value
                    ? [].concat(
                        key != 'filename' ? [{key: 'username', value: value, operator: '='}] : [],
                        key != 'username' ? [{key: 'filename', value: value, operator: '='}] : []
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

