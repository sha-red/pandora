// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.mainPanel = function() {
    var that = new Ox.SplitPanel({
        elements: [
            {
                collapsible: true,
                collapsed: !pandora.user.ui.showSidebar,
                element: pandora.$ui.leftPanel = pandora.ui.leftPanel(),
                resizable: true,
                resize: [192, 256, 320, 384],
                size: pandora.user.ui.sidebarSize
            },
            {
                element: pandora.$ui.rightPanel = pandora.ui.rightPanel()
            }
        ],
        orientation: 'horizontal'
    })
    return that;
};

