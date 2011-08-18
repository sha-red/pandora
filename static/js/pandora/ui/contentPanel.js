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
                size: pandora.user.ui.groupsSize
            },
            {
                element: pandora.$ui.list = pandora.ui.list()
            }
        ] : [
            {
                collapsed: !pandora.user.ui.showMovies,
                collapsible: true,
                element: pandora.$ui.browser = pandora.ui.browser(),
                size: 112 + Ox.UI.SCROLLBAR_SIZE
            },
            {
                element: pandora.$ui.item = pandora.ui.item()
            }
        ],
        orientation: 'vertical'
    });
    return that;
};

