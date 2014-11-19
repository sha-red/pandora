// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.entitiesDialog = function(options) {

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),

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
            closeButton: true
            content: Ox.LoadingScreen().start(),
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
        }),

        $toolbar = Ox.Bar({size: 24}),

        $findbar = Ox.Bar({size: 24}),

        $statusbar = Ox.Bar({size: 16}),

        $listPanel = Ox.SplitPanel({
            elements: [
                {element: $findbar, size: 24},
                {element: Ox.Element},
                {element: $statusbar, size: 16}
            ],
            orientation: 'vertical'
        }),

        $leftPanel = Ox.SplitPanel({
            elements: [
                {element: $toolbar, size: 24},
                {element: $listPanel}
            ],
            orientation: 'vertical'
        }),

        $entity = Ox.Element(),

        $titlebar = Ox.Bar({size: 24}),

        $rightPanel = Ox.SplitPanel({
            elements: [
                {element: $titlebar, size: 24},
                {element: $form}
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
                    element: $rightPanel,
                    resizable: true,
                    resize: [256, 384, 512],
                    size: 256
                }
            ],
            orientation: 'horizontal'
        });

    Ox.noop(function() {
        that.options({content: $content});
    });

    return that;

};