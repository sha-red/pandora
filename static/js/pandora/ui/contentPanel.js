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
                collapsed: !pandora.user.ui.showMovies,
                collapsible: true,
                element: pandora.$ui.browser = pandora.ui.browser(),
                size: 112 + Ox.UI.SCROLLBAR_SIZE,
                tooltip: pandora.site.itemName.plural.toLowerCase()
            },
            {
                element: pandora.$ui.item = pandora.ui.item()
            }
        ],
        orientation: 'vertical'
    });
    pandora.UI.bind({
        listView: function() {
            that.replaceElement(1, pandora.$ui.list = pandora.ui.list());
        },
        item: function(value) {
            if (value && pandora.UI.getPrevious('item')) {
                that.replaceElement(1, pandora.$ui.item = pandora.ui.item());
            }
        },
        itemView: function() {
            that.replaceElement(1, pandora.$ui.item = pandora.ui.item());
        }
    });
    return that;
};

