// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.mainPanel = function() {
    var that = Ox.SplitPanel({
            elements: [
                {
                    collapsible: true,
                    collapsed: !pandora.user.ui.showSidebar,
                    element: pandora.$ui.leftPanel = pandora.ui.leftPanel(),
                    resizable: true,
                    resize: [192, 256, 320, 384],
                    size: pandora.user.ui.sidebarSize,
                    tooltip: 'sidebar'
                },
                {
                    element: pandora.$ui.rightPanel = pandora.ui.rightPanel()
                }
            ],
            orientation: 'horizontal'
        })
        .bindEvent({
            pandora_find: function() {
                var previousUI = pandora.UI.getPrevious();
                if (!previousUI.item && pandora.user.ui._list == previousUI._list) {
                    if (['map', 'calendar'].indexOf(pandora.user.ui.listView) > -1) {
                        pandora.$ui.contentPanel.replaceElement(1,
                            pandora.ui.navigationView(pandora.user.ui.listView)
                        );
                    } else {
                        pandora.$ui.list.reloadList();
                    }
                    pandora.user.ui._groupsState.forEach(function(data, i) {
                        if (!Ox.isEqual(data.selected, previousUI._groupsState[i].selected)) {
                            pandora.$ui.groups[i].options({selected: data.selected});
                        }
                        if (!Ox.isEqual(data.find, previousUI._groupsState[i].find)) {
                            pandora.$ui.groups[i].reloadList();
                        }
                    });
                } else {
                    that.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
                }
            },
            pandora_item: function(data) {
                Ox.print('PANDORA_ITEM', data.value, data.previousValue)
                if (!data.value || !data.previousValue) {
                    that.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
                }
            },
            pandora_showsidebar: function(data) {
                data.value == that.options('elements')[0].collapsed && that.toggle(0);
            }
        });
    return that;
};

