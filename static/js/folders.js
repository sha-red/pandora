// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.folders = function(section) {
    section = section || pandora.user.ui.section;
    var ui = pandora.user.ui,
        that = Ox.Element()
            .css({overflowX: 'hidden', overflowY: 'auto'})
            .bindEvent({
                resize: function() {
                    pandora.resizeFolders();
                }
            }),
        counter = 0,
        editable = (ui[
            section == 'items' ? '_list' : section.slice(0, -1)
        ] || '').split(':')[0] == pandora.user.username,
        folderItems = section == 'items' ? 'Lists' : Ox.toTitleCase(section),
        folderItem = folderItems.slice(0, -1);
    pandora.$ui.allItems = pandora.ui.allItems(section).appendTo(that);
    pandora.$ui.folder = [];
    pandora.$ui.folderBrowser = {};
    pandora.$ui.folderList = {};
    pandora.$ui.folderPlaceholder = {};
    pandora.$ui.findListElement = {};
    pandora.$ui.findListSelect = {};
    pandora.$ui.findListInput = {};
    pandora.$ui.manageListsButton = {};
    pandora.site.sectionFolders[section].forEach(function(folder, i) {
        var extras, $select;
        if (folder.id == 'personal') {
            if (pandora.user.level == 'guest') {
                extras = [
                    infoButton(Ox._('Personal ' + folderItems),
                        Ox._('To create and share your own list of {0} please sign up or sign in.', [Ox._(pandora.site.itemName.plural.toLowerCase())]),
                        Ox._('To create and share your own {0} please sign up or sign in.', [section]))
                ];
            } else {
                if (section == 'items') {
                    extras = [
                        pandora.$ui.personalListsMenu = Ox.MenuButton({
                            items: [
                                { id: 'newlist', title: Ox._('New List'), keyboard: 'control n' },
                                { id: 'newlistfromselection', title: Ox._('New List from Selection'), keyboard: 'shift control n', disabled: ui.listSelection.length == 0 },
                                { id: 'newsmartlist', title: Ox._('New Smart List'), keyboard: 'alt control n' },
                                { id: 'newsmartlistfromresults', title: Ox._('New Smart List from Results'), keyboard: 'shift alt control n' },
                                {},
                                { id: 'duplicatelist', title: Ox._('Duplicate Selected List'), keyboard: 'control d', disabled: !ui._list },
                                { id: 'editlist', title: Ox._('Edit Selected List...'), keyboard: 'control e', disabled: !editable },
                                { id: 'deletelist', title: Ox._('Delete Selected List...'), keyboard: 'delete', disabled: !editable }
                            ],
                            title: 'edit',
                            tooltip: Ox._('Manage Personal Lists'),
                            type: 'image'
                        })
                        .bindEvent({
                            click: function(data) {
                                var $list = pandora.$ui.folderList[folder.id];
                                // fixme: duplicated
                                if (Ox.contains([
                                    'newlist', 'newlistfromselection', 'newsmartlist', 'newsmartlistfromresults'
                                ], data.id)) {
                                    pandora.addList(data.id.indexOf('smart') > -1, data.id.indexOf('from') > -1);
                                } else if (data.id == 'duplicatelist') {
                                    pandora.addList(pandora.user.ui._list);
                                } else if (data.id == 'editlist') {
                                    pandora.ui.listDialog().open();
                                } else if (data.id == 'deletelist') {
                                    pandora.ui.deleteListDialog().open();
                                }
                            },
                            pandora_find: function() {
                                // fixme: duplicated
                                var action = ui._list
                                    && pandora.getListData(ui._list).user == pandora.user.username
                                    ? 'enableItem' : 'disableItem'
                                pandora.$ui.personalListsMenu[
                                    ui._list ? 'enableItem' : 'disableItem'
                                ]('duplicatelist');
                                pandora.$ui.personalListsMenu[action]('editlist');
                                pandora.$ui.personalListsMenu[action]('deletelist');
                                pandora.$ui.personalListsMenu[
                                    ui.listSelection.length ? 'enableItem' : 'disableItem'
                                ]('newlistfromselection');
                            },
                            pandora_listselection: function(data) {
                                pandora.$ui.personalListsMenu[
                                    data.value.length ? 'enableItem' : 'disableItem'
                                ]('newlistfromselection');
                            }
                        })
                    ];
                } else if (section == 'edits') {
                    extras = [
                        pandora.$ui.personalListsMenu = Ox.MenuButton({
                            items: [
                                { id: 'newedit', title: Ox._('New Edit'), keyboard: 'control n' },
                                { id: 'neweditfromselection', title: Ox._('New Edit from Selection'), keyboard: 'shift control n', disabled: !ui.edit || !ui.editSelection.length },
                                { id: 'newsmartedit', title: Ox._('New Smart Edit'), keyboard: 'alt control n'},
                                {},
                                { id: 'duplicateedit', title: Ox._('Duplicate Selected Edit'), keyboard: 'control d', disabled: !ui.edit },
                                { id: 'editedit', title: Ox._('Edit Selected Edit...'), keyboard: 'control e', disabled: !editable },
                                { id: 'deleteedit', title: Ox._('Delete Selected Edit...'), keyboard: 'delete', disabled: !editable }
                            ],
                            title: 'edit',
                            tooltip: Ox._('Manage Personal Edits'),
                            type: 'image'
                        })
                        .bindEvent({
                            click: function(data) {
                                var $list = pandora.$ui.folderList[folder.id];
                                if (data.id == 'newedit') {
                                    pandora.addEdit();
                                } else if (data.id == 'neweditfromselection') {
                                    pandora.addEdit(false, true);
                                } else if (data.id == 'newsmartedit') {
                                    pandora.addEdit(true, false);
                                } else if (data.id == 'duplicateedit') {
                                    pandora.addEdit(ui.edit);
                                } else if (data.id == 'editedit') {
                                    pandora.ui.listDialog().open();
                                } else if (data.id == 'deleteedit') {
                                    pandora.ui.deleteListDialog().open();
                                }
                            }
                        })
                        .bindEvent({
                            pandora_edit: function(data) {
                                var action = ui.edit
                                    && pandora.getListData(ui.edit).user == pandora.user.username
                                    ? 'enableItem' : 'disableItem';
                                pandora.$ui.personalListsMenu[
                                    ui.edit ? 'enableItem' : 'disableItem'
                                ]('duplicateedit');
                                pandora.$ui.personalListsMenu[action]('editedit');
                                pandora.$ui.personalListsMenu[action]('deleteedit');
                            },
                            pandora_editselection: function(data) {
                                pandora.$ui.personalListsMenu[
                                    data.value.length ? 'enableItem' : 'disableItem'
                                ]('neweditfromselection');
                            }
                        })
                    ];
                } else if (section == 'texts') {
                    extras = [
                        pandora.$ui.personalListsMenu = Ox.MenuButton({
                            items: [
                                { id: 'newtext', title: Ox._('New Text'), keyboard: 'control n' },
                                { id: 'newpdf', title: Ox._('New PDF'), keyboard: 'alt control n' },
                                {},
                                { id: 'edittext', title: Ox._('Edit Selected Text...'), keyboard: 'control e', disabled: !editable },
                                { id: 'deletetext', title: Ox._('Delete Selected Text...'), keyboard: 'delete', disabled: !editable }
                            ],
                            title: 'edit',
                            tooltip: Ox._('Manage Personal Texts'),
                            type: 'image'
                        })
                        .bindEvent({
                            click: function(data) {
                                var $list = pandora.$ui.folderList[folder.id];
                                if (data.id == 'newtext') {
                                    pandora.addText({type: 'html'});
                                } else if (data.id == 'newpdf') {
                                    pandora.addText({type: 'pdf'});
                                } else if (data.id == 'edittext') {
                                    pandora.ui.listDialog().open();
                                } else if (data.id == 'deletetext') {
                                    pandora.ui.deleteListDialog().open();
                                }
                            }
                        })
                        .bindEvent('pandora_text', function(data) {
                            var action = ui.text
                                && pandora.getListData(ui.text).user == pandora.user.username
                                ? 'enableItem' : 'disableItem';
                            pandora.$ui.personalListsMenu[action]('edittext');
                            pandora.$ui.personalListsMenu[action]('deletetext');
                        })
                    ];
                } else {
                    extras = [];
                }
            }
        } else if (folder.id == 'favorite') {
            if (pandora.user.level == 'guest') {
                extras = [infoButton(Ox._('Favorite ' + folderItems),
                    Ox._('To browse and subscribe to shared {0} from other users, please sign up or sign in.', [Ox._(folderItems.toLowerCase())]))];
            } else {
                extras = [pandora.$ui.manageListsButton['favorite'] = Ox.Button({
                    selectable: true,
                    style: 'symbol',
                    title: 'edit',
                    tooltip: Ox._('Manage Favorite {0}', [Ox._(folderItems)]),
                    type: 'image'
                })
                .bindEvent({
                    change: function(data) {
                        var listData;
                        Ox.Request.clearCache(); // fixme: remove
                        pandora.site.sectionFolders[section][i].showBrowser = !pandora.site.sectionFolders[section][i].showBrowser;
                        this.options({tooltip: data.value ? Ox._('Done') : Ox._('Manage Favorite {0}', [Ox._(folderItems)])});
                        if (pandora.site.sectionFolders[section][i].showBrowser) {
                            pandora.$ui.folderList.favorite.replaceWith(
                                pandora.$ui.folderBrowser.favorite = pandora.ui.folderBrowser('favorite', section)
                            );
                            pandora.$ui.folder[i].options({collapsed: false});
                        } else {
                            listData = pandora.getListData();
                            if (
                                pandora.$ui.folderList.favorite.options('selected').length
                                && !listData.subscribed
                            ) {
                                // the selected list in the favorites browser is not in the favorites folder
                                pandora.$ui.folderList.favorite.options({selected: []});
                                if (Ox.getObjectById(pandora.site.sectionFolders[section], 'featured').showBrowser) {
                                    // but in the featured browser
                                    pandora.$ui.folderList.featured.options({selected: [listData.id]});
                                } else {
                                    // and nowhere else
                                    pandora.UI.set({
                                        find: pandora.site.user.ui.find
                                    });
                                }
                            }
                            pandora.$ui.folderBrowser.favorite.replaceWith(
                                pandora.$ui.folderList.favorite = pandora.ui.folderList('favorite', section)
                            );
                        }
                        pandora.resizeFolders();
                    }
                })];
            }
        } else if (folder.id == 'featured') {
            if (pandora.user.level != 'admin') {
                extras = [infoButton(Ox._('Featured ' + folderItems),
                    Ox._('Featured {0} are selected public {0}, picked by the {1} staff.',
                        [Ox._(folderItems.toLowerCase()), pandora.site.site.name]))];
            } else {
                extras = [pandora.$ui.manageListsButton['featured'] = Ox.Button({
                    selectable: true,
                    style: 'symbol',
                    title: 'edit',
                    tooltip: Ox._('Manage Featured {0}', [Ox._(folderItems)]),
                    type: 'image'
                })
                .bindEvent({
                    change: function(data) {
                        var listData;
                        Ox.Request.clearCache(); // fixme: remove
                        pandora.site.sectionFolders[section][i].showBrowser = !pandora.site.sectionFolders[section][i].showBrowser;
                        this.options({tooltip: data.value ? Ox._('Done') : Ox._('Manage Favorite {0}', [Ox._(folderItems)])});
                        if (pandora.site.sectionFolders[section][i].showBrowser) {
                            pandora.$ui.folderList.featured.replaceWith(
                                pandora.$ui.folderBrowser.featured = pandora.ui.folderBrowser('featured', section)
                            );
                            pandora.$ui.folder[i].options({collapsed: false});
                        } else {
                            listData = pandora.getListData();
                            Ox.Log('', 'FEATURED', listData)
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
                                    || Ox.getObjectById(pandora.site.sectionFolders[section], 'favorite').showBrowser
                                ) {
                                    // but in the favorites folder or browser
                                    pandora.$ui.folderList.favorite.options({selected: [listData.id]});
                                } else {
                                    // and nowhere else
                                    pandora.UI.set({
                                        find: pandora.site.user.ui.find
                                    });
                                }
                            }
                            pandora.$ui.folderBrowser.featured.replaceWith(
                                pandora.$ui.folderList.featured = pandora.ui.folderList('featured', section)
                            );
                        }
                        pandora.resizeFolders();
                    }
                })];
            }
        } else if (folder.id == 'volumes') {
            if (pandora.user.level == 'guest') {
                extras = [infoButton(Ox._('Local Volumes'), Ox._('To import {0} from a local disk, please sign up or sign in.',
                    [Ox._(pandora.site.itemName.plural.toLocaleLowerCase())]))];
            } else {
                extras = [Ox.MenuButton({
                    items: [
                        { id: 'add', title: Ox._('Add Volume...'), disabled: true },
                        { id: 'scan', title: Ox._('Scan Selected Volume...'), disabled: true },
                        { id: 'remove', title: Ox._('Remove Selected Volume...'), disabled: true },
                        {},
                        { id: 'import', title: Ox._('Import {0}...',
                            [Ox._(pandora.site.itemName.plural)]), disabled: true }
                    ],
                    title: 'edit',
                    tooltip: Ox._('Manage Volumes'),
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
                collapsed: !ui.showFolder.items[folder.id],
                extras: extras,
                size: 16,
                title: Ox._(folder.title)
            })
            .bindEvent({
                click: function(data) {
                    if (data.id == 'new' || data.id == 'newsmart') {
                        pandora.addFolderItem(section, data.id == 'newsmart', false);
                    } else if (data.id == 'browse') {
                        // ...
                    }
                },
                toggle: function(data) {
                    data.collapsed && pandora.$ui.folderList[folder.id].loseFocus();
                    pandora.UI.set('showFolder.items.' + folder.id, !data.collapsed);
                    pandora.resizeFolders();
                }
            });
        pandora.$ui.folderList[folder.id] = pandora.ui.folderList(folder.id, section)
            .bindEvent({
                selectnext: function() {
                    // ...
                },
                selectprevious: function() {
                    // ...
                }
            })
            .bindEventOnce({
                init: function(data) {
                    if (++counter == pandora.site.sectionFolders[section].length) {
                        pandora.$ui.folder.forEach(function($folder) {
                            that.append($folder);
                        });
                        pandora.resizeFolders(section);
                        pandora.selectList();
                    }
                }
            })
            .appendTo(pandora.$ui.folder[i].$content);
        pandora.$ui.folderPlaceholder[folder.id] = pandora.ui.folderPlaceholder(folder.id, section)
            .hide()
            .appendTo(pandora.$ui.folder[i].$content);
    });
    function infoButton(title, text) {
        return Ox.Button({
            style: 'symbol',
            title: 'info',
            type: 'image'
        }).bindEvent({
            click: function() {
                var $dialog = pandora.ui.iconDialog({
                    buttons: title != Ox._('Featured Lists') ? [
                        Ox.Button({title: Ox._('Sign Up...')}).bindEvent({
                            click: function() {
                                $dialog.close();
                                pandora.$ui.accountDialog = pandora.ui.accountDialog('signup').open();
                            }
                        }),
                        Ox.Button({title: Ox._('Sign In...')}).bindEvent({
                            click: function() {
                                $dialog.close();
                                pandora.$ui.accountDialog = pandora.ui.accountDialog('signin').open();
                            }
                        }),
                        {},
                        Ox.Button({title: Ox._('Not Now')}).bindEvent({
                            click: function() {
                                $dialog.close();
                            }
                        })
                    ] : [
                        Ox.Button({title: Ox._('Close')}).bindEvent({
                            click: function() {
                                $dialog.close();
                            }
                        })
                    ],
                    content: text,
                    title: title
                }).open();
            }
        });
    }
    that.bindEvent({
        pandora_edit: function() {
            var folder = pandora.getListData().folder,
                edit = pandora.user.ui.edit,
                previousEdit = pandora.UI.getPrevious().edit;
            if (edit != previousEdit) {
                Ox.forEach(pandora.$ui.folderList, function($list, id) {
                    id != folder && $list.options('selected', []);
                });
                folder && pandora.$ui.folderList[folder].options({selected: [edit]});
            }
        },
        pandora_find: function() {
            var folder = pandora.getListData().folder,
                list = pandora.user.ui._list,
                previousList = pandora.UI.getPrevious()._list;
            if (list != previousList) {
                Ox.forEach(pandora.$ui.folderList, function($list, id) {
                    id != folder && $list.options('selected', []);
                });
                folder && pandora.$ui.folderList[folder].options({selected: [list]});
            }
            /*
            if (!pandora.user.ui._list && previousUI._list) {
                pandora.$ui.folderList[pandora.getListData(previous)]
                Ox.forEach(pandora.$ui.folderList, function($list) {
                    $list.options({selected: []});
                });
            }
            */
        },
        pandora_text: function() {
            if (!pandora.user.ui.text) {
                Ox.forEach(pandora.$ui.folderList, function($list, id) {
                    $list.options('selected', []);
                });
            }
        }
    })
    return that;
};
