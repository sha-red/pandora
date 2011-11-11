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
    }
    if (isDuplicate && listData.type == 'static') {
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
                    sort: [{key: 'id', operator: ''}]
                }, function(result) {
                    var items = result.data.items.map(function(item) {
                        return item.id;
                    });
                    addList(items);
                })
            } else {
                addList();
            }
        })
    } else {
        addList();
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
                })
            } else {
                getPosterFrames(newList);
            }
        });
    }
    function getPosterFrames(newList) {
        if (!isDuplicate) {
            pandora.api.find({
                query: {
                    conditions: [{key: 'list', value: newList, operator: '=='}],
                    operator: '&'
                },
                keys: ['id', 'posterFrame'],
                sort: [{key: 'votes', operator: ''}], // fixme: may not always exist
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
        Ox.Request.clearCache('findLists');
        $folderList.bindEventOnce({
            load: function(data) {
                $folderList.gainFocus()
                    .options({selected: [newList]})
                    .editCell(newList, 'name');
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

pandora.changeListStatus = function(id, status, callback) {
    if (status == 'private') {
        pandora.api.findLists({
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
                changeListStatus();
            }
        });
    } else {
        changeListStatus();
    }
    function changeListStatus() {
        pandora.api.editList({
            id: id,
            status: status
        }, callback);
    }
};

pandora.clickLink = function(e) {
    if (e.target.hostname == document.location.hostname) {
        pandora.URL.push(e.target.pathname);
    } else {
        document.location.href = '/url=' + encodeURIComponent(e.target.href);
    }
};

pandora.createLinks = function($element) {
    $element
        .bind({
            click: function() {
                return false;
            }
        })
        .bindEvent({
            singleclick: function(e) {
                $(e.target).is('a') && pandora.clickLink(e);
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
                $list.addClass('OxDroppable').$element.find('.OxItem').each(function() {
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
            $tooltip.options({
                title: getTitle(data._event)
            }).show(data._event);
            canMove && Ox.UI.$window.bind({
                keydown: keydown,
                keyup: keyup
            });
        },
        draganddrop: function(data) {
            var event = data._event;
            $tooltip.options({
                title: getTitle(event)
            }).show(event);
            if (scrollInterval && !isAtListsTop(event) && !isAtListsBottom(event)) {
                clearInterval(scrollInterval);
                scrollInterval = 0;
            }
        },
        draganddroppause: function(data) {
            var event = data._event, scroll,
                $parent, $grandparent, $panel, $bar, title;
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
                    $bar = $panel.children('.OxBar');
                    title = $bar.children('.OxTitle')
                        .html().split(' ')[0].toLowerCase();
                    !pandora.user.ui.showFolder.items[title] && $bar.trigger('dblclick');
                }
                if (!scrollInterval) {
                    //Ox.Log('', 'AT TOP', isAtListsTop(event), 'AT BOTTOM', isAtListsBottom(event))
                    scroll = isAtListsTop(event) ? -16
                        : isAtListsBottom(event) ? 16 : 0
                    if (scroll) {
                        scrollInterval = setInterval(function() {
                            pandora.$ui.folders.$element.scrollTop(
                                pandora.$ui.folders.$element.scrollTop() + scroll
                            );
                        }, 100);
                    }
                }
            }
        },
        draganddropenter: function(data) {
            var $parent = $(data._event.target).parent(),
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
            var $parent = $(data._event.target).parent(),
                $item = $parent.is('.OxItem') ? $parent : $parent.parent();
            if ($item.is('.OxDroppable')) {
                $item.removeClass('OxDrop');
                drag.target = null;
            }
        },
        draganddropend: function(data) {
            Ox.Log('', data, drag, '------------');
            canMove && Ox.UI.$window.unbind({
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

    function getTitle(e) {
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
                ? 'the list "' + drag.target.name + '"'
                : 'another list'
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
                        border: '2px solid rgb(192, 192, 192)',
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
                Ox.getPositionById(pandora.site.layers, condition.key) > -1
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
    return Ox.divideInt(
        window.innerWidth - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 1, 5
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
                ? Math.round(pandora.user.ui.sidebarSize / (16/9)) + 16
                : pandora.user.ui.sidebarSize,
            window.innerHeight - 109 // 20 menu + 24 bar + 64 (4 closed folders) + 1 resizebar
        );
    }
    return height;
}

pandora.getItemByIdOrTitle = function(str, callback) {
    pandora.api.get({id: str, keys: ['id']}, function(result) {
        if (result.status.code == 200) {
            callback(result.data.id);
        } else {
            pandora.api.find({
                query: {
                    conditions: [{key: 'title', value: str, operator: '='}],
                    operator: '&'
                },
                sort: [{key: 'votes', operator: ''}], // fixme: not all systems have "votes"
                range: [0, 100],
                keys: ['id', 'title', 'votes']
            }, function(result) {
                var id = '';
                if (result.data.items.length) {
                    var items = Ox.map(result.data.items, function(item) {
                        // test if exact match or word match
                        var sort = new RegExp('^' + str + '$', 'i').test(item.title) ? 2000000
                            : new RegExp('\\b' + str + '\\b', 'i').test(item.title) ? 1000000 : 0;
                        return sort ? {id: item.id, sort: sort + (parseInt(item.votes) || 0)} : null;
                        // fixme: remove the (...|| 0) check once the backend sends correct data
                    });
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
}

pandora.getListData = function(list) {
    var data = {}, folder;
    list = Ox.isUndefined(list) ? pandora.user.ui._list : list;
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
        });
        if (folder) {
            data = pandora.$ui.folderList[folder].value(pandora.user.ui._list);
            data.editable = data.user == pandora.user.username && data.type == 'static';
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
    Ox.Log('', 'getMetadataByIdOrName', item, view, str);
    var isName = str[0] == '@',
        canBeAnnotation = (
            !view || view == 'video' || view == 'timeline'
        ) && item && !isName,
        canBeEvent = !view || view == 'calendar',
        canBePlace = !view || view == 'map';
    str = isName ? str.substr(1) : str;
    getId(canBeAnnotation ? 'annotation' : '', function(id) {
        if (id) {
            Ox.Log('', 'id?', id)
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
                        value: type == 'annotation' ? item + '/' + str : str,
                        operator: '=='
                    }],
                    operator: '&'
                },
                keys: ['id'],
                range: [0, 1]
            }, item ? {
                itemQuery: {
                    conditions: [{key: 'id', value: item, operator: '=='}],
                    operator: '&'
                }
            } : {}), function(result) {
                callback(result.data.items.length ? result.data.items[0].id : '');
            });
        } else {
            callback();
        }
    }
};

pandora.getPageTitle = function(stateOrURL) {
    var pages = Ox.merge([
            {id: '', title: ''},
            {id: 'help', title: 'Help'},
            {id: 'home', title: ''},
            {id: 'preferences', title: 'Preferences'},
            {id: 'signin', title: 'Sign In'},
            {id: 'signout', title: 'Sign Out'},
            {id: 'signup', title: 'Sign Up'},
            {id: 'software', title: 'Software'}
        ], pandora.site.sitePages),
        page = Ox.getObjectById(
            pages,
            Ox.isObject(stateOrURL) ? stateOrURL.page : stateOrURL.substr(1)
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

pandora.getSortOperator = function(key) {
    var data = pandora.getSortKeyData(key);
    return data.sortOperator || ['string', 'text'].indexOf(
        Ox.isArray(data.type) ? data.type[0] : data.type
    ) > -1 ? '+' : '-';
};

pandora.getVideoPartsAndPoints = function(durations, points) {
    var parts = durations.length,
        offsets = Ox.range(parts).map(function(i) {
            return Ox.sum(Ox.sub(durations, 0, i));
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

pandora.hasFocusedInput = function() {
    var focused = Ox.Focus.focused();
    return focused && Ox.UI.elements[focused].is('.OxInput');
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

pandora.isItemFind = function(find) {
    return find.conditions.length == 1
        && Ox.getPositionById(pandora.site.layers, find.conditions[0].key) > -1
        && find.conditions[0].operator == '=';
};

pandora.signin = function(data) {
    pandora.user = data.user;
    pandora.user.ui._list = pandora.getListState(pandora.user.ui.find);
    pandora.user.ui._filterState = pandora.getFilterState(pandora.user.ui.find);
    pandora.user.ui._findState = pandora.getFindState(pandora.user.ui.find);
    Ox.Theme(pandora.user.ui.theme);
    pandora.UI.set({find: pandora.user.ui.find});
    Ox.Request.clearCache();
    pandora.$ui.appPanel.reload();
};

pandora.signout = function(data) {
    pandora.user = data.user;
    pandora.user.ui._list = pandora.getListState(pandora.user.ui.find);
    pandora.user.ui._filterState = pandora.getFilterState(pandora.user.ui.find);
    pandora.user.ui._findState = pandora.getFindState(pandora.user.ui.find);
    Ox.Theme(pandora.site.user.ui.theme);
    pandora.UI.set({find: pandora.user.ui.find});
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
    pandora.UI.set({
        find: {
            conditions: [{key: 'list', value: newId, operator: '=='}],
            operator: '&'
        }
    }, false);
};

pandora.resizeFilters = function(width) {
    pandora.user.ui.filterSizes = pandora.getFilterSizes();
    pandora.$ui.browser
        .size(0, pandora.user.ui.filterSizes[0])
        .size(2, pandora.user.ui.filterSizes[4]);
    pandora.$ui.filtersInnerPanel
        .size(0, pandora.user.ui.filterSizes[1])
        .size(2, pandora.user.ui.filterSizes[3]);
    pandora.$ui.filters.forEach(function($list, i) {
        $list.resizeColumn('name', pandora.user.ui.filterSizes[i] - 40 - Ox.UI.SCROLLBAR_SIZE);
        if (pandora.user.ui.showFlags) {
            $list.find('.flagname').css({width: pandora.user.ui.filterSizes[i] - 64 - Ox.UI.SCROLLBAR_SIZE})
        }
    });
};

pandora.resizeFolders = function() {
    var width = pandora.getFoldersWidth(),
        columnWidth = {};
    if (pandora.user.ui.section == 'items') {
        columnWidth = {user: parseInt((width - 96) * 0.4)};
        columnWidth.name = (width - 96) - columnWidth.user;
    }
    Ox.Log('', 'RESIZE FOLDERS', width);
    pandora.$ui.allItems.resizeElement(width - 104);
    Ox.forEach(pandora.$ui.folderList, function($list, id) {
        var pos = Ox.getPositionById(pandora.site.sectionFolders[pandora.user.ui.section], id);
        pandora.$ui.folder[pos].css({width: width + 'px'});
        $list.css({width: width + 'px'});
        if (pandora.user.ui.section == 'items') {
            if (pandora.site.sectionFolders[pandora.user.ui.section][pos].showBrowser) {
                pandora.$ui.findListInput[id].options({
                    width: width - 24
                });
                $list.resizeColumn('user', columnWidth.user)
                    .resizeColumn('name', columnWidth.name);
            } else {
                $list.resizeColumn(id == 'favorite' ? 'id' : 'name', width - 96);
            }
        }
        if (!pandora.user.ui.showFolder[pandora.user.ui.section][id]) {
            pandora.$ui.folder[pos].update();
        }
    });
};

pandora.resizeWindow = function() {
    // FIXME: a lot of this throws errors on load
    pandora.$ui.leftPanel.size(2, pandora.getInfoHeight(true));
    pandora.resizeFolders();
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
            pandora.$ui.map.resizeMap();
        } else if (pandora.user.ui.listView == 'calendar') {
            pandora.$ui.calendar.resizeCalendar();
        } else {
            pandora.$ui.list.size();
        }
    } else {
        pandora.$ui.browser.scrollToSelection();
        if (pandora.user.ui.itemView == 'info') {
            pandora.$ui.item.resize();
        } else if (pandora.user.ui.itemView == 'clips') {
            pandora.$ui.clipList.size();
        } else if (pandora.user.ui.itemView == 'video') {
            pandora.$ui.player.options({
               // fixme: duplicated
               height: pandora.$ui.contentPanel.size(1),
               width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
            });
        } else if (pandora.user.ui.itemView == 'timeline') {
            pandora.$ui.editor.options({
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
};

pandora.selectList = function() {
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
        var indices = Ox.map(conditions, function(condition, i) {
            return (
                condition.conditions
                ? includeSubconditions && everyCondition(condition.conditions, key, operator)
                : condition.key == key && condition.operator == operator
            ) ? i : null;
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
        Ox.Log('', 'getFindState', find)
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
            indices = Ox.map(pandora.site.findKeys, function(findKey) {
                var index = oneCondition(find.conditions, findKey.id, '=');
                return index > -1 ? index : null;
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
