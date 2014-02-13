// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.folderBrowser = function(id, section) {
    // Yes, we have to wait for the lists init event to decide if it is shown.
    // This run-once init handler runs *after* the list's own init handler.
    var i = Ox.getIndexById(pandora.site.sectionFolders[section], id),
        that = Ox.Element();
    pandora.site.sectionFolders[section][i].hasItems = null;
    pandora.$ui.folderList[id] = pandora.ui.folderBrowserList(id, section)
        .bindEventOnce({
            init: function(data) {
                pandora.site.sectionFolders[section][i].hasItems = !!data.items;
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
                                },
                                {
                                    element: Ox.Element().append(
                                        pandora.ui.folderPlaceholder(id, section).updateText('public', true)
                                    ),
                                    size: 0
                                }
                            ],
                            orientation: 'vertical'
                        })
                    );
                    pandora.resizeFolders();
                } else {
                    // if there are no items, then the placeholder is already there
                    pandora.$ui.folderPlaceholder[id].updateText('public');
                }
            }
        });
    return that;
};

