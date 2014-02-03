// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.folderBrowser = function(id, section) {
    var that = Ox.Element();
    pandora.$ui.folderList[id] = pandora.ui.folderBrowserList(id, section)
        .bindEvent({
            init: function(data) {
                if (data.items) {
                    that.setElement(
                        Ox.SplitPanel({
                            elements: [
                                {
                                    element: pandora.ui.folderBrowserBar(id, section),
                                    size: 24
                                },
                                {
                                    element: pandora.$ui.folderList[id]
                                }
                            ],
                            orientation: 'vertical'
                        })
                    );
                } else {
                    // if there are no items, then the placeholder is already there
                    pandora.$ui.folderPlaceholder[id].updateText('public');
                }
            }
        });
    return that;
};

