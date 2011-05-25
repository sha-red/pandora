// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.enterFullscreen = function() {
    app.$ui.appPanel.size(0, 0);
    app.user.ui.showSidebar && app.$ui.mainPanel.size(0, 0);
    app.$ui.rightPanel.size(0, 0).size(2, 0);
    !app.user.ui.showMovies && app.$ui.contentPanel.css({
        top: (-112 - Ox.UI.SCROLLBAR_SIZE) + 'px' // fixme: rightPanel.size(0, 0) doesn't preserve negative top of browser
    });
    app.user.ui.showMovies && app.$ui.contentPanel.size(0, 0);
    app.$ui.player.options({
        height: app.$document.height() - 2,
        width: app.$document.width() - 2
    })
}

pandora.exitFullscreen = function() {
    app.$ui.appPanel.size(0, 20);
    app.user.ui.showSidebar && app.$ui.mainPanel.size(0, app.user.ui.sidebarSize);
    app.$ui.rightPanel.size(0, 24).size(2, 16);
    !app.user.ui.showMovies && app.$ui.contentPanel.css({
        top: 24 + (-112 - Ox.UI.SCROLLBAR_SIZE) + 'px' // fixme: rightPanel.size(0, 0) doesn't preserve negative top of browser
    });
    app.user.ui.showMovies && app.$ui.contentPanel.size(0, 112 + Ox.UI.SCROLLBAR_SIZE);
}
pandora.getFoldersHeight = function() {
    var height = 48;
    app.ui.sectionFolders[app.user.ui.section].forEach(function(folder, i) {
        height += app.user.ui.showFolder[app.user.ui.section][folder.id] * (
            !!folder.showBrowser * 40 + folder.items * 16
        );
        Ox.print('h', height)
    });
    /*
    $.each(app.user.ui.showFolder[app.user.ui.section], function(id, show) {
        var i = Ox.getPositionById(app.ui.sectionFolders[app.user.ui.section], id);
        height += show * (
            app.ui.sectionFolders[app.user.ui.section][i].showBrowser * 40 +
            app.ui.sectionFolders[app.user.ui.section][i].items * 16
        );
    });
    */
    return height;
}

pandora.getFoldersWidth = function() {
    var width = app.user.ui.sidebarSize;
    // fixme: don't use height(), look up in splitpanels
    Ox.print(pandora.getFoldersHeight(), '>', app.$ui.leftPanel.height() - 24 - 1 - app.$ui.info.height())
    if (pandora.getFoldersHeight() > app.$ui.leftPanel.height() - 24 - 1 - app.$ui.info.height()) {
        width -= Ox.UI.SCROLLBAR_SIZE;
    }
    return width;
}

pandora.getGroupWidth = function(pos, panelWidth) { // fixme: don't pass panelWidth
    var width = {};
    width.list = Math.floor(panelWidth / 5) + (panelWidth % 5 > pos);
    width.column = width.list - 40 - Ox.UI.SCROLLBAR_SIZE;
    return width;
}

pandora.getSortOperator = function(key) { // fixme: make static
    var type = Ox.getObjectById(app.config.itemKeys, key).type;
    return ['hue', 'string', 'text'].indexOf(
        Ox.isArray(type) ? type[0] : type
    ) > -1 ? '+' : '-';
}

pandora.login = function(data) {
    app.user = data.user;
    Ox.Theme(app.user.ui.theme);
    app.$ui.appPanel.reload();
}

pandora.logout = function(data) {
    app.user = data.user;
    Ox.Theme(app.config.user.ui.theme);
    app.$ui.appPanel.reload();
}

pandora.reloadGroups = function(i) {
    var query = pandora.Query.toObject();
    app.$ui.list.options({
        items: function(data, callback) {
            return pandora.api.find($.extend(data, {
                query: query
            }), callback);
        }
    });
    $.each(app.ui.groups, function(i_, group_) {
        if (i_ != i) {
            //Ox.print('setting groups request', i, i_)
            app.$ui.groups[i_].options({
                items: function(data, callback) {
                    delete data.keys;
                    return pandora.api.find($.extend(data, {
                        group: group_.id,
                        query: pandora.Query.toObject(group_.id)
                    }), callback);
                }
            });
        }
    });
    history.pushState({}, '', pandora.Query.toString(query));
}

pandora.getListData = function() {
    var data = {};
    if (app.user.ui.list) {
        var folder = app.$ui.folderList['personal'].options('selected')[0] ==
            app.user.ui.list ? 'personal' : 'featured';
        data = app.$ui.folderList[folder].value(app.user.ui.list);
    }
    data.editable = data.user == app.user.username && data.type == 'static';
    return data;
}

pandora.reloadList = function() {
    Ox.print('reloadList')
    var listData = pandora.getListData();
    Ox.Request.clearCache(); // fixme: remove
    app.$ui.groups.forEach(function($group) {
        $group.reloadList();
    });
    app.$ui.list.bindEvent({
            init: function(event, data) {
                app.$ui.folderList[listData.status]
                    .value(listData.id, 'items', data.items);
            }
        })
        .bindEventOnce({
            load: function(event, data) {
                app.$ui.list.gainFocus().options({selected: [data.items]});
            }
        })
        .reloadList();
}

pandora.resizeGroups = function(width) {
    var widths = $.map(app.ui.groups, function(v, i) {
        return pandora.getGroupWidth(i, width);
    });
    //Ox.print('widths', widths);
    app.$ui.browser.size(0, widths[0].list).size(2, widths[4].list);
    app.$ui.groupsInnerPanel.size(0, widths[1].list).size(2, widths[3].list);
    $.each(app.$ui.groups, function(i, list) {
        list.resizeColumn('name', widths[i].column);
    });
}

pandora.resizeFolders = function() {
    var width = pandora.getFoldersWidth(),
        columnWidth = {};
    if (app.user.ui.section == 'site') {
        columnWidth.title = width - 16;
    } else if (app.user.ui.section == 'items') {
        columnWidth = {user: parseInt((width - 88) * 0.4)};
        columnWidth.name = (width - 88) - columnWidth.user;
    }
    //Ox.print('sectionsWidth', width)
    $.each(app.$ui.folderList, function(id, $list) {
        var i = Ox.getPositionById(app.ui.sectionFolders[app.user.ui.section], id);
        app.$ui.folder[i].css({width: width + 'px'});
        $list.css({width: width + 'px'});
        Ox.print('...', id, $list.options())
        if (app.user.ui.section == 'site') {
            $list.resizeColumn('title', columnWidth.title);
        } else if (app.user.ui.section == 'items') {
            if (app.ui.sectionFolders[app.user.ui.section][i].showBrowser) {
                $list.resizeColumn('user', columnWidth.user)
                    .resizeColumn('name', columnWidth.name);
            } else {
                $list.resizeColumn(id == 'favorite' ? 'id' : 'name', width - 88);
            }                
        }
        if (!app.user.ui.showFolder[app.user.ui.section][id]) {
            app.$ui.folder[i].update();
        }
    });
}

pandora.saveVideoPosition = function() {
    //alert(JSON.stringify(['videoPosition|' + old.user.ui.item, app.$ui[old.user.ui.itemView == 'player' ? 'player' : 'editor'].options('position')]));
}

pandora.selectList = function() {
    if (app.user.ui.list) {
        pandora.api.findLists({
            keys: ['status', 'user'],
            query: {
                conditions: [{key: 'id', value: app.user.ui.list, operator: '='}],
                operator: ''
            },
            range: [0, 1]
        }, function(result) {
            var folder, list;
            if (result.data.items.length) {
                list = result.data.items[0];
                folder = list.status == 'featured' ? 'featured' : (
                    list.user == app.user.username ? 'personal' : 'favorite'
                );
                app.$ui.folderList[folder]
                    .options('selected', [app.user.ui.list])
                    .gainFocus();
            } else {
                app.user.ui.list = '';
                //app.user.ui.listQuery.conditions = []; // fixme: Query should read from pandora.ui.list, and not need pandora.ui.listQuery to be reset
                //pandora.URL.set(pandora.Query.toString());
            }
        })
    }
}

