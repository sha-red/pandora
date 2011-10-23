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
                    size: pandora.getInfoHeight(),
                    tooltip: 'info'
                }
            ],
            id: 'leftPanel',
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(data) {
                pandora.user.ui.sidebarSize = data.size;
                var infoHeight = pandora.getInfoHeight();
                if (data.size < pandora.site.sectionButtonsWidth && pandora.$ui.sectionButtons) {
                    pandora.$ui.sectionButtons.removeElement();
                    delete pandora.$ui.sectionButtons;
                    pandora.$ui.sectionbar.append(pandora.$ui.sectionSelect = pandora.ui.sectionSelect());
                } else if (data.size >= pandora.site.sectionButtonsWidth && pandora.$ui.sectionSelect) {
                    pandora.$ui.sectionSelect.removeElement();
                    delete pandora.$ui.sectionSelect;
                    pandora.$ui.sectionbar.append(pandora.$ui.sectionButtons = pandora.ui.sectionButtons());
                }
                !pandora.user.ui.showInfo && pandora.$ui.leftPanel.css({bottom: -infoHeight});
                pandora.$ui.leftPanel.size(2, infoHeight);
                pandora.$ui.info.resizeInfo();
                pandora.resizeFolders();
            },
            resizeend: function(data) {
                // set to 0 so that UI.set registers a change of the value
                pandora.user.ui.sidebarSize = 0;
                pandora.UI.set({sidebarSize: data.size});
            },
            toggle: function(data) {
                pandora.UI.set({showSidebar: !data.collapsed});
                if (data.collapsed) {
                    Ox.forEach(pandora.$ui.folderList, function($list) {
                        $list.loseFocus();
                    });
                }
            },
            pandora_showinfo: function(data) {
                data.value == that.options('elements')[1].collapsed && that.toggle(1);
            }
        });
    return that;
};

