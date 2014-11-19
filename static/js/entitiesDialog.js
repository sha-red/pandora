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
            width: 248
        })
        .bindEvent({
            change: function(data) {
                // ...
            }
        })
        .css({
            margin: '4px'
        }),

        $toolbar = Ox.Bar({size: 24})
            .append($entitiesSelect),

        $findInput = Ox.Input({
            clear: true,
            placeholder: 'Find',
            width: 248
        })
        .css({
            margin: '4px'
        })
        .bindEvent({
            submit: function() {
                
            }
        }),

        $listBar = Ox.Bar({size: 24})
            .append($findInput),

        $list = Ox.TableList({
            columns: [
                {id: 'id', title: 'ID', operator: '+'}
                {id: 'name', title: 'Name', operator: '+', visible: true, width: 256}
            ],
            items: function(options, callback) {
                pandora.api.findEntities({
                    query: {
                        conditions: [
                            {key: 'type', operator: '==', value: type}
                        ].concat(options.query.conditions),
                        operator: '&'
                    },
                    sort: options.sort,
                    range: options.range
                }, callback);
            },
            sort: [{key: 'name', operator: '+'}],
            scrollbarVisible: true,
            unique: 'id',
            width: 256
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
                {element: $findbar, size: 24},
                {element: $list},
                {element: $listStatusbar, size: 16}
            ],
            orientation: 'vertical'
        }),

        $leftPanel = Ox.SplitPanel({
            elements: [
                {element: $listbar, size: 24},
                {element: $listPanel}
            ],
            orientation: 'vertical'
        }),

        $entity = Ox.Element(),

        $itemMenu = Ox.MenuButton({
            items: [
                {'id': 'add', title: Ox._('Add Entity'), keyboard: 'control n'},
                {'id': 'delete', title: Ox._('Delete Entity'), keyboard: 'delete'}
            ],
            title: 'set',
            tooltip: Ox._('Options'),
            type: 'image'
        })
        .css({
            margin: '4px'
        })
        .bindEvent({
            click: function(data) {
                if (data.id == 'add') {
                    // ...
                } else if (data.id == 'delete') {
                    // ...
                }
            }
        })

        $itemBar = Ox.Bar({size: 24})
            .append($itemMenu),

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
        }),

        $content = Ox.SplitPanel({
            elements: [
                {
                    element: $leftPanel,
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