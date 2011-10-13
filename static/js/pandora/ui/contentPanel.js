// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.contentPanel = function() {
    var that = Ox.SplitPanel({
            elements: !pandora.user.ui.item ? [
                {
                    collapsed: !pandora.user.ui.showGroups,
                    collapsible: true,
                    element: pandora.$ui.browser = pandora.ui.browser(),
                    resizable: true,
                    resize: [96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256],
                    size: pandora.user.ui.groupsSize,
                    tooltip: 'groups'
                },
                {
                    element: pandora.$ui.list = pandora.ui.list()
                }
            ] : [
                {
                    collapsed: !pandora.user.ui.showBrowser,
                    collapsible: true,
                    element: pandora.$ui.browser = pandora.ui.browser(),
                    size: 112 + Ox.UI.SCROLLBAR_SIZE,
                    tooltip: pandora.site.itemName.singular.toLowerCase() + ' browser'
                },
                {
                    element: pandora.$ui.item = pandora.ui.item()
                }
            ],
            orientation: 'vertical'
        })
        .bindEvent({
            pandora_listview: function() {
                that.replaceElement(1, pandora.$ui.list = pandora.ui.list());
            },
            pandora_item: function(data) {
                if (data.value && data.previousValue) {
                    that.replaceElement(1, pandora.$ui.item = pandora.ui.item());
                }
            },
            pandora_itemview: function() {
                that.replaceElement(1, pandora.$ui.item = pandora.ui.item());
            },
            pandora_showbrowser: function(data) {
                data.value == that.options('elements')[0].collapsed && that.toggle(0);
            },
            pandora_showgroups: function(data) {
                data.value == that.options('elements')[0].collapsed && that.toggle(0);
            }
        });
    return that;
};

