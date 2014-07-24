// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.addItem = function() {
    pandora.api.add(function(result) {
        Ox.Request.clearCache('find');
        pandora.UI.set({
            item: result.data.id,
            itemView: 'info'
        });
    });
};

pandora.addEdit = function() {
    // addEdit(isSmart, isFrom) or addEdit(edit) [=duplicate]
    pandora.addFolderItem.apply(null, ['edits'].concat(Ox.slice(arguments)));
};

pandora.addFolderItem = function(section) {
    // addFolderItem(section, isSmart, isFrom)
    // or addFolderItem(section, list) [=duplicate]
    var $folderList = pandora.$ui.folderList.personal,
        isDuplicate = arguments.length == 2,
        isItems = section == 'items',
        isSmart, isFrom, list, listData, data,
        ui = pandora.user.ui;
    pandora.UI.set({showSidebar: true});
    if (!isDuplicate) {
        isSmart = arguments[1];
        isFrom = arguments[2];
        data = {
            name: Ox._('Untitled'),
            status: 'private',
            type: !isSmart ? 'static' : 'smart'
        };
        if (isFrom) {
            if (!isSmart) {
                if (isItems) {
                    data.items = ui.listSelection;
                } else {
                    data.clips = pandora.getClipData(
                        ui.section == 'items'
                        ? pandora.$ui.clipList.options('selected') // FIXME: still wrong, could be annotation or in-to-out
                        : pandora.$ui.editPanel.getSelectedClips()
                    );
                }
            } else {
                data.query = ui.find;
            }
        }
        if (ui.section == 'items' && section == 'edits') {
            pandora.UI.set({section: 'edits'});
        }
        addList();
    } else {
        list = arguments[1];
        listData = pandora.getListData();
        data = {
            name: listData.name,
            status: listData.status == 'featured' ? 'public' : listData.status,
            type: listData.type
        };
        if (data.type == 'smart') {
            data.query = listData.query;
        }
        pandora.api[isItems ? 'findLists' : 'findEdits']({
            query: {conditions: [{key: 'id', value: list, operator: '=='}]},
            keys: ['description']
        }, function(result) {
            data.description = result.data.items[0].description;
            if (data.type == 'static') {
                var query;
                if (isItems) {
                    query = {
                        conditions: [{key: 'list', value: list, operator: '=='}],
                        operator: '&'
                    };
                    pandora.api.find({query: query}, function(result) {
                        if (result.data.items) {
                            pandora.api.find({
                                query: query,
                                keys: ['id'],
                                sort: [{key: 'id', operator: ''}],
                                range: [0, result.data.items]
                            }, function(result) {
                                data.items = result.data.items.map(function(item) {
                                    return item.id;
                                });
                                addList();
                            });
                        } else {
                            addList();
                        }
                    });
                } else {
                    pandora.api.getEdit({id: list}, function(result) {
                        data.clips = result.data.clips.map(function(clip) {
                            return Ox.extend({
                                item: clip.item
                            }, clip.annotation ? {
                                annotation: clip.annotation
                            } : {
                                'in': clip['in'],
                                out: clip.out
                            });
                        });
                        addList();
                    });
                }
            } else {
                addList();
            }
        });
    }
    function addList() {
        pandora.api[isItems ? 'addList' : 'addEdit'](data, function(result) {
            getPosterFrames(result.data.id);
        });
    }
    function getPosterFrames(newList) {
        var query,
            sortKey = Ox.getObjectById(pandora.site.itemKeys, 'votes')
                ? 'votes' : 'timesaccessed';
        if (!isDuplicate) {
            (isItems ? Ox.noop : pandora.api.getEdit)({id: newList}, function(result) {
                query = isItems ? {
                    conditions: [{key: 'list', value: newList, operator: '=='}],
                    operator: '&'
                } : {
                    conditions: Ox.unique(result.data.clips.map(function(clip) {
                        return {key: 'id', value: clip.item, operator: '=='};
                    })),
                    operator: '|'
                };
                pandora.api.find({
                    query: {
                        conditions: [{key: 'list', value: newList, operator: '=='}],
                        operator: '&'
                    },
                    keys: ['id', 'posterFrame'],
                    sort: [{key: sortKey, operator: ''}],
                    range: [0, 4]
                }, function(result) {
                    var posterFrames = result.data.items.map(function(item) {
                        return {item: item.id, position: item.posterFrame};
                    });
                    posterFrames = posterFrames.length == 1
                        ? Ox.repeat([posterFrames[0]], 4)
                        : posterFrames.length == 2
                        ? [posterFrames[0], posterFrames[1], posterFrames[1], posterFrames[0]]
                        : posterFrames.length == 3
                        ? [posterFrames[0], posterFrames[1], posterFrames[2], posterFrames[0]]
                        : posterFrames;
                    setPosterFrames(newList, posterFrames);
                });
            });
        } else {
            pandora.api[isItems ? 'findLists' : 'findEdits']({
                query: {
                    conditions: [{key: 'id', value: list, operator: '=='}],
                    operator: '&'
                },
                keys: ['posterFrames']
            }, function(result) {
                setPosterFrames(newList, result.data.items[0].posterFrames);
            });
        }
    }
    function setPosterFrames(newList, posterFrames) {
        pandora.api[isItems ? 'editList' : 'editEdit']({
            id: newList,
            posterFrames: posterFrames
        }, function() {
            reloadFolder(newList);
        });
    }
    function reloadFolder(newList) {
        // FIXME: collapsing sets ui showFolder,
        // but should work the other way around
        // (same applies to addText, below)
        $folderList = pandora.$ui.folderList.personal;
        pandora.$ui.folder[0].options({collapsed: false});
        Ox.Request.clearCache(isItems ? 'findLists' : 'findEdits');
        $folderList.bindEventOnce({
            load: function() {
                $folderList.gainFocus()
                    .options({selected: [newList]})
                    .editCell(newList, 'name', true);
                pandora.UI.set(isItems ? {
                    find: {
                        conditions: [{key: 'list', value: newList, operator: '=='}],
                        operator: '&'
                    }
                } : {
                    edit: newList
                });
            }
        }).reloadList();
    }
};

pandora.addList = function() {
    // addList(isSmart, isFrom) or addList(list) [=duplicate]
    pandora.addFolderItem.apply(null, ['items'].concat(Ox.slice(arguments)));
};

pandora.addText = function(options) {
    var $folderList = pandora.$ui.folderList.personal;
    options = options || {};
    pandora.api.addText(options, function(result) {
        reloadFolder(result.data.id);
    });
    function reloadFolder(newId) {
        pandora.$ui.folder[0].options({collapsed: false});
        Ox.Request.clearCache('findTexts');
        $folderList.bindEventOnce({
            load: function(data) {
                $folderList.gainFocus()
                    .options({selected: [newId]})
                    .editCell(newId, 'name', true);
                pandora.UI.set(pandora.user.ui.section.slice(0, -1), newId);
            }
        }).reloadList();
    }
}

pandora.beforeUnloadWindow = function() {
    if (pandora.firefogg)
        return Ox._("Encoding is currently running\nDo you want to leave this page?");
    //prevent error dialogs on unload
    pandora.isUnloading = true;
};

pandora.changeFolderItemStatus = function(id, status, callback) {
    var ui = pandora.user.ui,
        folderItems = ui.section == 'items' ? 'Lists' : Ox.toTitleCase(ui.section),
        folderItem = folderItems.slice(0, -1);
    if (status == 'private') {
        pandora.api['find' + folderItems]({
            query: {conditions: [{key: 'id', value: id, operator: '=='}]},
            keys: ['name', 'subscribers']
        }, function(result) {
            var name = result.data.items[0].name,
                subscribers = result.data.items[0].subscribers;
            if (subscribers) {
                pandora.ui.makeListPrivateDialog(name, subscribers, function(makePrivate) {
                    if (makePrivate) {
                        changeFolderItemStatus();
                    } else {
                        callback({data: {
                            id: id,
                            status: 'public'
                        }});
                    }
                }).open();
            } else {
                changeFolderItemStatus();
            }
        });
    } else {
        changeFolderItemStatus();
    }
    function changeFolderItemStatus() {
        pandora.api['edit' + folderItem]({
            id: id,
            status: status
        }, callback);
    }
};

pandora.clickLink = function(e) {
    var match = e.target.id.match(/^embed(\d+)$/)
    if (match) {
        pandora.$ui.textPanel.selectEmbed(parseInt(match[1]));
    } else if (
        e.target.hostname == document.location.hostname
        && !Ox.startsWith(e.target.pathname, '/static')
        && (window.self == window.top  || pandora.isEmbeddableView(e.target.href))
    ) {
        if (pandora.$ui.home && e.target.pathname != '/home') {
            pandora.$ui.home.fadeOutScreen();
        }
        pandora.URL.push(e.target.pathname, true);
    } else {
        pandora.openLink(e.target.href);
    }
};

pandora.createLinks = function($element) {
    function isExternalLink(target) {
        return target.hostname != document.location.hostname
            || Ox.startsWith(target.pathname, '/static');
    } 
    $element.on({
        click: function(e) {
            var $target = $(e.target);
            if (
                $target.is('a')
                && !$($target.parent()).is('.OxEditable')
                && !$($target.parent()).is('.OxEditableContent')
            ) {
                e.preventDefault();
                if (isExternalLink(e.target)) {
                    pandora.openLink(e.target.href);
                } else {
                    pandora.clickLink(e);
                }
            }
            return false;
        }
    });
};

(function() {

    pandora.doHistory = function(action, items, targets, callback) {
        items = Ox.makeArray(items);
        targets = Ox.makeArray(targets);
        if (action == 'copy' || action == 'paste') {
            addItems(items, targets[0], addToHistory);
        } else if (action == 'cut' || action == 'delete') {
            removeItems(items, targets[0], addToHistory);
        } else if (action == 'edit') {
            editItem(items[1], addToHistory);
        } else if (action == 'join' || action == 'split') {
            removeItems(items[0], targets[0], function() {
                addItems(items[1], targets[0], addToHistory);
            });
        } else if (action == 'move') {
            removeItems(items, targets[0], function() {
                addItems(items, targets[1], addToHistory);
            });
        } 
        function addToHistory(result, addedItems) {
            var actions = {
                    copy: 'Copying',
                    cut: 'Cutting',
                    'delete': 'Deleting',
                    edit: 'Editing',
                    join: 'Joining',
                    move: 'Moving',
                    paste: 'Pasting',
                    split: 'Splitting'
                },
                length = action == 'edit' ? 1
                    : action == 'join' || action == 'split' ? items[0].length
                    : items.length,
                type = getType(items),
                text = Ox._(actions[action]) + ' ' + (
                    length == 1 ? Ox._(type == 'item' ? pandora.site.itemName.singular : 'Clip')
                    : length + ' ' + Ox._(type == 'item' ? pandora.site.itemName.plural : 'Clips')
                );
            pandora.history.add({
                action: action,
                items: action == 'cut' || action == 'delete' ? [items]
                    : action == 'copy' || action == 'paste' ? [addedItems]
                    : action == 'edit' ? items
                    : action == 'join' || action == 'split' ? [items[0], addedItems]
                    : [items, addedItems], // move
                positions: [],
                targets: targets,
                text: text
            });
            callback(result);
        }
    };

    pandora.redoHistory = function(callback) {
        var object = pandora.history.redo();
        if (object) {
            if (object.action == 'copy' || object.action == 'paste') {
                addItems(object.items[0], object.targets[0], done);
            } else if (object.action == 'cut' || object.action == 'delete') {
                removeItems(object.items[0], object.targets[0], done);
            } else if (object.action == 'edit') {
                editItem(object.items[1], done);
            } else if (object.action == 'join' || object.action == 'split') {
                removeItems(object.items[0], object.targets[0], function() {
                    addItems(object.items[1], object.targets[0], done);
                });
            } else if (object.action == 'move') {
                removeItems(object.items[0], object.targets[0], function() {
                    addItems(object.items[1], object.targets[1], done);
                });
            }
        }
        function done() {
            doneHistory(object, callback);
        }
    };

    pandora.undoHistory = function(callback) {
        var object = pandora.history.undo();
        if (object) {
            if (object.action == 'copy' || object.action == 'paste') {
                removeItems(object.items[0], object.targets[0], done);
            } else if (object.action == 'cut' || object.action == 'delete') {
                addItems(object.items[0], object.targets[0], done);
            } else if (object.action == 'edit') {
                editItem(object.items[0], done);
            } else if (object.action == 'join' || object.action == 'split') {
                removeItems(object.items[1], object.targets[0], function() {
                    addItems(object.items[0], object.targets[0], done);
                });
            } else if (object.action == 'move') {
                removeItems(object.items[1], object.targets[1], function() {
                    addItems(object.items[0], object.targets[0], done);
                });
            }
        }
        function done() {
            doneHistory(object, callback);
        }
    };

    function addItems(items, target, callback) {
        var clips, type = getType(items);
        if (type == 'item') {
            pandora.api.find({
                query: {
                    conditions: [{key: 'list', operator: '==', value: target}],
                    operator: '&'
                },
                positions: items
            }, function(result) {
                var existingItems = Object.keys(result.data.positions),
                    addedItems = items.filter(function(item) {
                        return !Ox.contains(existingItems, item);
                    });
                if (addedItems.length) {
                    pandora.api.addListItems({items: addedItems, list: target}, function(result) {
                        callback(result, addedItems);
                    });                    
                } else {
                    callback(null, []);
                }
            });
        } else {
            pandora.api.addClips({
                clips: pandora.getClipData(items),
                edit: target,
                index: pandora.$ui.editPanel.getPasteIndex()
            }, function(result) {
                // adding clips creates new ids, so mutate items in history
                items.splice.apply(items, [0, items.length].concat(pandora.getClipItems(result.data.clips)));
                callback(result, items);
            });
        }
    }

    function doneHistory(object, callback) {
        var list, listData,
            type = getType(object.items),
            ui = pandora.user.ui;
        if (type == 'item' && ui.section == 'items') {
            Ox.Request.clearCache('find');
            object.targets.filter(function(list) {
                return list != ui._list;
            }).forEach(function(list) {
                listData = pandora.getListData(list);
                pandora.api.find({
                    query: {
                        conditions: [{key: 'list', value: list, operator: '=='}],
                        operator: '&'
                    }
                }, function(result) {
                    pandora.$ui.folderList[listData.folder].value(
                        list, 'items', result.data.items
                    );
                });
            });
            if (Ox.contains(object.targets, ui._list)) {
                // FIXME: Why is this timeout needed?
                setTimeout(pandora.reloadList, 250);
            }
        } else if (type == 'clip' && ui.section == 'edits') {
            // FIXME: update edit list (once it has item count)
            if (Ox.contains(object.targets, ui.edit)) {
                pandora.$ui.editPanel.updatePanel();
            }
        }
        callback && callback();
    }

    function editItem(item, callback) {
        var clip = pandora.getClipData([item])[0],
            id = getClipIds([item])[0];
        pandora.api.editClip({
            id: id,
            'in': clip['in'],
            out: clip.out
        }, callback);
    }

    function getClipIds(items) {
        return items.map(function(clip) {
            return clip.split('/').pop();
        });
    }

    function getType(items) {
        return Ox.contains(items[0], '/') || Ox.contains(items[0][0], '/') ? 'clip' : 'item';
    }

    function removeItems(items, target, callback) {
        var type = getType(items);
        if (type == 'item') {
            pandora.api.removeListItems({items: items, list: target}, callback);
        } else {
            pandora.api.removeClips({ids: getClipIds(items), edit: target}, callback);
        }
    }

}());

pandora.enableDragAndDrop = function($list, canMove, section) {

    section = section || pandora.user.ui.section;

    var $tooltip = Ox.Tooltip({
            animate: false
        }),
        drag = {},
        scrollInterval;

    $list.bindEvent({
        draganddropstart: function(data) {
            if (section != pandora.user.ui.section) {
                pandora.$ui.mainPanel.replaceElement(0,
                    pandora.$ui.leftPanel = pandora.ui.leftPanel(section)
                );
            }
            drag.action = 'copy';
            drag.ids = $list.options('selected'),
            drag.item = drag.ids.length == 1
                ? $list.value(drag.ids[0], 'title') || 1
                : drag.ids.length;
            drag.source = pandora.getListData(),
            drag.targets = {};
            //fixme instead of a fixed timeout,
            //bind to lists and update if they get new items
            setTimeout(function() {
                Ox.forEach(pandora.$ui.folderList, function($list) {
                    $list.addClass('OxDroppable').find('.OxItem').each(function() {
                        var $item = $(this),
                            id = $item.data('id'),
                            data = $list.value(id);
                        if (drag.targets) {
                            drag.targets[id] = Ox.extend({
                                editable: data.user == pandora.user.username
                                    && data.type == 'static',
                                selected: $item.is('.OxSelected')
                            }, data);
                            if (!drag.targets[id].selected && drag.targets[id].editable) {
                                $item.addClass('OxDroppable');
                            }
                        }
                    });
                });
            }, section != pandora.user.ui.section ? 2000 : 0);
            $tooltip.options({title: getTitle()}).show(data.event);
            canMove && Ox.UI.$window.on({
                keydown: keydown,
                keyup: keyup
            });
        },
        draganddrop: function(data) {
            var event = data.event;
            $tooltip.options({
                title: getTitle(event)
            }).show(event);
            if (scrollInterval && !isAtListsTop(event) && !isAtListsBottom(event)) {
                clearInterval(scrollInterval);
                scrollInterval = 0;
            }
        },
        draganddroppause: function(data) {
            var event = data.event, scroll,
                $parent, $grandparent, $panel, title;
            if (!pandora.user.ui.showSidebar) {
                if (event.clientX < 16 && event.clientY >= 44
                    && event.clientY < window.innerHeight - 16
                ) {
                    pandora.$ui.mainPanel.toggle(0);
                }
            } else {
                $parent = $(event.target).parent();
                $grandparent = $parent.parent();
                $panel = $parent.is('.OxCollapsePanel') ? $parent
                    : $grandparent.is('.OxCollapsePanel') ? $grandparent : null;
                if ($panel) {
                    title = $panel.children('.OxBar').children('.OxTitle')
                        .html().split(' ')[0].toLowerCase();
                    if (!pandora.user.ui.showFolder.items[title]) {
                        Ox.UI.elements[$panel.data('oxid')].options({collapsed: false});
                    }
                }
                if (!scrollInterval) {
                    scroll = isAtListsTop(event) ? -16
                        : isAtListsBottom(event) ? 16 : 0
                    if (scroll) {
                        scrollInterval = setInterval(function() {
                            pandora.$ui.folders.scrollTop(
                                pandora.$ui.folders.scrollTop() + scroll
                            );
                        }, 100);
                    }
                }
            }
        },
        draganddropenter: function(data) {
            var $parent = $(data.event.target).parent(),
                $item = $parent.is('.OxItem') ? $parent : $parent.parent(),
                $list = $item.parent().parent().parent().parent();
            if ($list.is('.OxDroppable')) {
                $item.addClass('OxDrop');
                drag.target = drag.targets[$item.data('id')];
            } else {
                drag.target = null;
            }
        },
        draganddropleave: function(data) {
            var $parent = $(data.event.target).parent(),
                $item = $parent.is('.OxItem') ? $parent : $parent.parent();
            if ($item.is('.OxDroppable')) {
                $item.removeClass('OxDrop');
                drag.target = null;
            }
        },
        draganddropend: function(data) {
            Ox.Log('', data, drag, '------------');
            canMove && Ox.UI.$window.off({
                keydown: keydown,
                keyup: keyup
            });
            if (drag.target && drag.target.editable && !drag.target.selected) {
                if (drag.action == 'copy' || (
                    drag.action == 'move' && drag.source.editable
                )) {
                    if (section == 'items') {
                        var targets = drag.action == 'copy' ? drag.target.id
                            : [pandora.user.ui._list, drag.target.id];
                        pandora.doHistory(drag.action, data.ids, targets, function() {
                            Ox.Request.clearCache('find');
                            pandora.api.find({
                                query: {
                                    conditions: [{key: 'list', value: drag.target.id, operator: '=='}],
                                    operator: '&'
                                }
                            }, function(result) {
                                var folder = drag.target.status != 'featured' ? 'personal' : 'featured';
                                pandora.$ui.folderList[folder].value(
                                    drag.target.id, 'items', result.data.items
                                );
                                cleanup(250);
                            });
                            drag.action == 'move' && pandora.reloadList();
                        });
                    } else if (section == 'edits') {
                        var targets = drag.action == 'copy' ? drag.target.id
                            : [pandora.user.ui.edit, drag.target.id];
                        pandora.doHistory(drag.action, data.ids, targets, function() {
                            Ox.print('FIXME, reload clipslist on move');
                            pandora.$ui.editPanel.updatePanel();
                            cleanup(250);
                        });
                    } 
                }
            } else {
                cleanup(0);
            }
            function cleanup(ms) {
                drag = {};
                clearInterval(scrollInterval);
                scrollInterval = 0;
                setTimeout(function() {
                    $('.OxDroppable').removeClass('OxDroppable');
                    $('.OxDrop').removeClass('OxDrop');
                    $tooltip.hide();
                    section != pandora.user.ui.section && setTimeout(function() {
                        pandora.$ui.mainPanel.replaceElement(0,
                            pandora.$ui.leftPanel = pandora.ui.leftPanel());
                    }, 500);
                }, ms);
            }
        }
    });

    function getTitle() {
        var image, text,
            itemName = section == 'items' ? {
                plural: Ox._(pandora.site.itemName.plural.toLowerCase()),
                singular: Ox._(pandora.site.itemName.singular.toLowerCase())
            } : {
                plural: Ox._('clips'),
                singular: Ox._('clip')
            },
            targetName = section == 'items' ? {
                plural: Ox._('lists'),
                singular: Ox._('list')
            } : {
                plural: Ox._('edits'),
                singular: Ox._('edit')
            };
        if (drag.action == 'move' && section == 'edits' && pandora.user.ui.section == 'items') {
            image = 'symbolClose';
            text = Ox._(
                'You can only remove {0}<br>from {1}.',
                [itemName.plural, targetName.plural]
            );
        } else if (drag.action == 'move' && drag.source.user != pandora.user.username) {
            image = 'symbolClose';
            text = Ox._(
                'You can only remove {0}<br>from your own {1}.',
                [itemName.plural, targetName.plural]
            );
        } else if (drag.action == 'move' && drag.source.type == 'smart') {
            image = 'symbolClose';
            text = Ox._(
                'You can\'t remove {0}<br>from smart {1}.',
                [itemName.plural, targetName.plural]
            );
        } else if (drag.target && drag.target.user != pandora.user.username) {
            image = 'symbolClose';
            text = Ox._(
                'You can only {0} {1}<br>to your own {2}',
                [drag.action, itemName.plural, targetName.plural]
            );
        } else if (drag.target && drag.target.type == 'smart') {
            image = 'symbolClose';
            text = Ox._(
                'You can\'t {0} {1}<br>to smart {2}',
                [drag.action, itemName.plural, targetName.plural]
            );
        } else {
            image = drag.action == 'copy' ? 'symbolAdd' : 'symbolRemove';
            text = Ox._(Ox.toTitleCase(drag.action)) + ' ' + (
                Ox.isString(drag.item)
                ? '"' + drag.item + '"'
                : drag.item + ' ' + itemName[drag.item == 1 ? 'singular' : 'plural']
            ) + '<br>' + (
                drag.target && !drag.target.selected
                ? Ox._(
                    'to the {0} "{1}"',
                    [targetName.singular, Ox.encodeHTMLEntities(drag.target.name)]
                )
                : Ox._(
                    'to ' + (
                        (section == 'items' && pandora.user.ui._list)
                        || (section == 'edits' && pandora.user.ui.section == 'edits')
                        ? 'another' : (section == 'items' ? 'a' : 'an')
                    ) + ' {0}',
                    [targetName.singular]
                )
            );
        }
        return $('<div>')
            .append(
                $('<div>')
                    .css({
                        float: 'left',
                        width: '16px',
                        height: '16px',
                        padding: '2px',
                        border: '2px solid rgb(' + Ox.Theme.getThemeData().symbolDefaultColor.join(', ') + ')',
                        borderRadius: '12px',
                        margin: '3px 2px 2px 2px'
                    })
                    .append(
                         $('<img>')
                            .attr({src: Ox.UI.getImageURL(image)})
                            .css({width: '16px', height: '16px'})
                    )
            )
            .append(
                $('<div>')
                    .css({
                        float: 'left',
                        margin: '1px 2px 2px 2px',
                        fontSize: '11px',
                        whiteSpace: 'nowrap'
                    })
                    .html(text)
            );
    }

    function isAtListsTop(e) {
        return pandora.user.ui.showSidebar
            && e.clientX < pandora.user.ui.sidebarSize
            && e.clientY >= 44 && e.clientY < 60;
    }

    function isAtListsBottom(e) {
        var listsBottom = window.innerHeight - pandora.getInfoHeight();
        return pandora.user.ui.showSidebar
            && e.clientX < pandora.user.ui.sidebarSize
            && e.clientY >= listsBottom - 16 && e.clientY < listsBottom;
    }

    function keydown(e) {
        if (e.metaKey) {
            drag.action = 'move';
            $tooltip.options({title: getTitle()}).show();
        }
    }
    function keyup(e) {
        if (drag.action == 'move') {
            drag.action = 'copy';
            $tooltip.options({title: getTitle()}).show();
        }
    }

};

pandora.enterFullscreen = function() {
    pandora.$ui.appPanel.size(0, 0);
    pandora.user.ui.showSidebar && pandora.$ui.mainPanel.size(0, 0);
    pandora.$ui.rightPanel.size(0, 0).size(2, 0);
    !pandora.user.ui.showBrowser && pandora.$ui.contentPanel.css({
        top: (-112 - Ox.UI.SCROLLBAR_SIZE) + 'px' // fixme: rightPanel.size(0, 0) doesn't preserve negative top of browser
    });
    pandora.user.ui.showBrowser && pandora.$ui.contentPanel.size(0, 0);
    pandora.$ui.player.options({
        height: pandora.$document.height() - 2,
        width: pandora.$document.width() - 2
    });
};

pandora.exitFullscreen = function() {
    pandora.$ui.appPanel.size(0, 20);
    pandora.user.ui.showSidebar && pandora.$ui.mainPanel.size(0, pandora.user.ui.sidebarSize);
    pandora.$ui.rightPanel.size(0, 24).size(2, 16);
    !pandora.user.ui.showBrowser && pandora.$ui.contentPanel.css({
        top: 24 + (-112 - Ox.UI.SCROLLBAR_SIZE) + 'px' // fixme: rightPanel.size(0, 0) doesn't preserve negative top of browser
    });
    pandora.user.ui.showBrowser && pandora.$ui.contentPanel.size(0, 112 + Ox.UI.SCROLLBAR_SIZE);
};

pandora.getAllItemsTitle = function(section) {
    section = section || pandora.user.ui.section;
    return section == 'items'
        ? Ox._('All {0}', [Ox._(pandora.site.itemName.plural)])
        : Ox._('{0} ' + Ox.toTitleCase(section), [pandora.site.site.name]);
};

pandora.getClipData = function(items) {
    return items.map(function(clip) {
        var split = clip.split('/'),
            item = split[0],
            points = split[1].split('-');
        return Ox.extend({
            item: item
        }, points.length == 1 ? {
            annotation: item + '/' + points[0]
        } : {
            'in': parseFloat(points[0]),
            out: parseFloat(points[1])
        });
    });
};

pandora.getClipItems = function(data) {
    return data.map(function(clip) {
        return (
            clip.annotation || clip.item + '/' + clip['in'] + '-' + clip.out
        ) + '/' + (clip.id || '');
    });
};

// FIXME: naming hazard, above and below

pandora.getClipsItems = function(width) {
    width = width || window.innerWidth
        - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 1
        - Ox.UI.SCROLLBAR_SIZE;
    return Math.floor((width - 8) / (128 + 8)) - 1;
};

pandora.getClipsQuery = function(callback) {
    // fixme: nice, but not needed
    function addClipsConditions(conditions) {
        conditions.forEach(function(condition) {
            if (condition.conditions) {
                addClipsConditions(condition.conditions);
            } else if (
                (condition.key == 'annotations'
                ||Ox.getIndexById(pandora.site.layers, condition.key) > -1)
                && condition.operator == '='
            ) {
                clipsQuery.conditions.push(condition);
            }
        });
    }
    var clipsQuery = {
        conditions: []
    };
    addClipsConditions(pandora.user.ui.find.conditions);
    clipsQuery.operator = clipsQuery.conditions.length ? '|' : '&';
    if (callback) {
        if (pandora.user.ui._list) {
            pandora.api.getList({id: pandora.user.ui._list}, function(result) {
                if (result.data.type == 'smart') {
                    addClipsConditions(result.data.query.conditions);
                }
                callback(clipsQuery)
            });
        } else {
                callback(clipsQuery)
        }
    } else {
        return clipsQuery;
    }
};

pandora.getClipVideos = function(clip, resolution) {
    var currentTime = 0,
        start = clip['in'] || 0,
        end = clip.out;
    resolution = resolution || pandora.user.ui.videoResolution;
    return Ox.flatten(Ox.range(clip.parts).map(function(i) {
        var item = {
            src: pandora.getVideoURL(clip.item, resolution, i + 1)
        };
        if (currentTime + clip.durations[i] <= start || currentTime > end) {
            item = null;
        } else {
            if (clip.id) {
                item.id = clip.id;
            }
            if (currentTime <= start && currentTime + clip.durations[i] > start) {
                item['in'] = start - currentTime;
            }
            if (currentTime + clip.durations[i] >= end) {
                item.out = end - currentTime;
            }
            if (item['in'] && item.out) {
                item.duration = item.out - item['in']
            } else if (item.out) {
                item.duration = item.out;
            } else if (!Ox.isUndefined(item['in'])) {
                item.duration = clip.durations[i] - item['in'];
                item.out = clip.durations[i];
            } else {
                item.duration = clip.durations[i];
                item['in'] = 0;
                item.out = item.duration;
            }
        }
        currentTime += clip.durations[i];
        return item;
    }).filter(function(c) {
        return !!c;
    }));
};

(function() {
    var itemTitles = {};
    pandora.getDocumentTitle = function(itemData) {
        var parts = [];
        if (itemData) {
            itemTitles[pandora.user.ui.item] = Ox.decodeHTMLEntities(
                pandora.getItemTitle(itemData)
            );
        }
        if (pandora.user.ui.section == 'items') {
            if (!pandora.user.ui.item) {
                parts.push(
                    pandora.user.ui._list
                    ? pandora.user.ui._list.split(':').slice(1).join(':')
                    : pandora.getAllItemsTitle('items')
                );
                parts.push(Ox._("{0} View", [Ox._(Ox.toTitleCase(pandora.user.ui.listView))]));
            } else {
                parts.push(itemTitles[pandora.user.ui.item] || pandora.user.ui.item);
                parts.push(Ox._("{0} View", [Ox._(Ox.toTitleCase(pandora.user.ui.itemView))]));
            }
        } else if (pandora.user.ui.section == 'edits') {
            if (pandora.user.ui.edit) {
                parts.push(pandora.user.ui.edit.split(':').slice(1).join(':'));
            }
            parts.push(Ox._('Edits'));
        } else if (pandora.user.ui.section == 'texts') {
            if (pandora.user.ui.text) {
                parts.push(pandora.user.ui.text.split(':').slice(1).join(':'));
            }
            parts.push(Ox._('Texts'));
        }
        parts.push(pandora.site.site.name);
        return parts.join(' – ');
    };
}());

pandora.getDownloadLink = function(item, rightslevel) {
    var torrent = pandora.site.video.torrent;
    if (arguments.length == 2 && torrent &&
        pandora.site.capabilities.canSeeItem.guest < rightslevel) {
        torrent = false;
    }
    return '/' + item + (torrent ? '/torrent/' : '/download/');
};

pandora.getEditTooltip = function(title) {
    return function(e) {
        var $target = $(e.target);
        return (
            $target.is('a') || $target.parents('a').length
            ? Ox._('Shift+doubleclick to edit') : Ox._('Doubleclick to edit')
        ) + (title ? ' ' + Ox._(title) : '');
    }
};

pandora.getFilterSizes = function() {
    return Ox.splitInt(
        window.innerWidth
        - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize
        - 1,
        5
    );
};

pandora.getFoldersHeight = function(section) {
    section = section || pandora.user.ui.section;
    var height = 0;
    pandora.site.sectionFolders[section].forEach(function(folder, i) {
        height += 16 + pandora.user.ui.showFolder[section][folder.id] * (
            !!(folder.showBrowser && folder.hasItems) * 40 + (folder.items || 1) * 16
        );
    });
    return height;
};

pandora.getFoldersWidth = function(section) {
    section = section || pandora.user.ui.section;
    var width = pandora.user.ui.sidebarSize;
    if (
        pandora.$ui.appPanel
        && pandora.getFoldersHeight(section)
            > window.innerHeight - 20 - 24 - 16 - 1 - pandora.getInfoHeight(section)
    ) {
        width -= Ox.UI.SCROLLBAR_SIZE;
    }
    return width;
};

pandora.getHash = function(state, callback) {
    var embedKeys = [
            'annotationsRange', 'annotationsSort',
            'embed',
            'ignoreRights', 'invertHighlight',
            'matchRatio',
            'paused', 'playInToOut',
            'showAnnotations', 'showCloseButton', 'showLayers', 'showTimeline',
            'timeline', 'title'
        ],
        isEmbed = state.hash && state.hash.anchor == 'embed',
        isPrint = state.hash && state.hash.anchor == 'print',
        printKeys = [],
        removeKeys = [];
    if (state.hash && state.hash.anchor && !isEmbed && !isPrint) {
        delete state.hash.anchor;
    }
    if (state.hash && state.hash.query) {
        if (isEmbed) {
            state.hash.query.forEach(function(condition) {
                if (!Ox.contains(embedKeys, condition.key)) {
                    removeKeys.push(condition.key);
                }
            });
        } else if (isPrint) {
            state.hash.query.forEach(function(condition) {
                if (!Ox.contains(printKeys, condition.key)) {
                    removeKeys.push(condition.key);
                }
            });
        } else {
            state.hash.query.forEach(function(condition) {
                var key = condition.key.split('.')[0];
                if (pandora.site.user.ui[key] === void 0) {
                    removeKeys.push(condition.key);
                }
            });
        }
        state.hash.query = state.hash.query.filter(function(condition) {
            return !Ox.contains(removeKeys, condition.key);
        });
        if (Ox.isEmpty(state.hash.query)) {
            delete state.hash.query;
        }
    }
    if (Ox.isEmpty(state.hash)) {
        delete state.hash;
    }
    callback();
};

pandora.getInfoHeight = function(section, includeHidden) {
    // Note: Either argument can be ommitted
    // fixme: new, check if it can be used more
    section = section || pandora.user.ui.section;
    if (arguments.length == 1 && Ox.isBoolean(arguments[0])) {
        section = pandora.user.ui.section;
        includeHidden = arguments[0];
    }
    var height = 0, isVideoPreview;
    if (pandora.user.ui.showInfo || includeHidden) {
        isVideoPreview = section == 'items' && (
            pandora.user.ui.item || (
                pandora.user.ui.listSelection.length && !pandora.isClipView()
            )
        );
        height = Math.min(
            isVideoPreview
                ? Math.round(pandora.user.ui.sidebarSize / pandora.site.video.previewRatio) + 16
                : pandora.user.ui.sidebarSize,
            window.innerHeight - 109 // 20 menu + 24 bar + 64 (4 closed folders) + 1 resizebar
        );
    }
    return height;
};

pandora.getItem = function(state, str, callback) {
    if (state.type == pandora.site.itemName.plural.toLowerCase()) {
        var secondaryId = pandora.site.itemKeys.filter(function(key) {
                return key.secondaryId;
            }).map(function(key) {
                return key.id;
            })[0],
            sortKey = Ox.getObjectById(pandora.site.itemKeys, 'votes')
                ? 'votes'
                : 'timesaccessed';
        Ox.getObjectById(pandora.site.itemKeys, 'alt')
        pandora.api.get({id: str, keys: ['id']}, function(result) {
            if (result.status.code == 200) {
                state.item = result.data.id;
                callback();
            } else {
                (secondaryId ? pandora.api.find : Ox.noop)({
                    query: {
                        conditions: [{key: secondaryId, value: str, operator: '=='}],
                        operator: '&'
                    },
                    sort: [{key: sortKey, operator: '-'}],
                    range: [0, 1],
                    keys: ['id']
                }, function(result) {
                    if (result && result.data.items.length) {
                        state.item = result.data.items[0].id;
                        callback();
                    } else {
                        pandora.api.find({
                            query: {
                                conditions: [{key: 'title', value: str, operator: '=='}],
                                operator: '&'
                            },
                            sort: [{key: sortKey, operator: '-'}],
                            range: [0, 100],
                            keys: ['id', 'title', sortKey]
                        }, function(result) {
                            if (result.data.items.length) {
                                var regexp = new RegExp('^' + Ox.escapeRegExp(str) + '$', 'i'),
                                    items = result.data.items.map(function(item) {
                                        return {
                                            id: item.id,
                                            // prefer title match over originalTitle match
                                            sort: (item.title == str ? 1000000 : 0)
                                                + (parseInt(item[sortKey]) || 0)
                                            // fixme: remove the (...|| 0) check
                                            // once the backend sends correct data
                                        };
                                    });
                                state.item = items.sort(function(a, b) {
                                    return b.sort - a.sort;
                                })[0].id;
                            }
                            callback();
                        });
                    }
                });
            }
        });
    } else if (state.type == 'edits') {
        pandora.api.getEdit({id: str}, function(result) {
            if (result.status.code == 200) {
                state.item = result.data.id;
                callback();
            } else {
                state.item = '';
                callback();
            }
        });
    } else if (state.type == 'texts') {
        pandora.api.getText({id: str, keys: ['id', 'names', 'pages', 'type']}, function(result) {
            if (result.status.code == 200) {
                state.item = result.data.id;
                callback();
            } else {
                // FIXME: add findText call here?
                // FIXME: it's obscure that in the texts case,
                // we have to set item to '', while for videos,
                // it remains undefined 
                state.item = '';
                callback();
            }
        });
    } else {
        callback();
    }
};

pandora.getItemFind = function(find) {
    var itemFind = '';
    Ox.forEach(find.conditions, function(condition) {
        if (
            (
                condition.key == '*' || condition.key == 'annotations'
                || Ox.getIndexById(pandora.site.layers, condition.key) > -1
            )
            && condition.value.length
            && ['=', '=='].indexOf(condition.operator) > -1
        ) {
            itemFind = condition.value;
            return false;
        }
    })
    return itemFind;
};

pandora.getItemIdAndPosition = function() {
    var selected, ret, ui = pandora.user.ui;
    function getIdAndPositionByClipId(clipId) {
        var split = clipId.replace('-', '/').split('/');
        return {
            id: split[0],
            position: parseFloat(split[1])
        };
    }
    function getIdAndPositionByItemId(itemId) {
        return {
            id: itemId,
            position: ui.videoPoints[itemId] ? ui.videoPoints[itemId].position : 0
        };
    }
    if (ui.section == 'items') {
        if (!ui.item) {
            if (
                ui.listView == 'timelines'
                && (selected = ui.listSelection).length == 1
            ) {
                ret = getIdAndPositionByItemId(selected[0]);
            } else if (
                ['clip', 'map', 'calendar'].indexOf(ui.listView) > -1
                && pandora.$ui.clipList
                && (selected = pandora.$ui.clipList.options('selected')).length == 1
            ) {
                ret = getIdAndPositionByClipId(selected[0]);
            }
        } else {
            if (pandora.isVideoView()) {
                ret = getIdAndPositionByItemId(ui.item);
            } else if (
                ['clips', 'map', 'calendar'].indexOf(ui.itemView) > -1
                && pandora.$ui.clipList
                && (selected = pandora.$ui.clipList.options('selected')).length == 1
            ) {
                ret = getIdAndPositionByClipId(selected[0]);
            }
        }
    } else if (ui.section == 'edits') {
        if (ui.edit) {
            // TODO
        }
    }
    return ret;
}

pandora.getItemTitle = function(itemData) {
    return (itemData.title || Ox._('Untitled')) + (
        Ox.len(itemData.director) || itemData.year
        ? ' (' + (
            Ox.len(itemData.director)
            ? itemData.director
            : [Ox._('Unknown Director')]
        ).join(', ') + ')'
        : ''
    ) + (itemData.year ? ' ' + itemData.year : '')
};

pandora.getLargeClipTimelineURL = function(item, inPoint, outPoint, type, callback) {
    var fps = 25,
        width = Math.ceil((outPoint - inPoint) * fps),
        height = 64,
        canvas = Ox.$('<canvas>').attr({width: width, height: height})[0],
        context = canvas.getContext('2d'),
        inIndex = Math.floor(inPoint / 60),
        outIndex = Math.floor(outPoint / 60),
        offset = inPoint % 60 * -fps;
    Ox.parallelForEach(Ox.range(inIndex, outIndex + 1), function(index, i) {
        var callback = Ox.last(arguments),
            image = Ox.$('<img>')
                .on({
                    load: function() {
                        context.drawImage(image, offset + i * 1500, 0);
                        callback();
                    }
                })
                .attr({
                    src: '/' + item + '/timeline' + type + '64p' + index + '.jpg'
                })[0];
    }, function() {
        callback(canvas.toDataURL());
    });
};

pandora.getLargeEditTimelineURL = function(edit, type, i, callback) {
    var clips = [],
        timelineIn = i * 60,
        timelineOut = Math.min((i + 1) * 60, edit.duration),
        fps = 25,
        width = (timelineOut - timelineIn) * fps,
        height = 64,
        canvas = Ox.$('<canvas>').attr({width: width, height: height})[0],
        context = canvas.getContext('2d');
    Ox.forEach(edit.clips, function(clip) {
        var clipIn = clip.position,
            clipOut = clip.position + clip.duration;
        if (clipIn >= timelineOut) {
            return false; // break
        }
        if (
            (timelineIn <= clipIn && clipIn <= timelineOut)
            || (timelineIn <= clipOut && clipOut <= timelineOut)
            || (clipIn <= timelineIn && timelineOut <= clipOut)
        ) {
            clips.push({
                'in': clip['in'] + (clipIn < timelineIn ? timelineIn - clipIn : 0),
                item: clip.item,
                offset: Math.floor(Math.max(clipIn - timelineIn, 0) * fps),
                out: clip.out - (clipOut > timelineOut ? clipOut - timelineOut : 0)
            });
        }
    });
    Ox.parallelForEach(clips, function(clip) {
        var callback = Ox.last(arguments);
        pandora.getLargeClipTimelineURL(clip.item, clip['in'], clip.out, type, function(url) {
            var image = Ox.$('<img>')
                .on({
                    load: function() {
                        context.drawImage(image, clip.offset, 0);
                        callback();
                    }
                })
                .attr({
                    src: url
                })[0];
        });
    }, function() {
        callback(canvas.toDataURL());
    });
};

pandora.getListData = function(list) {
    var data = {}, folder;
    if (Ox.isUndefined(list)) {
        list = pandora.user.ui[
            pandora.user.ui.section == 'items' ? '_list'
            : pandora.user.ui.section.slice(0, -1)
        ];
    }
    if (list && pandora.$ui.folderList) {
        Ox.forEach(pandora.$ui.folderList, function($list, id) {
            var ret = true;
            // for the current list, we have to check in which
            // folder it is selected, since for example, a personal
            // list may appear again in the featured lists browser
            if (
                (list == pandora.user.ui._list && $list.options('selected').length)
                || !Ox.isEmpty($list.value(list))
            ) {
                folder = id;
                ret = false;
            }
            return ret;
        });
        if (folder) {
            data = pandora.$ui.folderList[folder].value(list);
            if (pandora.user.ui.section == 'item') {
                data.editable = data.user == pandora.user.username && data.type == 'static';
            } else {
                data.editable = data.user == pandora.user.username;
            }
            data.folder = folder;
        }
    }
    return data;
};

pandora.getPageTitle = function(stateOrURL) {
    var pages = [
            {id: '', title: ''},
            {id: 'api', title: Ox._('API Documentation')},
            {id: 'help', title: Ox._('Help')},
            {id: 'home', title: ''},
            {id: 'preferences', title: Ox._('Preferences')},
            {id: 'signin', title: Ox._('Sign In')},
            {id: 'signout', title: Ox._('Sign Out')},
            {id: 'signup', title: Ox._('Sign Up')},
            {id: 'software', title: Ox._('Software')},
            {id: 'tv', title: Ox._('TV')}
        ].concat(pandora.site.sitePages),
        page = Ox.getObjectById(
            pages,
            Ox.isObject(stateOrURL) ? stateOrURL.page : stateOrURL.slice(1)
        );
    return page
        ? (page.title ? page.title + ' – ' : '') + pandora.site.site.name
        : null;
};

pandora.getPart = function(state, str, callback) {
    if (state.page == 'api') {
        pandora.api.api(function(result) {
            if (Ox.contains(Object.keys(result.data.actions), str)) {
                state.part = str;
            }
            callback();
        })
    } else if (state.page == 'faq') {
        // ...
        callback();
    } else if (state.page == 'help') {
        if (Ox.getObjectById(pandora.site.help, str)) {
            state.part = str;
        }
        callback();
    } else if (state.page == 'news') {
        pandora.api.getNews(function(result) {
            if (Ox.getObjectById(result.data.items, str)) {
                state.part = str;
            } else if (result.data.items.length) {
                state.part = result.data.items[0].id;
            }
            callback();
        });
    } else if (state.page == 'preferences') {
        if (Ox.contains(['account', 'appearance', 'advanced'], str)) {
            state.part = str;
        }
        callback();
    } else if (state.page == 'tv') {
        var split = str.split(':'), user, name;
        if (split.length >= 2) {
            user = split.shift();
            name = split.join(':');
            pandora.api.findLists({
                keys: ['name', 'user'],
                query: {
                    conditions: [
                        {key: 'user', operator: '==', value: user},
                        {key: 'name', operator: '==', value: name}
                    ],
                    operator: '&'
                }
            }, function(result) {
                if (result.data.items.length) {
                    state.part = str;
                }
                callback();
            });
        } else {
            callback();
        }
    } else if (state.page == 'documents') {
        var split = str.split('/')[0],
            id = split;
        if (id) {
            pandora.api.findDocuments({
                query: {
                    conditions: [{key: 'id', value: id, operator: '=='}],
                    operator: '&'
                }
            }, function(result) {
                if (result.data.items) {
                    state.part = str;
                    //fixme set page/zoom/center here
                } else {
                    state.page = '';
                }
                callback();
            });
        } else {
            state.page = '';
            callback();
        }
    } else {
        callback();
    }
};

pandora.getSmallClipTimelineURL = function(item, inPoint, outPoint, type, callback) {
    var width = Math.ceil(outPoint - inPoint),
        height = 16,
        canvas = Ox.$('<canvas>').attr({width: width, height: height})[0],
        context = canvas.getContext('2d'),
        inIndex = Math.floor(inPoint / 3600),
        outIndex = Math.floor(outPoint / 3600),
        offset = inPoint % 3600 * -1;
    Ox.parallelForEach(Ox.range(inIndex, outIndex + 1), function(index, i) {
        var callback = Ox.last(arguments),
            image = Ox.$('<img>')
                .on({
                    load: function() {
                        context.drawImage(image, offset + i * 3600, 0);
                        callback();
                    }
                })
                .attr({
                    src: '/' + item + '/timeline' + type + '16p' + index + '.jpg'
                })[0];
    }, function() {
        callback(canvas.toDataURL());
    });
};

pandora.getSort = function(state, val, callback) {
    if (state.type == pandora.site.itemName.plural.toLowerCase()) {
        // TODO in the future: If str is index, fall back if list is smart
        // (but this can only be tested after find has been parsed)
        callback();
    } else if (state.type == 'edits') {
        if (val[0].key == 'index') {
            pandora.api.getEdit({id: state.item}, function(result) {
                if (result.data.type == 'smart') {
                    if (state.sort.length > 1) {
                        state.sort = [state.sort[1]];
                    } else {
                        state.sort = [
                            pandora.site.user.ui.editSort.filter(function(sort) {
                                return sort.key != 'index';
                            })[0]
                        ];
                    }
                }
                callback();
            });
        } else {
            callback();
        }
    } else if (state.type == 'texts') {
        callback();
    }
};

pandora.getSortKeyData = function(key) {
    return Ox.getObjectById(pandora.site.itemKeys, key)
        || Ox.getObjectById(pandora.site.clipKeys, key);
};

pandora.getSortKeys = function() {
    return pandora.site.itemKeys.filter(function(key) {
        return key.sort && (
            !key.capability
            || pandora.site.capabilities[key.capability][pandora.user.level]
        );
    }).map(function(key) {
        return Ox.extend(key, {
            operator: pandora.getSortOperator(key.id)
        });
    });
};

pandora.getSortOperator = function(key) {
    var data = pandora.getSortKeyData(key);
    return data.sortOperator || ['string', 'text'].indexOf(
        Ox.isArray(data.type) ? data.type[0] : data.type
    ) > -1 ? '+' : '-';
};

pandora.getSpan = function(state, val, callback) {
    // For a given item, or none (state.item), and a given view, or any
    // (state.view), this takes a value (array of numbers or string) and checks
    // if it is a valid video position (numbers) or annotation/event/place id or
    // event/place name (string), and in that case sets state.span, and may
    // modify state.view.
    // fixme: "subtitles:23" is still missing
    if (state.type == pandora.site.itemName.plural.toLowerCase()) {
        var isArray = Ox.isArray(val),
            isName, isVideoView, canBeAnnotation, canBeEvent, canBePlace;
        if (isArray) {
            pandora.api.get({id: state.item, keys: ['duration']}, function(result) {
                state.span = val.map(function(number) {
                    return Math.min(number, result.data.duration);
                });
                callback();
            });
        } else {
            isName = val[0] == '@';
            isVideoView = pandora.isVideoView(state.view);
            canBeAnnotation = state.item && (!state.view || isVideoView) && !isName;
            canBeEvent = !state.view || state.view == 'calendar';
            canBePlace = !state.view || state.view == 'map';
            val = isName ? val.slice(1) : val;
            getId(canBeAnnotation ? 'annotation' : '', function(id) {
                if (id) {
                    Ox.Log('URL', 'id?', id)
                    state.span = id;
                    state.view = pandora.user.ui.videoView;
                    callback();
                } else {
                    getId(canBePlace ? 'place' : '', function(id) {
                        if (id) {
                            Ox.Log('URL', 'found place id', id)
                            state.span = id;
                            state.view = 'map';
                            callback();
                        } else {
                            getId(canBeEvent ? 'event' : '', function(id) {
                                if (id) {
                                    Ox.Log('URL', 'found event id', id)
                                    state.span = id;
                                    state.view = 'calendar';
                                } else if (canBePlace && isName) {
                                    Ox.Log('URL', 'setting place id', '@' + val)
                                    state.span = '@' + val;
                                    state.view = 'map';
                                }
                                callback();
                            });
                        }
                    });
                }
            });
        }
    } else if (state.type == 'edits') {
        if (isArray) {
            pandora.api.getEdit({id: state.item}, function(result) {
                state.span = val.map(function(number) {
                    return Math.min(number, result.data.duration);
                });
                callback();
            });
        } else {
            pandora.api.getEdit({id: state.item, keys: ['clips']}, function(result) {
                if (result.data.clips && Ox.getObjectById(result.data.clips, val)) {
                    state.span = val;
                }
                callback();
            });
        }
    } else if (state.type == 'texts') {
        pandora.api.getText({id: state.item}, function(result) {
            if (isArray) {
                if (result.data.type == 'html') {
                    state.span = Ox.limit(val[0], 0, 100);
                } else {
                    state.span = Math.floor(Ox.limit(val[0], 1, result.data.pages));
                }
            } else if (result.data.type == 'html' && Ox.contains(result.data.names, val)) {
                state.span = val;
            }
            callback();
        });
    }

    function getId(type, callback) {
        if (type) {
            pandora.api['find' + Ox.toTitleCase(type + 's')](Ox.extend({
                query: {
                    conditions: [{
                        key: isName ? 'name' : 'id',
                        value: type != 'annotation' ? val : state.item + '/' + val,
                        operator: '=='
                    }],
                    operator: '&'
                },
                keys: type != 'annotation' ? ['id'] : ['id', 'in', 'out'],
                range: [0, 1]
            }, state.item && type != 'annotation' ? {
                itemQuery: {
                    conditions: [{key: 'id', value: state.item, operator: '=='}],
                    operator: '&'
                }
            } : {}), function(result) {
                var annotation, span;
                if (result.data.items.length) {
                    span = result.data.items[0];
                    annotation = span.id.split('/')[1];
                    type == 'annotation' && pandora.UI.set('videoPoints.' + state.item, {
                        annotation: annotation,
                        'in': span['in'],
                        out: span.out,
                        position: span['in']
                    });
                }
                callback(
                    !span ? ''
                    : type != 'annotation' ? span.id
                    : annotation
                );
            });
        } else {
            callback();
        }
    }

};

pandora.getStatusText = function(data) {
    var ui = pandora.user.ui,
        canSeeMedia = pandora.site.capabilities.canSeeMedia[pandora.user.level],
        canSeeSize = pandora.site.capabilities.canSeeSize[pandora.user.level],
        itemName = ['clip', 'video'].indexOf(ui.listView) > -1
            ? (data.items == 1 ? Ox._('Clip') : Ox._('Clips'))
            : Ox._(pandora.site.itemName[data.items == 1 ? 'singular' : 'plural']),
        parts = [];
    parts.push(Ox.formatNumber(data.items) + ' '+ itemName);
    if (data.runtime) {
        parts.push(Ox.formatDuration(data.runtime, 'short'));
    } else if (data.duration) {
        parts.push(Ox.formatDuration(data.duration, 'short'));
    }
    if (canSeeMedia) {
        data.files && parts.push(
            Ox.toTitleCase(Ox.formatCount(data.files, 'file'))
        );
        data.duration && parts.push(Ox.formatDuration(data.duration));
    }
    if (canSeeSize) {
        data.size && parts.push(Ox.formatValue(data.size, 'B'));
    }
    if (canSeeMedia) {
        data.pixels && parts.push(Ox.formatValue(data.pixels, 'px'));
    }
    return parts.join(', ');
};

pandora.getMediaURL = function(url) {
    return pandora.site.site.mediaprefix + url;
};

pandora.getVideoURL = function(id, resolution, part, track) {
    var prefix = pandora.site.site.videoprefix
        .replace('{id}', id)
        .replace('{part}', part)
        .replace('{resolution}', resolution)
        .replace('{uid}', Ox.uid());
    return prefix + '/' + id + '/' + resolution + 'p' + part
        + (track ? '.' + track : '')
        + '.' + pandora.user.videoFormat;
};

pandora.getVideoOptions = function(data) {
    var canPlayClips = data.editable || pandora.site.capabilities.canPlayClips[pandora.user.level] >= data.rightslevel,
        canPlayVideo = data.editable || pandora.site.capabilities.canPlayVideo[pandora.user.level] >= data.rightslevel,
        options = {};
    options.subtitlesLayer = pandora.site.layers.filter(function(layer) {
        return layer.isSubtitles;
    }).map(function(layer) {
        return layer.id;
    })[0];
    options.censored = canPlayVideo ? []
        : canPlayClips ? (
            options.subtitles.length
                ? options.subtitles.map(function(subtitle, i) {
                    return {
                        'in': i == 0 ? 0 : options.subtitles[i - 1].out,
                        out: subtitle['in']
                    };
                }).concat(
                    [{'in': Ox.last(options.subtitles).out, out: data.duration}]
                ).filter(function(censored) {
                    // don't include gaps shorter than one second
                    return censored.out - censored['in'] >= 1;
                })
                : Ox.range(0, data.duration - 5, 60).map(function(position) {
                    return {
                        'in': position + 5,
                        out: Math.min(position + 60, data.duration)
                    };
                })
        )
        : [{'in': 0, out: data.duration}];
    options.video = [];
    pandora.site.video.resolutions.forEach(function(resolution) {
        if (data.audioTracks) {
            data.audioTracks.forEach(function(track) {
                Ox.range(data.parts).forEach(function(i) {
                    options.video.push({
                        duration: data.durations[i],
                        index: i,
                        track: Ox.getLanguageNameByCode(track),
                        resolution: resolution,
                        src: pandora.getVideoURL(data.item || pandora.user.ui.item, resolution, i + 1, track)
                    });
                });
            });
        } else {
            Ox.range(data.parts).forEach(function(i) {
                options.video.push({
                    duration: data.durations[i],
                    index: i,
                    resolution: resolution,
                    src: pandora.getVideoURL(data.item || pandora.user.ui.item, resolution, i + 1)
                });
            });
        }
    });
    options.audioTrack = data.audioTracks ? Ox.getLanguageNameByCode(
        Ox.contains(data.audioTracks, pandora.site.language)
            ? pandora.site.language
            : data.audioTracks[0]
    ) : void 0;
    options.annotations = [];
    pandora.site.layers.forEach(function(layer, i) { 
        options.annotations[i] = Ox.extend({}, layer, {
            title: Ox._(layer.title),
            item: Ox._(layer.item),
            items: data.layers[layer.id].map(function(annotation) {
                annotation.duration = Math.abs(annotation.out - annotation['in']);
                annotation.editable = annotation.editable
                    || annotation.user == pandora.user.username
                    || pandora.site.capabilities['canEditAnnotations'][pandora.user.level];
                annotation.languages = (
                    annotation.languages || [pandora.site.language]
                ).map(function(language) {
                    return Ox.getLanguageNameByCode(language);
                });
                return annotation;
            })
        });
    });
    Ox.Log('Video', 'VideoOptions', options);
    return options;
};

pandora.getVideoPartsAndPoints = function(durations, points) {
    var parts = durations.length,
        offsets = Ox.range(parts).map(function(i) {
            return Ox.sum(durations.slice(0, i));
        }),
        ret = {
            parts: [],
            points: []
        };
    points.forEach(function(point, i) {
        Ox.loop(parts - 1, -1, -1, function(i) {
            if (offsets[i] <= point) {
                ret.parts[i] = i;
                return false;
            }
        });
    });
    ret.parts = Ox.unique(ret.parts);
    ret.points = points.map(function(point) {
        return point - offsets[ret.parts[0]];
    });
    return ret;
};

pandora.hasDialogOrScreen = function() {
    return !!$('.OxDialog:visible').length
        || !!$('.OxFullscreen').length
        || !!$('.OxScreen').length;
};

pandora.hasEventsLayer = function() {
    return pandora.site.layers.some(function(layer) {
        return layer.type == 'event';
    });
};

pandora.hasFocusedInput = function() {
    var focused = Ox.Focus.focused();
    return focused && Ox.UI.elements[focused].is('.OxInput');
};

pandora.hasPlacesLayer = function() {
    return pandora.site.layers.some(function(layer) {
        return layer.type == 'place';
    });
};

pandora.isClipView = function(view, item) {
    if (pandora.user.ui.section == 'items') {
        if (arguments.length == 0) {
            item = pandora.user.ui.item;
            view = !item ? pandora.user.ui.listView : pandora.user.ui.itemView;
        } else if (arguments.length == 1) {
            item = pandora.user.ui.item;
        }
    }
    return (
        !item ? ['calendar', 'clip', 'map'] : ['calendar', 'clips', 'map']
    ).indexOf(view) > -1;
};

pandora.isEmbeddableView = function(url) {
    //fixme. actually return true for embeddable views
    return false;
};

pandora.isEmbedURL = function(url) {
    url = url || document.location.href;
    var hash = Ox.parseURL(url).hash;
    return /^#embed(\?.*?)?$/.test(hash);
};

pandora.isPrintURL = function(url) {
    url = url || document.location.href;
    var hash = Ox.parseURL(url).hash;
    return /^#print(\?.*?)?$/.test(hash);
};

pandora.isVideoView = function(view, item) {
    if (pandora.user.ui.section == 'items') {
        if (arguments.length == 0) {
            item = pandora.user.ui.item;
            view = !item ? pandora.user.ui.listView : pandora.user.ui.itemView;
        } else if (arguments.length == 1) {
            item = pandora.user.ui.item;
        }
    }
    return (
        !item ? ['video'] : ['player', 'editor', 'timeline']
    ).indexOf(view) > -1;
};

pandora.loadUserScript = function() {
    if (pandora.user.ui.onload) {
        try {
            eval(pandora.user.ui.onload);
        } catch(e) {
            Ox.print('user onload script error', e);
        }
    }
};

pandora.logEvent = function(data, event, element) {
    var element = this,
        handlers = self.eventHandlers ? self.eventHandlers[event] : [];
    if (!Ox.contains([
        'mousedown', 'mouserepeat', 'anyclick', 'singleclick', 'doubleclick', 'mousewheel',
        'dragstart', 'drag', 'dragenter', 'dragleave', 'dragpause', 'dragend',
        'draganddropstart', 'draganddrop', 'draganddropenter',
        'draganddropleave', 'draganddroppause', 'draganddropend',
        'playing', 'position', 'progress', 'request'
    ], event) && !Ox.startsWith(event, 'pandora_')) {
        try {
            data = JSON.stringify(data)
        } catch(e) {}
        Ox.print(
            'EVENT',
            element.oxid,
            '"' + element[0].className.split(' ').filter(function(className) {
                return /^Ox/.test(className);
            }).map(function(className) {
                return className.replace(/^Ox/, '');
            }).join(' ') + '"',
            event,
            data,
            handlers.length,
            handlers.map(function(handler) {
                return handler.toString().split('\n').shift();
            })
        );
    }
};

pandora.openLink = function(url) {
    if (Ox.startsWith(url, 'mailto:')) {
        window.open(url);
    } else {
        window.open('/url=' + encodeURIComponent(url), '_blank');
    }
};

pandora.signin = function(data) {
    // fixme: this is still voodoo
    pandora.user = Ox.extend(data.user, {
        sectionElement: 'buttons',
        videoFormat: Ox.getVideoFormat(pandora.site.video.formats)
    });
    pandora.user.ui._list = pandora.getListState(pandora.user.ui.find);
    pandora.user.ui._filterState = pandora.getFilterState(pandora.user.ui.find);
    pandora.user.ui._findState = pandora.getFindState(pandora.user.ui.find);
    pandora.site.sortKeys = pandora.getSortKeys();
    pandora.URL.init();
    pandora.URL.update();
    Ox.Theme(pandora.user.ui.theme);
    pandora.$ui.appPanel.reload();
    pandora.loadUserScript();
};

pandora.signout = function(data) {
    // fixme: this is still voodoo
    pandora.user = data.user;
    pandora.user.ui._list = pandora.getListState(pandora.user.ui.find);
    pandora.user.ui._filterState = pandora.getFilterState(pandora.user.ui.find);
    pandora.user.ui._findState = pandora.getFindState(pandora.user.ui.find);
    pandora.site.sortKeys = pandora.getSortKeys();
    pandora.URL.init();
    pandora.URL.update();
    Ox.Theme(pandora.user.ui.theme);
    pandora.$ui.appPanel.reload();
};

pandora.reloadList = function() {
    Ox.Log('', 'reloadList')
    var listData = pandora.getListData();
    Ox.Request.clearCache(); // fixme: remove
    pandora.$ui.filters.forEach(function($filter) {
        $filter.reloadList();
    });
    pandora.$ui.list
        .bindEvent({
            init: function(data) {
                // fixme: this will not work for lists in the favorites folder
                // (but then it's also unlikely they'll have to be reloaded)
                var folder = listData.status != 'featured' ? 'personal' : 'featured';
                pandora.$ui.folderList[folder].value(listData.id, 'items', data.items);
            }
        })
        .bindEventOnce({
            load: function(data) {
                pandora.$ui.list.gainFocus();
                // fixme: what is this?
                // if (data) pandora.$ui.list.options({selected: [data.items]});
            }
        })
        .reloadList();
};

pandora.renameList = function(oldId, newId, newName, folder) {
    folder = folder || pandora.getListData(oldId).folder;
    pandora.$ui.folderList[folder].value(oldId, 'name', newName);
    pandora.$ui.folderList[folder].value(oldId, 'id', newId);
    if (pandora.user.ui.section == 'items') {
        pandora.$ui.toolbar.updateListName(newId);
        // fixme: ugly
        // ... does this always coincide with triggerEvents = false, as below?
        pandora.replaceURL = true;
        pandora.UI.set('lists.' + pandora.UI.encode(newId), pandora.user.ui.lists[oldId], false);
        pandora.UI.set({
            find: {
                conditions: [{key: 'list', value: newId, operator: '=='}],
                operator: '&'
            }
        }, false);
        pandora.UI.set('lists.' + pandora.UI.encode(oldId), null, false);

    } else {
        pandora.replaceURL = true;
        pandora.UI.set(pandora.user.ui.section + '.' + pandora.UI.encode(newId),
                pandora.user.ui[pandora.user.ui.section][oldId], false);
        pandora.UI.set(pandora.user.ui.section.slice(0, -1), newId);
        pandora.UI.set(pandora.user.ui.section + '.' + pandora.UI.encode(oldId), null, false);
    }
};

pandora.resizeFilters = function(width) {
    pandora.user.ui.filterSizes = pandora.getFilterSizes();
    pandora.$ui.browser && pandora.$ui.browser
        .size(0, pandora.user.ui.filterSizes[0])
        .size(2, pandora.user.ui.filterSizes[4]);
    pandora.$ui.filtersInnerPanel && pandora.$ui.filtersInnerPanel
        .size(0, pandora.user.ui.filterSizes[1])
        .size(2, pandora.user.ui.filterSizes[3]);
    pandora.$ui.filters && pandora.$ui.filters.forEach(function($list, i) {
        $list.resizeColumn('name', pandora.user.ui.filterSizes[i] - 44 - Ox.UI.SCROLLBAR_SIZE);
        if (pandora.site.flags) {
            $list.find('.flagname').css({width: pandora.user.ui.filterSizes[i] - 68 - Ox.UI.SCROLLBAR_SIZE})
        }
    });
};

pandora.resizeFolders = function(section) {
    section = section || pandora.user.ui.section;
    var width = pandora.getFoldersWidth(section),
        columnWidth = width - (section != 'texts' ? 96 : 48),
        userColumnWidth = Math.round(columnWidth * 0.4),
        nameColumnWidth = columnWidth - userColumnWidth;
    pandora.$ui.allItems && pandora.$ui.allItems.resizeElement((
        section == 'items' ? columnWidth
        : section == 'edits' ? width - 16
        : width - 48
    ) - 8);
    Ox.forEach(pandora.$ui.folderList, function($list, id) {
        var pos = Ox.getIndexById(pandora.site.sectionFolders[section], id);
        pandora.$ui.folder[pos].css({width: width + 'px'});
        $list.css({width: width + 'px'});
        if (pandora.site.sectionFolders[section][pos].showBrowser) {
            pandora.$ui.findListsInput[id] && pandora.$ui.findListsInput[id].options({
                width: width - 24
            });
            $list.resizeColumn('user', userColumnWidth)
                .resizeColumn('name', nameColumnWidth);
        } else {
            $list.resizeColumn(id == 'favorite' ? 'id' : 'name', columnWidth);
        }
        if (!pandora.user.ui.showFolder[section][id]) {
            pandora.$ui.folder[pos].updatePanel();
        }
    });
    if (pandora.user.ui.section == 'texts') {
        pandora.$ui.text && pandora.$ui.text.update();
    }
};

pandora.resizeWindow = function() {
    if (pandora.$ui.embedPanel && pandora.$ui.embedPanel.resizePanel) {
        pandora.$ui.embedPanel.resizePanel();
    }
    if (pandora.$ui.embedPanel || pandora.$ui.printView) {
        return;
    }
    // FIXME: a lot of this throws errors on load
    pandora.$ui.leftPanel && pandora.$ui.leftPanel.size(2, pandora.getInfoHeight(true));
    pandora.resizeFolders();
    if (pandora.user.ui.section == 'items') {
        if (!pandora.user.ui.item) {
            pandora.resizeFilters(pandora.$ui.rightPanel.width());
            if (pandora.user.ui.listView == 'clips') {
                var clipsItems = pandora.getClipsItems(),
                    previousClipsItems = pandora.getClipsItems(pandora.$ui.list.options('width'));
                pandora.$ui.list.options({
                    width: window.innerWidth
                        - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 1
                        - Ox.UI.SCROLLBAR_SIZE
                });
                if (clipsItems != previousClipsItems) {
                    Ox.Request.clearCache(); // fixme
                    pandora.$ui.list.reloadList(true);
                }
            } else if (pandora.user.ui.listView == 'timelines') {
                pandora.$ui.list.options({
                    width: window.innerWidth
                        - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 1
                        - Ox.UI.SCROLLBAR_SIZE
                });
            } else if (pandora.user.ui.listView == 'map') {
                pandora.$ui.map && pandora.$ui.map.resizeMap();
            } else if (pandora.user.ui.listView == 'calendar') {
                pandora.$ui.calendar && pandora.$ui.calendar.resizeCalendar();
            } else {
                pandora.$ui.list && pandora.$ui.list.size();
            }
        } else {
            pandora.$ui.browser.scrollToSelection();
            if (pandora.user.ui.itemView == 'info') {
                pandora.$ui.item.resizeElement && pandora.$ui.item.resizeElement();
            } else if (pandora.user.ui.itemView == 'clips') {
                pandora.$ui.clipList.size();
            } else if (pandora.user.ui.itemView == 'timeline') {
                pandora.$ui.timeline && pandora.$ui.timeline.options({
                    // fixme: duplicated
                    height: pandora.$ui.contentPanel.size(1),
                    width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
                });
            } else if (pandora.user.ui.itemView == 'player') {
                pandora.$ui.player && pandora.$ui.player.options({
                    // fixme: duplicated
                    height: pandora.$ui.contentPanel.size(1),
                    width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
                });
            } else if (pandora.user.ui.itemView == 'editor') {
                pandora.$ui.editor && pandora.$ui.editor.options({
                    // fixme: duplicated
                    height: pandora.$ui.contentPanel.size(1),
                    width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
                });
            } else if (pandora.user.ui.itemView == 'map') {
                pandora.$ui.map.resizeMap();
            } else if (pandora.user.ui.itemView == 'calendar') {
                pandora.$ui.calendar.resizeCalendar();
            }
        }
    } else if (pandora.user.ui.section == 'edits') {
        if (!pandora.user.ui.edit) {
            // ...
        } else {
            pandora.$ui.editPanel && pandora.$ui.editPanel.options({
                height: pandora.$ui.appPanel.size(1),
                width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
            });
        }
    } else if (pandora.user.ui.section == 'texts') {
        pandora.$ui.text && pandora.$ui.text.update();
    }
};

pandora.selectList = function() {
    if (pandora.user.ui.section == 'items') {
        if (pandora.user.ui._list) {
            pandora.api.findLists({
                keys: ['status', 'user'],
                query: {
                    conditions: [{key: 'id', value: pandora.user.ui._list, operator: '=='}],
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
                        .options({selected: [pandora.user.ui._list]});
                    if (!pandora.hasDialogOrScreen() && !pandora.hasFocusedInput()) {
                        pandora.$ui.folderList[folder].gainFocus();
                    }
                }
            });
        }
    } else {
        var id = pandora.user.ui[pandora.user.ui.section.slice(0,-1)],
            section = Ox.toTitleCase(pandora.user.ui.section.slice(0, -1));
        if (id) {
            pandora.api['get' + section]({id: id}, function(result) {
                var folder;
                if (result.data.id) {
                    folder = result.data.status == 'featured' ? 'featured' : (
                        result.data.user == pandora.user.username ? 'personal' : 'favorite'
                    );
                    pandora.$ui.folderList[folder].options({selected: [id]});
                }
            });
        }
    }
};

pandora.setLocale = function(locale, callback) {
    var url;
    // language from http header might not be supported,
    // fall back to site default
    if (pandora.site.languages.indexOf(locale) == -1) {
        locale = pandora.site.user.ui.locale;
    }
    if (locale != 'en') {
        if (pandora.localStorage('enableDebugMode')) {
            url = [
                '/static/json/locale.pandora.' + locale + '.json',
                '/static/json/locale.' + pandora.site.site.id + '.' + locale + '.json',
            ];
        } else {
            url = '/static/json/locale.' + locale + '.json'
        }
    }
    Ox.setLocale(locale, url, callback);
};

pandora.setTheme = function(theme) {
    var iframe, src;
    Ox.Theme(theme);
    iframe = Ox.UI.elements[$('#embed').data('oxid')];
    if (iframe) {
        src = iframe.attr('src');
        if (src && Ox.parseURL(src).hostname == document.location.hostname) {
            iframe.postMessage('settheme', {theme: theme});
        }
    }
};

pandora.unloadWindow = function() {
    /*
    // fixme: ajax request has to have async set to false for this to work
    pandora.user.ui.section == 'items'
        && pandora.user.ui.item
        && ['video', 'timeline'].indexOf(pandora.user.ui.itemView) > -1
        && pandora.UI.set(
            'videoPosition.' + pandora.user.ui.item,
            pandora.$ui[
                pandora.user.ui.itemView == 'video' ? 'player' : 'editor'
            ].options('position')
        );
    */
};

pandora.updateItemContext = function() {
    Ox.Request.clearCache('find');
    if (!Ox.isEqual(pandora.user.ui.find, pandora.site.user.ui.find)) {
        pandora.api.find({
            query: pandora.user.ui.find,
            positions: [pandora.user.ui.item],
            sort: pandora.user.ui.sort
        }, function(result) {
            if (result.data.positions[pandora.user.ui.item] === void 0) {
                pandora.stayInItemView = true;
                pandora.UI.set({find: pandora.site.user.ui.find});
                pandora.$ui.contentPanel.replaceElement(0, pandora.$ui.browser = pandora.ui.browser());
            } else {
                pandora.$ui.browser.reloadList();
            }
        });
    } else {
        pandora.$ui.browser.reloadList();
    }
};

pandora.updateStatus = function(item) {
    var ui = pandora.user.ui;
    item = item || ui.item;
    if (pandora.$ui.updateStatus && pandora.$ui.updateStatus[item]) {
        return;
    }
    pandora.$ui.updateStatus = pandora.$ui.updateStatus || {};
    pandora.$ui.updateStatus[item] = setTimeout(function() {
        if(isActive()) {
            Ox.Request.clearCache();
            pandora.api.get({
                id: item,
                keys: ['rendered']
            }, function(result) {
                delete pandora.$ui.updateStatus[item];
                if (isActive()) {
                    if (result.data.rendered) {
                        Ox.Request.clearCache();
                        if (pandora.isVideoView()) {
                            pandora.$ui.mainPanel.replaceElement(1,
                                pandora.$ui.rightPanel = pandora.ui.rightPanel());
                        } else if(pandora.$ui.item) {
                            pandora.updateItemContext();
                            pandora.$ui.item.reload();
                        }
                    } else {
                        pandora.updateStatus(item);
                    }
                }
            });
        } else {
            delete pandora.$ui.updateStatus[item];
        }
    }, 10000);

    function isActive() {
        return ui.item == item && [
            'info', 'player', 'editor', 'timeline'
        ].indexOf(ui.itemView) > -1;
    }
};

pandora.wait = function(taskId, callback, timeout) {
    var task = {};
    timeout = timeout || 5000;
    task.timeout = setTimeout(function() {
        pandora.api.taskStatus({taskId: taskId}, function(result) {
            var t;
            if (result.data.status == 'PENDING') {
                t = pandora.wait(taskId, callback);
                task.timeout = t.timeout;
            } else {
                callback(result);
            }
        });
    }, 5000);
    return task;
};

(function() {

    // Note: getFindState has to run after getListState and getFilterState

    function everyCondition(conditions, key, operator) {
        // If every condition has the given key and operator
        // (excluding conditions where all subconditions match)
        // returns true, otherwise false
        return Ox.every(conditions, function(condition) {
            return condition.key == key && condition.operator == operator;
        });
    }

    function oneCondition(conditions, key, operator, includeSubconditions) {
        // If exactly one condition has the given key and operator
        // (including or excluding conditions where all subconditions match)
        // returns the corresponding index, otherwise returns -1
        var indices = Ox.indicesOf(conditions, function(condition) {
            return (
                condition.conditions
                ? includeSubconditions && everyCondition(condition.conditions, key, operator)
                : condition.key == key && condition.operator == operator
            );
        });
        return indices.length == 1 ? indices[0] : -1;
    }

    pandora.getFilterState = function(find) {
        // A filter is selected if exactly one condition in an & query or every
        // condition in an | query has the filter id as key and "==" as operator
        return pandora.user.ui.filters.map(function(filter) {
            // FIXME: cant index be an empty array, instead of -1?
            var key = filter.id,
                state = {index: -1, find: Ox.clone(find, true), selected: []};
            if (find.operator == '&') {
                // include conditions where all subconditions match
                state.index = oneCondition(find.conditions, key, '==', true);
                if (state.index > -1) {
                    state.selected = find.conditions[state.index].conditions
                        ? find.conditions[state.index].conditions.map(function(condition) {
                            return condition.value;
                        })
                        : [find.conditions[state.index].value];
                }
            } else {
                if (everyCondition(find.conditions, key, '==')) {
                    state.index = Ox.range(find.conditions.length);
                    state.selected = find.conditions.map(function(condition) {
                        return condition.value;
                    });
                }
            }
            if (state.selected.length) {
                if (Ox.isArray(state.index)) {
                    // every condition in an | query matches this filter
                    state.find = {conditions: [], operator: ''};
                } else {
                    // one condition in an & query matches this filter
                    state.find.conditions.splice(state.index, 1);
                    if (
                        state.find.conditions.length == 1
                        && state.find.conditions[0].conditions
                    ) {
                        // unwrap single remaining bracketed query
                        state.find = {
                            conditions: state.find.conditions[0].conditions,
                            operator: state.find.conditions[0].operator
                        };
                    }
                }
            }
            return state;
        });
    }

    pandora.getFindState = function(find) {
        // The find element is populated if exactly one condition in an & query
        // has a findKey as key and "=" as operator (and all other conditions
        // are either list or filters), or if all conditions in an | query have
        // the same filter id as key and "==" as operator
        Ox.Log('Find', 'getFindState', find)
        // FIXME: this is still incorrect when you select a lot of filter items
        // and reload the page (will be advanced)
        var conditions, indices, state = {index: -1, key: '*', value: ''};
        if (find.operator == '&') {
            // number of conditions that are not list or filters
            conditions = find.conditions.length
                - !!pandora.user.ui._list
                - pandora.user.ui._filterState.filter(function(filter) {
                    return filter.index > -1;
                }).length;
            // indices of non-advanced find queries
            indices = pandora.site.findKeys.map(function(findKey) {
                return oneCondition(find.conditions, findKey.id, '=');
            }).filter(function(index) {
                return index > -1;
            });
            state = conditions == 1 && indices.length == 1 ? {
                index: indices[0],
                key: find.conditions[indices[0]].key,
                value: Ox.decodeURIComponent(find.conditions[indices[0]].value)
            } : {
                index: -1,
                key: conditions == 0 && indices.length == 0 ? '*' : 'advanced',
                value: ''
            };
        } else {
            state = {
                index: -1,
                key: 'advanced',
                value: ''
            };
            Ox.forEach(pandora.user.ui.filters, function(key) {
                if (everyCondition(find.conditions, key, '==')) {
                    state.key = '*';
                    return false;
                }
            });
        }
        return state;
    }

    pandora.getListState = function(find) {
        // A list is selected if exactly one condition in an & query has "list"
        // as key and "==" as operator
        var index, state = '';
        if (find.operator == '&') {
            index = oneCondition(find.conditions, 'list', '==');
            if (index > -1) {
                state = find.conditions[index].value;
            }
        }
        return state;
    };

}());
