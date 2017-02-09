// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.documentContentPanel = function() {
    var that = Ox.SplitPanel({
            elements: !pandora.user.ui.document ? [
                {
                    collapsed: true,
                    collapsible: false, //fixme
                    element: pandora.$ui.documentBrowser = pandora.ui.documentBrowser(),
                    resizable: false, //fixme
                    resize: [96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256],
                    size: 96,
                    tooltip: '' /* fixme:
                        Ox._('filters') + ' <span class="OxBright">'
                            + Ox.SYMBOLS.shift + 'F</span>'
                    */
                },
                {
                    element: pandora.$ui.list = pandora.ui.collection()
                },
                {
                    element: pandora.$ui.statusbar = pandora.ui.statusbar(),
                    size: 16
                }
            ] : [
                {
                    collapsed: !pandora.user.ui.showBrowser,
                    collapsible: true,
                    element: pandora.$ui.documentBrowser = pandora.ui.documentBrowser(),
                    size: 112 + Ox.UI.SCROLLBAR_SIZE,
                    tooltip: Ox._('{0} browser', [Ox._('document')])
                        + ' <span class="OxBright">'
                        + Ox.SYMBOLS.shift + 'B</span>'
                },
                {
                    element: pandora.$ui.document = pandora.ui.document()
                }
            ],
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(data) {
                Ox.print('split resize');
            },
            pandora_document: function(data) {
                if (data.value && data.previousValue) {
                    that.replaceElement(1, pandora.$ui.document = pandora.ui.document());
                }
            },
            pandora_documentview: function(data) {
                that.replaceElement(1, pandora.$ui.document = pandora.ui.document());
            },
            pandora_collectionview: function() {
                !pandora.user.ui.document && that.replaceElement(1,
                    pandora.$ui.list = pandora.ui.collection());
            },
            pandora_showbrowser: function(data) {
                data.value == that.options('elements')[0].collapsed && that.toggleElement(0);
            },
        });
    return that;
};