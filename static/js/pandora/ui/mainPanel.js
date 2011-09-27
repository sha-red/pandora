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
                tooltip: 'lists'
            },
            {
                element: pandora.$ui.rightPanel = pandora.ui.rightPanel()
            }
        ],
        orientation: 'horizontal'
    });
    pandora.UI.bind({
        find: function() {
            var previousUI = pandora.UI.getPrevious();
            if (pandora.user.ui._list == previousUI._list) {
                pandora.$ui.list.reloadList();
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
        item: function(value) {
            if (!value || !pandora.UI.getPrevious('item')) {
                that.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
            }
        }
    });
    return that;
};

