// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.documentsPanel = function(options) {

    var ui = pandora.user.ui,

        hasItemView = false,
        isItemView = false,

        columns = [
            {
                id: 'type',
                operator: '+',
                title: Ox._('Type'),
                visible: true,
                width: 128
            },
            {
                id: 'name',
                operator: '+',
                title: Ox._('Name'),
                visible: true,
                width: 256
            },
            {
                format: function(value) {
                    return value.toUpperCase();
                },
                id: 'extension',
                operator: '+',
                title: Ox._('Extension'),
                visible: true,
                width: 64
            },
            {
                align: 'right',
                format: function(value) {
                    return Ox.isArray(value)
                        ? Ox.formatDimensions(value, 'px')
                        : Ox.formatCount(value, 'page');
                },
                id: 'dimensions',
                operator: '-',
                title: Ox._('Dimensions'),
                visible: true,
                width: 128
            },
            {
                align: 'right',
                format: function(value) {
                    return Ox.formatValue(value, 'B');
                },
                id: 'size',
                operator: '-',
                title: Ox._('Size'),
                visible: true,
                width: 64
            },
            {
                id: 'description',
                operator: '+',
                title: Ox._('Description'),
                visible: true,
                width: 256
            },
            {
                align: 'right',
                id: 'matches',
                operator: '-',
                title: Ox._('Matches'),
                visible: true,
                width: 64
            },
            {
                id: 'user',
                operator: '+',
                title: Ox._('User'),
                visible: true,
                width: 128
            },
            {
                align: 'right',
                format: function(value) {
                    return Ox.formatDate(value, '%F %T');
                },
                id: 'created',
                operator: '-',
                title: Ox._('Created'),
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
                title: Ox._('Modified'),
                visible: true,
                width: 144
            }
        ],

        $listbar = Ox.Bar({size: 24}),

        $addButton = Ox.Button({
            title: isItemView ? 'add' : 'upload',
            tooltip: Ox._(isItemView ? 'Add Documents...' : 'Upload Documents...'),
            type: 'image'
        })
        .css({float: 'left', margin: '4px 2px 4px 4px'})
        .bindEvent({
            click: function() {
                
            }
        })
        .appendTo($listbar),

        $viewSelect = Ox.Select({
            items: [
                {id: 'list', title: Ox._('List')},
                {id: 'grid', title: Ox._('Grid')}
            ],
            width: 192
        })
        .css({float: 'left', margin: '4px 2px'})
        .bindEvent({
            change: function(data) {
                pandora.UI.set({documentsView: data.id});
            }
        })
        .appendTo($listbar),

        $sortSelect = Ox.Select({
            items: columns.map(function(column) {
                return {
                    id: column.id,
                    title: Ox._('Sort by ' + column.title)
                };
            }),
            width: 192
        })
        .bindEvent({
            change: function(data) {
                var key = data.value;
                pandora.UI.set({documentsSort: [{
                    key: key,
                    operator: Ox.getObjectById(columns, key).operator
                }]});
            }
        }),

        $orderButton = Ox.Button({
            overlap: 'left',
            title: getOrderButtonTitle(),
            tooltip: getOrderButtonTooltip(),
            type: 'image'
        })
        .bindEvent({
            click: function() {
                pandora.UI.set({documentsSort: [{
                    key: ui.documentsSort[0].key,
                    operator: ui.documentsSort[0].operator == '+' ? '-' : '+'
                }]});
            }
        }),

        $sortElement = Ox.FormElementGroup({
            elements: [$sortSelect, $orderButton],
            float: 'right'
        })
        .css({float: 'left', margin: '4px 2px'})
        .appendTo($listbar),

        $findSelect = Ox.Select({
            items: isItemView ? [
                {id: 'all', title: Ox._('Find: All')},
                {id: 'name', title: Ox._('Find: Name')}
            ] : [
                {id: 'all', title: Ox._('Find: All')},
                {id: 'name', title: Ox._('Find: Name')},
                {id: 'user', title: Ox._('Find: User')}
            ],
            overlap: 'right',
            type: 'image'
        })
        .bindEvent({
            change: function(data) {
                
            }
        }),

        $findInput = Ox.Input({
            changeOnKeypress: true,
            clear: true,
            placeholder: Ox._('Find: All'),
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
            .css({float: 'right', margin: '4px 4px 4px 2px'})
            .appendTo($listbar),

        $list = renderList(),

        $statusbar = Ox.Bar({size: 16}),

        $status = Ox.Element()
            .css({
                margin: '2px 4px',
                fontSize: '9px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            })
            .html(Ox._('Loading...'))
            .appendTo($statusbar),

        $listPanel = Ox.SplitPanel({
            elements: [
                {element: $listbar, size: 24},
                {element: $list},
                {element: $statusbar, size: 16}
            ],
            orientation: 'vertical'
        }),

        $itembar = Ox.Bar({size: 24}),

        $itemMenu = Ox.MenuButton({
            items: isItemView ? [
                {id: 'open', title: '', keyboard: 'enter'},
                {id: 'edit', title: ''},
                {id: 'remove', title: ''}
            ] : [
                {id: 'open', title: '', keyboard: 'enter'},
                {id: 'addtoitem', title: ''},
                {id: 'addtolist', title: ''},
                {id: 'replace', title: Ox._('Replace Document...')},
                {id: 'delete', title: '', keyboard: 'delete'}
            ],
            title: 'set',
            tooltip: 'Options'
        })
        .bindEvent({
            click: function() {
                
            }
        }),

        $selectButton = Ox.ButtonGroup({
            buttons: [
                {id: 'previous', title: 'left'},
                {id: 'next', title: 'right'}
            ],
            type: 'image'
        })
        .css({float: 'right', margin: '4px 2px'})
        .appendTo($itembar)
        .bindEvent({
            click: function(data) {
                
            }
        }),

        $deselectButton = Ox.Button({
            title: 'close',
            tooltip: Ox._('Done'),
            type: 'image'
        })
        .css({float: 'right', margin: '4px 4px 4px 2px'})
        .bindEvent({
            click: function() {
                pandora.UI.set(
                    'documentsSelection.' + (isItemView ? ui.item : ''),
                    []
                )
            }
        })
        .appendTo($itembar),

        $item = Ox.Element().css({overflowY: 'scroll'}),

        $preview,

        $form,

        $itemPanel = Ox.SplitPanel({
            elements: [
                {element: $itembar, size: 24},
                {element: $item}
            ],
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(data) {
                ui.sidebarSize = data.size;
            },
            resizeend: function(data) {
                // set to 0 so that UI.set registers a change of the value
                ui.documentSize = 0;
                pandora.UI.set({documentSize: data.size});
            },
            toggle: function() {
                pandora.UI.set({showDocument: !data.collapsed});
            }
        }),

        that = Ox.SplitPanel({
            elements: [
                {
                    element: $listPanel
                },
                {
                    collapsible: isItemView,
                    collapsed: !ui.showDocument,
                    element: $itemPanel,
                    size: ui.documentSize,
                    resizable: isItemView,
                    resize: isItemView ? [192, 256, 320, 384] : []
                }
            ],
            orientation: 'horizontal'
        })
        .bindEvent({
            pandora_documentssort: function(data) {
                updateSortElement();
                $list.options({sort: data.value});
            }
        });

    that.bindEvent(
        'documentsSelection.' + (isItemView ? ui.item : ''),
        selectDocuments
    );

    function addDocuments() {
        pandora.api.addDocument({
            item: ui.item,
            ids: $list.options('selected')
        }, function() {
            Ox.Request.clearCache();
            // ...
            $list.reloadList();
        });
    }

    function deleteDocuments() {
        pandora.ui.deleteDocumentDialog($list.options('selected'), function() {
            Ox.Request.clearCache();
            // ...
            $list.reloadList();
        }).open();
    }

    function getOrderButtonTitle() {
        return ui.documentsSort[0].operator == '+' ? 'up' : 'down';
    }

    function getOrderButtonTooltip() {
        return Ox._(ui.documentsSort[0].operator == '+' ? 'ascending' : 'descending');
    }

    function getPreviewSize() {
        var ratio = $list.value(selected[0], 'ratio'),
            size = ui.documentSize - 16 - Ox.UI.SCROLLBAR_SIZE,
            height = ratio > 1 ? size / ratio : size,
            width = ratio > 1 ? size : size * ratio,
            left = Math.floor((size - width) / 2);
        return {
            height: height,
            // fixme: CSS gets applied twice, to image and enclosing element
            margin: [8, 8, 8, 8 + left].map(function(px) {
                return Math.round(px / 2) + 'px';
            }).join(' '),
            width: width
        };
    }

    function removeDocuments() {
        pandora.api.removeDocument({
            item: ui.item,
            ids: $list.options('selected')
        }, function() {
            Ox.Request.clearCache();
            // ...
            $list.reloadList();
        });
    }

    function renderForm() {
        var item = $list.value(selected),
            editable = item.user == pandora.user.username
                || pandora.site.capabilities.canEditDocuments[pandora.user.level],
            inputWidth = ui.documentSize - 16 - Ox.UI.SCROLLBAR_SIZE,
            labelWidth = 80;
        return Ox.Form({
            items: [
                Ox.Input({
                    disabled: !editable,
                    id: 'name',
                    label: Ox._('Name'),
                    labelWidth: labelWidth,
                    value: item.name,
                    width: inputWidth
                }),
                Ox.Input({
                    disabled: true,
                    id: 'extension',
                    label: Ox._('Extension'),
                    labelWidth: labelWidth,
                    value: item.extension,
                    width: inputWidth
                }),
                Ox.Input({
                    disabled: true,
                    id: 'dimensions',
                    label: Ox._('Dimensions'),
                    labelWidth: labelWidth,
                    value: Ox.isArray(value)
                        ? Ox.formatDimensions(value, 'px')
                        : Ox.formatCount(value, 'page'),
                    width: inputWidth
                }),
                Ox.Input({
                    disabled: true,
                    id: 'size',
                    label: Ox._('Size'),
                    labelWidth: labelWidth,
                    value: Ox.formatValue(item.size, 'B'),
                    width: inputWidth
                }),
                Ox.Input({
                    disabled: true,
                    id: 'matches',
                    label: Ox._('Matches'),
                    labelWidth: labelWidth,
                    value: item.matches,
                    width: inputWidth
                }),
                Ox.Input({
                    disabled: true,
                    id: 'username',
                    label: Ox._('Username'),
                    labelWidth: labelWidth,
                    value: item.user,
                    width: inputWidth
                }),
                Ox.Input({
                    disabled: !editable,
                    id: 'type',
                    label: Ox._('Type'),
                    labelWidth: labelWidth,
                    value: item.type,
                    width: inputWidth
                }),
                Ox.Input({
                    disabled: !editable,
                    height: 256,
                    id: 'description',
                    placeholder: Ox._('Description'),
                    type: 'textarea',
                    value: item.description,
                    width: inputWidth
                })
            ],
            width: 240
        })
        .css({margin: '12px 8px 8px 8px'})
        .bindEvent({
            change: function(event) {
                var data = Ox.extend({id: item.id}, event.id, event.data.value);
                pandora.api.editDocument(data, function(result) {
                    $list.value(result.data.id, event.id, result.data[event.id]);
                    if (event.id == 'name') {
                        $list.value(item.id, 'id', result.data.id);
                    }
                    Ox.Request.clearCache('findDocuments');
                    $list.reloadList();
                });
            }
        });
    }

    function renderList() {
        var options = {
            items: pandora.api.findDocuments,
            keys: ['ratio'],
            query: {conditions: [], operator: '&'},
            sort: ui.documentsSort.concat([
                {key: 'extension', operator: '+'},
                {key: 'filename', operator: '+'}
            ]),
            sums: ['size'],
            unique: 'id'
        };
        return (ui.documentsView == 'list' ? Ox.TableList(Ox.extend(options, {
            columns: columns,
            columnsVisible: true,
            scrollbarVisible: true,
        })) : Ox.IconList(Ox.extend(options, {
            item: function(data, sort, size) {
                var sortKey = sort[0].key,
                    infoKey = sortKey == 'name' ? 'extension' : sortKey,
                    info = (
                        Ox.getObjectById(columns, infoKey).format || Ox.identity
                    )(data[infoKey]),
                    size = size || 128;
                return {
                    height: Math.round(data.ratio > 1 ? size / ratio : size),
                    id: data.id,
                    info: info,
                    title: data.name,
                    url: '/documents/' + data.id + '/256p.jpg',
                    width: Math.round(data.ratio > 1 ? size : size * ratio)
                };
            },
            size: 128
        })))
        .bindEvent({
            add: uploadDocuments,
            'delete': deleteDocuments,
            init: function(data) {
                $status.html(
                    Ox.toTitleCase(Ox.formatCount(data.items, 'document'))
                    + ', ' + Ox.formatValue(data.size, 'B')
                );
            },
            select: function() {
                pandora.UI.set(
                    'documentsSelection.' + (isItemView ? ui.item : ''),
                    data.ids
                );
            },
            sort: function() {
                pandora.UI.set({documentsSort: data.sort});
            }
        });
    }

    function renderPreview() {
        var size = getPreviewSize(),
            src = '/documents/' + selected + '/256p.jpg';
        return Ox.ImageElement({
            height: size.height,
            src: src,
            width: size.width
        })
        .css({
            margin: size.margin,
            borderRadius: '8px'
        })
        .on({
            click: function() {
                var item = $list.value(selected);
                window.open(
                    '/documents/' + selected + '/' + item.name + '.' + item.extension,
                    '_blank'
                );
            }
        });
    }

    function selectDocuments() {
        var items = ui.documentSelection[isItemView ? ui.item : ''],
            string = items.length < 2 ? 'Document' : items.length + ' Documents';
        ['open', 'edit', 'delete'].forEach(function(id) {
            $itemMenu[items.length ? 'enableItem' : 'disableItem']
        });
        $itemMenu.setItemTitle('open', Ox._('Open ' + string));
        if (isItemView) {
            $itemMenu.setItemTitle(
                'edit', Ox._('Edit ' + string + '...')
            )
            .setItemTitle('remove', Ox._(
                'Remove ' + string + ' from this '
                + pandora.site.itemName.singular
            ));
        } else {
            $itemMenu.setItemTitle('addtoitem', Ox._(
                'Add ' + string + ' to Current '
                + pandora.site.itemName.singular
            ))
            .setItemTitle('addtolist', Ox._(
                'Add ' + string + ' to All Items in Current List'
            ))
            .setItemTitle('delete', Ox._('Delete ' + string + '...'));
        }
        $selectButton(items.length ? 'show' : 'hide');
        $deselectButton(items.length ? 'show' : 'hide');
        $item.empty();
        if (items.length) {
            $preview = renderPreview().appendTo($item);
            $form = renderForm().appendTo($item);
        }
    }

    function updateList() {
        var key = $findSelect.value(),
            value = $findInput.value(),
            query = {
                conditions: value
                    ? [].concat(
                        key != 'user'
                            ? [{key: 'name', value: value, operator: '='}]
                            : [],
                        key == 'all'
                            ? [{key: 'description', value: value, operator: '='}]
                            : [],
                        key != 'name'
                            ? [{key: 'user', value: value, operator: '='}]
                            : []
                    )
                    : [],
                operator: '|'
            };
        $list.options({query: query});
    }

    function updateSortElement() {
        $sortSelect.value(ui.documentsSort[0].key);
        $orderButton.options({
            title: getOrderButtonTitle(),
            tooltip: getOrderButtonTooltip()
        });
    }

    function uploadDocuments(data) {
        pandora.ui.uploadDocumentDialog(data.files, function(files) {
            if (files) {
                Ox.Request.clearCache('findDocuments');
                $list.bindEventOnce({
                    load: function() {
                        $list.options({selected: [files.ids]});
                    }
                })
                .reloadList();
            }
        }).open();
    }

    return that;

}