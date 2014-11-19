// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.entitiesDialog = function(options) {

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),

        type = pandora.site.entities[0].id,

        $entitiesSelect = Ox.Select({
            items: pandora.site.entities.map(function(type) {
                return {
                    id: type.id,
                    title: type.title
                };
            }),
            width: 122
        })
        .bindEvent({
            change: function(data) {
                // ...
            }
        })
        .css({
            float: 'left',
            margin: '4px 2px 4px 4px'
        }),

        $findInput = Ox.Input({
            clear: true,
            placeholder: 'Find',
            width: 122
        })
        .css({
            float: 'right',
            margin: '4px 4px 4px 2px'
        })
        .bindEvent({
            change: function(data) {
                $list.options({
                    query: {
                        conditions: [
                            {key: 'name', operator: '=', value: data.value}
                        ],
                        operator: '&'
                    }
                });
            }
        }),

        $listBar = Ox.Bar({size: 24})
            .append($entitiesSelect)
            .append($findInput),

        $list = Ox.TableList({
            columns: [
                {id: 'id', title: 'ID', operator: '+'},
                {id: 'name', title: 'Name', operator: '+', visible: true, width: 256 - Ox.SCROLLBAR_SIZE}
            ],
            items: function(options, callback) {
                pandora.api.findEntities({
                    keys: options.keys,
                    query: {
                        conditions: [
                            {key: 'type', operator: '==', value: type}
                        ].concat(options.query.conditions),
                        operator: '&'
                    },
                    range: options.range,
                    sort: options.sort
                }, callback);
            },
            sort: [{key: 'name', operator: '+'}],
            scrollbarVisible: true,
            unique: 'id',
            width: 256 - Ox.SCROLLBAR_SIZE
        })
        .bindEvent({
            init: function(data) {
                var text = Ox.formatCount(
                    data.items,
                    Ox._('entity'),
                    Ox._('entities')
                )
                $listStatus.html(text[0].toUpperCase() + text.slice(1));
            }
        }),

        $listStatus = Ox.Element()
        .css({
            fontSize: '9px',
            marginTop: '2px',
            textAlign: 'center'
        })
        .html(Ox._('Loading...')),

        $listStatusbar = Ox.Bar({size: 16})
            .append($listStatus),

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
                // ...
            }
        }),

        $entity = Ox.Element(),

        $itemMenu = Ox.MenuButton({
            items: [
                {
                    'id': 'add',
                    title: Ox._('Add Entity'),
                    keyboard: 'control n'
                },
                {
                    'id': 'delete',
                    title: Ox._('Delete Entity...'),
                    disabled: true,
                    keyboard: 'delete'
                }
            ],
            title: 'set',
            tooltip: Ox._('Options'),
            type: 'image'
        })
        .css({
            float: 'left',
            margin: '4px'
        })
        .bindEvent({
            click: function(data) {
                if (data.id == 'add') {
                    pandora.api.addEntity({
                        type: type
                    }, function(result) {
                        Ox.print('$$$$', result);
                        Ox.Request.clearCache('findEntities');
                        $list.reloadList().options({
                            selected: [result.data.id]
                        });
                    })
                } else if (data.id == 'delete') {
                    // ...
                }
            }
        }),

        $deselectButton = Ox.Button({
            title: 'close',
            tooltip: Ox._('Done'),
            type: 'image'
        })
        .css({
            float: 'right',
            margin: '4px'
        })
        .hide()
        .bindEvent({
            click: function() {
                pandora.UI.set(
                    'entitiesSelection.' + type,
                    []
                );
            }
        }),

        $itemBar = Ox.Bar({size: 24})
            .append($itemMenu)
            .append($deselectButton),

        $itemStatus = Ox.Element()
        .css({
            fontSize: '9px',
            marginTop: '2px',
            textAlign: 'center'
        })
        .html(Ox._('No entity selected')),

        $itemStatusbar = Ox.Bar({size: 16})
            .append($itemStatus),

        $itemPanel = Ox.SplitPanel({
            elements: [
                {element: $itemBar, size: 24},
                {element: Ox.Element()},
                {element: $itemStatusbar, size: 16}
            ],
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function() {
                // ...
            }
        }),

        $content = Ox.SplitPanel({
            elements: [
                {
                    element: $listPanel,
                    resizable: true,
                    resize: [256, 384, 512],
                    size: 256
                },
                {
                    element: $entity
                },
                {
                    element: $itemPanel,
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
                    title: Ox._('Manage Documents...')
                })
                .bindEvent({
                    click: function() {
                        that.close();
                        (pandora.$ui.documentsDialog || (
                            pandora.$ui.documentsDialog = pandora.ui.documentsDialog()
                        )).open();
                    }
                }),
                {},
                Ox.Button({
                    title: Ox._('Done'),
                    width: 48
                })
                .bindEvent({
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
            title: Ox._('Manage Entities'),
            width: dialogWidth
        })
        .bindEvent({
            // resize: ...
        });

    return that;

};