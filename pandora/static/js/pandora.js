/***
    Pandora
***/

var app = new Ox.App({
    config: '/static/json/pandora.json',
    init: 'hello',
    id: 'oxdb',
    name: 'OxDB',
    requestURL: '/api/'
}).launch(function(data) {
    Ox.print('data', data)
    app.config = data.config;
    app.user = data.user;
    if (app.user.group == 'guest') {
        app.user = data.config.user;
        $.browser.safari && Ox.theme('modern');
    }

    app.$body = $('body');
    app.$document = $(document);
    app.$window = $(window);
    app.$ui = {};
    app.ui = {
        infoRatio: 4 / 3,
        selectedMovies: []
    };

    app.Query.fromString(location.hash.substr(1));

    app.$ui.mainMenu = app.constructMainMenu();
    app.$ui.sections = app.constructSections();
    app.$ui.lists = app.constructLists();
    app.$ui.info = app.constructInfo();
    app.$ui.toolbar = app.constructToolbar();
    app.$ui.groups = app.constructGroups();
    app.$ui.statusbar = app.constructStatusbar();

    app.$ui.app = app.constructApp();
    app.$ui.app.appendTo(app.$body);

    Ox.Request.requests() && app.$ui.loadingIcon.start();
    Ox.Event.bind('', 'requestStart', function() {
        Ox.print('requestStart')
        app.$ui.loadingIcon.start();
    });
    Ox.Event.bind('', 'requestStop', function() {
        Ox.print('requestStop')
        app.$ui.loadingIcon.stop();
    });

});




// Objects

app.Query = (function() {

    function constructFind(query) {
        Ox.print('cF', query)
        return /*encodeURI(*/$.map(query.conditions, function(v, i) {
            if (!Ox.isUndefined(v.conditions)) {
                return '[' + constructFind(v) + ']';
            } else {
                return v.value !== '' ? v.key + (v.key ? ':' : '') + constructValue(v.value, v.operator) : null;
            }
        }).join(query.operator)/*)*/;
    }

    function constructValue(value, operator) {
        operator = operator.replace('=', '^$');
        if (operator.indexOf('$') > -1) {
            value = operator.substr(0, operator.length - 1) + value + '$'
        } else {
            value = operator + value;
        }
        return value;
    }

    function mergeFind() {
    }

    function parseFind(str) {
        var find = {
                conditions: [],
                operator: ''
            },
            subconditions = str.match(/\[.*?\]/g) || [];
        $.each(subconditions, function(i, v) {
            subconditions[i] = v.substr(1, v.length - 2);
            str = str.replace(v, '[' + i + ']');
        });
        if (str.indexOf(',') > -1) {
            find.operator = '&';
        } else if (str.indexOf('|') > -1) {
            find.operator = '|';
        }
        Ox.print('pF', str, find.operator)
        find.conditions = $.map(find.operator === '' ? [str] : str.split(find.operator == '&' ? ',' : '|'), function(v, i) {
            Ox.print('v', v)
            var ret, kv;
            if (v[0] == '[') {
                Ox.print('recursion', subconditions)
                ret = parseFind(subconditions[parseInt(v.substr(1, v.length - 2))]);
            } else {
                kv = ((v.indexOf(':') > - 1 ? '' : ':') + v).split(':');
                ret = $.extend({
                    key: kv[0]
                }, parseValue(kv[1]));
            }
            return ret;
        });
        return find;
    }

    function parseValue(str) {
        var value = {
                value: decodeURI(str),
                operator: ''
            };
        if (value.value[0] == '!') {
            value.operator = '!'
            value.value = value.value.substr(1);
        }
        if ('^<>'.indexOf(value.value[0]) > -1) {
            value.operator += value.value[0];
            value.value = value.value.substr(1);
        }
        if (value.value.substr(-1) == '$') {
            value.operator += '$';
            value.value = value.value.substr(0, value.value.length - 1);
        }
        value.operator = value.operator.replace('^$', '=');
        return value;
    }

    return {

        fromString: function(str) {
            var query = Ox.unserialize(str),
                sort = [];
            if ('find' in query) {
                app.user.ui.findQuery = parseFind(query.find);
                Ox.print('user.ui.findQuery', app.user.ui.findQuery)
            }
            if ('sort' in query) {
                sort = query.sort.split(',')
                app.user.ui.sort = $.map(query.sort.split(','), function(v, i) {
                    var hasOperator = '+-'.indexOf(v[0]) > -1,
                        key = hasOperator ? query.sort.substr(1) : query.sort,
                        operator = hasOperator ? v[0].replace('+', '') : Ox.getObjectById(app.config.sortKeys, key).operator;
                    return {
                        key: key,
                        operator: operator
                    };
                });
            }
            if ('view' in query) {
                app.user.ui.listView = query.view;
            }
        },

        toObject: function(groupId) {
            Ox.print('tO', app.user.ui.findQuery.conditions)
            // the inner $.merge() creates a clone
            var conditions = $.merge($.merge([], app.user.ui.listQuery.conditions), app.user.ui.findQuery.conditions);
            $.merge(conditions, app.ui.groups ? $.map(app.ui.groups, function(v, i) {
                    if (v.id != groupId && v.query.conditions.length) {
                        return v.query.conditions.length == 1 ?
                            v.query.conditions : v.query;
                    }
                }) : []),
                operator = conditions.length < 2 ? '' : ','; // fixme: should be &
            Ox.print(groupId, app.user.ui.find, conditions);
            return {
                conditions: conditions,
                operator: operator
            };
        },

        toString: function() {
            Ox.print('tS', app.user.ui.find)
            return Ox.serialize({
                find: constructFind(Query.toObject()),
                sort: app.user.ui.sort[0].operator + app.user.ui.sort[0].key,
                view: app.user.ui.listView
            });
        }

    };

})();



/*
    // Menu


    Ox.Event.bind('change_viewmovies', function(event, data) {
        app.$ui.viewSelect.selectItem(data.id);
    });
    Ox.Event.bind('change_find', function(event, data) {
        app.$ui.findInput.changeLabel(data.id);
    });
    Ox.Event.bind('click_query', function(event, data) {
        var $dialog = new Ox.Dialog({
            buttons: [
                {
                    click: function() {
                        $dialog.close();
                    },
                    id: 'close',
                    title: 'Close',
                    value: 'Close'
                }
            ],
            id: 'query',
            title: 'Query'
        }).append(Query.toString() + '<br/><br/>' + JSON.stringify(Query.toObject())).open();
    });

    // Resize

    Ox.Event.bind('click_show_query', function(event, data) {
        var query = constructQuery(),
            html = 'Conditions<br/><br/>' + $.map(query.conditions, function(v) {
                return v.key + ' ' + v.operator + ' ' + v.value;
            }).join('<br/>') + '<br/><br/>Operator: ' + query.operator,
            $dialog = new Ox.Dialog({
                buttons: [
                    {
                        value: 'Close',
                        click: function() {
                            $dialog.close();
                        }
                    }
                ],
                title: 'Show Query'
            })
            .append(html)
            .open();
    });

// Functions
*/

app.constructApp = function() {
    return new Ox.SplitPanel({
        elements: [
            {
                element: app.$ui.mainMenu,
                size: 20
            },
            {
                element: app.$ui.mainPanel = new Ox.SplitPanel({
                    elements: [
                        {
                            collapsible: true,
                            element: app.$ui.leftPanel = new Ox.SplitPanel({
                                    elements: [
                                        {
                                            element: app.$ui.lists.options({
                                                id: 'listsPanel'
                                            })
                                        },
                                        {
                                            collapsible: true,
                                            element: app.$ui.info.options({
                                                id: 'infoPanel'
                                            }),
                                            size: app.user.ui.listsSize / app.ui.infoRatio + 16
                                        }
                                    ],
                                    id: 'leftPanel',
                                    orientation: 'vertical'
                                })
                                .bindEvent('resize', function(event, data) {
                                    Ox.print('resize', data, data / app.ui.infoRatio + 16);
                                    app.$ui.leftPanel.resize('infoPanel', Math.round(data / app.ui.infoRatio) + 16);
                                }),
                            resizable: true,
                            resize: [128, 192, 256],
                            size: app.user.ui.listsSize
                        },
                        {
                            element: app.$ui.rightPanel = new Ox.SplitPanel({
                                elements: [
                                    {
                                        element: app.$ui.toolbar.css({ zIndex: 2 }), // fixme: remove later
                                        size: 24
                                    },
                                    {
                                        element: app.$ui.contentPanel = new Ox.SplitPanel({
                                            elements: [
                                                {
                                                    collapsible: true,
                                                    element: app.$ui.groupsOuterPanel = new Ox.SplitPanel({
                                                        elements: [
                                                            {
                                                                element: app.$ui.groups[0],
                                                                size: app.ui.groups[0].size
                                                            },
                                                            {
                                                                element: app.$ui.groupsInnerPanel = new Ox.SplitPanel({
                                                                    elements: [
                                                                        {
                                                                            element: app.$ui.groups[1],
                                                                            size: app.ui.groups[1].size
                                                                        },
                                                                        {
                                                                            element: app.$ui.groups[2],
                                                                        },
                                                                        {
                                                                            element: app.$ui.groups[3],
                                                                            size: app.ui.groups[3].size
                                                                        }
                                                                    ],
                                                                    orientation: 'horizontal'
                                                                })
                                                            },
                                                            {
                                                                element: app.$ui.groups[4],
                                                                size: app.ui.groups[4].size
                                                            },
                                                        ],
                                                        orientation: 'horizontal'
                                                    }),
                                                    resizable: true,
                                                    resize: [96, 112, 128, 144, 160, 176],
                                                    size: app.user.ui.groupsSize
                                                },
                                                {
                                                    element: app.$ui.list = app.constructList(app.user.ui.listView)
                                                }
                                            ],
                                            orientation: 'vertical'
                                        })
                                    },
                                    {
                                        element: app.$ui.statusbar,
                                        size: 16
                                    }
                                ],
                                id: 'rightPanel',
                                orientation: 'vertical'
                            })
                            .bindEvent('resize', function(event, data) {
                                var widths = $.map(app.ui.groups, function(v, i) {
                                    return app.getGroupWidth(i, data);
                                });
                                Ox.print('widths', widths);
                                app.$ui.groupsOuterPanel.resize(0, widths[0].list).resize(2, widths[4].list);
                                app.$ui.groupsInnerPanel.resize(0, widths[1].list).resize(2, widths[3].list);
                                $.each(app.$ui.groups, function(i, list) {
                                    list.resizeColumn('name', widths[i].column);
                                });
                            })
                        }
                    ],
                    orientation: 'horizontal'
                })
            }
        ],
        orientation: 'vertical'
    });
}

app.constructGroups = function() {
    $groups = [];
    var panelWidth = app.$document.width() - app.user.ui.listsSize - 1;
    app.ui.groups = $.map(app.config.groups, function(id, i) {
        var title = Ox.getObjectById(app.config.sortKeys, id).title,
            width = app.getGroupWidth(i, panelWidth);
        return {
            id: id,
            element: $groups[i] = new Ox.TextList({
                    columns: [
                        {
                            align: 'left',
                            id: 'name',
                            operator: id == 'year' ? '-' : '+',
                            title: title,
                            unique: true,
                            visible: true,
                            width: width.column
                        },
                        {
                            align: 'right',
                            id: 'items',
                            operator: '-',
                            title: '#',
                            visible: true,
                            width: 40
                        }
                    ],
                    id: 'group_' + id,
                    request: function(options) {
                        delete options.keys;
                        app.request('find', $.extend(options, {
                            group: id,
                            query: app.Query.toObject()
                        }), options.callback);
                    },
                    sort: [
                        {
                            key: id == 'year' ? 'name' : 'items',
                            operator: '-'
                        }
                    ]
                })
                .bindEvent('select', function(event, data) {
                    Ox.print('select', i)
                    var group = groups[i],
                        query;
                    groups[i].query.conditions = $.map(data.ids, function(v) {
                        return {
                            key: group.id,
                            value: v,
                            operator: '='
                        };
                    });
                    query = app.Query.toObject();
                    app.$ui.list.options({
                        request: function(options) {
                            return app.request('find', $.extend(options, {
                                query: query
                            }), options.callback);
                        }
                    });
                    $.each(groups, function(i_, group_) {
                        if (i_ != i) {
                            app.$ui.groups[i_].options({
                                request: function(options) {
                                    delete options.keys;
                                    return app.request('find', $.extend(options, {
                                        group: group_.id,
                                        query: app.Query.toObject(group_.id)
                                    }), options.callback);
                                }
                            });
                        }
                    });
                    location.hash = app.Query.toString(query);
                }),
            query: {
                conditions: [],
                operator: '|'
            },
            size: width.list,
            title: title
        };
    });
    return $groups;
}

app.constructInfo = function() {
    return new Ox.Element()
        .append(
            app.$ui.infoStill = new Ox.Element('img')
                .css({
                    position: 'absolute',
                    left: 0,
                    top: 0
                })
        )
        .append(
            app.$ui.infoTimeline = new Ox.Element('img')
                .css({
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    height: '16px',
                })
        );
}

app.constructList = function(view) {
    var $list;
    Ox.print('constructList', view);
    if (view == 'list' || view == 'calendar') {
        $list = new Ox.TextList({
            columns: $.map(app.config.sortKeys, function(key, i) {
                return $.extend({
                    visible: $.inArray(key.id, app.user.ui.columns) > -1,
                    unique: key.id == 'id'
                }, key);
            }),
            columnsMovable: true,
            columnsRemovable: true,
            id: 'list',
            request: function(options) {
                Ox.print('options, Query.toObject', options, app.Query.toObject())
                app.request('find', $.extend(options, {
                    query: app.Query.toObject()
                }), options.callback);
            },
            sort: app.user.ui.sort
        });
    } else if (view == 'icons') {
        $list = new Ox.IconList({
            id: 'list',
            item: function(data, sort, size) {
                return {
                    height: data.posterHeight,
                    id: data['id'],
                    info: data[$.inArray(sort[0].key, ['title', 'director']) > -1 ? 'year' : sort[0].key],
                    title: data.title + (data.director ? ' (' + data.director + ')' : ''),
                    url: 'http://0xdb.org/' + data.id + '/poster.' + size + '.' + 'jpg',
                    width: data.posterWidth
                };
            },
            keys: ['director', 'id', 'posterHeight', 'posterWidth', 'posterURL', 'title'],
            request: function(options) {
                app.request('find', $.extend(options, {
                    query: Query.toObject()
                }), options.callback);
            },
            size: 128,
            sort: [
                {
                    key: 'director',
                    operator: ''
                }
            ],
            unique: 'id'
        }).css('background', 'blue');
    } else {
        $list = new Ox.Element('<div>')
            .css({
                width: '100px',
                height: '100px',
                background: 'red'
            })
    }
    $list.bindEvent({
        closepreview: function(event, data) {
            app.$ui.previewDialog.close();
            delete app.$ui.previewDialog;
        },
        load: function(event, data) {
            app.$ui.total.html(app.constructStatus('total', data));
            data = [];
            $.each(app.config.totals, function(i, v) {
                data[v.id] = 0;
            });
            app.$ui.selected.html(app.constructStatus('selected', data));
        },
        openpreview: function(event, data) {
            app.request('find', {
                keys: ['director', 'id', 'posterHeight', 'posterWidth', 'posterURL', 'title'],
                query: {
                    conditions: $.map(data.ids, function(id, i) {
                        return {
                            key: 'id',
                            value: id,
                            operator: '='
                        }
                    }),
                    operator: '|'
                }
            }, function(result) {
                var item = result.data.items[0],
                    title = item.title + (item.director ? ' (' + item.director + ')' : ''),
                    documentHeight = app.$document.height(),
                    dialogHeight = documentHeight - 40,
                    dialogWidth = parseInt((dialogHeight - 48) * 0.75),
                    $image = $('<img>')
                        .attr({
                            src: 'http://0xdb.org/' + item.id + '/poster.large.jpg'
                        })
                        .css({
                            height: (dialogHeight - 48) + 'px',
                            width: dialogWidth + 'px'
                        })
                        .load(function() {
                            var image = $image[0],
                                imageHeight = Math.min(image.height, documentHeight - 88),
                                imageWidth = parseInt(image.width * imageHeight / image.height);
                            app.$ui.previewDialog.options({
                                height: imageHeight + 48,
                                width: imageWidth
                            });
                            $image.css({
                                height: imageHeight + 'px',
                                width: imageWidth + 'px'
                            });
                        });
                if ('previewDialog' in app.$ui) {
                    app.$ui.previewDialog.options({
                        title: title
                    });
                    app.$ui.previewImage.animate({
                        opacity: 0
                    }, 250, function() {
                        app.$ui.previewImage.replaceWith(
                            $image.css({
                                opacity: 0
                            }).animate({
                                opacity: 1
                            }, 250));
                        app.$ui.previewImage = $image;
                    });
                } else {
                    app.$ui.previewDialog = new Ox.Dialog({
                            buttons: [
                                {
                                    title: 'Close',
                                    click: function() {
                                        app.$ui.previewDialog.close();
                                        delete app.$ui.previewDialog;
                                        app.$ui.list.closePreview();
                                    }
                                }
                            ],
                            height: dialogHeight,
                            padding: 0,
                            title: title,
                            width: dialogWidth
                        })
                        .append($image)
                        .open();
                    app.$ui.previewImage = $image;
                }
            });
        },
        select: function(event, data) {
            var $still, $timeline;
            app.ui.selectedMovies = data.ids;
            if (data.ids.length) {
                app.$ui.mainMenu.enableItem('copy');
                app.$ui.mainMenu.enableItem('openmovie');
            } else {
                app.$ui.mainMenu.disableItem('copy');
                app.$ui.mainMenu.disableItem('openmovie');            
            }
            if (data.ids.length == 1) {
                $still = $('<img>')
                    .attr({
                        src: 'http://0xdb.org/' + data.ids[0] + '/still.jpg'
                    })
                    .one('load', function() {
                        if (data.ids[0] != app.ui.selectedMovies[0]) {
                            Ox.print('cancel after load...')
                            return;
                        }
                        var image = $still[0],
                            imageWidth = image.width,
                            imageHeight = image.height,
                            width = app.$ui.info.width(),
                            height = imageHeight * width / imageWidth;
                        app.ui.infoRatio = width / height;
                        $still.css({
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                //width: width + 'px',
                                //height: height + 'px',
                                width: '100%',
                                opacity: 0
                            })
                            .appendTo(app.$ui.info.$element)
                            .animate({
                                opacity: 1
                            });
                        app.$ui.infoStill.animate({
                            opacity: 0
                        }, 250);
                        app.$ui.info.animate({
                            height: (height + 16) + 'px'
                        }, 250, function() {
                            app.$ui.infoStill.remove();
                            app.$ui.infoStill = $still;
                        });
                    });
                /*
                $timeline = $('<img>')
                    .attr({
                        src: 'http://0xdb.org/' + data.ids[0] + '/timeline/timeline.png'
                    })
                    .one('load', function() {
                        $timeline.css({
                                position: 'absolute',
                                left: 0,
                                bottom: '16px',
                                opacity: 0
                            })
                            .appendTo($ui.info.$element)
                            .animate({
                                opacity: 1
                            });
                        $ui.infoTimeline.animate({
                            opacity: 0
                        }, 250, function() {
                            $ui.infoTimeline.remove();
                            $ui.infoTimeline = $timeline;
                        });
                    });
                */
            }
            app.request('find', {
                query: {
                    conditions: $.map(data.ids, function(id, i) {
                        return {
                            key: 'id',
                            value: id,
                            operator: '='
                        }
                    }),
                    operator: '|'
                }
            }, function(result) {
                app.$ui.selected.html(app.constructStatus('selected', result.data));
            });
        },
        sort: function(event, data) {
            /* some magic has already set user.ui.sort
            Ox.print(':', user.ui.sort[0])
            if (data.key != user.ui.sort[0].key) {
                app.$ui.mainMenu.checkItem('sort_sortmovies_' + data.key);
            }
            if (data.operator != user.ui.sort[0].operator) {
                app.$ui.mainMenu.checkItem('sort_ordermovies_' + data.operator === '' ? 'ascending' : 'descending');
            }
            user.ui.sort[0] = data;
            */
            app.$ui.mainMenu.checkItem('sortMenu_sortmovies_' + data.key);
            app.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + (data.operator === '' ? 'ascending' : 'descending'));
        }
    });
    
    return $list;

}

app.constructLists = function() {
    var $lists = new Ox.Element;
    $.each(app.$ui.sections, function(i, $section) {
        $lists.append($section);
    });
    return $lists;
}

app.constructMainMenu = function() {
    return new Ox.MainMenu({
            extras: [
                app.$ui.loadingIcon = new Ox.LoadingIcon({
                    size: 'medium'
                })
            ],
            id: 'mainMenu',
            menus: [
                { id: app.options('id') + 'Menu', title: app.options('name'), items: [
                    { id: 'about', title: 'About' },
                    {},
                    { id: 'home', title: 'Home Screen' },
                    { id: 'faq', title: 'Frequently Asked Questions' },
                    { id: 'tos', title: 'Terms of Service' },
                    {},
                    { id: 'contact', title: 'Contact...' }
                ] },
                { id: 'userMenu', title: 'User', items: [
                    { id: 'username', title: 'User: not logged in', disabled: true },
                    {},
                    { id: 'preferences', title: 'Preferences...', disabled: true, keyboard: 'control ,' },
                    {},
                    { id: 'register', title: 'Create an Account...' },
                    { id: 'loginlogout', title: ['Login...', 'Logout...'] }
                ] },
                { id: 'listMenu', title: 'List', items: [
                    { id: 'history', title: 'History', items: [
                        { id: 'allmovies', title: 'All Movies' }
                    ] },
                    { id: 'lists', title: 'View List', items: [
                        { id: 'favorites', title: 'Favorites' }
                    ] },
                    { id: 'features', title: 'View Feature', items: [
                        { id: 'situationistfilm', title: 'Situationist Film' },
                        { id: 'timelines', title: 'Timelines' }
                    ] },
                    {},
                    { id: 'newlist', title: 'New List...', keyboard: 'control n' },
                    { id: 'newlistfromselection', title: 'New List from Selection...', disabled: true, keyboard: 'shift control n' },
                    { id: 'newsmartlist', title: 'New Smart List...', keyboard: 'alt control n' },
                    { id: 'newsmartlistfromresults', title: 'New Smart List from Results...', keyboard: 'shift alt control n' },
                    {},
                    { id: 'addmovietolist', title: ['Add Selected Movie to List...', 'Add Selected Movies to List...'], disabled: true },
                    {},
                    { id: 'setposterframe', title: 'Set Poster Frame', disabled: true }
                ]},
                { id: 'editMenu', title: 'Edit', items: [
                    { id: 'undo', title: 'Undo', disabled: true, keyboard: 'control z' },
                    { id: 'redo', title: 'Redo', disabled: true, keyboard: 'shift control z' },
                    {},
                    { id: 'cut', title: 'Cut', disabled: true, keyboard: 'control x' },
                    { id: 'copy', title: 'Copy', disabled: true, keyboard: 'control c