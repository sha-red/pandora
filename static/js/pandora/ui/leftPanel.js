// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.leftPanel = function() {
    var that = new Ox.SplitPanel({
            elements: [
                {
                    element: app.$ui.sectionbar = pandora.ui.sectionbar('buttons'),
                    size: 24
                },
                {
                    element: app.$ui.folders = pandora.ui.folders()
                },
                {
                    collapsed: !app.user.ui.showInfo,
                    collapsible: true,
                    element: app.$ui.info = pandora.ui.info(),
                    size: app.user.ui.sidebarSize / app.ui.infoRatio + 16
                }
            ],
            id: 'leftPanel',
            orientation: 'vertical'
        })
        .bindEvent({
            resize: function(event, data) {
                var infoSize = Math.round(data / app.ui.infoRatio) + 16;
                app.user.ui.sidebarSize = data;
                if (data < app.ui.sectionButtonsWidth && app.$ui.sectionButtons) {
                    app.$ui.sectionButtons.removeElement();
                    delete app.$ui.sectionButtons;
                    app.$ui.sectionbar.append(app.$ui.sectionSelect = pandora.ui.sectionSelect());
                } else if (data >= app.ui.sectionButtonsWidth && app.$ui.sectionSelect) {
                    app.$ui.sectionSelect.removeElement();
                    delete app.$ui.sectionSelect;
                    app.$ui.sectionbar.append(app.$ui.sectionButtons = pandora.ui.sectionButtons());
                }
                !app.user.ui.showInfo && app.$ui.leftPanel.css({bottom: -infoSize});
                app.$ui.leftPanel.size(2, infoSize);
                pandora.resizeFolders();
            },
            resizeend: function(event, data) {
                pandora.UI.set({sidebarSize: data});
            },
            toggle: function(event, data) {
                pandora.UI.set({showSidebar: !data.collapsed});
                if (data.collapsed) {
                    $.each(app.$ui.folderList, function(k, $list) {
                        $list.loseFocus();
                    });
                }
            }
        });
    return that;
};

