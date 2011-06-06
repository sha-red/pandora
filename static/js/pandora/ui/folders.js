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
    pandora.$ui.folder = [];
    pandora.$ui.folderBrowser = {};
    pandora.$ui.folderList = {};
    if (pandora.user.ui.section == 'site') {
        $.each(pandora.site.sectionFolders.site, function(i, folder) {
            var height = (Ox.getObjectById(pandora.site.sectionFolders.site, folder.id).items.length * 16);
            pandora.$ui.folder[i] = new Ox.CollapsePanel({
                    id: folder.id,
                    collapsed: !pandora.user.ui.showFolder.site[folder.id],
                    size: 16,
                    title: folder.title
                })
                .bindEvent({
                    toggle: function(event, data) {
                        
                    }
                });
            //alert(JSON.stringify(Ox.getObjectById(pandora.site.sectionFolders.site, folder.id)))
            pandora.$ui.folder[i].$content.css({
                height: height + 'px'
            })
                //.appendTo(that);
            pandora.$ui.folderList[folder.id] = pandora.ui.folderList(folder.id)
                .css({
                    height: height + 'px'
                })
                .appendTo(pandora.$ui.folder[i].$content);
            pandora.$ui.folder.forEach(function($folder) {
                that.append($folder);
            });
        });
        //pandora.resizeFolders();
    } else if (pandora.user.ui.section == 'items') {
        $.each(pandora.site.sectionFolders.items, function(i, folder) {
            var extras = [];
            if (folder.id == 'personal' && pandora.user.level != 'guest') {
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
                        var $list = pandora.$ui.folderList[folder.id],
                            id;
                        if (data.id == 'new' || data.id == 'newsmart') {
                            pandora.api.addList({
                                name: 'Untitled',
                                status: 'private',
                                type: data.id == 'new' ? 'static' : 'smart'
                            }, function(result) {
                                id = result.data.id;
                                pandora.UI.set(['lists', id].join('|'), pandora.site.user.ui.lists['']); // fixme: necessary?
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
            } else if (folder.id == 'favorite' && pandora.user.level != 'guest') {
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
                        pandora.site.sectionFolders.items[i].showBrowser = !pandora.site.sectionFolders.items[i].showBrowser;
                        if (pandora.site.sectionFolders.items[i].showBrowser) {
                            pandora.$ui.folderList.favorite.replaceWith(
                                pandora.$ui.folderBrowser.favorite = pandora.ui.folderBrowser('favorite')
                            );
                        } else {
                            pandora.$ui.folderBrowser.favorite.replaceWith(
                                pandora.$ui.folderList.favorite = pandora.ui.folderList('favorite')
                            );
                        }
                        pandora.resizeFolders();
                    }
                })];
            } else if (folder.id == 'featured' && pandora.user.level == 'admin') {
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
                        pandora.site.sectionFolders.items[i].showBrowser = !pandora.site.sectionFolders.items[i].showBrowser;
                        if (pandora.site.sectionFolders.items[i].showBrowser) {
                            pandora.$ui.folderList.featured.replaceWith(
                                pandora.$ui.folderBrowser.featured = pandora.ui.folderBrowser('featured'));
                        } else {
                            pandora.$ui.folderBrowser.featured.replaceWith(
                                pandora.$ui.folderList.featured = pandora.ui.folderList('featured')
                            );
                        }
                        pandora.resizeFolders();
                    }
                })];
            }
            pandora.$ui.folder[i] = new Ox.CollapsePanel({
                    id: folder.id,
                    collapsed: !pandora.user.ui.showFolder.items[folder.id],
                    extras: extras,
                    size: 16,
                    title: folder.title
                })
                .bindEvent({
                    // fixme: duplicated
                    click: function(event, data) {
                        var $list = pandora.$ui.folderList[i],
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
                            pandora.$ui.sectionList[1].replaceWith(pandora.$ui.publicLists = pandora.ui.publicLists());
                            pandora.site.showAllPublicLists = true;
                            */
                        }
                    },
                    toggle: function(event, data) {
                        data.collapsed && pandora.$ui.folderList[folder.id].loseFocus();
                        pandora.UI.set('showFolder|items|' + folder.id, !data.collapsed);
                        pandora.resizeFolders();
                    }
                });
            //$sections.push(pandora.$ui.section[i]);
            pandora.$ui.folderList[folder.id] = pandora.ui.folderList(folder.id)
                .bindEventOnce({
                    init: function(event, data) {
                        Ox.print('init', i, counter)
                        if (++counter == 3) {
                            pandora.$ui.folder.forEach(function($folder) {
                                that.append($folder);
                            });
                            pandora.resizeFolders();
                            pandora.selectList(); //fixme: doesn't work
                        }
                    }
                })
                .appendTo(pandora.$ui.folder[i].$content);
        });
    }
    that.toggle = function() {
        
    };
    return that;
};
