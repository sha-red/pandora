// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.leftPanel = function() {
    var that = Ox.SplitPanel({
            elements: [
                {
                    element: pandora.$ui.sectionbar = pandora.ui.sectionbar('buttons'),
                    size: 24
                },
                {
                    element: pandora.$ui.folders = pandora.ui.folders()
                },
                {
                    collapsed: !pandora.user.ui.showInfo,
                    collapsible: true,
                    element: pandora.$ui.info = pandora.ui.info(),
                    size: Math.min(pandora.user.ui.sidebarSize, 256),
                    tooltip: 'info'
                }
            ],
            id: 'leftPanel',
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(data) {
                Ox.print('LEFT PANEL RESIZE')
                var infoSize = Math.min(data.size, 256);
                // fixme: don't make a request here:
                pandora.UI.set('sidebarSize', data.size);
                if (data.size < pandora.site.sectionButtonsWidth && pandora.$ui.sectionButtons) {
                    pandora.$ui.sectionButtons.removeElement();
                    delete pandora.$ui.sectionButtons;
                    pandora.$ui.sectionbar.append(pandora.$ui.sectionSelect = pandora.ui.sectionSelect());
                } else if (data.size >= pandora.site.sectionButtonsWidth && pandora.$ui.sectionSelect) {
                    pandora.$ui.sectionSelect.removeElement();
                    delete pandora.$ui.sectionSelect;
                    pandora.$ui.sectionbar.append(pandora.$ui.sectionButtons = pandora.ui.sectionButtons());
                }
                !pandora.user.ui.showInfo && pandora.$ui.leftPanel.css({bottom: -infoSize});
                pandora.$ui.leftPanel.size(2, infoSize);
                if (pandora.$ui.videoPreview) {
                    pandora.$ui.videoPreview.options({
                        height: infoSize,
                        width: data.size
                    });
                } else {
                    pandora.$ui.info.find('img').css({height: infoSize + 'px'})
                }
                pandora.resizeFolders();
            },
            resizeend: function(data) {
                pandora.UI.set({sidebarSize: data.size});
            },
            toggle: function(data) {
                pandora.UI.set({showSidebar: !data.collapsed});
                if (data.collapsed) {
                    Ox.forEach(pandora.$ui.folderList, function($list) {
                        $list.loseFocus();
                    });
                }
            }
        });
    return that;
};

