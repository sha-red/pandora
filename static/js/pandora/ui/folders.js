// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.folders = function() {
    var that = Ox.Element()
        .css({overflowX: 'hidden', overflowY: 'auto'})
        .bindEvent({
            resize: pandora.resizeFolders
        });
    var counter = 0;
    //var $sections = [];
    pandora.$ui.folder = [];
    pandora.$ui.folderBrowser = {};
    pandora.$ui.folderList = {};
    pandora.$ui.findListElement = {};
    pandora.$ui.findListSelect = {};
    pandora.$ui.findListInput = {};
    pandora.$ui.manageListsButton = {};
    if (pandora.user.ui.section == 'items') {
        pandora.site.sectionFolders.items.forEach(function(folder, i) {
            var extras;
            if (folder.id == 'personal') {
                if (pandora.user.level == 'guest') {
                    extras = [infoButton('Personal Lists', 'To create and publish your own lists of movies, please sign up or sign in.')];
                } else {
                    extras = [Ox.Select({
                        items: [
                            { id: 'new', title: 'New List...' },
                            { id: 'newfromselection', title: 'New List from Current Selection...', disabled: true },
                            {},
                            { id: 'newsmart', title: 'New Smart List...' },
                            { id: 'newfromresults', title: 'New Smart List from Current Results...', disabled: true },
                            {},
                            { id: 'copyselection', title: 'Copy Selection to List...' },
                            { id: 'moveselection', title: 'Move Selection to List...' }
                        ],
                        max: 0,
                        min: 0,
                        selectable: false,
                        tooltip: 'Manage Personal Lists',
                        type: 'image'
                    })
                    .bindEvent({
                        click: function(data) {
                            var $list = pandora.$ui.folderList[folder.id];
                            // fixme: duplicated
                            if (data.id == 'new' || data.id == 'newsmart') {
                                pandora.api.addList({
                                    name: 'Untitled',
                                    status: 'private',
                                    type: data.id == 'new' ? 'static' : 'smart'
                                }, function(result) {
                                    var id = result.data.id;
                                    pandora.UI.set('lists.' + id, pandora.site.user.ui.lists['']); // fixme: necessary?
                                    pandora.URL.set('?find=list:' + id)
                                    Ox.Request.clearCache(); // fixme: remove
                                    $list.reloadList().bindEventOnce({
                                        load: function(data) {
                                            $list.gainFocus()
                                                .options({selected: [id]})
                                                .editCell(id, 'name');
                                        }
                                    });
                                });
                            }
                        }
                    })];
                }
            } else if (folder.id == 'favorite') {
                if (pandora.user.level == 'guest') {
                    extras = [infoButton('Favorite Lists', 'To browse and subscribe to shared lists from other users, please sign up or sign in.')];
                } else {
                    extras = [pandora.$ui.manageListsButton['favorite'] = Ox.Button({
                        selectable: true,
                        style: 'symbol',
                        title: 'Edit',
                        tooltip: 'Manage Favorite Lists',
                        type: 'image'
                    })
                    .bindEvent({
                        change: function(data) {
                            Ox.Request.clearCache(); // fixme: remove
                            pandora.site.sectionFolders.items[i].showBrowser = !pandora.site.sectionFolders.items[i].showBrowser;
                            if (pandora.site.sectionFolders.items[i].showBrowser) {
                                pandora.$ui.folderList.favorite.replaceWith(
                                    pandora.$ui.folderBrowser.favorite = pandora.ui.folderBrowser('favorite')
                                );
                            } else {
                                listData = pandora.getListData();
                                if (
                                    pandora.$ui.folderList.favorite.options('selected').length
                                    && !listData.subscribed
                                ) {
                                    // the selected list in the favorites browser is not in the favorites folder
                                    pandora.$ui.folderList.favorite.options({selected: []});
                                    if (Ox.getObjectById(pandora.site.sectionFolders.items, 'featured').showBrowser) {
                                        // but in the featured browser
                                        pandora.$ui.folderList.featured.options({selected: [listData.id]});
                                    } else {
                                        // and nowhere else
                                        pandora.URL.set('');
                                    }
                                }
                                pandora.$ui.folderBrowser.favorite.replaceWith(
                                    pandora.$ui.folderList.favorite = pandora.ui.folderList('favorite')
                                );
                            }
                            pandora.resizeFolders();
                        }
                    })];
                }
            } else if (folder.id == 'featured') {
                if (pandora.user.level != 'admin') {
                    extras = [infoButton('Featured Lists', 'Featured lists are selected public lists, picked by the ' + pandora.site.site.name + ' staff.')];
                } else {
                    extras = [pandora.$ui.manageListsButton['featured'] = Ox.Button({
                        selectable: true,
                        style: 'symbol',
                        title: 'Edit',
                        tooltip: 'Manage Featured Lists',
                        type: 'image'
                    })
                    .bindEvent({
                        change: function(data) {
                            var listData;
                            Ox.Request.clearCache(); // fixme: remove
                            pandora.site.sectionFolders.items[i].showBrowser = !pandora.site.sectionFolders.items[i].showBrowser;
                            if (pandora.site.sectionFolders.items[i].showBrowser) {
                                pandora.$ui.folderList.featured.replaceWith(
                                    pandora.$ui.folderBrowser.featured = pandora.ui.folderBrowser('featured')
                                );
                            } else {
                                listData = pandora.getListData();
                                Ox.print('FEATURED', listData)
                                if (
                                    pandora.$ui.folderList.featured.options('selected').length
                                    && listData.status != 'featured'
                                ) {
                                    // the selected list in the featured browser is not in the featured folder
                                    pandora.$ui.folderList.featured.options({selected: []});
                                    if (listData.user == pandora.user.username) {
                                        // but in the personal folder
                                        pandora.$ui.folderList.personal.options({selected: [listData.id]});
                                    } else if (
                                        listData.subscribed
                                        || Ox.getObjectById(pandora.site.sectionFolders.items, 'favorite').showBrowser
                                    ) {
                                        // but in the favorites folder or browser
                                        pandora.$ui.folderList.favorite.options({selected: [listData.id]});
                                    } else {
                                        // and nowhere else
                                        pandora.URL.set('');
                                    }
                                }
                                pandora.$ui.folderBrowser.featured.replaceWith(
                                    pandora.$ui.folderList.featured = pandora.ui.folderList('featured')
                                );
                            }
                            pandora.resizeFolders();
                        }
                    })];
                }
            } else if (folder.id == 'volumes') {
                if (pandora.user.level == 'guest') {
                    extras = [infoButton('Local Volumes', 'To import movies from a local disk, please sign up or sign in.')];
                } else {
                    extras = [Ox.Select({
                        items: [
                            { id: 'add', title: 'Add Volume...' },
                            { id: 'scan', title: 'Scan Selected Volume...' },
                            { id: 'remove', title: 'Remove Selected Volume...' },
                            {},
                            { id: 'import', title: 'Import Movies...' }
                        ],
                        max: 0,
                        min: 0,
                        selectable: false,
                        type: 'image'
                    })
                    .bindEvent({
                        click: function(data) {
                        }
                    })];
                }
            }
            pandora.$ui.folder[i] = Ox.CollapsePanel({
                    id: folder.id,
                    collapsed: !pandora.user.ui.showFolder.items[folder.id],
                    extras: extras,
                    size: 16,
                    title: folder.title
                })
                .bindEvent({
                    // fixme: duplicated
                    click: function(data) {
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
                                    load: function(data) {
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
                    toggle: function(data) {
                        data.collapsed && pandora.$ui.folderList[folder.id].loseFocus();
                        pandora.UI.set('showFolder.items.' + folder.id, !data.collapsed);
                        pandora.resizeFolders();
                    }
                });
            //$sections.push(pandora.$ui.section[i]);
            pandora.$ui.folderList[folder.id] = pandora.ui.folderList(folder.id)
                .bindEventOnce({
                    init: function(data) {
                        Ox.print('init', i, counter)
                        if (++counter == 4) {
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
    function infoButton(title, text) {
        return Ox.Button({
            style: 'symbol',
            title: 'info',
            type: 'image'
        }).bindEvent({
            click: function() {
                var $dialog = Ox.Dialog({
                    buttons: Ox.merge([
                        Ox.Button({title: 'Close'}).bindEvent({
                            click: function() {
                                $dialog.close();
                            }
                        })
                    ], title != 'Featured Lists' ? [
                        Ox.Button({title: 'Sign Up'}).bindEvent({
                            click: function() {
                                $dialog.close();
                                pandora.$ui.accountDialog = pandora.ui.accountDialog('signup').open();
                            }
                        }),
                        Ox.Button({title: 'Sign In'}).bindEvent({
                            click: function() {
                                $dialog.close();
                                pandora.$ui.accountDialog = pandora.ui.accountDialog('signin').open();
                            }
                        })
                    ] : []),
                    content: Ox.Element()
                        .append(
                            $('<img>')
                                .attr({src: '/static/png/icon64.png'})
                                .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
                        )
                        .append(
                            $('<div>')
                                .css({position: 'absolute', left: '96px', top: '16px', width: '192px'})
                                .html(text)
                        ),
                    fixedSize: true,
                    height: 128,
                    width: 304,
                    title: title
                }).open();
            }
        });
    }
    that.toggle = function() {
        
    };
    return that;
};
