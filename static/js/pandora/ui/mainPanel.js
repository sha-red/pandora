// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.mainPanel = function() {
    var that = new Ox.SplitPanel({
        elements: [
            {
                collapsible: true,
                collapsed: !app.user.ui.showSidebar,
                element: app.$ui.leftPanel = pandora.ui.leftPanel(),
                resizable: true,
                resize: [192, 256, 320, 384],
                size: app.user.ui.sidebarSize
            },
            {
                element: app.$ui.rightPanel = pandora.ui.rightPanel()
            }
        ],
        orientation: 'horizontal'
    })
    return that;
};

