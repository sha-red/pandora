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
    app.requests = {};
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

    ///*
    app.$body.css({
        opacity: 0
    });
    //*/
    app.$ui.app.appendTo(app.$body);
    ///*
    app.$body.animate({
        opacity: 1
    }, 2000);
    //*/

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
                find: constructFind(app.Query.toObject()),
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
                    request: function(data, callback) {
                        Ox.print('sending request', data)
                        delete data.keys;
                        return app.api.find($.extend(data, {
                            group: id,
                            query: app.Query.toObject()
                        }), callback);
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
                    var group = app.ui.groups[i],
                        query;
                    app.ui.groups[i].query.conditions = $.map(data.ids, function(v) {
                        return {
                            key: group.id,
                            value: v,
                            operator: '='
                        };
                    });
                    query = app.Query.toObject();
                    app.$ui.list.options({
                        request: function(data, callback) {
                            return app.api.find($.extend(data, {
                                query: query
                            }), callback);
                        }
                    });
                    $.each(app.ui.groups, function(i_, group_) {
                        if (i_ != i) {
                            app.$ui.groups[i_].options({
                                request: function(data, callback) {
                                    delete data.keys;
                                    return app.api.find($.extend(data, {
                                        group: group_.id,
                                        query: app.Query.toObject(group_.id)
                                    }), callback);
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
        Ox.print('--OK--');
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
    var $list,
        keys = ['director', 'id', 'poster', 'title', 'year'];
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
            request: function(data, callback) {
                Ox.print('data, Query.toObject', data, app.Query.toObject())
                app.api.find($.extend(data, {
                    query: app.Query.toObject()
                }), callback);
            },
            sort: app.user.ui.sort
        });
    } else if (view == 'icons') {
        $list = new Ox.IconList({
            id: 'list',
            item: function(data, sort, size) {
                return {
                    height: data.poster.height || 128, // fixme: remove later
                    id: data['id'],
                    info: data[['title', 'director'].indexOf(sort[0].key) > -1 ? 'year' : sort[0].key],
                    title: data.title + (data.director ? ' (' + data.director + ')' : ''),
                    url: 'http://0xdb.org/' + data.id + '/poster.' + size + '.' + 'jpg',
                    width: data.poster.width || 80 // fixme: remove later
                };
            },
            keys: keys,
            request: function(data, callback) {
                Ox.print('data, Query.toObject', data, app.Query.toObject())
                app.api.find($.extend(data, {
                    query: app.Query.toObject()
                }), callback);
            },
            size: 128,
            sort: app.user.ui.sort,
            unique: 'id'
        });
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
            app.requests.preview && app.api.cancel(app.requests.preview);
            app.requests.preview = app.api.find({
                keys: ['director', 'id', 'poster', 'title'],
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
                var documentHeight = app.$document.height(),
                    item = result.data.items[0],
                    title = item.title + (item.director ? ' (' + item.director + ')' : ''),
                    dialogHeight = documentHeight - 100,
                    dialogWidth;
                app.ui.previewRatio = item.poster.width / item.poster.height,
                dialogWidth = parseInt((dialogHeight - 48) * app.ui.previewRatio);
                if ('previewDialog' in app.$ui) {
                    app.$ui.previewDialog.options({
                        title: title
                    });
                    app.$ui.previewImage.animate({
                        opacity: 0
                    }, 100, function() {
                        app.$ui.previewDialog.resize(dialogWidth, dialogHeight, function() {
                            app.$ui.previewImage
                                .attr({
                                    src: item.poster.url,
                                })
                                .one('load', function() {
                                    app.$ui.previewImage
                                        .css({
                                            width: dialogWidth + 'px',
                                            height: (dialogHeight - 48 - 2) + 'px', // fixme: why -2 ?
                                            opacity: 0
                                        })
                                        .animate({
                                            opacity: 1
                                        }, 100);
                                });
                        });
                    });
                    Ox.print(app.$document.height(), dialogWidth, 'x', dialogHeight, dialogWidth / (dialogHeight - 48), item.poster.width, 'x', item.poster.height, item.poster.width / item.poster.height)
                } else {
                    app.$ui.previewImage = $('<img>')
                        .attr({
                            src: item.poster.url
                        })
                        .css({
                            position: 'absolute',
                            width: dialogWidth + 'px',
                            height: (dialogHeight - 48 - 2) + 'px', // fixme: why -2 ?
                            left: 0,
                            top: 0,
                            right: 0,
                            bottom: 0,
                            margin: 'auto',
                        });
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
                            id: 'previewDialog',
                            minHeight: app.ui.previewRatio >= 1 ? 128 / app.ui.previewRatio + 48 : 176,
                            minWidth: app.ui.previewRatio >= 1 ? 128 : 176 * app.ui.previewRatio,
                            padding: 0,
                            title: title,
                            width: dialogWidth
                        })
                        .append(app.$ui.previewImage)
                        .bindEvent('resize', function(event, data) {
                            var dialogRatio = data.width / (data.height - 48),
                                height, width;
                            if (dialogRatio < app.ui.previewRatio) {
                                width = data.width;
                                height = width / app.ui.previewRatio;
                            } else {
                                height = (data.height - 48 - 2);
                                width = height * app.ui.previewRatio;
                            }
                            app.$ui.previewImage.css({
                                width: width + 'px',
                                height: height + 'px', // fixme: why -2 ?
                            })
                        })
                        .open();
                    //app.$ui.previewImage = $image;
                    //Ox.print(app.$document.height(), dialogWidth, 'x', dialogHeight, dialogWidth / (dialogHeight - 48), item.poster.width, 'x', item.poster.height, item.poster.width / item.poster.height)
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
            app.api.find({
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
                    { id: 'copy', title: 'Copy', disabled: true, keyboard: 'control c' },
                    { id: 'paste', title: 'Paste', disabled: true, keyboard: 'control v' },
                    { id: 'delete', title: 'Delete', disabled: true, keyboard: 'delete' },
                    {},
                    { id: 'selectall', title: 'Select All', disabled: true, keyboard: 'control a' },
                    { id: 'selectnone', title: 'Select None', disabled: true, keyboard: 'shift control a' },
                    { id: 'invertselection', title: 'Invert Selection', disabled: true, keyboard: 'alt control a' }
                ] },
                { id: 'viewMenu', title: 'View', items: [
                    { id: 'movies', title: 'View Movies', items: [
                        { group: 'viewmovies', min: 1, max: 1, items: $.map(app.config.listViews, function(view, i) {
                            return $.extend({
                                checked: app.user.ui.listView == view.id,
                            }, view);
                        }) },
                    ]},
                    { id: 'icons', title: 'Icons', items: [
                        { id: 'poster', title: 'Poster' },
                        { id: 'still', title: 'Still' },
                        { id: 'timeline', title: 'Timeline' }
                    ] },
                    { id: 'info', title: 'Info', items: [
                        { id: 'poster', title: 'Poster' },
                        { id: 'video', title: 'Video' }
                    ] },
                    {},
                    { id: 'openmovie', title: ['Open Movie', 'Open Movies'], disabled: true, items: $.map(app.config.itemViews, function(view, i) {
                        return view;
                    }) },
                    {},
                    { id: 'lists', title: 'Hide Lists', keyboard: 'shift l' },
                    { id: 'info', title: 'Hide Info', keyboard: 'shift i' },
                    { id: 'groups', title: 'Hide Groups', keyboard: 'shift g' },
                    { id: 'movies', title: 'Hide Movies', disabled: true, keyboard: 'shift m' }
                ]},
                { id: 'sortMenu', title: 'Sort', items: [
                    { id: 'sortmovies', title: 'Sort Movies by', items: [
                        { group: 'sortmovies', min: 1, max: 1, items: $.map(app.config.sortKeys, function(key, i) {
                            return $.extend({
                                checked: app.user.ui.sort[0].key == key.id,
                            }, key);
                        }) }
                    ] },
                    { id: 'ordermovies', title: 'Order Movies', items: [
                        { group: 'ordermovies', min: 1, max: 1, items: [
                            { id: 'ascending', title: 'Ascending', checked: app.user.ui.sort[0].operator === '' },
                            { id: 'descending', title: 'Descending', checked: app.user.ui.sort[0].operator == '-' }
                        ]}
                    ] },
                    { id: 'advancedsort', title: 'Advanced Sort...', keyboard: 'shift control s' },
                    {},
                    { id: 'groupsstuff', title: 'Groups Stuff' }
                ] },
                { id: 'findMenu', title: 'Find', items: [
                    { id: 'find', title: 'Find', items: [
                        { group: 'find', min: 1, max: 1, items: $.map(app.config.findKeys, function(key, i) {
                            return $.extend({
                                checked: app.user.ui.findQuery.conditions.length && 
                                        (app.user.ui.findQuery.conditions[0].key == key.id ||
                                        (app.user.ui.findQuery.conditions[0].key === '' && key.id == 'all')),
                            }, key)
                        }) }
                    ] },
                    { id: 'advancedfind', title: 'Advanced Find...', keyboard: 'shift control f' }
                ] },
                { id: 'dataMenu', title: 'Data', items: [
                    { id: 'titles', title: 'Manage Titles...' },
                    { id: 'names', title: 'Manage Names...' },
                    {},
                    { id: 'posters', title: 'Manage Stills...' },
                    { id: 'posters', title: 'Manage Posters...' },
                    {},
                    { id: 'places', title: 'Manage Places...' },
                    { id: 'events', title: 'Manage Events...' },
                    {},
                    { id: 'users', title: 'Manage Users...' },
                    { id: 'lists', title: 'Manage Lists...' },
                ] },
                { id: 'codeMenu', title: 'Code', items: [
                    { id: 'download', title: 'Download' },
                    { id: 'contribute', title: 'Contribute' },
                    { id: 'report', title: 'Report a Bug' },
                ] },
                { id: 'helpMenu', title: 'Help', items: [
                    { id: 'help', title: app.options('name') + ' Help', keyboard: 'shift ?' }
                ] },
                { id: 'debugMenu', title: 'Debug', items: [
                    { id: 'query', title: 'Show Query' }
                ] },
                { id: 'testMenu', title: 'Test', items: [
                    { group: 'foogroup', items: [
                        { id: 'item1', title: 'Item 1' },
                        { id: 'item2', title: 'Item 2' }
                    ] }
                ] }
            ]
        })
        .bindEvent({
            change: function(event, data) {
                if (data.id == 'find') {
                    var id = data.checked[0].id;
                    app.$ui.findSelect.selectItem(id);
                } else if (data.id == 'ordermovies') {
                    var id = data.checked[0].id;
                    app.$ui.list.sortList(user.ui.sort[0].key, id == 'ascending' ? '' : '-');
                } else if (data.id == 'sortmovies') {
                    var id = data.checked[0].id,
                        operator = Ox.getObjectById(app.config.sortKeys, id).operator;
                    app.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + (operator === '' ? 'ascending' : 'descending'));
                    app.$ui.list.sortList(id, operator);
                }
            },
            click: function(event, data) {
                if (data.id == 'about') {
                    var $dialog = new Ox.Dialog({
                        buttons: [
                            {
                                click: function() {
                                    $dialog.close();
                                },
                                id: 'close',
                                title: 'Close'
                            }
                        ],
                        id: 'about',
                        title: 'About'
                    }).open();
                } else if (data.id == 'home') {
                    var $dialog = new Ox.Dialog({
                        buttons: [
                            {
                                click: function() {
                                    $dialog.close();
                                },
                                id: 'close',
                                title: 'Close'
                            }
                        ],
                        height: 498,
                        id: 'home',
                        title: app.options('name'),
                        width: 800
                    }).open();
                } else if (data.id == 'loginlogout') {
                    var $form = new Ox.Form({
                            error: 'Unknown username or wrong password',
                            id: 'login',
                            items: [
                                {
                                    element: new Ox.Input({
                                        autovalidate: function(value, blur, callback) {
                                            var length = value.length;
                                            value = $.map(value.toLowerCase().split(''), function(v, i) {
                                                if (new RegExp('[a-z0-9' + ((i == 0 || (i == length - 1 && blur)) ? '' : '\- ') + ']')(v)) {
                                                    return v
                                                } else {
                                                    return null;
                                                }
                                            }).join('');
                                            $.each(['--', '- ', ' -', '--'], function(i, v) {
                                                while (value.indexOf(v) > -1) {
                                                    value = value.replace(new RegExp(v, 'g'), v[0]);
                                                }
                                            })
                                            callback(value);
                                        },
                                        id: 'username',
                                        label: 'Username',
                                        labelWidth: 120,
                                        validate: function(value, callback) {
                                            app.api.findUser({
                                                key: 'username',
                                                value: value,
                                                operator: '='
                                            }, function(result) {
                                                Ox.print('result', result)
                                                var valid = result.data.users.length == 1;
                                                callback({
                                                    message: 'Unknown Username',
                                                    valid: valid
                                                });
                                            });
                                        },
                                        width: 300
                                    })
                                    .bindEvent({
                                        validate: function(event, data) {
                                            $dialog[(data.valid ? 'enable' : 'disable') + 'Button']('signin');
                                        }
                                    })
                                },
                                {
                                    element: new Ox.Input({
                                        id: 'password',
                                        label: 'Password',
                                        labelWidth: 120,
                                        type: 'password',
                                        validate: /.+/,
                                        width: 300
                                    })
                                }
                            ],
                            submit: function(data, callback) {
                                app.api.login(data, function(result) {
                                    if (result.status.code == 200) {
                                        $dialog.close();
                                        app.user = result.data.user;
                                        app.$ui.mainMenu.getItem('username').options({
                                            title: 'User: ' + app.user.name
                                        });
                                        app.$ui.mainMenu.getItem('preferences').options({
                                            disabled: false
                                        });
                                        app.$ui.mainMenu.getItem('register').options({
                                            disabled: true
                                        });
                                    } else {
                                        callback([{ id: 'password', message: 'Incorrect Password' }]);
                                    }
                                });
                            }
                        }),
                        $dialog = new Ox.Dialog({
                            buttons: [
                                [
                                    {
                                        click: function() {

                                        },
                                        id: 'signup',
                                        title: 'Sign up...'
                                    },
                                    {
                                        click: function() {

                                        },
                                        id: 'reset',
                                        title: 'Reset Password...'
                                    }
                                ],
                                [
                                    {
                                        click: function() {
                                            $dialog.close();
                                            app.$ui.mainMenu.getItem('loginlogout').toggleTitle();
                                        },
                                        id: 'cancel',
                                        title: 'Cancel'
                                    },
                                    {
                                        click: $form.submit,
                                        disabled: true,
                                        id: 'signin',
                                        title: 'Sign in'
                                    }
                                ]
                            ],
                            id: 'login',
                            minWidth: 332,
                            title: 'Sign in',
                            width: 332
                        }).append($form).open();
                } else if (data.id == 'places') {
                    var $manage = new Ox.SplitPanel({
                            elements: [
                                {
                                    collapsible: true,
                                    element: new Ox.SplitPanel({
                                        elements: [
                                            {
                                                element: new Ox.Toolbar({
                                                    orientation: 'horizontal',
                                                    size: 44
                                                }).append(
                                                    app.$ui.findPlacesElement = new Ox.FormElementGroup({
                                                        elements: [
                                                            app.$ui.findPlacesSelect = new Ox.Select({
                                                                    id: 'findPlacesSelect',
                                                                    items: [
                                                                        { id: 'name', title: 'Find: Name' },
                                                                        { id: 'region', title: 'Find: Region' },
                                                                        { id: 'user', title: 'Find: User' }
                                                                    ],
                                                                    overlap: 'right',
                                                                    type: 'image'
                                                                })
                                                                .bindEvent({
                                                                    change: function(event, data) {
                                                                        app.$ui.findPlacesSelect.loseFocus();
                                                                        app.$ui.findPlacesInput.options({
                                                                            placeholder: data.selected[0].title
                                                                        });
                                                                    }
                                                                }),
                                                            app.$ui.findPlacesInput = new Ox.Input({
                                                                clear: true,
                                                                id: 'findPlacesInput',
                                                                placeholder: 'Find: Name',
                                                                width: 168
                                                            })
                                                        ],
                                                        id: 'findPlacesElement'
                                                    }) 
                                                    .css({
                                                        float: 'left',
                                                        margin: '4px'
                                                    })
                                                ).append(
                                                    app.$ui.sortPlacesSelect = new Ox.Select({
                                                        id: 'sortPlacesSelect',
                                                        items: [
                                                            { id: 'name', title: 'Sort by Name', checked: true },
                                                            { id: 'region', title: 'Sort by Region' },
                                                            { id: 'size', title: 'Sort by Size' },
                                                            { id: 'latitude', title: 'Sort by Latitude' },
                                                            { id: 'longitude', title: 'Sort by Longitude' },
                                                            { id: 'clips', title: 'Sort by Number of Clips' },
                                                            { id: 'user', title: 'Sort by User' },
                                                            { id: 'datecreated', title: 'Sort by Date Added' },
                                                            { id: 'datemodified', title: 'Sort by Date Modified' }
                                                        ],
                                                        width: 184
                                                    })
                                                    .css({
                                                        float: 'left',
                                                        margin: '0 4px 4px 4px'
                                                    })
                                                ),
                                                size: 44
                                            },
                                            {
                                                element: new Ox.Element('div')
                                            },
                                            {
                                                element: new Ox.Toolbar({
                                                    orientation: 'horizontal',
                                                    size: 16
                                                }),
                                                size: 16
                                            }
                                        ],
                                        orientation: 'vertical'
                                    }),
                                    resizable: true,
                                    resize: [128, 192, 256],
                                    size: 192
                                },
                                {
                                    element: new Ox.SplitPanel({
                                        elements: [
                                            {
                                                element: new Ox.Toolbar({
                                                    orientation: 'horizontal',
                                                    size: 24
                                                }).append(
                                                    app.$ui.labelsButton = new Ox.Button({
                                                            id: 'labelsButton',
                                                            title: [
                                                                {id: 'show', title: 'Show Labels'},
                                                                {id: 'hide', title: 'Hide Labels'}
                                                            ],
                                                            width: 96
                                                        })
                                                        .css({
                                                            float: 'left',
                                                            margin: '4px'
                                                        })
                                                ).append(
                                                    app.$ui.findMapInput = new Ox.Input({
                                                        clear: true,
                                                        id: 'findMapInput',
                                                        placeholder: 'Find on Map',
                                                        width: 192
                                                    })
                                                    .css({
                                                        float: 'right',
                                                        margin: '4px'
                                                    })
                                                ),
                                                size: 24
                                            },
                                            {
                                                element: app.$ui.map = new Ox.Map({
                                                    places: ['Boston', 'Brussels', 'Barcelona', 'Berlin', 'Beirut', 'Bombay', 'Bangalore', 'Beijing']
                                                }).css({
                                                    left: 0,
                                                    top: 0,
                                                    right: 0,
                                                    bottom: 0
                                                })
                                            },
                                            {
                                                element: new Ox.Toolbar({
                                                    orientation: 'horizontal',
                                                    size: 24
                                                }).append(
                                                    app.$ui.newPlaceButton = new Ox.Button({
                                                        id: 'newPlaceButton',
                                                        title: 'New Place...',
                                                        width: 96
                                                    })
                                                    .css({
                                                        float: 'left',
                                                        margin: '4px'
                                                    })
                                                ),
                                                size: 24
                                            }
                                        ],
                                        orientation: 'vertical'
                                    })
                                }
                            ],
                            orientation: 'horizontal'
                        }).css({
                            top: '24px',
                            bottom: '24px',
                        }),
                        $dialog = new Ox.Dialog({
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
                            height: parseInt(app.$document.height() * 0.8),
                            id: 'places',
                            minHeight: 400,
                            minWidth: 600,
                            padding: 0,
                            title: 'Manage Places',
                            width: parseInt(app.$document.width() * 0.8)
                        }).css({
                            overflow: 'hidden'
                        }).append($manage).open();
                }
            }
        });
}

app.constructSections = function() {
    var $sections = [];
    $.each(app.user.ui.sections, function(i, id) {
        var $section = new Ox.CollapsePanel({
            id: id,
            size: 'small',
            title: Ox.getObjectById(app.config.sections, id).title
        });
        $sections.push($section);
        $section.$content.append(
            $('<div>').css({ height: '20px' }).append(
                $('<div>').css({ float: 'left', width: '16px', height: '16px', margin: '1px'}).append(
                    $('<img>').attr({ src: 'static/oxjs/build/png/ox.ui.modern/iconFind.png' }).css({ width: '16px', height: '16px', border: 0, background: 'rgb(64, 64, 64)', WebkitBorderRadius: '2px' })
                )
            ).append(
                $('<div>').css({ float: 'left', width: '122px', height: '14px', margin: '2px' }).html('Foo')
            ).append(
                $('<div>').css({ float: 'left', width: '40px', height: '14px', margin: '2px', textAlign: 'right' }).html('23')
            )
        );
    });
    return $sections;
}

app.constructStatusbar = function() {
    return new Ox.Bar({
            size: 16
        })
        .css({
            textAlign: 'center'
        })
        .append(
            new Ox.Element()
                .css({
                    marginTop: '2px',
                    fontSize: '9px'
                })
                .append(
                    app.$ui.total = new Ox.Element('span')
                )
                .append(
                    new Ox.Element('span').html(' &mdash; ')
                )
                .append(
                    app.$ui.selected = new Ox.Element('span')
                )
        );
}

app.constructStatus = function(key, data) {
    return Ox.toTitleCase(key) + ': ' + [
        Ox.formatNumber(data.items) + ' movie' + (data.items != 1 ? 's' : ''),
        Ox.formatDuration(data.runtime, 'medium'),
        data.files + ' file' + (data.files != 1 ? 's' : ''),
        Ox.formatDuration(data.duration, 'short'),
        Ox.formatValue(data.size, 'B'),
        Ox.formatValue(data.pixels, 'px')
    ].join(', ');
}

app.constructToolbar = function() {
    return new Ox.Bar({
            size: 24
        })
        .append(
            app.$ui.groupsButton = new Ox.Button({
                    id: 'groupsButton',
                    title: [
                        {id: 'show', title: 'Show Groups'},
                        {id: 'hide', title: 'Hide Groups'}
                    ],
                    width: 96
                })
                .css({
                    float: 'left',
                    margin: '4px'
                })
        )
        .append(
            app.$ui.viewSelect = new Ox.Select({
                    id: 'viewSelect',
                    items: $.map(app.config.listViews, function(view, i) {
                        view.title = 'View ' + view.title
                        return $.extend({
                            checked: app.user.ui.listView == view.id,
                        }, view);
                    }),
                    width: 144
                })
                .css({
                    float: 'left',
                    margin: '4px'
                })
                .bindEvent('change', function(event, data) {
                    var id = data.selected[0].id;
                    app.$ui.mainMenu.checkItem('viewMenu_movies_' + id);
                    //$ui.list.$element.replaceWith(constructList(id));
                    Ox.print('change ... id', id, list = app.constructList(id), list.options(), list.options('id'))
                    //$ui.contentPanel.replace('list', constructList(id));
                    app.$ui.contentPanel.replace(1, app.constructList(id));
                })
        )
        .append(
            app.$ui.findElement = new Ox.FormElementGroup({
                    elements: [
                        app.$ui.findSelect = new Ox.Select({
                                id: 'select',
                                items: $.map(app.config.findKeys, function(key, i) {
                                    return {
                                        id: key.id,
                                        title: 'Find: ' + key.title
                                    };
                                }),
                                overlap: 'right',
                                width: 112
                            })
                            .bindEvent('change', function(event, data) {
                                var key = data.selected[0].id;
                                app.user.ui.findQuery.conditions[0].key = key
                                app.$ui.mainMenu.checkItem('findMenu_find_' + key);
                                app.$ui.findInput.focus();
                            }),
                        app.$ui.findInput = new Ox.Input({
                                autocomplete: function(value, callback) {
                                    var key = 'title';
                                    var findKey = Ox.getObjectById(app.config.findKeys, key);
                                    Ox.print('autocomplete', key, value);
                                    value === '' && Ox.print('Warning: autocomplete function should never be called with empty value');
                                    if ('autocomplete' in findKey && findKey.autocomplete) {
                                        app.api.find({
                                            keys: [key],
                                            query: {
                                                conditions: [
                                                    {
                                                        key: key,
                                                        value: value,
                                                        operator: ''
                                                    }
                                                ],
                                                operator: ''
                                            },
                                            sort: [
                                                {
                                                    key: key,
                                                    operator: ''
                                                }
                                            ],
                                            range: [0, 10]
                                        }, function(result) {
                                            callback($.map(result.data.items, function(v) {
                                                return v.title;
                                            }));
                                        });
                                    } else {
                                        callback();                            
                                    }
                                },
                                autocompleteSelect: true,
                                autocompleteSelectHighlight: true,
                                autocompleteSelectSubmit: true,
                                clear: true,
                                id: 'input',
                                width: 192
                            })
                        .bindEvent('submit', function(event, data) {
                            var key = app.user.ui.findQuery.conditions[0].key,
                                query;
                            Ox.print('key', key);
                            app.user.ui.findQuery.conditions = [
                                {
                                    key: key == 'all' ? '' : key,
                                    value: data.value,
                                    operator: ''
                                }
                            ];
                            $.each(groups, function(i, group) {
                                groups[i].query.conditions = [];
                                app.$ui.groups[i].options({
                                    request: function(data, callback) {
                                        delete data.keys;
                                        return app.api.find($.extend(data, {
                                            group: group.id,
                                            query: app.Query.toObject(group.id)
                                        }), callback);
                                    }
                                });
                            });
                            app.$ui.list.options({
                                request: function(data, callback) {
                                    return app.api.find($.extend(data, {
                                        query: query = app.Query.toObject()
                                    }), callback);
                                }
                            });
                            location.hash = app.Query.toString(query);
                        })
                    ],
                    id: 'findElement'
                })
                .css({
                    float: 'right',
                    margin: '4px'
                })
        );
}

app.getGroupWidth = function(pos, panelWidth) {
    var width = {};
    width.list = Math.floor(panelWidth / 5) + (panelWidth % 5 > pos);
    width.column = width.list - 40 - ($.browser.mozilla ? 16 : 12);
    return width;
}




/*

    //FIXME: how to properly overwrite functions without replacing them
    var super_launch = app.launch;
    app.launch = function() {
        app.request.send('hello', function(result) {
            app.user = result.data.user;
            if(app.user.group!='guest') {
                app.menu.getItem('status').options('title', 'User: ' + app.user.username);
                app.menu.getItem('login').options('title', 'Logout');
            }
        });
        super_launch();
    };


    var loadingIcon = new Ox.LoadingIcon({
            size: 'medium'
        })
        .css({
            marginLeft: '4px'
        });

    app.menu = new Ox.MainMenu({
                    extras: [
                        new Ox.Input({
                            autocomplete: function(option, value, callback) {
                                    var field = option.substring(6).toLowerCase();
                                    if(typeof(callback) == 'undefined') {
                                        callback = value;
                                        value = null;
                                    }
                                    Ox.debug('app.menu.find.autocomplete: option: ', option, 'value: ', value, ', callback:',callback);
                                    Ox.debug('app.menu.find.autocomplete: field: ', field);
                                    if(field == 'all') {
                                        callback([]);
                                    } else if (value) {
                                        value = value.toLowerCase();
                                        //var order = $.inArray(field, ['year', 'date'])?'-':'';
                                        app.request.send('find', {
                                            query: {
                                                conditions: [
                                                {
                                                    key: field,
                                                    value: value,
                                                    operator: '~'
                                                }
                                                ]
                                            },
                                            list: 'all',
                                            sort: [{key:field, operator: ''}],
                                            keys: [field],
                                            range: [0, 10]
                                        }, function(result) {
                                            var items = $.map(
                                                result.data.items,
                                                function(item, i) { return item.title; }
                                            );
                                            callback(items);
                                        });
                                    }
                            },
                            clear: true,
                            highlight: false,
                            id: 'find',
                            label: [
                                { id: 'all', title: 'Find: All' },
                                { id: 'title', title: 'Find: Title' },
                                { id: 'director', title: 'Find: Director' },
                                { id: 'country', title: 'Find: Country' },
                                { id: 'year', title: 'Find: Year' },
                                { id: 'language', title: 'Find: Language' },
                                { id: 'writer', title: 'Find: Writer' },
                                { id: 'producer', title: 'Find: Producer' },
                                { id: 'cinematographer', title: 'Find: Cinematographer' },
                                { id: 'editor', title: 'Find: Editor' },
                                { id: 'actor', title: 'Find: Actor' },
                                { id: 'character', title: 'Find: Character' },
                                { id: 'name', title: 'Find: Name' },
                                { id: 'genre', title: 'Find: Genre' },
                                { id: 'keyword', title: 'Find: Keyword' },
                                { id: 'summary', title: 'Find: Summary' },
                                { id: 'dialog', title: 'Find: Dialog' }
                            ],
                            labelWidth: 96
                        }).width(320),
                        loadingIcon
                    ],
        menus: [
            {
                id: 'pandoraMM',
                title: site.name,
                items: [
                    { id: 'about', title: 'About ' + site.name },
                    {},
                    { id: 'faq', title: 'Frequently Asked Questions'},
                    { id: 'tos', title: 'Terms of Service'},
                    { id: 'sas', title: 'Security Advisory System'},
                    {},
                    { id: 'contact', title: 'Contact'},
                    {},
                    { id: 'technology', title: 'Technology'},
                    { id: 'source', title: 'Source Code'},
                    { id: 'report', title: 'Report a Bug...'},
                ]
            },
            {
                id: 'user',
                id: 'user',
                title: 'User',
                items: [
                    { id: 'status', title: 'User: not logged in', disabled:true },
                    {},
                    { id: 'accunt', title: 'Account', disabled:true},
                    { id: 'preferences', title: 'Preferences', disabled:true},
                    {},
                    {id: 'login', title: 'Login'},
                ]
            },
            {
                id: 'file',
                title: 'File',
                items: [
                    { id: 'load', keyboard: 'control o', title: 'Open' },
                    { id: 'save', keyboard: 'control a', title: 'Save' },
                    { id: 'save_ad', keyboard: 'shift control s', title: 'Save As...'}
                ]
            },
            {
                id: 'edit',
                title: 'Edit',
                items: [
                    { id: 'undo', keyboard: 'control z', title: 'Undo' },
                    { id: 'redo', keyboard: 'shift control z', title: 'Redo' },
                    {},
                    { id: 'cut', keyboard: 'control x', title: 'Cut' },
                    { id: 'copy', keyboard: 'control c', title: 'Copy' },
                    { id: 'paste', keyboard: 'control v', title: 'Paste'},
                    { id: 'delete', keyboard: 'delete', title: 'Delete'},
                    {},
                    { id: 'select_all', keyboard: 'control a', title: 'Select All' },
                    { id: 'select_none', keyboard: 'shift control a', title: 'Select None' },
                    { id: 'invert_selection', keyboard: 'alt control a', title: 'Invert Selection' },
                ]
            },
            {
                id: 'sort',
                title: 'Sort',
                items: [
                    { id: 'sort_movies', title: 'Sort Movies by', items: [
                        { checked: true, group: 'sort_movies', id: 'title', title: 'Title'},
                        { checked: false, group: 'sort_movies', id: 'director', title: 'Director' },
                    ] },
                    { id: 'order_movies', title: 'Order Movies', items: [
                        { checked: false, group: 'order_movies', id: 'ascending', title: 'Ascending'},
                        { checked: true, group: 'order_movies', id: 'descending', title: 'Descending' },
                    ] }
                ]
            },
            {
                id: 'help',
                title: 'Help',
                items: [
                    { id: 'help', keyboard: 'control h', title: 'Help' }
                ]
            }
        ],
        size: 'large'
    });

    function pageDialog(title, page) {
        //Ox.debug(title, page);
        var $dialog = new Ox.Dialog({
            title: title,
            buttons: [
                {
                    title: 'Close',
                    click: function() { $dialog.close(); }
                }
            ]
        })
        .append(page)
        .open();
    };
    //this should be: mainMenu.bind('click_about', function(event) {
    app.menu.bindEvent('click_about', function() {
        pageDialog('About ' + site.name, site.pages.about);
    });
    app.menu.bindEvent('click_faq', function() {
        pageDialog(app.menu.getItem('faq').options('title')[0],
                   site.pages.faq);
    });
    app.menu.bindEvent('click_tos', function() {
        pageDialog(app.menu.getItem('tos').options('title')[0],
                   site.pages.tos);
    });
    app.menu.bindEvent('click_sas', function() {
        pageDialog(app.menu.getItem('sas').options('title')[0],
                   site.pages.sas);
    });

    OxForm = function(options, self) {
        var self = self || {},
            that = new Ox.Element({}, self)
                .defaults({
                    elements: [],
                })
                .options(options || {})
                .addClass('OxForm'),
            length = self.options.elements.length;
        $.each(self.options.elements, function(i, v) {
            that.append(Ox.Container().css({'margin': '5px'}).append(v));
        });
        that.values = function() {
            var values = {};
            $.each(self.options.elements, function(i, v) {
                values[v.$input.attr('name')] = v.$input.val();
            });
            return values;
        }
        return that;
    };

    app.menu.bindEvent('click_contact', function() {
        var labelWidth = 64;
        var inputWidth = 380;

        var u = new Ox.Input({
            label: 'Your Email',
            labelWidth: labelWidth,
            name:'email',
            size: 'medium'
        }).width(inputWidth).addClass('margin');
        if(app.user && app.user.preferences.email) {
            u.val(app.user.preferences.email);
        }

        var form = new OxForm({
            elements: [
                u,
                new Ox.Input({
                    label: 'Subject',
                    labelWidth: labelWidth,
                    name: 'subject',
                    size: 'medium'
                }).width(inputWidth).addClass('margin'),
                new Ox.Input({
                    label: 'Message',
                    labelWidth: labelWidth,
                    type: 'textarea',
                    size: 'medium',
                    name: 'message'
                }).width(380).height(176).addClass('margin')
            ]
        });

        var $dialog = new Ox.Dialog({
            title: 'Contact',
            width: 424,
            height: 320,
            buttons: [
                {
                    value: 'Cancel',
                    click: function() { $dialog.close(); }
                },
                {
                    value: 'Contact',
                    click: function() {
                        app.request.send('contact', form.values(),
                        function(result) {
                            if(result.status.code == 200) {
                                $dialog.close();                               
                            } else {
                                $dialog.append(result.status.text);
                            }
                        });
                    }
                }
            ]
        })
        .append(form)
        .open();
    });
    app.menu.bindEvent('click_technology', function() {
        pageDialog(app.menu.getItem('technology').options('title')[0],
                   site.pages.technology);
    });
    app.menu.bindEvent('click_source', function() {
        pageDialog(app.menu.getItem('source').options('title')[0],
                   site.pages.source);
    });
    app.menu.bindEvent('click_report', function() {
        pageDialog(app.menu.getItem('report').options('title')[0],
                   site.pages.report);
    });

    app.logout = function () {
        this.request('logout');
        this.user = {};
        this.menu.getItem('logout').toggle();
        this.menu.getItem('status').options('title', 'User: not logged in');
    };
    app.menu.bindEvent('click_logout', function(event, data) {
        app.logout();
    });

    app.menu.bindEvent('click_login', function(element) {
        var labelWidth = 64;
        var inputWidth = labelWidth+200;
        var loginForm = new OxForm({
            elements: [
                new Ox.Input({
                    label: 'Username',
                    labelWidth: labelWidth,
                    name:'username',
                    size: 'medium'
                }).addClass('margin').width(inputWidth),
                new Ox.Input({
                    label: 'Password',
                    labelWidth: labelWidth,
                    name:'password',
                    type: 'password',
                    size: 'medium'
                }).addClass('margin').width(inputWidth)
            ]
        }).css({
            'padding-top': '48px',
        });

        var submit = function() {
            app.request.send('login', loginForm.values(), function(result) {
                if(result.status.code == 200) {
                    $dialog.close();
                    app.user = result.data.user;
                    app.menu.getItem('status').options(title, 'User: ' + app.user.username);
                    app.menu.getItem('login').toggle();
                    
                } else {
                    $dialog.append('Login failed ' + result.status.text);
                }
            });
        }

        var d = new Ox.Container();
        var registerInfo = new Ox.Panel();

        registerInfo.append(Ox.Element().css({'margin-left': '4px'}).append('<br>Forgot your password? <a href="">Recover Password</a><br>Dont have an account? <a href="">Register Now</a>'));

        var panel = Ox.SplitPanel({
            elements: [
                {
                    element: loginForm,
                },
                {
                    element: registerInfo,
                    size: 80
                }
            ],
            orientation: 'vertical'
        }).appendTo(d);

        var $dialog = new Ox.Dialog({
            title: 'Login',
            width: inputWidth+24,
            height: 184,
            buttons: [
                [],[
                    {
                        value: 'Cancel',
                        click: function() { $dialog.close(); }
                    },
                    {
                        value: 'Login',
                        click: submit
                    }
                ]
            ]
        })
        .append(d)
        .open();
    });
    var bottomPanel = Ox.Toolbar({size: 'small'})
        .css({
            zIndex: 2,
            MozBoxShadow: '0 0 4px rgb(0, 0, 0)',
            WebkitBoxShadow: '0 0 4px rgb(0, 0, 0)'
        })
        .append(
            $('<div/>')
                .addClass('bottom')
                .html(site.url + ' - a rather unique kind of movie database.')
        );
    var mainSplitPanel = Ox.SplitPanel({
        elements: [
            {
                element: app.menu,
                size: 24
            },
            {
                element: middleSplitPanel
            },
            {
                element: bottomPanel,
                size: 24
            }
        ],
        orientation: 'vertical'
    }).appendTo($body);

    var listPanel = new Ox.CollapsePanel({
        title: 'Lists'
    }).appendTo(sidePanel);
    listPanel.$content.html('Nouvelle Vague<br/>Hollywood 40\'s<br/>Pirate Cinema Berlin')

    var historyPanel = new Ox.CollapsePanel({
        title: 'Search History'
    }).appendTo(sidePanel);

    historyPanel.$content.html('Paris<br/>Matirx<br/>Godard')

    app.results = new Ox.TextList({
        columns: [ {
                align: 'left',
                id: 'title',
                operator: '+',
                title: 'Title',
                visible: true,
                width: 160
            },
            {
                align: 'left',
                id: 'director',
                operator: '+',
                title: 'Director',
                visible: true,
                width: 160
            },
            {
                align: 'right',
                id: 'year',
                operator: '-',
                title: 'Year',
                visible: true,
                width: 80
            }	
        ],
        request: function(options) {
            app.request.send('find', $.extend(options, {
                query: {
                    conditions: [],
                    operator: ',' // fixme: should be &
                }
            }), options.callback);
        },
        id: 'results',
        sort: [{
            key: 'year',
            operator: '-'
        }]
    }).appendTo(content);

    app.menu.bindEvent('submit_find', function(event, data) {
        app.results.options({
            request: function(options) {
                app.request.send('find', $.extend(options, {
                    query: {
                        key: data.option.substr(6).toLowerCase(),
                        value: data.value,
                        operator: '~'
                    }
                }), options.callback);
            },
        });
    });
    app.launch();

});

*/