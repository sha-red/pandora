// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.documentsPanel = function(options) {

    var ui = pandora.user.ui,
        hasItemView = ui.section == 'items' && ui.item,
        hasListSelection = ui.section == 'items' && !ui.item && ui.listSelection.length,
        isItemView = options.isItemView,
        listLoaded = false,

        columns = [
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

        $listBar = Ox.Bar({size: 24}),

        $viewSelect = Ox.Select({
            items: [
                {id: 'list', title: Ox._('View as List')},
                {id: 'grid', title: Ox._('View as Grid')}
            ],
            value: ui.documentsView,
            width: 128
        })
        .css({float: 'left', margin: '4px 2px 4px 4px'})
        .bindEvent({
            change: function(data) {
                pandora.UI.set({documentsView: data.value});
            }
        })
        .appendTo($listBar),

        $sortSelect = Ox.Select({
            items: columns.map(function(column) {
                return {
                    id: column.id,
                    title: Ox._('Sort by {0}', [column.title])
                };
            }),
            value: ui.documentsSort[0].key,
            width: 128
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
        .appendTo($listBar),

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
                $findInput.options({placeholder: data.title}).focusInput();
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
            .appendTo($listBar),

        $list = renderList(),

        $listStatusbar = Ox.Bar({size: 16}).css({textAlign: 'center'}),

        $listStatus = Ox.Element()
            .css({
                margin: '2px 4px',
                fontSize: '9px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            })
            .html(Ox._('Loading...'))
            .appendTo($listStatusbar),

        $listPanel = Ox.SplitPanel({
            elements: [
                {element: $listBar, size: 24},
                {element: $list},
                {element: $listStatusbar, size: 16}
            ],
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function() {
                $list.size();
            },
        }),

        $itemBar = Ox.Bar({size: 24}),

        $itemMenu = Ox.MenuButton({
            items: isItemView ? [
                {
                    id: 'add', 
                    disabled: !pandora.site.capabilities.canManageDocuments[pandora.user.level],
                    title: Ox._('Add Documents to {0}...', [pandora.site.itemName.singular]),
                    keyboard: 'control n'
                },
                {},
                {id: 'open', title: '', keyboard: 'return'},
                {id: 'edit', title: ''},
                {id: 'embed', title: Ox._('Embed Document...')},
                {},
                {id: 'remove', title: '', keyboard: 'delete'}
            ] : [
                {id: 'upload', title: Ox._('Upload {0}...', [Ox._('Documents')]), file: {width: 192}},
                {},
                {id: 'open', title: '', keyboard: 'return'},
                {id: 'add', title: ''},
                {id: 'embed', title: Ox._('Embed Document...')},
                {},
                {id: 'replace', title: Ox._('Replace {0}...', [Ox._('Document')])},
                {id: 'delete', title: '', keyboard: 'delete'}
            ],
            title: 'set',
            tooltip: Ox._('Options'),
            type: 'image'
        })
        .css({float: 'left', margin: '4px'})
        .bindEvent({
            click: function(data) {
                if (data.id == 'add') {
                    isItemView ? openDocumentsDialog() : addDocuments();
                } else if (data.id == 'delete') {
                    deleteDocuments();
                } else if (data.id == 'edit') {
                    editDocuments();
                } else if (data.id == 'embed') {
                    openEmbedDialog();
                } else if (data.id == 'open') {
                    openDocuments();
                } else if (data.id == 'remove') {
                    removeDocuments();
                } else if (data.id == 'replace') {
                    replaceDocument(data.files);
                } else if (data.id == 'upload') {
                    uploadDocuments(data);
                }
            }
        })
        .appendTo($itemBar),

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
                );
            }
        })
        .hide()
        .appendTo($itemBar),

        $selectButton = Ox.ButtonGroup({
            buttons: [
                {id: 'previous', title: 'left', tooltip: Ox._('Previous')},
                {id: 'next', title: 'right', tooltip: Ox._('Next')}
            ],
            type: 'image'
        })
        .css({float: 'right', margin: '4px 2px'})
        .bindEvent({
            click: function(data) {
                $list.selectSelected(data.id == 'previous' ? -1 : 1);
            }
        })
        .hide()
        .appendTo($itemBar),

        $item = Ox.Element().css({overflowY: 'scroll'}),

        $preview,

        $data,

        $itemStatusbar = Ox.Bar({size: 16})
            .css({textAlign: 'center'}),

        $itemStatus = Ox.Element()
            .css({
                margin: '2px 4px',
                fontSize: '9px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            })
            .appendTo($itemStatusbar),

        $itemPanel = Ox.SplitPanel({
            elements: [
                {element: $itemBar, size: 24},
                {element: $item},
                {element: $itemStatusbar, size: 16}
            ],
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(data) {
                ui.documentSize = data.size;
                resizeItem();
            },
            resizeend: function(data) {
                // set to 0 so that UI.set registers a change of the value
                ui.documentSize = 0;
                pandora.UI.set({documentSize: data.size});
            },
            toggle: function(data) {
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
                    collapsed: isItemView && !ui.showDocument,
                    element: $itemPanel,
                    size: ui.documentSize,
                    resizable: true,
                    resize: [192, 256, 320, 384],
                    tooltip: 'document <span class="OxBright">'
                        + Ox.SYMBOLS.shift + 'D</span>'
                }
            ],
            orientation: 'horizontal'
        })
        .bindEvent({
            pandora_documentsize: function(data) {
                that.size(1, data.value);
            },
            pandora_documentssort: function(data) {
                updateSortElement();
                $list.options({sort: data.value});
            },
            pandora_documentsview: function(data) {
                $listPanel.replaceElement(1, $list = renderList());
            },
            pandora_showdocument: function(data) {
                isItemView && that.toggleElement(1);
            }
        });

    if (isItemView) {
        pandora.$ui.documentsList = $list;
    }

    // to determine the width of the find input inside
    // the documents dialog, that dialog has to be present
    setTimeout(function() {
        $findInput.options({width: getFindInputWidth()});
    });

    that.bindEvent(
        'pandora_documentsselection.' + (isItemView ? ui.item.toLowerCase() : ''),
        selectDocuments
    );

    function addDocuments() {
        var ids = ui.documentsSelection[''];
        pandora.api.addDocument({
            item: hasItemView ? ui.item : ui.listSelection,
            ids: ids
        }, function() {
            Ox.Request.clearCache();
            if (ui.item && ui.itemView == 'documents') {
                // FIXME: $list.reloadList() would be much better
                pandora.$ui.contentPanel.replaceElement(1,
                    pandora.$ui.item = pandora.ui.item()
                );
                // FIXME: there has to be a way to do this without timeout
                setTimeout(function() {
                    pandora.UI.set('documentsSelection.' + ui.item, ids);
                }, 1000);
            }
        });
    }

    function closeDocuments() {
        if (pandora.$ui.documentDialog) {
            pandora.$ui.documentDialog.close();
        }
    }

    function deleteDocuments() {
        pandora.ui.deleteDocumentDialog(
            $list.options('selected').map(function(id) {
                return $list.value(id);
            }),
            function() {
                Ox.Request.clearCache();
                // ...
                $list.reloadList();
            }
        ).open();
    }

    function editDocuments() {
        pandora.UI.set('documentsSelection.', $list.options('selected'));
        openDocumentsDialog();
    }

    function getOrderButtonTitle() {
        return ui.documentsSort[0].operator == '+' ? 'up' : 'down';
    }

    function getOrderButtonTooltip() {
        return Ox._(ui.documentsSort[0].operator == '+' ? 'Ascending' : 'Descending');
    }

    function getFindInputWidth() {
        // 2 * 128px selects + 2 * 16px buttons + 4 * 4px margins = 304px
        return Math.min(192, (
            isItemView
            ? window.innerWidth - (ui.showSidebar * ui.sidebarSize) - 1
                - (ui.showDocument * ui.documentSize)
            : pandora.$ui.documentsDialog.options('width')
                - ui.documentSize - 1
        ) - 304);
    }

    function getPreviewSize() {
        var ratio = $list.value($list.options('selected')[0], 'ratio'),
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

    function openDocuments() {
        pandora.openDocumentDialog({
            documents: $list.options('selected').map(function(id) {
                return $list.value(id);
            })
        }).bindEvent({
            close: function() {
                $list.closePreview();
            }
        });
    }

    function openDocumentsDialog() {
        pandora.$ui.documentsDialog = pandora.ui.documentsDialog().open();
    }

    function openEmbedDialog() {
        pandora.$ui.embedDocumentDialog = pandora.ui.embedDocumentDialog(
            ui.documentsSelection[isItemView ? ui.item : ''][0]
        ).open();
    }

    function replaceDocument(file) {
        var id = $list.options('selected')[0];
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

    function renderData() {
        var $name, $description,
            item = $list.value($list.options('selected')[0]),
            editable = item.user == pandora.user.username
                || pandora.site.capabilities.canEditDocuments[pandora.user.level]
                || options.editable,
            labelWidth = 80,
            width = ui.documentSize - 16 - Ox.UI.SCROLLBAR_SIZE;
        return isItemView
            ? Ox.Element()
                .css({textAlign: 'center'})
                .append(
                    Ox.$('<div>').css({height: '8px'})
                )
                .append(
                    $name = Ox.EditableContent({
                        editable: editable,
                        tooltip: editable ? pandora.getEditTooltip('name') : '',
                        value: item.name,
                        width: width
                    })
                    .css({
                        textAlign: 'center',
                        fontWeight: 'bold'
                    })
                    .bindEvent({
                        edit: function() {
                            $name.options({
                                width: that.width()
                            });
                        },
                        submit: function(data) {
                            pandora.api.editDocument({
                                name: data.value,
                                id: item.id,
                                item: ui.item,
                            }, function(result) {
                                $name.options({value: result.data.name});
                                Ox.Request.clearCache('findDocuments');
                                $list.reloadList();
                            });
                        }
                    })
                )
                .append(
                    Ox.$('<div>').css({height: '8px'})
                )
                .append(
                    $description = Ox.EditableContent({
                        clickLink: pandora.clickLink,
                        editable: editable,
                        format: function(value) {
                            return '<div class="OxLight" style="text-align: center">'
                                + value + '</div>';
                        },
                        height: width,
                        placeholder: Ox._('No description'),
                        tooltip: editable ? pandora.getEditTooltip('description') : '',
                        type: 'textarea',
                        value: item.description || '',
                        width: width
                    })
                    .css({
                        margin: '0 8px',
                        textAlign: 'center'
                    })
                    .bindEvent({
                        submit: function(data) {
                            pandora.api.editDocument({
                                description: data.value,
                                id: item.id,
                                item: ui.item,
                            }, function(result) {
                                $description.options({value: result.data.description});
                                Ox.Request.clearCache('findDocuments');
                                $list.reloadList();
                            });
                        }
                    })
                )
            : Ox.Form({
                items: [
                    Ox.Input({
                        disabled: !editable,
                        id: 'name',
                        label: Ox._('Name'),
                        labelWidth: labelWidth,
                        value: item.name,
                        width: width
                    }),
                    Ox.Input({
                        disabled: true,
                        id: 'extension',
                        label: Ox._('Extension'),
                        labelWidth: labelWidth,
                        value: item.extension,
                        width: width
                    }),
                    Ox.Input({
                        disabled: true,
                        id: 'dimensions',
                        label: Ox._('Dimensions'),
                        labelWidth: labelWidth,
                        value: Ox.isArray(item.dimensions)
                            ? Ox.formatDimensions(item.dimensions, 'px')
                            : Ox.formatCount(item.dimensions, 'page'),
                        width: width
                    }),
                    Ox.Input({
                        disabled: true,
                        id: 'size',
                        label: Ox._('Size'),
                        labelWidth: labelWidth,
                        value: Ox.formatValue(item.size, 'B'),
                        width: width
                    }),
                    Ox.Input({
                        disabled: true,
                        id: 'matches',
                        label: Ox._('Matches'),
                        labelWidth: labelWidth,
                        value: item.matches,
                        width: width
                    }),
                    Ox.Input({
                        disabled: true,
                        id: 'username',
                        label: Ox._('Username'),
                        labelWidth: labelWidth,
                        value: item.user,
                        width: width
                    }),
                    Ox.Input({
                        disabled: !editable,
                        height: 256,
                        id: 'description',
                        placeholder: Ox._('Description'),
                        type: 'textarea',
                        value: item.description,
                        width: width
                    })
                ],
                width: 240
            })
            .css({margin: '12px 8px 8px 8px'})
            .bindEvent({
                change: function(event) {
                    var data = Ox.extend({id: item.id}, event.id, event.data.value);
                    if (isItemView) {
                        data.item = ui.item;
                    }
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
            keys: ['description', 'dimensions', 'extension', 'id', 'name', 'ratio', 'size', 'user'],
            query: {
                conditions: isItemView ? [{ key: 'item', value: ui.item, operator: '==' }] : [],
                operator: '&'
            },
            selected: ui.documentsSelection[isItemView ? ui.item : ''] || [],
            sort: ui.documentsSort.concat([
                {key: 'extension', operator: '+'},
                {key: 'name', operator: '+'}
            ]),
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
                    height: Math.round(data.ratio > 1 ? size / data.ratio : size),
                    id: data.id,
                    info: info,
                    title: data.name,
                    url: '/documents/' + data.id + '/256p.jpg',
                    width: Math.round(data.ratio > 1 ? size : size * data.ratio)
                };
            },
            size: 128
        })))
        .bindEvent({
            add: function() {
                // we can't open upload dialog via control+n
                isItemView && openDocumentsDialog();
            },
            closepreview: closeDocuments,
            'delete': isItemView ? removeDocuments : deleteDocuments,
            init: function(data) {
                $listStatus.html(
                    Ox.toTitleCase(Ox.formatCount(data.items, 'document'))
                    + (isItemView ? '' : ', ' + Ox.formatValue(data.size, 'B'))
                );
            },
            key_escape: function() {
                pandora.UI.set({document: ''});
            },
            open: openDocuments,
            openpreview: openDocuments,
            select: function(data) {
                pandora.UI.set(
                    'documentsSelection.' + (isItemView ? ui.item : ''),
                    data.ids
                );
            },
            sort: function(data) {
                pandora.UI.set({documentsSort: [data]});
            }
        })
        .bindEventOnce({
            load: function() {
                listLoaded = true;
                selectDocuments();
                !ui.showBrowser && $list.gainFocus();
            }
        });
    }

    function renderPreview() {
        var selected = $list.options('selected')[0],
            size = getPreviewSize(),
            src = '/documents/' + selected + '/256p.jpg';
        return Ox.ImageElement({
            height: size.height,
            src: src,
            // fixme: this tends to stick around after menu click
            // (and may not be necessary in the first place)
            // tooltip: Ox._('Click to open document'),
            width: size.width
        })
        .css({
            borderRadius: '8px',
            margin: size.margin,
            cursor: 'pointer'
        })
        .on({
            click: openDocuments
        });
    }

    function resizeItem() {
        var size = getPreviewSize(),
            width = ui.documentSize - 16 - Ox.UI.SCROLLBAR_SIZE;
        $preview && $preview.options({
            height: size.height,
            width: size.width
        }).css({
            margin: size.margin
        });
        if (!isItemView && $data) {
            $data.options('items').forEach(function($item) {
                $item.options({width: width});
            });
        }
    }

    function selectDocuments() {
        // FIXME: this looks wrong - will produce inconsistent state
        if(!listLoaded) {
            return;
        }
        var selected = ui.documentsSelection[isItemView ? ui.item : ''] || [],
            string = Ox._(selected.length < 2 ? 'Document' : 'Documents');
        $list.options({selected: selected});
        $itemMenu.setItemTitle('open', Ox._('Open {0}', [string]))
            [selected.length ? 'enableItem' : 'disableItem']('open');
        if (isItemView) {
            $itemMenu.setItemTitle('edit', Ox._('Edit {0}...', [string]))
                .setItemTitle('remove', Ox._(
                    'Remove {0} from {1}',
                    [string, Ox._(pandora.site.itemName.singular)]
                ))
                [selected.length ? 'enableItem' : 'disableItem']('edit')
                [selected.length ? 'enableItem' : 'disableItem']('embed')
                [selected.length ? 'enableItem' : 'disableItem']('remove');
        } else {
            $itemMenu.setItemTitle('add', Ox._('Add {0} to {1} {2}', [
                    string,
                    Ox._(hasListSelection ? 'Selected' : 'Current'),
                    Ox._(pandora.site.itemName[
                        hasListSelection && ui.listSelection.length > 1
                        ? 'plural' : 'singular'])
                ]))
                .setItemTitle('replace', Ox._('Replace {0}...', [string]))
                .setItemTitle('delete', Ox._('Delete {0}...',  [string]))
                [selected.length && (hasItemView || hasListSelection) ? 'enableItem' : 'disableItem']('add')
                [selected.length ? 'enableItem' : 'disableItem']('embed')
                [selected.length == 1 ? 'enableItem' : 'disableItem']('replace')
                [selected.length ? 'enableItem' : 'disableItem']('delete');
        }
        $selectButton[selected.length > 1 ? 'show' : 'hide']();
        $deselectButton[selected.length ? 'show' : 'hide']();
        $item.empty();
        if (selected.length) {
            $preview = renderPreview().appendTo($item);
            $data = renderData().appendTo($item);
        }
        $itemStatus.html(
            selected.length
            ? Ox.formatCount(selected.length, 'Document')
            : Ox._('No document selected')
        );
    }

    function updateList() {
        var key = $findSelect.value(),
            value = $findInput.value(),
            itemCondition = isItemView
                ? {key: 'item', operator: '==', value: ui.item}
                : null,
            findQuery = {
                conditions: [].concat(
                    key != 'user'
                        ? [{key: 'name', operator: '=', value: value}]
                        : [],
                    key == 'all'
                        ? [
                            {key: 'extension', operator: '=', value: value},
                            {key: 'description', operator: '=', value: value}
                        ]
                        : [],
                    key != 'name'
                        ? [{key: 'user', operator: '=', value: value}]
                        : []
                ),
                operator: '|'
            },
            query = isItemView
                ? {
                    conditions: [itemCondition].concat(findQuery),
                    operator: '&'
                }
                : findQuery;
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
                        $list.options({selected: files.ids});
                    }
                })
                .reloadList();
            }
        }).open();
    }

    that.selectSelected = function(offset) {
        $list.selectSelected(offset);
        return that;
    };

    that.updateSize = function() {
        $findInput.options({width: getFindInputWidth()});
        $list.size();
    };

    return that;

};
