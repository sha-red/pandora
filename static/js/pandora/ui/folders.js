// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.folders = function() {
    var that = new Ox.Element()
        .css({overflowX: 'hidden', overflowY: 'auto'})
        .bindEvent({
            resize: function(event, data) {
                pandora.resizeFolders();
            }
        });
    var counter = 0;
    //var $sections = [];
    app.$ui.folder = [];
    app.$ui.folderBrowser = {};
    app.$ui.folderList = {};
    if (app.user.ui.section == 'site') {
        $.each(app.ui.sectionFolders.site, function(i, folder) {
            var height = (Ox.getObjectById(app.ui.sectionFolders.site, folder.id).items.length * 16);
            app.$ui.folder[i] = new Ox.CollapsePanel({
                    id: folder.id,
                    collapsed: !app.user.ui.showFolder.site[folder.id],
                    size: 16,
                    title: folder.title
                })
                .bindEvent({
                    toggle: function(event, data) {
                        
                    }
                });
            //alert(JSON.stringify(Ox.getObjectById(app.ui.sectionFolders.site, folder.id)))
            app.$ui.folder[i].$content.css({
                height: height + 'px'
            })
                //.appendTo(that);
            app.$ui.folderList[folder.id] = pandora.ui.folderList(folder.id)
                .css({
                    height: height + 'px'
                })
                .appendTo(app.$ui.folder[i].$content);
            app.$ui.folder.forEach(function($folder) {
                that.append($folder);
            });
        });
        //pandora.resizeFolders();
    } else if (app.user.ui.section == 'items') {
        $.each(app.ui.sectionFolders.items, function(i, folder) {
            var extras = [];
            if (folder.id == 'personal' && app.user.level != 'guest') {
                extras = [new Ox.Select({
                    items: [
                        { id: 'new', title: 'New List...' },
                        { id: 'newfromselection', title: 'New List from Current Selection...', disabled: true },
                        { id: 'newsmart', title: 'New Smart List...' },
                        { id: 'newfromresults', title: 'New Smart List from Current Results...', disabled: true },
                        {},
                        { id: 'addselection', title: 'Add Selection to List...' }
                    ],
                    max: 0,
                    min: 0,
                    selectable: false,
                    type: 'image'
                })
                .bindEvent({
                    click: function(event, data) {
                        var $list = app.$ui.folderList[folder.id],
                            id;
                        if (data.id == 'new' || data.id == 'newsmart') {
                            pandora.api.addList({
                                name: 'Untitled',
                                status: 'private',
                                type: data.id == 'new' ? 'static' : 'smart'
                            }, function(result) {
                                id = result.data.id;
                                pandora.UI.set(['lists', id].join('|'), app.site.user.ui.lists['']); // fixme: necessary?
                                pandora.URL.set('?find=list:' + id)
                                Ox.Request.clearCache(); // fixme: remove
                                $list.reloadList().bindEventOnce({
                                    load: function(event, data) {
                                        $list.gainFocus()
                                            .options({selected: [id]})
                                            .editCell(id, 'name');
                                    }
                                });
                            });
                        }
                    }
                })];
            } else if (folder.id == 'favorite' && app.user.level != 'guest') {
                extras = [new Ox.Button({
                    selectable: true,
                    style: 'symbol',
                    title: 'Edit',
                    tooltip: 'Manage Favorite Lists',
                    type: 'image'
                })
                .bindEvent({
                    change: function(event, data) {
                        Ox.Request.clearCache(); // fixme: remove
                        app.ui.sectionFolders.items[i].showBrowser = !app.ui.sectionFolders.items[i].showBrowser;
                        if (app.ui.sectionFolders.items[i].showBrowser) {
                            app.$ui.folderList.favorite.replaceWith(
                                app.$ui.folderBrowser.favorite = pandora.ui.folderBrowser('favorite')
                            );
                        } else {
                            app.$ui.folderBrowser.favorite.replaceWith(
                                app.$ui.folderList.favorite = pandora.ui.folderList('favorite')
                            );
                        }
                        pandora.resizeFolders();
                    }
                })];
            } else if (folder.id == 'featured' && app.user.level == 'admin') {
                extras = [new Ox.Button({
                    selectable: true,
                    style: 'symbol',
                    title: 'Edit',
                    tooltip: 'Manage Featured Lists',
                    type: 'image'
                })
                .bindEvent({
                    change: function(event, data) {
                        Ox.Request.clearCache(); // fixme: remove
                        app.ui.sectionFolders.items[i].showBrowser = !app.ui.sectionFolders.items[i].showBrowser;
                        if (app.ui.sectionFolders.items[i].showBrowser) {
                            app.$ui.folderList.featured.replaceWith(
                                app.$ui.folderBrowser.featured = pandora.ui.folderBrowser('featured'));
                        } else {
                            app.$ui.folderBrowser.featured.replaceWith(
                                app.$ui.folderList.featured = pandora.ui.folderList('featured')
                            );
                        }
                        pandora.resizeFolders();
                    }
                })];
            }
            app.$ui.folder[i] = new Ox.CollapsePanel({
                    id: folder.id,
                    collapsed: !app.user.ui.showFolder.items[folder.id],
                    extras: extras,
                    size: 16,
                    title: folder.title
                })
                .bindEvent({
                    // fixme: duplicated
                    click: function(event, data) {
                        var $list = app.$ui.folderList[i],
                            hasFocus, id;
                        if (data.id == 'new' || data.id == 'newsmart') {
                            pandora.api.addList({
                                name: 'Untitled',
                                status: 'private',
                                type: data.id == 'new' ? 'static' : 'smart'
                            }, function(result) {
                                id = result.data.id;
                                pandora.URL.set('?find=list:' + id)
                                Ox.Request.clearCache(); // fixme: remove
                                $list.reloadList().bindEventOnce({
                                    load: function(event, data) {
                                        $list.gainFocus()
                                            .options({selected: [id]})
                                            .editCell(id, 'name');
                                    }
                                });
                            });
                        } else if (data.id == 'browse') {
                            alert('??')
                            /*
                            app.$ui.sectionList[1].replaceWith(app.$ui.publicLists = pandora.ui.publicLists());
                            app.ui.showAllPublicLists = true;
                            */
                        }
                    },
                    toggle: function(event, data) {
                        data.collapsed && app.$ui.folderList[folder.id].loseFocus();
                        pandora.UI.set('showFolder|items|' + folder.id, !data.collapsed);
                        pandora.resizeFolders();
                    }
                });
            //$sections.push(app.$ui.section[i]);
            app.$ui.folderList[folder.id] = pandora.ui.folderList(folder.id)
                .bindEventOnce({
                    init: function(event, data) {
                        Ox.print('init', i, counter)
                        if (++counter == 3) {
                            app.$ui.folder.forEach(function($folder) {
                                that.append($folder);
                            });
                            pandora.resizeFolders();
                            pandora.selectList(); //fixme: doesn't work
                        }
                    }
                })
                .appendTo(app.$ui.folder[i].$content);
        });
    }
    that.toggle = function() {
        
    };
    return that;
};
