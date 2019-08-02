'use strict';

pandora.ui.mainPanel = function() {
    var ui = pandora.user.ui,
        that = Ox.SplitPanel({
            elements: [
                {
                    collapsible: true,
                    collapsed: !ui.showSidebar,
                    element: pandora.$ui.leftPanel = pandora.ui.leftPanel(),
                    resizable: true,
                    resize: [192, 256, 320, 384],
                    size: ui.sidebarSize,
                    tooltip: Ox._('sidebar') + ' <span class="OxBright">'
                        + Ox.SYMBOLS.shift + 'S</span>'
                },
                {
                    element: getRightPanel()
                }
            ],
            orientation: 'horizontal'
        })
        .bindEvent({
            pandora_finddocuments: function() {
                var previousUI = pandora.UI.getPrevious();
                Ox.Log('FIND', 'handled in mainPanel', previousUI.item, previousUI._list)
                if (!previousUI.document && ui._collection == previousUI._collection) {
                    pandora.$ui.list.reloadList();

                    // FIXME: why is this being handled _here_?
                    ui._documentFilterState.forEach(function(data, i) {
                        if (!Ox.isEqual(data.selected, previousUI._documentFilterState[i].selected)) {
                            pandora.$ui.documentFilters[i].options(
                                ui.showFilters ? {
                                    selected: data.selected
                                } : {
                                    _selected: data.selected,
                                    selected: []
                                }
                            );
                        }
                        if (!Ox.isEqual(data.find, previousUI._documentFilterState[i].find)) {
                            if (!ui.showFilters) {
                                pandora.$ui.documentFilters[i].options({
                                    _selected: data.selected
                                });
                            }
                            // we can call reloadList here, since the items function
                            // handles the hidden filters case without making requests
                            pandora.$ui.documentFilters[i].reloadList();
                        }
                    });
                } else {
                    if (pandora.stayInItemView) {
                        pandora.stayInItemView = false;
                    } else {
                        that.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
                    }
                }
            },
            pandora_document: function(data) {
                if (!data.value || !data.previousValue) {
                    that.replaceElement(1, pandora.$ui.documentPanel = pandora.ui.documentPanel());
                }
            },
            pandora_edit: function(data) {
                that.replaceElement(1, pandora.$ui.editPanel = pandora.ui.editPanel());
            },
            pandora_find: function() {
                var previousUI = pandora.UI.getPrevious();
                Ox.Log('FIND', 'handled in mainPanel', previousUI.item, previousUI._list)
                if (!previousUI.item && ui._list == previousUI._list) {
                    if (['map', 'calendar'].indexOf(ui.listView) > -1) {
                        pandora.$ui.contentPanel.replaceElement(1,
                            pandora.ui.navigationView(ui.listView)
                        );
                    } else {
                        if (['clips', 'clip'].indexOf(ui.listView) > -1) {
                            pandora.$ui.list.options({find: ui.itemFind});
                        }
                        pandora.$ui.list.reloadList();
                    }
                    // FIXME: why is this being handled _here_?
                    ui._filterState.forEach(function(data, i) {
                        if (!Ox.isEqual(data.selected, previousUI._filterState[i].selected)) {
                            pandora.$ui.filters[i].options(
                                ui.showFilters ? {
                                    selected: data.selected
                                } : {
                                    _selected: data.selected,
                                    selected: []
                                }
                            );
                        }
                        if (!Ox.isEqual(data.find, previousUI._filterState[i].find)) {
                            if (!ui.showFilters) {
                                pandora.$ui.filters[i].options({
                                    _selected: data.selected
                                });
                            }
                            // we can call reloadList here, since the items function
                            // handles the hidden filters case without making requests
                            pandora.$ui.filters[i].reloadList();
                        }
                    });
                } else {
                    if (pandora.stayInItemView) {
                        pandora.stayInItemView = false;
                    } else {
                        that.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
                    }
                }
            },
            pandora_item: function(data) {
                if (!data.value || !data.previousValue) {
                    that.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
                }
            },
            pandora_section: function(data) {
                if (data.value != data.previousValue) {
                    that.replaceElement(0, pandora.$ui.leftPanel = pandora.ui.leftPanel());
                    that.replaceElement(1, getRightPanel());
                }
            },
            pandora_showsidebar: function(data) {
                data.value == that.options('elements')[0].collapsed && that.toggleElement(0);
            },
            pandora_text: function(data) {
                if (data.value != data.previousValue) {
                    that.replaceElement(1, pandora.$ui.textPanel = pandora.ui.textPanel());
                }
            }
        });
    function getRightPanel() {
        return ui.section == 'items' ? pandora.$ui.rightPanel = pandora.ui.rightPanel()
            : ui.section == 'edits' ? pandora.$ui.editPanel = pandora.ui.editPanel()
            : ui.section == 'documents' ? pandora.$ui.documentPanel = pandora.ui.documentPanel()
            : pandora.$ui.textPanel = pandora.ui.textPanel();
    }
    return that;
};

