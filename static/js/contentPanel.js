'use strict';

pandora.ui.contentPanel = function() {
    var that = Ox.SplitPanel({
            elements: !pandora.user.ui.item ? [
                {
                    collapsed: !pandora.user.ui.showFilters,
                    collapsible: true,
                    element: pandora.$ui.browser = pandora.ui.browser(),
                    resizable: true,
                    resize: [96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256],
                    size: pandora.user.ui.filtersSize,
                    tooltip: Ox._('filters') + ' <span class="OxBright">'
                        + Ox.SYMBOLS.shift + 'F</span>'
                },
                {
                    element: pandora.$ui.list = pandora.ui.list()
                },
                {
                    element: pandora.$ui.statusbar = pandora.ui.statusbar(),
                    size: 16
                }
            ] : [
                {
                    collapsed: !pandora.user.ui.showBrowser,
                    collapsible: true,
                    element: pandora.$ui.browser = pandora.ui.browser(),
                    size: 112 + Ox.UI.SCROLLBAR_SIZE,
                    tooltip: Ox._('{0} browser', [Ox._(pandora.site.itemName.singular.toLowerCase())])
                        + ' <span class="OxBright">'
                        + Ox.SYMBOLS.shift + 'B</span>'
                },
                {
                    element: pandora.$ui.item = pandora.ui.item()
                }
            ],
            orientation: 'vertical'
        })
        .bindEvent({
            pandora_item: function(data) {
                if (data.value && data.previousValue) {
                    that.replaceElement(1, pandora.$ui.item = pandora.ui.item());
                }
            },
            pandora_itemview: function() {
                pandora.user.ui.item && that.replaceElement(1, pandora.$ui.item = pandora.ui.item());
            },
            pandora_listview: function() {
                !pandora.user.ui.item && that.replaceElement(1, pandora.$ui.list = pandora.ui.list());
            },
            pandora_showbrowser: function(data) {
                data.value == that.options('elements')[0].collapsed && that.toggleElement(0);
            },
            pandora_showfilters: function(data) {
                data.value == that.options('elements')[0].collapsed && that.toggleElement(0);
            }
        });
    return that;
};

