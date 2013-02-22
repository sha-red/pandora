// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.addList = function() {
    // addList(isSmart, isFrom) or addList(list) [=duplicate]
    var $folderList = pandora.$ui.folderList.personal,
        isDuplicate = arguments.length == 1,
        isSmart, isFrom, list, listData, data;
    if (!isDuplicate) {
        isSmart = arguments[0];
        isFrom = arguments[1];
        data = {
            name: 'Untitled',
            status: 'private',
            type: !isSmart ? 'static' : 'smart'
        };
        if (isFrom) {
            if (!isSmart) {
                data.items = pandora.user.ui.listSelection;
            } else {
                data.query = pandora.user.ui.find;
            }
        }
        addList();
    } else {
        list = arguments[0];
        listData = pandora.getListData();
        data = {
            name: listData.name,
            status: listData.status,
            type: listData.type
        };
        if (data.type == 'smart') {
            data.query = listData.query;
        }
        pandora.api.findLists({
            query: {conditions: [{key: 'id', value: list, operator: '=='}]},
            keys: ['description']
        }, function(result) {
            data.description = result.data.items[0].description;
            if (data.type == 'static') {
                var query = {
                    conditions: [{key: 'list', value: list, operator: '=='}],
                    operator: '&'
                };
                pandora.api.find({
                    query: query
                }, function(result) {
                    if (result.data.items) {
                        pandora.api.find({
                            query: query,
                            keys: ['id'],
                            sort: [{key: 'id', operator: ''}],
                            range: [0, result.data.items]
                        }, function(result) {
                            var items = result.data.items.map(function(item) {
                                return item.id;
                            });
                            addList(items);
                        });
                    } else {
                        addList();
                    }
                });
            } else {
                addList()
            }
        });
    }
    function addList(items) {
        pandora.api.addList(data, function(result) {
            var newList = result.data.id;
            if (items) {
                pandora.api.addListItems({
                    list: newList,
                    items: items
                }, function() {
                    getPosterFrames(newList);
                });
            } else {
                getPosterFrames(newList);
            }
        });
    }
    function getPosterFrames(newList) {
        var sortKey = Ox.getObjectById(pandora.site.itemKeys, 'votes')
                      ? 'votes'
                      : 'timesaccessed';
        if (!isDuplicate) {
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
            })
        } else {
            pandora.api.findLists({
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
        pandora.api.editList({
            id: newList,
            posterFrames: posterFrames
        }, function() {
            reloadFolder(newList);
        });
    }
    function reloadFolder(newList) {
        pandora.$ui.folder[0].options({collapsed: false});
        Ox.Request.clearCache('findLists');
        $folderList.bindEventOnce({
            load: function(data) {
                $folderList.gainFocus()
                    .options({selected: [newList]})
                    .editCell(newList, 'name', true);
                pandora.UI.set({
                    find: {
                        conditions: [{key: 'list', value: newList, operator: '=='}],
                        operator: '&'
                    }
                });
            }
        }).reloadList();
    }
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
                        changeListStatus();
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

pandora.clearIconCache = function(item) {
    ['poster', 'icon'].forEach(function(icon) {
        ['', 64, 128, 512].forEach(function(size) {
            var url = '/' + item + '/' + icon + size + '.jpg',
                xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.send();
        });
    });
}

pandora.clearListIconCache = function(list) {
    ['', 256].forEach(function(size) {
        var url = '/list/' + list + '/icon' + size + '.jpg',
            xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.send();
    });
}

pandora.clickLink = function(e) {
    var match = e.target.id.match(/^embed(\d+)$/)
    if (match) {
        pandora.$ui.textPanel.selectEmbed(parseInt(match[1]));
    } else if (
        e.target.hostname == document.location.hostname
        && !Ox.startsWith(e.target.pathname, '/static')
    ) {
        if (pandora.$ui.home && e.target.pathname != '/home') {
            pandora.$ui.home.fadeOutScreen();
        }
        pandora.URL.push(e.target.pathname);
    } else {
        window.open('/url=' + encodeURIComponent(e.target.href), '_blank');
    }
};

pandora.createLinks = function($element) {
    function isExternalLink(target) {
        return target.hostname != document.location.hostname
            || Ox.startsWith(target.pathname, '/static');
    } 
    $element
        .on({
            click: function(e) {
                if($(e.target).is('a') && isExternalLink(e.target)) {
                    e.preventDefault();
                    window.open('/url=' + encodeURIComponent(e.target.href), '_blank');
                }
                return false;
            }
        })
        .bindEvent({
            singleclick: function(e) {
                if($(e.target).is('a') && !isExternalLink(e.target)) {
                    pandora.clickLink(e);
                }
            }
        });
};

pandora.enableDragAndDrop = function($list, canMove) {

    var $tooltip = Ox.Tooltip({
            animate: false
        }),
        drag = {},
        scrollInterval;

    $list.bindEvent({
        draganddropstart: function(data) {
            drag.action = 'copy';
            drag.ids = $list.options('selected'),
            drag.item = drag.ids.length == 1
                ? $list.value(drag.ids[0], 'title')
                : drag.ids.length;
            drag.source = pandora.getListData(),
            drag.targets = {};
            Ox.forEach(pandora.$ui.folderList, function($list) {
                $list.addClass('OxDroppable').find('.OxItem').each(function() {
                    var $item = $(this),
                        id = $item.data('id'),
                        data = $list.value(id);
                    drag.targets[id] = Ox.extend({
                        editable: data.user == pandora.user.username
                            && data.type == 'static',
                        selected: $item.is('.OxSelected')
                    }, data);
                    if (!drag.targets[id].selected && drag.targets[id].editable) {
                        $item.addClass('OxDroppable');
                    }
                });
            });
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
            // fixme: should be named showLists in the user ui prefs!
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
                    if (drag.action == 'move') {
                        pandora.api.removeListItems({
                            list: pandora.user.ui._list,
                            items: data.ids
                        }, pandora.reloadList);
                    }
                    pandora.api.addListItems({
                        list: drag.target.id,
                        items: data.ids
                    }, function() {
                        Ox.Request.clearCache(); // fixme: remove
                        pandora.api.find({
                            query: {
                                conditions: [{key: 'list', value: drag.target.id, operator: '='}],
                                operator: ''
                            }
                        }, function(result) {
                            var folder = drag.target.status != 'featured' ? 'personal' : 'featured';
                            //Ox.Log('', drag.source.status, '//////', drag.target.status)
                            pandora.$ui.folderList[folder].value(
                                drag.target.id, 'items',
                                result.data.items
                            );
                            cleanup(250);
                        });
                    });
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
                }, ms);
            }
        }
    });

    function getTitle() {
        var image, text;
        if (drag.action == 'move' && drag.source.user != pandora.user.username) {
            image = 'symbolClose'
            text = 'You can only remove ' + pandora.site.itemName.plural.toLowerCase()
                + '<br/>from your own lists.';
        } else if (drag.action == 'move' && drag.source.type == 'smart') {
            image = 'symbolClose';
            text = 'You can\'t remove ' + pandora.site.itemName.plural.toLowerCase()
                + '<br/>from smart lists.';
        } else if (drag.target && drag.target.user != pandora.user.username) {
            image = 'symbolClose'
            text = 'You can only ' + drag.action + ' ' + pandora.site.itemName.plural.toLowerCase()
                + '<br/>to your own lists';
        } else if (drag.target && drag.target.type == 'smart') {
            image = 'symbolClose'
            text = 'You can\'t ' + drag.action + ' ' + pandora.site.itemName.plural.toLowerCase()
                + '<br/>to smart lists';
        } else {
            image = drag.action == 'copy' ? 'symbolAdd' : 'symbolRemove';
            text = Ox.toTitleCase(drag.action) + ' ' + (
                Ox.isString(drag.item)
                ? '"' + drag.item + '"'
                : drag.item + ' ' + pandora.site.itemName[
                    drag.item == 1 ? 'singular' : 'plural'
                ].toLowerCase()
            ) + '</br> to ' + (
                drag.target && !drag.target.selected
                ? 'the list "' + Ox.encodeHTMLEntities(drag.target.name) + '"'
                : (pandora.user.ui._list ? 'another' : 'a') + ' list'
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
            )
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

pandora.getClipsItems = function(width) {
    width = width || window.innerWidth
        - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 1
        - Ox.UI.SCROLLBAR_SIZE;
    return Math.floor((width - 8) / (128 + 8)) - 1;
};

pandora.getClipsQuery = function() {
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
    return clipsQuery;
};

(function() {
    var itemTitles = {};
    pandora.getDocumentTitle = function(itemTitle) {
        Ox.Log('', 'ITEM TITLES', itemTitles)
        if (itemTitle) {
            itemTitles[pandora.user.ui.item] = itemTitle
        }
        var parts = [pandora.site.site.name];
        if (!pandora.user.ui.item) {
            pandora.user.ui._list && parts.push('List ' + pandora.user.ui._list);
            parts.push(Ox.toTitleCase(pandora.user.ui.listView) + ' View');
        } else {
            parts.push(itemTitles[pandora.user.ui.item] || pandora.user.ui.item);
            parts.push(Ox.toTitleCase(pandora.user.ui.itemView) + ' View');
        }
        return parts.join(' - ');
    };
}());

pandora.getFilterSizes = function() {
    return Ox.splitInt(
        window.innerWidth
        - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize
        - 1,
        5
    );
};

pandora.getFoldersHeight = function() {
    var height = 0;
    pandora.site.sectionFolders[pandora.user.ui.section].forEach(function(folder, i) {
        height += 16 + pandora.user.ui.showFolder[pandora.user.ui.section][folder.id] * (
            !!folder.showBrowser * 40 + folder.items * 16
        );
    });
    return height;
};

pandora.getFoldersWidth = function() {
    var width = pandora.user.ui.sidebarSize;
    Ox.Log('', 'FOLDERS HEIGHT', pandora.getFoldersHeight(), 'INFO HEIGHT', pandora.getInfoHeight())
    if (
        pandora.$ui.appPanel
        && pandora.getFoldersHeight() > window.innerHeight - 20 - 24 -16 - 1 - pandora.getInfoHeight()
    ) {
        width -= Ox.UI.SCROLLBAR_SIZE;
    }
    return width;
};

pandora.getInfoHeight = function(includeHidden) {
    // fixme: new, check if it can be used more
    var height = 0, isVideoPreview;
    if (pandora.user.ui.showInfo || includeHidden) {
        isVideoPreview = pandora.user.ui.item || (
            pandora.user.ui.listSelection.length && !pandora.isClipView()
        );
        height = Math.min(
            isVideoPreview
                ? Math.round(pandora.user.ui.sidebarSize / pandora.site.video.previewRatio) + 16
                : pandora.user.ui.sidebarSize,
            window.innerHeight - 109 // 20 menu + 24 bar + 64 (4 closed folders) + 1 resizebar
        );
    }
    return height;
}

pandora.getItemByIdOrTitle = function(type, str, callback) {
    if (type == pandora.site.itemName.plural.toLowerCase()) {
        var sortKey = Ox.getObjectById(pandora.site.itemKeys, 'votes')
                      ? 'votes'
                      : 'timesaccessed';
        pandora.api.get({id: str, keys: ['id']}, function(result) {
            if (result.status.code == 200) {
                callback(result.data.id);
            } else {
                pandora.api.find({
                    query: {
                        conditions: [{key: 'title', value: str, operator: '='}],
                        operator: '&'
                    },
                    sort: [{key: sortKey, operator: ''}],
                    range: [0, 100],
                    keys: ['id', 'title', sortKey]
                }, function(result) {
                    var id = '';
                    if (result.data.items.length) {
                        var items = Ox.filter(Ox.map(result.data.items, function(item) {
                            // test if exact match or word match
                            var sort = new RegExp('^' + str + '$', 'i').test(item.title) ? 2000000
                                : new RegExp('\\b' + str + '\\b', 'i').test(item.title) ? 1000000 : 0;
                            return sort ? {id: item.id, sort: sort + (parseInt(item[sortKey]) || 0)} : null;
                            // fixme: remove the (...|| 0) check once the backend sends correct data
                        }));
                        if (items.length) {
                            id = items.sort(function(a, b) {
                                return b.sort - a.sort;
                            })[0].id;
                        }
                    }
                    callback(id);
                });
            }
        });
    } else {
        callback(str);
    }
}

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
        if (['player', 'editor', 'timeline'].indexOf(ui.itemView) > -1) {
            ret = getIdAndPositionByItemId(ui.item);
        } else if (
            ['clips', 'map', 'calendar'].indexOf(ui.itemView) > -1
            && pandora.$ui.clipList
            && (selected = pandora.$ui.clipList.options('selected')).length == 1
        ) {
            ret = getIdAndPositionByClipId(selected[0]);
        }
    }
    return ret;
}

pandora.getListData = function(list) {
    var data = {}, folder;
    if (pandora.user.ui.section == 'items') {
        list = Ox.isUndefined(list) ? pandora.user.ui._list : list;
    } else {
        list = Ox.isUndefined(list) ? pandora.user.ui[pandora.user.ui.section.slice(0, -1)] : list;
    }
    if (list) {
        Ox.forEach(pandora.$ui.folderList, function($list, id) {
            var ret = true;
            // for the current list, we have to check in which
            // folder it is selected, since for example, a personal
            // list may appear again in the featured lists browser
            if (
                list == pandora.user.ui._list
                && $list.options('selected').length
            ) {
                folder = id;
                ret = false;
            } else if (!Ox.isEmpty($list.value(list))) {
                folder = id
                ret = false;
            }
            // FIXME: Is there a `return ret` statement missing here?
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

pandora.getMetadataByIdOrName = function(item, view, str, callback) {
    // For a given item (or none) and a given view (or any), this takes a string
    // and checks if it's an annotation/event/place id or an event/place name,
    // and returns the id (or none) and the view (or none)
    // fixme: "subtitles:23" is still missing
    Ox.Log('URL', 'getMetadataByIdOrName', item, view, str);
    var isName = str[0] == '@',
        canBeAnnotation = (
            !view || Ox.contains(['player', 'editor', 'timeline'], view)
        ) && item && !isName,
        canBeEvent = !view || view == 'calendar',
        canBePlace = !view || view == 'map';
    str = isName ? str.slice(1) : str;
    getId(canBeAnnotation ? 'annotation' : '', function(id) {
        if (id) {
            Ox.Log('URL', 'id?', id)
            callback(id, pandora.user.ui.videoView);
        } else {
            getId(canBePlace ? 'place' : '', function(id) {
                if (id) {
                    Ox.Log('', 'found place id', id)
                    callback(id, 'map');
                } else {
                    getId(canBeEvent ? 'event' : '', function(id) {
                        if (id) {
                            callback(id, 'calendar');
                        } else if (canBePlace && isName) {
                            callback('@' + str, 'map');
                        } else {
                            callback();
                        }
                    });
                }
            });
        }
    });
    function getId(type, callback) {
        if (type) {
            pandora.api['find' + Ox.toTitleCase(type + 's')](Ox.extend({
                query: {
                    conditions: [{
                        key: isName ? 'name' : 'id',
                        value: type != 'annotation' ? str : item + '/' + str,
                        operator: '=='
                    }],
                    operator: '&'
                },
                keys: type != 'annotation' ? ['id'] : ['id', 'in', 'out'],
                range: [0, 1]
            }, item && type != 'annotation' ? {
                itemQuery: {
                    conditions: [{key: 'id', value: item, operator: '=='}],
                    operator: '&'
                }
            } : {}), function(result) {
                var annotation, span;
                if (result.data.items.length) {
                    span = result.data.items[0];
                    annotation = span.id.split('/')[1];
                    type == 'annotation' && pandora.UI.set('videoPoints.' + item, {
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

pandora.getPageTitle = function(stateOrURL) {
    var pages = [
            {id: '', title: ''},
            {id: 'help', title: 'Help'},
            {id: 'home', title: ''},
            {id: 'preferences', title: 'Preferences'},
            {id: 'signin', title: 'Sign In'},
            {id: 'signout', title: 'Sign Out'},
            {id: 'signup', title: 'Sign Up'},
            {id: 'software', title: 'Software'},
            {id: 'tv', title: 'TV'}
        ].concat(pandora.site.sitePages),
        page = Ox.getObjectById(
            pages,
            Ox.isObject(stateOrURL) ? stateOrURL.page : stateOrURL.slice(1)
        );
    return page
        ? pandora.site.site.name
        + (page.title ? ' - ' + page.title : '')
        : null;
};

pandora.getSortKeyData = function(key) {
    return Ox.getObjectById(pandora.site.itemKeys, key)
        || Ox.getObjectById(pandora.site.clipKeys, key);
}

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

pandora.getVideoUrl = function(id, resolution, part) {
    var prefix = pandora.site.site.videoprefix
        .replace('{id}', id)
        .replace('{part}', part)
        .replace('{resolution}', resolution)
        .replace('{uid}', Ox.uid());
    return prefix + '/' + id + '/' + resolution + 'p' + part + '.' + pandora.user.videoFormat;
}

pandora.getVideoOptions = function(data) {
    var canPlayClips = data.editable || pandora.site.capabilities.canPlayClips[pandora.user.level] >= data.rightslevel,
        canPlayVideo = data.editable || pandora.site.capabilities.canPlayVideo[pandora.user.level] >= data.rightslevel,
        options = {},
        subtitlesLayer = pandora.site.layers.filter(function(layer) {
            return layer.isSubtitles;
        })[0];
    options.subtitles = subtitlesLayer ? data.layers[subtitlesLayer.id].map(function(subtitle) {
        return {
            id: subtitle.id,
            'in': subtitle['in'],
            out: subtitle.out,
            text: subtitle.value.replace(/\n/g, ' ').replace(/<br\/?>/g, '\n')
        };
    }) : [];
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
    options.video = {};
    pandora.site.video.resolutions.forEach(function(resolution) {
        options.video[resolution] = Ox.range(data.parts).map(function(i) {
            return pandora.getVideoUrl(data.item || pandora.user.ui.item, resolution, i + 1);
        });
    });
    options.annotations = [];
    pandora.site.layers.forEach(function(layer, i) { 
        options.annotations[i] = Ox.extend({}, layer, {
            items: data.layers[layer.id].map(function(annotation) {
                annotation.duration = Math.abs(annotation.out - annotation['in']);
                annotation.editable = annotation.editable
                    || annotation.user == pandora.user.username
                    || pandora.site.capabilities['canEditAnnotations'][pandora.user.level];
                return annotation;
            })
        });
    });
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
    return $('.OxDialog:visible').length
        || $('.OxFullscreen').length
        || $('.OxScreen').length;
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
    if (arguments.length == 0) {
        item = pandora.user.ui.item;
        view = !item ? pandora.user.ui.listView : pandora.user.ui.itemView;
    } else if (arguments.length == 1) {
        item = pandora.user.ui.item;
    }
    return (
        !item ? ['calendar', 'clip', 'map'] : ['calendar', 'clips', 'map']
    ).indexOf(view) > -1;
};

pandora.isEmbedURL = function(url) {
    var hash = Ox.parseURL(url).hash;
    return hash.substr(0, 2) == '#?'
        && Ox.unserialize(hash.substr(2), true).embed === true
};

pandora.logEvent = function(data, event, element) {
    var element = this,
        handlers = self.eventHandlers ? self.eventHandlers[event] : [];
    if (!Ox.contains([
        'mousedown', 'mouserepeat', 'anyclick', 'singleclick', 'doubleclick',
        'dragstart', 'drag', 'dragenter', 'dragleave', 'dragpause', 'dragend',
        'draganddropstart', 'draganddrop', 'draganddropenter', 'draganddropleave', 'draganddropend',
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

pandora.normalizeHashQuery = function(state) {
    var embedKeys = [
            'annotationsFont', 'annotationsRange', 'annotationsSort',
            'embed',
            'ignoreRights', 'invertHighlight',
            'matchRatio',
            'paused', 'playInToOut',
            'showAnnotations', 'showCloseButton', 'showLayers', 'showTimeline',
            'timeline', 'title'
        ],
        isEmbed = state.hash && state.hash.query
            && Ox.indexOf(state.hash.query, function(condition) {
                return Ox.isEqual(condition, {key: 'embed', value: true});
            }) > -1,
        newState = Ox.clone(state, true),
        removeKeys = [];
    if (state.hash && state.hash.anchor) {
        if (!state.page) {
            delete newState.hash.anchor;
        }
    }
    if (state.hash && state.hash.query) {
        if (isEmbed) {
            state.hash.query.forEach(function(condition) {
                if (!Ox.contains(embedKeys, condition.key)) {
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
        newState.hash.query = newState.hash.query.filter(function(condition) {
            return !Ox.contains(removeKeys, condition.key);
        });
        if (Ox.isEmpty(newState.hash.query)) {
            delete newState.hash.query;
        }
    }
    if (Ox.isEmpty(newState.hash)) {
        delete newState.hash;
    }
    return newState;
};

pandora.signin = function(data) {
    // fixme: this is still voodoo
    pandora.user = Ox.extend(data.user, {
        sectionElement: 'buttons',
        videoFormat: Ox.UI.getVideoFormat(pandora.site.video.formats)
    });
    pandora.user.ui._list = pandora.getListState(pandora.user.ui.find);
    pandora.user.ui._filterState = pandora.getFilterState(pandora.user.ui.find);
    pandora.user.ui._findState = pandora.getFindState(pandora.user.ui.find);
    pandora.site.sortKeys = pandora.getSortKeys();
    pandora.URL.init();
    pandora.URL.update();
    Ox.Theme(pandora.user.ui.theme);
    Ox.Request.clearCache();
    pandora.$ui.appPanel.reload();
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
    Ox.Request.clearCache();
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
        pandora.UI.set({
            find: {
                conditions: [{key: 'list', value: newId, operator: '=='}],
                operator: '&'
            }
        }, false);
    } else {
        pandora.UI.set(pandora.user.ui.section.slice(0, -1), newId);
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

pandora.resizeFolders = function() {
    var width = pandora.getFoldersWidth(),
        columnWidth = {},
        sectionWidth = pandora.user.ui.section == 'items'? 96 : 32;
    columnWidth = {user: parseInt((width - (sectionWidth)) * 0.4)};
    columnWidth.name = (width - sectionWidth) - columnWidth.user;
    Ox.Log('', 'RESIZE FOLDERS', width);
    pandora.$ui.allItems.resizeElement(width - 104);
    Ox.forEach(pandora.$ui.folderList, function($list, id) {
        var pos = Ox.getIndexById(pandora.site.sectionFolders[pandora.user.ui.section], id);
        pandora.$ui.folder[pos].css({width: width + 'px'});
        $list.css({width: width + 'px'});
        if (pandora.site.sectionFolders[pandora.user.ui.section][pos].showBrowser) {
            pandora.$ui.findListInput[id].options({
                width: width - 24
            });
            $list.resizeColumn('user', columnWidth.user)
                .resizeColumn('name', columnWidth.name);
        } else {
            $list.resizeColumn(id == 'favorite' ? 'id' : 'name', width - 96);
        }
        if (!pandora.user.ui.showFolder[pandora.user.ui.section][id]) {
            pandora.$ui.folder[pos].updatePanel();
        }
    });
};

pandora.resizeWindow = function() {
    if (pandora.$ui.embedPanel) {
        pandora.$ui.embedPanel.resizePanel();
        return;
    }
    // FIXME: a lot of this throws errors on load
    pandora.$ui.leftPanel && pandora.$ui.leftPanel.size(2, pandora.getInfoHeight(true));
    pandora.resizeFolders();
    if (pandora.user.ui.section == 'item') {
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
                pandora.$ui.item.resize();
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
        var id = pandora.user.ui[pandora.user.ui.section.slice(0,-1)];
        if (id) {
            pandora.api.getText({id: id}, function(result) {
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

pandora.beforeunloadWindow = function() {
    if (pandora.firefogg)
        return "Encoding is currently running\nDo you want to leave this page?";
    //prevent error dialogs on unload
    pandora.isUnloading = true;
}

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
                value: decodeURIComponent(find.conditions[indices[0]].value)
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
