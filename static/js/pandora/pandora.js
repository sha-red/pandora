// vim: et:ts=4:sw=4:sts=4:ft=js

pandora.enterFullscreen = function() {
    pandora.$ui.appPanel.size(0, 0);
    pandora.user.ui.showSidebar && pandora.$ui.mainPanel.size(0, 0);
    pandora.$ui.rightPanel.size(0, 0).size(2, 0);
    !pandora.user.ui.showMovies && pandora.$ui.contentPanel.css({
        top: (-112 - Ox.UI.SCROLLBAR_SIZE) + 'px' // fixme: rightPanel.size(0, 0) doesn't preserve negative top of browser
    });
    pandora.user.ui.showMovies && pandora.$ui.contentPanel.size(0, 0);
    pandora.$ui.player.options({
        height: pandora.$document.height() - 2,
        width: pandora.$document.width() - 2
    });
};

pandora.exitFullscreen = function() {
    pandora.$ui.appPanel.size(0, 20);
    pandora.user.ui.showSidebar && pandora.$ui.mainPanel.size(0, pandora.user.ui.sidebarSize);
    pandora.$ui.rightPanel.size(0, 24).size(2, 16);
    !pandora.user.ui.showMovies && pandora.$ui.contentPanel.css({
        top: 24 + (-112 - Ox.UI.SCROLLBAR_SIZE) + 'px' // fixme: rightPanel.size(0, 0) doesn't preserve negative top of browser
    });
    pandora.user.ui.showMovies && pandora.$ui.contentPanel.size(0, 112 + Ox.UI.SCROLLBAR_SIZE);
};

pandora.getFoldersHeight = function() {
    var height = 48;
    pandora.site.sectionFolders[pandora.user.ui.section].forEach(function(folder, i) {
        height += pandora.user.ui.showFolder[pandora.user.ui.section][folder.id] * (
            !!folder.showBrowser * 40 + folder.items * 16
        );
        Ox.print('h', height);
    });
    /*
    $.each(pandora.user.ui.showFolder[pandora.user.ui.section], function(id, show) {
        var i = Ox.getPositionById(pandora.site.sectionFolders[pandora.user.ui.section], id);
        height += show * (
            pandora.site.sectionFolders[pandora.user.ui.section][i].showBrowser * 40 +
            pandora.site.sectionFolders[pandora.user.ui.section][i].items * 16
        );
    });
    */
    return height;
};

pandora.getFoldersWidth = function() {
    var width = pandora.user.ui.sidebarSize;
    // fixme: don't use height(), look up in splitpanels
    Ox.print(pandora.getFoldersHeight(), '>', pandora.$ui.leftPanel.height() - 24 - 1 - pandora.$ui.info.height());
    if (pandora.getFoldersHeight() > pandora.$ui.leftPanel.height() - 24 - 1 - pandora.$ui.info.height()) {
        width -= Ox.UI.SCROLLBAR_SIZE;
    }
    return width;
};

pandora.getGroupWidth = function(pos, panelWidth) { // fixme: don't pass panelWidth
    var width = {};
    width.list = Math.floor(panelWidth / 5) + (panelWidth % 5 > pos);
    width.column = width.list - 40 - Ox.UI.SCROLLBAR_SIZE;
    return width;
};

pandora.getSortOperator = function(key) { // fixme: make static
    var type = Ox.getObjectById(pandora.site.itemKeys, key).type;
    return ['hue', 'string', 'text'].indexOf(
        Ox.isArray(type) ? type[0] : type
    ) > -1 ? '+' : '-';
};

pandora.login = function(data) {
    pandora.user = data.user;
    Ox.Theme(pandora.user.ui.theme);
    pandora.$ui.appPanel.reload();
};

pandora.logout = function(data) {
    pandora.user = data.user;
    Ox.Theme(pandora.site.user.ui.theme);
    pandora.$ui.appPanel.reload();
};

pandora.reloadGroups = function(i) {
    var query = pandora.Query.toObject(),
        view = pandora.user.ui.lists[pandora.user.ui.list].listView;
    if(view == 'clip') {
        pandora.$ui.list.options({
            items: function(data, callback) {
                return pandora.api.findAnnotations($.extend(data, {
                    itemQuery: query
                }), callback);
            }
        });
    } else if (view == 'map') {
        pandora.$ui.list.options({
            items: function(data, callback) {
                return pandora.api.findPlaces($.extend(data, {
                    itemQuery: query
                }), callback);
            }
        });
    } else if (view == 'calendar') {
        pandora.$ui.list.options({
            items: function(data, callback) {
                return pandora.api.findEvents($.extend(data, {
                    itemQuery: query
                }), callback);
            }
        });
    } else {
        pandora.$ui.list.options({
            items: function(data, callback) {
                return pandora.api.find($.extend(data, {
                    query: query
                }), callback);
            }
        });
    }
    $.each(pandora.user.queryGroups, function(i_, group_) {
        if (i_ != i) {
            //Ox.print('setting groups request', i, i_)
            pandora.$ui.groups[i_].options({
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
    if (pandora.user.ui.list) {
        var folder = pandora.$ui.folderList['personal'].options('selected')[0] ==
            pandora.user.ui.list ? 'personal' : 'featured';
        data = pandora.$ui.folderList[folder].value(pandora.user.ui.list);
    }
    data.editable = data.user == pandora.user.username && data.type == 'static';
    return data;
}

pandora.reloadList = function() {
    Ox.print('reloadList')
    var listData = pandora.getListData();
    Ox.Request.clearCache(); // fixme: remove
    pandora.$ui.groups.forEach(function($group) {
        $group.reloadList();
    });
    pandora.$ui.list.bindEvent({
            init: function(event, data) {
                var folder = listData.status == 'private' ? 'personal' : listData.status;
                pandora.$ui.folderList[folder].value(listData.id, 'items', data.items);
            }
        })
        .bindEventOnce({
            load: function(event, data) {
                pandora.$ui.list.gainFocus();
                if (data) pandora.$ui.list.options({selected: [data.items]});
            }
        })
        .reloadList();
};

pandora.resizeGroups = function(width) {
    var widths = $.map(pandora.user.queryGroups, function(v, i) {
        return pandora.getGroupWidth(i, width);
    });
    //Ox.print('widths', widths);
    pandora.$ui.browser.size(0, widths[0].list).size(2, widths[4].list);
    pandora.$ui.groupsInnerPanel.size(0, widths[1].list).size(2, widths[3].list);
    $.each(pandora.$ui.groups, function(i, list) {
        list.resizeColumn('name', widths[i].column);
    });
};

pandora.resizeFolders = function() {
    var width = pandora.getFoldersWidth(),
        columnWidth = {};
    if (pandora.user.ui.section == 'site') {
        columnWidth.title = width - 16;
    } else if (pandora.user.ui.section == 'items') {
        columnWidth = {user: parseInt((width - 88) * 0.4)};
        columnWidth.name = (width - 88) - columnWidth.user;
    }
    //Ox.print('sectionsWidth', width)
    $.each(pandora.$ui.folderList, function(id, $list) {
        var i = Ox.getPositionById(pandora.site.sectionFolders[pandora.user.ui.section], id);
        pandora.$ui.folder[i].css({width: width + 'px'});
        $list.css({width: width + 'px'});
        Ox.print('...', id, $list.options())
        if (pandora.user.ui.section == 'site') {
            $list.resizeColumn('title', columnWidth.title);
        } else if (pandora.user.ui.section == 'items') {
            if (pandora.site.sectionFolders[pandora.user.ui.section][i].showBrowser) {
                $list.resizeColumn('user', columnWidth.user)
                    .resizeColumn('name', columnWidth.name);
            } else {
                $list.resizeColumn(id == 'favorite' ? 'id' : 'name', width - 88);
            }                
        }
        if (!pandora.user.ui.showFolder[pandora.user.ui.section][id]) {
            pandora.$ui.folder[i].update();
        }
    });
};

pandora.saveVideoPosition = function() {
    //alert(JSON.stringify(['videoPosition|' + old.user.ui.item, pandora.$ui[old.user.ui.itemView == 'player' ? 'player' : 'editor'].options('position')]));
};

pandora.selectList = function() {
    if (pandora.user.ui.list) {
        pandora.api.findLists({
            keys: ['status', 'user'],
            query: {
                conditions: [{key: 'id', value: pandora.user.ui.list, operator: '='}],
                operator: ''
            },
            range: [0, 1]
        }, function(result) {
            var folder, list;
            if (result.data.items.length) {
                list = result.data.items[0];
                folder = list.status == 'featured' ? 'featured' : (
                    list.user == pandora.user.username ? 'personal' : 'favorite'
                );
                pandora.$ui.folderList[folder]
                    .options('selected', [pandora.user.ui.list])
                    .gainFocus();
            } else {
                pandora.user.ui.list = '';
                //pandora.user.ui.listQuery.conditions = []; // fixme: Query should read from pandora.ui.list, and not need pandora.ui.listQuery to be reset
                //pandora.URL.set(pandora.Query.toString());
            }
        });
    }
};

