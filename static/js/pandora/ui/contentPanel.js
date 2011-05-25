// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.contentPanel = function() {
    var that = new Ox.SplitPanel({
        elements: app.user.ui.item == '' ? [
            {
                collapsed: !app.user.ui.showGroups,
                collapsible: true,
                element: app.$ui.browser = pandora.ui.browser(),
                resizable: true,
                resize: [96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256],
                size: app.user.ui.groupsSize
            },
            {
                element: app.$ui.list = pandora.ui.list(app.user.ui.lists[app.user.ui.list].listView)
            }
        ] : [
            {
                collapsed: !app.user.ui.showMovies,
                collapsible: true,
                element: app.$ui.browser = pandora.ui.browser(),
                size: 112 + Ox.UI.SCROLLBAR_SIZE
            },
            {
                element: app.$ui.item = pandora.ui.item(app.user.ui.item, app.user.ui.itemView)
            }
        ],
        orientation: 'vertical'
    })
    return that;
};

