// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.folderBrowser = function(id) {
    var that = Ox.SplitPanel({
        elements: [
            {
                element: pandora.ui.folderBrowserBar(id),
                size: 24
            },
            {
                element: pandora.$ui.folderList[id] = pandora.ui.folderBrowserList(id)
            }
        ],
        orientation: 'vertical'
    });
    return that;
};

