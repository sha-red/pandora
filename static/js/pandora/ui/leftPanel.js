// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.leftPanel = function() {
    var that = new Ox.SplitPanel({
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
                    size: pandora.user.ui.sidebarSize / pandora.user.infoRatio + 16
                }
            ],
            id: 'leftPanel',
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(event, data) {
                var infoSize = Math.round(data / pandora.user.infoRatio) + 16;
                pandora.user.ui.sidebarSize = data;
                if (data < pandora.site.sectionButtonsWidth && pandora.$ui.sectionButtons) {
                    pandora.$ui.sectionButtons.removeElement();
                    delete pandora.$ui.sectionButtons;
                    pandora.$ui.sectionbar.append(pandora.$ui.sectionSelect = pandora.ui.sectionSelect());
                } else if (data >= pandora.site.sectionButtonsWidth && pandora.$ui.sectionSelect) {
                    pandora.$ui.sectionSelect.removeElement();
                    delete pandora.$ui.sectionSelect;
                    pandora.$ui.sectionbar.append(pandora.$ui.sectionButtons = pandora.ui.sectionButtons());
                }
                !pandora.user.ui.showInfo && pandora.$ui.leftPanel.css({bottom: -infoSize});
                pandora.$ui.leftPanel.size(2, infoSize);
                pandora.resizeFolders();
            },
            resizeend: function(event, data) {
                pandora.UI.set({sidebarSize: data});
            },
            toggle: function(event, data) {
                pandora.UI.set({showSidebar: !data.collapsed});
                if (data.collapsed) {
                    $.each(pandora.$ui.folderList, function(k, $list) {
                        $list.loseFocus();
                    });
                }
            }
        });
    return that;
};

