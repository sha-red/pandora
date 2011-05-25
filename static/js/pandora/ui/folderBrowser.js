// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.folderBrowser = function(id) {
    var that = new Ox.SplitPanel({
        elements: [
            {
                element: pandora.ui.folderBrowserBar(),
                size: 24
            },
            {
                element: app.$ui.folderList[id] = pandora.ui.folderBrowserList(id)
            }
        ],
        orientation: 'vertical'
    });
    return that;
};

