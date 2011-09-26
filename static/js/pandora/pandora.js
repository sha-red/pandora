// vim: et:ts=4:sw=4:sts=4:ft=javascript

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
                    //Ox.print('AT TOP', isAtListsTop(event), 'AT BOTTOM', isAtListsBottom(event))
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
            Ox.print(data, drag, '------------');
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
                            list: pandora.user.ui.list,
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
                            //Ox.print(drag.source.status, '//////', drag.target.status)
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
    // fixme: don't use height(), look up in splitpanels
    if (pandora.getFoldersHeight() > pandora.$ui.leftPanel.height() - 24 - 1 - pandora.$ui.info.height()) {
        width -= Ox.UI.SCROLLBAR_SIZE;
    }
    return width;
};

pandora.getGroupsSizes = function() {
    return Ox.divideInt(
        window.innerWidth - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 1, 5
    )
};

pandora.getInfoHeight = function() {
    // fixme: new, check if it can be used more
    var isVideoPreview 
    if (!pandora.user.ui.item) {
        isVideoPreview = pandora.user.ui.listSelection.length && !pandora.isClipView();
    } else {
        isVideoPreview = !pandora.isClipView();
    }
    return pandora.user.ui.showInfo * Math.min(
        isVideoPreview
        ? Math.round(pandora.user.ui.sidebarSize / (16/9)) + 16 
        : pandora.user.ui.sidebarSize,
        window.innerHeight - 109 // 20 menu + 24 bar + 64 (4 closed folders) + 1 resizebar
    );
}

pandora.getItemByIdOrTitle = function(str, callback) {
    pandora.api.get({id: str, keys: ['id']}, function(result) {
        if (result.status.code == 200) {
            callback(result.data.id);
        } else {
            pandora.api.find({
                query: {
                    conditions: [{key: 'title', value: str, operator: ''}], // fixme: operator will be "="
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

pandora.getListData = function() {
    var data = {}, folder;
    if (pandora.user.ui.list) {
        Ox.forEach(pandora.$ui.folderList, function(list, key) {
            if (list.options('selected').length) {
                folder = key;
                return false;
            }
        });
        // the one case where folder is undefinded is when on page load
        // the folderLists call getListData to determine which list is selected
        if (folder) {
            //Ox.print('gLD f', folder)
            data = pandora.$ui.folderList[folder].value(pandora.user.ui.list);
            data.editable = data.user == pandora.user.username && data.type == 'static';
            data.folder = folder;
        }
    }
    return data;
};

pandora.getListMenu = function(lists) {
    return { id: 'listMenu', title: 'List', items: [
        { id: 'history', title: 'History', items: [
            { id: 'allmovies', title: 'All ' + pandora.site.itemName.plural }
        ] },
        { id: 'viewlist', title: 'View List', items: lists ? ['personal', 'favorite', 'featured'].map(function(folder) {
            return { id: folder + 'lists', title: Ox.toTitleCase(folder) + ' Lists', items: [
                { group: folder + 'lists', min: 0, max: 1, items: lists[folder].map(function(list) {
                    return { id: 'viewlist' + list.id, title: (folder == 'favorite' ? list.user + ': ' : '') + list.name, checked: list.id == pandora.user.ui.list };
                }) }
            ] };
        }) : [
            { id: 'loading', title: 'Loading...', disabled: true }
        ] },
        {},
        { id: 'newlist', title: 'New List...', keyboard: 'control n' },
        { id: 'newlistfromselection', title: 'New List from Selection...', disabled: true, keyboard: 'shift control n' },
        { id: 'newsmartlist', title: 'New Smart List...', keyboard: 'alt control n' },
        { id: 'newsmartlistfromresults', title: 'New Smart List from Results...', keyboard: 'shift alt control n' },
        {},
        { id: 'addmovietolist', title: ['Add Selected ' + pandora.site.itemName.singular + ' to List...', 'Add Selected ' + pandora.site.itemName.plural + ' to List...'], disabled: true },
        {},
        { id: 'setposterframe', title: 'Set Poster Frame', disabled: true }
    ] };
};

pandora.getMetadataByIdOrName = function(item, view, str, callback) {
    // For a given item (or none) and a given view (or any), this takes a string
    // and checks if it's an annotation/event/place id or an event/place name,
    // and returns the id (or none) and the view (or none)
    // fixme: "subtitles:23" is still missing
    Ox.print('getMetadataByIdOrName', item, view, str);
    var isName = str[0] == '@',
        canBeAnnotation = (
            !view || view == 'video' || view == 'timeline'
        ) && item && !isName,
        canBeEvent = !view || view == 'calendar',
        canBePlace = !view || view == 'map';
    str = isName ? str.substr(1) : str;
    getId(canBeAnnotation ? 'annotation' : '', function(id) {
        if (id) {
            Ox.print('id?', id)
            callback(id, pandora.user.ui.videoView);
        } else {
            getId(canBePlace ? 'place' : '', function(id) {
                if (id) {
                    callback(id, 'map');
                } else {
                    getId(canBeEvent ? 'event' : '', function(id) {
                        if (id) {
                            callback(id, 'calendar');
                        } else if (canBePlace && isName) {
                            // set map query ...
                            pandora.user.ui.mapFind = str;
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
                    key: isName ? 'name' : 'id',
                    value: type == 'annotation' ? item + '/' + str : str,
                    operator: '='
                },
                keys: ['id'],
                range: [0, 1]
            }, item ? {
                itemQuery: {key: 'id', value: item, operator: '='}
            } : {}), function(result) {
                // fixme: this has to be fixed on the backend!
                if (result.data.events) { result.data.items = result.data.events; };
                callback(result.data.items.length ? result.data.items[0].id : '');
            });
        } else {
            callback();
        }
    }
};

pandora.getSortMenu = function() {
    var ui = pandora.user.ui,
        isClipView = pandora.isClipView(ui.listView);
    return { id: 'sortMenu', title: 'Sort', items: [
        { id: 'sortmovies', title: 'Sort ' + (isClipView ? 'Clips' : pandora.site.itemName.plural) + ' by', items: [
            { group: 'sortmovies', min: 1, max: 1, items: Ox.merge(isClipView ? Ox.merge(pandora.site.clipKeys.map(function(key) {
                return Ox.extend({
                    checked: ui.listSort[0].key == key.id
                }, key);
            }), {}) : [], pandora.site.sortKeys.map(function(key) {
                return Ox.extend({
                    checked: ui.listSort[0].key == key.id
                }, key);
            })) }
        ] },
        { id: 'ordermovies', title: 'Order ' + (isClipView ? 'Clips' : pandora.site.itemName.plural), items: [
            { group: 'ordermovies', min: 1, max: 1, items: [
                { id: 'ascending', title: 'Ascending', checked: (ui.listSort[0].operator || pandora.getSortOperator(ui.listSort[0].key)) == '+' },
                { id: 'descending', title: 'Descending', checked: (ui.listSort[0].operator || pandora.getSortOperator(ui.listSort[0].key)) == '-' }
            ]}
        ] },
        { id: 'advancedsort', title: 'Advanced Sort...', keyboard: 'shift control s' },
        {},
        { id: 'sortgroups', title: 'Sort Groups', items: pandora.user.ui.groups.map(function(group) {
            return {
                id: 'sortgroup' + group.id,
                title: 'Sort ' + Ox.getObjectById(pandora.site.groups, group.id).title + ' Group by',
                items: [
                    { group: 'sortgroup' + group.id, min: 1, max: 1, items: [
                        { id: 'name', title: 'Name', checked: group.sort[0].key == 'name' },
                        { id: 'items', title: 'Items', checked: group.sort[0].key == 'items' }
                    ] }
                ]
            }
        }) },
        { id: 'ordergroups', title: 'Order Groups', items: pandora.user.ui.groups.map(function(group) {
            return {
                id: 'ordergroup' + group.id,
                title: 'Order ' + Ox.getObjectById(pandora.site.groups, group.id).title + ' Group',
                items: [
                    { group: 'ordergroup' + group.id, min: 1, max: 1, items: [
                        { id: 'ascending', title: 'Ascending', checked: group.sort[0].operator == '+' },
                        { id: 'descending', title: 'Descending', checked: group.sort[0].operator == '-' }
                    ] }
                ]
            }
        }) }
    ] };
};

pandora._getSortOperator = function(type) {
    return ['hue', 'string', 'text'].indexOf(
        Ox.isArray(type) ? type[0] : type
    ) > -1 ? '+' : '-';
}

pandora.getSortOperator = function(key) { // fixme: remove
    var type = Ox.getObjectById(
            /^clip:/.test(key) ? pandora.site.clipKeys : pandora.site.itemKeys,
            key
        ).type;
    return ['hue', 'string', 'text'].indexOf(
        Ox.isArray(type) ? type[0] : type
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

pandora.isClipView = function(view, item) {
    if (arguments.length == 0) {
        item = pandora.user.ui.item;
        view = !item ? pandora.user.ui.listView : pandora.user.ui.itemView;
    }
    return (
        !item ? ['calendar', 'clip', 'map'] : ['calendar', 'clips', 'map']
    ).indexOf(view) > -1;
};

pandora.signin = function(data) {
    pandora.user = data.user;
    pandora.Query.updateGroups();
    Ox.Theme(pandora.user.ui.theme);
    pandora.$ui.appPanel.reload();
};

pandora.signout = function(data) {
    pandora.user = data.user;
    pandora.Query.updateGroups();
    Ox.Theme(pandora.site.user.ui.theme);
    pandora.$ui.appPanel.reload();
};

pandora.reloadGroups = function(i) {
    // fixme: no longer needed
    var query = pandora.user.ui.query,
        view = pandora.user.ui.lists[pandora.user.ui.list].listView;
    if (view == 'clip') {
        pandora.$ui.list.options({
            items: function(data, callback) {
                return pandora.api.findAnnotations(Ox.extend(data, {
                    itemQuery: query
                }), callback);
            }
        });
    } else if (view == 'map') {
        pandora.$ui.map.options({
            places: function(data, callback) {
                return pandora.api.findPlaces(Ox.extend(data, {
                    itemQuery: query
                }), callback);
            }
        });
    } else if (view == 'calendar') {
        pandora.$ui.list.options({
            items: function(data, callback) {
                return pandora.api.findEvents(Ox.extend(data, {
                    itemQuery: query
                }), callback);
            }
        });
    } else {
        pandora.$ui.list.options({
            items: function(data, callback) {
                return pandora.api.find(Ox.extend(data, {
                    query: query
                }), callback);
            }
        });
    }
    Ox.forEach(pandora.user.ui.groups, function(group, i_) {
        if (i_ != i) {
            //Ox.print('setting groups request', i, i_)
            pandora.$ui.groups[i_].options({
                items: function(data, callback) {
                    delete data.keys;
                    return pandora.api.find(Ox.extend(data, {
                        group: group.id,
                        query: pandora.user.ui.groupsData[i_].query
                    }), callback);
                }
            });
        }
    });
};

pandora.reloadList = function() {
    Ox.print('reloadList')
    var listData = pandora.getListData();
    Ox.Request.clearCache(); // fixme: remove
    pandora.$ui.groups.forEach(function($group) {
        $group.reloadList();
    });
    pandora.$ui.list.bindEvent({
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
                if (data) pandora.$ui.list.options({selected: [data.items]});
            }
        })
        .reloadList();
};

pandora.resizeGroups = function(width) {
    pandora.user.ui.groupsSizes = pandora.getGroupsSizes();
    Ox.print('{}{}{}', window.innerWidth, window.innerWidth - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 1, pandora.user.ui.groupsSizes)
    pandora.$ui.browser
        .size(0, pandora.user.ui.groupsSizes[0])
        .size(2, pandora.user.ui.groupsSizes[4]);
    pandora.$ui.groupsInnerPanel
        .size(0, pandora.user.ui.groupsSizes[1])
        .size(2, pandora.user.ui.groupsSizes[3]);
    pandora.$ui.groups.forEach(function(list, i) {
        list.resizeColumn('name', pandora.user.ui.groupsSizes[i] - 40 - Ox.UI.SCROLLBAR_SIZE);
    });
};

pandora.resizeFolders = function() {
    var width = pandora.getFoldersWidth(),
        columnWidth = {};
    if (pandora.user.ui.section == 'items') {
        columnWidth = {user: parseInt((width - 96) * 0.4)};
        columnWidth.name = (width - 96) - columnWidth.user;
    }
    //Ox.print('sectionsWidth', width)
    Ox.forEach(pandora.$ui.folderList, function($list, id) {
        var i = Ox.getPositionById(pandora.site.sectionFolders[pandora.user.ui.section], id);
        pandora.$ui.folder[i].css({width: width + 'px'});
        $list.css({width: width + 'px'});
        if (pandora.user.ui.section == 'items') {
            if (pandora.site.sectionFolders[pandora.user.ui.section][i].showBrowser) {
                Ox.print('ID', id)
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
            pandora.$ui.folder[i].update();
        }
    });
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

