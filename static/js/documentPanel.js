'use strict';

pandora.ui.documentPanel = function() {
    var that = Ox.SplitPanel({
            elements: [
                {
                    element: pandora.$ui.toolbar = pandora.ui.documentToolbar(),
                    size: 24
                },
                {
                    element: pandora.$ui.documentContentPanel = pandora.ui.documentContentPanel()
                }
            ],
            id: 'documentPanel',
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(data) {
                if (!pandora.user.ui.document) {
                    pandora.$ui.list && pandora.$ui.list.size();
                } else {
                    pandora.$ui.document && pandora.$ui.document.update();
                }
            },
        });
    return that;
};

