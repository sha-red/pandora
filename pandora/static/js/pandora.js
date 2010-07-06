$(function() {

    //Ox.debug = Ox.print;
    //Ox.print = function() {};

    var $body = $("body"),
        $document = $(document),
        $window = $(window),
        config = {
            archiveId: "oxdb",
            archiveName: "0xDB",
            findKeys: [
                { id: "all", title: "All" },
                { id: "title", title: "Title" },
                { id: "director", title: "Director" },
                { id: "country", title: "Country" },
                { id: "year", title: "Year" },
                { id: "language", title: "Language" },
                { id: "writer", title: "Writer" },
                { id: "producer", title: "Producer" },
                { id: "cinematographer", title: "Cinematographer" },
                { id: "editor", title: "Editor" },
                { id: "actor", title: "Actor" },
                { id: "character", title: "Character" },
                { id: "name", title: "Name" },
                { id: "genre", title: "Genre" },
                { id: "keyword", title: "Keyword" },
                { id: "summary", title: "Summary" },
                { id: "dialog", title: "Dialog" }
            ],
            groups: ["director", "country", "year", "language", "genre"],
            itemViews: [
                { id: "info", title: "Info" },
                { id: "statistics", title: "Statistics" },
                { id: "clips", title: "Clips" },
                { id: "timeline", title: "Timeline" },
                { id: "map", title: "Map" },
                { id: "calendar", title: "Calendar" },
                { id: "files", title: "Files", admin: true }
            ],
            listViews: [
                { id: "list", title: "as List" },
                { id: "icons", title: "as Icons" },
                { id: "info", title: "with Info" },
                { id: "clips", title: "with Clips" },
                { id: "timelines", title: "with Timelines" },
                { id: "maps", title: "with Maps" },
                { id: "calendars", title: "with Calendars" },
                { id: "clip", title: "as Clips" },
                { id: "map", title: "on Map" },
                { id: "calendar", title: "on Calendar" },
            ],
            sortKeys: [
                { id: "title", title: "Title", operator: "", align: "left", width: 180 },
                { id: "director", title: "Director", operator: "", align: "left", width: 180 },
                { id: "country", title: "Country", operator: "", align: "left", width: 120 },
                { id: "year", title: "Year", operator: "-", align: "right", width: 60 },
                { id: "language", title: "Language", operator: "", align: "left", width: 120 },
                { id: "runtime", title: "Runtime", operator: "", align: "right", width: 60 },
                { id: "writer", title: "Writer", operator: "", align: "left", width: 180 },
                { id: "producer", title: "Producer", operator: "", align: "left", width: 180 },
                { id: "cinematographer", title: "Cinematographer", operator: "", align: "left", width: 180 },
                { id: "editor", title: "Editor", operator: "", align: "left", width: 180 },
                { id: "actors", title: "Number of Actors", operator: "-", align: "right", width: 60 },
                { id: "genre", title: "Genre", operator: "", align: "left", width: 120 },
                { id: "keywords", title: "Number of Keywords", operator: "-", align: "right", width: 60 },
                { id: "summary", title: "Words in Summary", operator: "-", align: "right", width: 60 },
                { id: "trivia", title: "Words in Trivia", operator: "-", align: "right", width: 60 },
                { id: "releasedate", title: "Release Date", operator: "-", align: "left", width: 90 },
                { id: "budget", title: "Budget", operator: "-", align: "right", width: 90 },
                { id: "gross", title: "Gross", operator: "-", align: "right", width: 90 },
                { id: "profit", title: "Profit", operator: "-", align: "right", width: 90 },
                { id: "rating", title: "Rating", operator: "-", align: "right", width: 60 },
                { id: "votes", title: "Votes", operator: "-", align: "right", width: 90 },
                { id: "id", title: "ID", operator: "", align: "left", width: 90 },
                { id: "aspectratio", title: "Aspect Ratio", operator: "-", align: "left", width: 90 },
                { id: "duration", title: "Duration", operator: "-", align: "right", width: 90 },
                { id: "color", title: "Color", operator: "", align: "left", width: 90 },
                { id: "saturation", title: "Saturation", operator: "-", align: "right", width: 60 },
                { id: "brightness", title: "Brightness", operator: "-", align: "right", width: 60 },
                { id: "volume", title: "Volume", operator: "-", align: "right", width: 60 },
                { id: "clips", title: "Clips", operator: "-", align: "right", width: 60 },
                { id: "cuts", title: "Cuts", operator: "-", align: "right", width: 60 },
                { id: "cutsperminute", title: "Cuts per Minute", operator: "-", align: "right", width: 60 },
                { id: "words", title: "Words", operator: "-", align: "right", width: 60 },
                { id: "wordsperminute", title: "Words per Minute", operator: "-", align: "right", width: 60 },
                { id: "resolution", title: "Resolution", operator: "-", align: "left", width: 90 },
                { id: "pixels", title: "Pixels", operator: "-", align: "right", width: 90 },
                { id: "size", title: "Size", operator: "-", align: "right", width: 90 },
                { id: "bitrate", title: "Bitrate", operator: "-", align: "right", width: 90 },
                { id: "files", title: "Files", operator: "-", align: "right", width: 60 },
                { id: "filename", title: "Filename", operator: "", align: "left", width: 180 },
                { id: "published", title: "Date Published", operator: "-", align: "left", width: 90 },
                { id: "modified", title: "Date Modified", operator: "-", align: "left", width: 90 }
            ],
            totals: [
                { id: "items" },
                { id: "runtime" },
                { id: "files", admin: true },
                { id: "duration", admin: true },
                { id: "size", admin: true },
                { id: "pixels" }
            ],
            userSettings: {
                group: "guest",
                ui: {
                    columns: ["title", "director", "country", "year", "language", "runtime", "genre"],
                    find: { key: "all", value: "", operator: "" },
                    itemView: "info",
                    listsSize: 192,
                    listView: "list",
                    showGroups: true,
                    showInfo: true,
                    showLists: true,
                    showMovies: true,
                    sort: [
                        { key: "director", operator: "" }
                    ],
                    theme: "modern"
                },
                username: ""
            }
        },
        user = config.userSettings,
        $ui = {
            groups: []
        };

// App

    Ox.theme(user.ui.theme);
    app = new Ox.App({
        requestURL: "/api/"
    });

// MainMenu

    $ui.mainMenu = new Ox.MainMenu({
        extras: [
            $ui.loadingIcon = new Ox.LoadingIcon({
                size: "medium"
            })
        ],
        menus: [
            { id: config.archiveId, title: config.archiveName, items: [
                { id: "about", title: "About" },
                {},
                { id: "home", title: "Home Screen" },
                { id: "faq", title: "Frequently Asked Questions" },
                { id: "tos", title: "Terms of Service" },
                {},
                { id: "contact", title: "Contact" }
            ] },
            { id: "user", title: "User", items: [
                { id: "username", title: "User: not logged in", disabled: true },
                {},
                { id: "preferences", title: "Preferences", disabled: true, keyboard: "control ," },
                {},
                { id: "login", title: "Login" }
            ] },
            { id: "edit", title: "Edit", items: [
                { id: "undo", title: "Undo", disabled: true, keyboard: "control z" },
                { id: "redo", title: "Redo", disabled: true, keyboard: "shift control z" },
                {},
                { id: "cut", title: "Cut", disabled: true, keyboard: "control x" },
                { id: "copy", title: "Copy", disabled: true, keyboard: "control c" },
                { id: "paste", title: "Paste", disabled: true, keyboard: "control v" },
                { id: "delete", title: "Delete", disabled: true, keyboard: "delete" },
                {},
                { id: "selectall", title: "Select All", disabled: true, keyboard: "control a" },
                { id: "selectnone", title: "Select None", disabled: true, keyboard: "shift control a" },
                { id: "invertselection", title: "Invert Selection", disabled: true, keyboard: "alt control a" }
            ] },
            { id: "list", title: "List", items: [
                { id: "history", title: "History", items: [
                    { id: "allmovies", title: "All Movies" }
                ] },
                { id: "lists", title: "View List", items: [
                    { id: "favorites", title: "Favorites" }
                ] },
                { id: "features", title: "View Feature", items: [
                    { id: "situationistfilm", title: "Situationist Film" },
                    { id: "timelines", title: "Timelines" }
                ] },
                {},
                { id: "newlist", title: "New List...", keyboard: "control n" },
                { id: "newlistfromselection", title: "New List from Selection...", disabled: true, keyboard: "shift control n" },
                { id: "newsmartlist", title: "New Smart List...", keyboard: "alt control n" },
                {},
                { id: "addtolist", title: "Add Selected Movie to List...", disabled: true },
                {},
                { id: "setposterframe", title: "Set Poster Frame", disabled: true }
            ]},
            { id: "view", title: "View", items: [
                { id: "movies", title: "View Movies", items: $.map(config.listViews, function(view, i) {
                    return $.extend({
                        checked: user.ui.listView == view.id,
                        group: "viewmovies"
                    }, view);
                }) },
                { id: "icons", title: "Icons", items: [
                    { id: "poster", title: "Poster" },
                    { id: "still", title: "Still" },
                    { id: "timeline", title: "Timeline" }
                ] },
                { id: "info", title: "Info", items: [
                    { id: "poster", title: "Poster" },
                    { id: "video", title: "Video" }
                ] },
                {},
                { id: "movie", title: "Open Movie", items: $.map(config.itemViews, function(view, i) {
                    return view;
                }) },
                {},
                { id: "lists", title: "Hide Lists", keyboard: "shift l" },
                { id: "info", title: "Hide Info", keyboard: "shift i" },
                { id: "groups", title: "Hide Groups", keyboard: "shift g" },
                { id: "movies", title: "Hide Movies", disabled: true, keyboard: "shift m" }
            ]},
            { id: "sort", title: "Sort", items: [
                { id: "sortmovies", title: "Sort Movies by", items: $.map(config.sortKeys, function(key, i) {
                    return $.extend({
                        checked: user.ui.sort[0].key == key,
                        group: "sortmovies"
                    }, key);
                }) },
                { id: "ordermovies", title: "Order Movies", items: [
                    { id: "ascending", title: "Ascending", group: "ordermovies", checked: user.ui.sort[0].operator == "" },
                    { id: "descending", title: "Descending", group: "ordermovies", checked: user.ui.sort[0].operator == "-" }
                ]},
                { id: "advancedsort", title: "Advanced Sort...", keyboard: "shift control s" },
                {},
                { id: "groupsstuff", title: "Groups Stuff" }
            ] },
            { id: "find", title: "Find", items: [
                { id: "find", title: "Find", items: $.map(config.findKeys, function(key, i) {
                    return $.extend({
                        checked: user.ui.find.key == key,
                        group: "find"
                    }, key)
                }) },
                { id: "advancedfind", title: "Advanced Find...", keyboard: "shift control f" }
            ] },
            { id: "code", title: "Code", items: [
                { id: "download", title: "Download" },
                { id: "contribute", title: "Contribute" },
                { id: "report", title: "Report a Bug" },
            ] },
            { id: "help", title: "Help", items: [
                { id: "help", title: config.archiveName + " Help", keyboard: "shift ?" }
            ] },
            { id: "debug", title: "Debug", items: [
                { id: "query", title: "Show Query" }
            ]}
        ]
    });

// Toolbar

    $ui.toolbar = new Ox.Bar({
            size: 24
        })
        .append(
            $ui.groupsButton = new Ox.Button({
                    id: "groupsButton",
                    value: ["Show Groups", "Hide Groups"]
                })
                .css({
                    float: "left",
                    margin: "4px"
                })
                .width(80)
        )
        .append(
            $ui.viewSelect = new Ox.Select({
                    id: "viewSelect",
                    items: $.map(config.listViews, function(view, i) {
                        view.title = "View " + view.title
                        return $.extend({
                            checked: user.ui.listView == view.id,
                        }, view);
                    })
                })
                .css({
                    float: "left",
                    margin: "4px"
                })
                .width(120)
        )
        .append(
            $ui.findInput = new Ox.Input({
                    autocomplete: function(key, value, callback) {
                        Ox.print("autocomplete", key, value);
                        value === "" && Ox.print("Warning: autocomplete function should never be called with empty value");
                        if (key == "all") {
                            callback();
                        } else {
                            app.request("find", {
                                keys: [key],
                                query: {
                                    conditions: [
                                        {
                                            key: key,
                                            value: value,
                                            operator: ""
                                        }
                                    ],
                                    operator: ""
                                },
                                sort: [
                                    {
                                        key: key,
                                        operator: ""
                                    }
                                ],
                                range: [0, 10]
                            }, function(result) {
                                callback($.map(result.data.items, function(v) {
                                    return v.title;
                                }));
                            });
                        }
                    },
                    clear: true,
                    highlight: true,
                    id: "findInput",
                    label: $.map(config.findKeys, function(key, i) {
                        return {
                            id: key.id,
                            title: "Find: " + key.title
                        }
                    }),
                    labelWidth: 85
                })
                .css({
                    float: "right",
                    margin: "4px"
                })
                .width(300)
        );

// Groups

    var rightPanelWidth = $document.width() - user.ui.listsSize - 1,
        groups = $.map(config.groups, function(id, i) {
            var size = rightPanelWidth / 5 + (rightPanelWidth % 5 > i),
                title = Ox.getObjectById(config.sortKeys, id).title;
            return {
                id: id,
                conditions: [],
                element: new Ox.TextList({
                    columns: [
                        {
                            align: "left",
                            id: "name",
                            operator: id == "year" ? "-" : "+",
                            title: title,
                            unique: true,
                            visible: true,
                            width: size - 40 - ($.browser.mozilla ? 16 : 12)
                        },
                        {
                            align: "right",
                            id: "items",
                            operator: "-",
                            title: "#",
                            visible: true,
                            width: 40
                        }
                    ],
                    id: "group_" + id,
                    request: function(options) {
                        delete options.keys;
                        app.request("find", $.extend(options, {
                            group: id,
                            query: constructQuery()
                        }), options.callback);
                    },
                    sort: [
                        {
                            key: id == "year" ? "name" : "items",
                            operator: "-"
                        }
                    ]
                }),
                size: size,
                title: title
            };
        });

// Statusbar

$ui.statusbar = new Ox.Bar({
        size: 16
    })
    .css({
        textAlign: "center"
    })
    .append(
        new Ox.Element()
            .css({
                marginTop: "2px",
                fontSize: "9px"
            })
            .append(
                $ui.total = new Ox.Element("span")
            )
            .append(
                new Ox.Element("span").html(" &mdash; ")
            )
            .append(
                $ui.selected = new Ox.Element("span")
            )
    );

// Interface

    $ui.app = new Ox.SplitPanel({
        elements: [
            {
                element: $ui.mainMenu,
                size: 20
            },
            {
                element: $ui.mainPanel = new Ox.SplitPanel({
                    elements: [
                        {
                            collapsible: true,
                            element: $ui.leftPanel = new Ox.SplitPanel({
                                elements: [
                                    {
                                        element: $ui.lists = new Ox.Element({
                                            id: "listsPanel"
                                        })
                                    },
                                    {
                                        collapsible: true,
                                        element: $ui.info = new Ox.Element({
                                            id: "infoPanel"
                                        }),
                                        size: 144
                                    }
                                ],
                                id: "leftPanel",
                                orientation: "vertical"
                            }),
                            size: user.ui.listsSize,
                            resizable: true,
                            resize: [128, 192, 256]
                        },
                        {
                            element: $ui.rightPanel = new Ox.SplitPanel({
                                elements: [
                                    {
                                        element: $ui.toolbar,
                                        size: 24
                                    },
                                    {
                                        element: $ui.contentPanel = new Ox.SplitPanel({
                                            elements: [
                                                {
                                                    element: $ui.groupsOuterPanel = new Ox.SplitPanel({
                                                        elements: [
                                                            {
                                                                element: $ui.groups[0] = groups[0].element,
                                                                size: groups[0].size
                                                            },
                                                            {
                                                                element: $ui.groupsInnerPanel = new Ox.SplitPanel({
                                                                    elements: [
                                                                        {
                                                                            element: $ui.groups[1] = groups[1].element,
                                                                            size: groups[1].size
                                                                        },
                                                                        {
                                                                            element: $ui.groups[2] = groups[2].element,
                                                                            size: groups[2].size
                                                                        },
                                                                        {
                                                                            element: $ui.groups[3] = groups[3].element,
                                                                            size: groups[3].size
                                                                        }
                                                                    ],
                                                                    orientation: "horizontal"
                                                                })
                                                            },
                                                            {
                                                                element: $ui.groups[4] = groups[4].element,
                                                                size: groups[4].size
                                                            },
                                                        ],
                                                        orientation: "horizontal"
                                                    }),
                                                    size: 128
                                                },
                                                {
                                                    element: $ui.list = constructList(user.ui.listView)
                                                }
                                            ],
                                            orientation: "vertical"
                                        })
                                    },
                                    {
                                        element: $ui.statusbar,
                                        size: 16
                                    }
                                ],
                                id: "rightPanel",
                                orientation: "vertical"
                            }),
                        }
                    ],
                    orientation: "horizontal"
                })
            }
        ],
        orientation: "vertical"
    }).appendTo($body);

// Events

    Ox.Request.requests() && $ui.loadingIcon.start();
    Ox.Event.bind("requestStart", function() {
        Ox.print("requestStart")
        $ui.loadingIcon.start();
    });
    Ox.Event.bind("requestStop", function() {
        Ox.print("requestStop")
        $ui.loadingIcon.stop();
    });

    Ox.Event.bind("change_viewSelect", function(event, data) {
        $ui.list.replaceWith(constructList(data.id));
    });

    Ox.Event.bind("submit_findInput", function(event, data) {
        findCondition = {
            key: data.key == "all" ? "" : data.key,
            value: data.value,
            operator: ""
        };
        $.each(groups, function(i, group) {
            groups[i].conditions = [];
            $ui.groups[i].options({
                request: function(options) {
                    delete options.keys;
                    return app.request("find", $.extend(options, {
                        group: group.id,
                        query: constructQuery(group.id)
                    }), options.callback);
                }
            });
        });
        $ui.list.options({
            request: function(options) {
                return app.request("find", $.extend(options, {
                    query: constructQuery()
                }), options.callback);
            }
        })
    });

    $.each(groups, function(i, group) {
        Ox.Event.bind("select_group_" + group.id, function(event, data) {
            $ui.list.options({
                request: function(options) {
                    groups[i].conditions = $.map(data.ids, function(v) {
                        return {
                            key: group.id,
                            value: v,
                            operator: "="
                        };
                    });
                    return app.request("find", $.extend(options, {
                        query: constructQuery()
                    }), options.callback);
                }
            });
            $.each(groups, function(i_, group_) {
                if (i_ != i) {
                    $ui.groups[i_].options({
                        request: function(options) {
                            delete options.keys;
                            return app.request("find", $.extend(options, {
                                group: group_.id,
                                query: constructQuery(group_.id)
                            }), options.callback);
                        }
                    });
                }
            });
        });
    });
    Ox.Event.bind("change_sort_movies", function(event, data) {

    });
    Ox.Event.bind("load_list", function(event, data) {
        $ui.total.html(constructStatus("total", data));
        data = [];
        $.each(config.totals, function(i, v) {
            data[v.id] = 0;
        });
        $ui.selected.html(constructStatus("selected", data));
    });
    Ox.Event.bind("sort_list", function(event, data) {
        
    });
    Ox.Event.bind("select_list", function(event, data) {
        app.request("find", {
            query: {
                conditions: $.map(data.ids, function(id, i) {
                    return {
                        key: "id",
                        value: id,
                        operator: "="
                    }
                }),
                operator: "|"
            }
        }, function(result) {
            $ui.selected.html(constructStatus("selected", result.data));
        });
    });
    Ox.Event.bind("click_show_query", function(event, data) {
        var query = constructQuery(),
            html = "Conditions<br/><br/>" + $.map(query.conditions, function(v) {
                return v.key + " " + v.operator + " " + v.value;
            }).join("<br/>") + "<br/><br/>Operator: " + query.operator,
            $dialog = new Ox.Dialog({
                title: "Show Query",
                buttons: [
                    {
                        value: "Close",
                        click: function() {
                            $dialog.close();
                        }
                    }
                ]
            })
            .append(html)
            .open();
    });

// Functions

    function constructList(view) {
        var $list;
        if (view == "list") {
            $list = new Ox.TextList({
                columns: $.map(config.sortKeys, function(key, i) {
                    return $.extend({
                        visible: $.inArray(key.id, user.ui.columns) > -1,
                        unique: key.id == "id"
                    }, key);
                }),
                id: "list",
                request: function(options) {
                    app.request("find", $.extend(options, {
                        query: constructQuery()
                    }), options.callback);
                },
                sort: user.ui.sort
            });
        } else if (view == "icons") {
            $list = new Ox.IconList({
                id: "list",
                item: function(data, sort, size) {
                    return {
                        height: data.posterHeight,
                        id: data["id"],
                        info: data[$.inArray(sort[0].key, ["title", "director"]) > -1 ? "year" : sort[0].key],
                        title: data.title + (data.director ? " (" + data.director + ")" : ""),
                        url: "http://0xdb.org/" + data.id + "/poster." + size + "." + "jpg",
                        width: data.posterWidth
                    };
                },
                keys: ["director", "id", "posterHeight", "posterWidth", "posterURL", "title"],
                request: function(options) {
                    app.request("find", $.extend(options, {
                        query: constructQuery()
                    }), options.callback);
                },
                size: 128,
                sort: [
                    {
                        key: "director",
                        operator: "+"
                    }
                ],
                unique: "id"
            });
        }
        return $list;
    }

    function constructQuery(groupId) {
        var conditions = $.merge(!Ox.isUndefined(user.ui.find.key) ? [user.ui.find] : [], groups ? $.map(groups, function(v, i) {
            if (v.id != groupId) {
                return v.conditions;
            }
        }) : []);
        return {
            conditions: conditions,
            operator: conditions.length ? "," : ""
        };
    }

    function constructStatus(key, data) {
        return Ox.toTitleCase(key) + ": " + [
            Ox.formatNumber(data.items) + " movie" + (data.items != 1 ? "s" : ""),
            Ox.formatDuration(data.runtime, "medium"),
            data.files + " file" + (data.files != 1 ? "s" : ""),
            Ox.formatDuration(data.duration, "short"),
            Ox.formatValue(data.size, "B"),
            Ox.formatValue(data.pixels, "px")
        ].join(", ");
    }



    //FIXME: how to properly overwrite functions without replacing them
    var super_launch = app.launch;
    app.launch = function() {
        app.request('hello', function(result) {
            app.user = result.data.user;
            if(app.user.group!='guest') {
                app.menu.getItem('status').options('title', "User: " + app.user.username);
                app.menu.getItem('login').options('title', 'Logout');
            }
        });
        super_launch();
    };

    return;




    var loadingIcon = new Ox.LoadingIcon({
            size: "medium"
        })
        .css({
            marginLeft: "4px"
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
                                        app.request('find', {
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
                            id: "find",
                            label: [
                                { id: "all", title: "Find: All" },
                                { id: "title", title: "Find: Title" },
                                { id: "director", title: "Find: Director" },
                                { id: "country", title: "Find: Country" },
                                { id: "year", title: "Find: Year" },
                                { id: "language", title: "Find: Language" },
                                { id: "writer", title: "Find: Writer" },
                                { id: "producer", title: "Find: Producer" },
                                { id: "cinematographer", title: "Find: Cinematographer" },
                                { id: "editor", title: "Find: Editor" },
                                { id: "actor", title: "Find: Actor" },
                                { id: "character", title: "Find: Character" },
                                { id: "name", title: "Find: Name" },
                                { id: "genre", title: "Find: Genre" },
                                { id: "keyword", title: "Find: Keyword" },
                                { id: "summary", title: "Find: Summary" },
                                { id: "dialog", title: "Find: Dialog" }
                            ],
                            labelWidth: 96
                        }).width(320),
                        loadingIcon
                    ],
        menus: [
            {
                id: "pandoraMM",
                title: site.name,
                items: [
                    { id: "about", title: "About " + site.name },
                    {},
                    { id: "faq", title: "Frequently Asked Questions"},
                    { id: "tos", title: "Terms of Service"},
                    { id: "sas", title: "Security Advisory System"},
                    {},
                    { id: "contact", title: "Contact"},
                    {},
                    { id: "technology", title: "Technology"},
                    { id: "source", title: "Source Code"},
                    { id: "report", title: "Report a Bug..."},
                ]
            },
            {
                id: "user",
                id: "user",
                title: "User",
                items: [
                    { id: "status", title: "User: not logged in", disabled:true },
                    {},
                    { id: "accunt", title: "Account", disabled:true},
                    { id: "preferences", title: "Preferences", disabled:true},
                    {},
                    {id: "login", title: "Login"},
                ]
            },
            {
                id: "file",
                title: "File",
                items: [
                    { id: "load", keyboard: "control o", title: "Open" },
                    { id: "save", keyboard: "control a", title: "Save" },
                    { id: "save_ad", keyboard: "shift control s", title: "Save As..."}
                ]
            },
            {
                id: "edit",
                title: "Edit",
                items: [
                    { id: "undo", keyboard: "control z", title: "Undo" },
                    { id: "redo", keyboard: "shift control z", title: "Redo" },
                    {},
                    { id: "cut", keyboard: "control x", title: "Cut" },
                    { id: "copy", keyboard: "control c", title: "Copy" },
                    { id: "paste", keyboard: "control v", title: "Paste"},
                    { id: "delete", keyboard: "delete", title: "Delete"},
                    {},
                    { id: "select_all", keyboard: "control a", title: "Select All" },
                    { id: "select_none", keyboard: "shift control a", title: "Select None" },
                    { id: "invert_selection", keyboard: "alt control a", title: "Invert Selection" },
                ]
            },
            {
                id: "sort",
                title: "Sort",
                items: [
                    { id: "sort_movies", title: "Sort Movies by", items: [
                        { checked: true, group: "sort_movies", id: "title", title: "Title"},
                        { checked: false, group: "sort_movies", id: "director", title: "Director" },
                    ] },
                    { id: "order_movies", title: "Order Movies", items: [
                        { checked: false, group: "order_movies", id: "ascending", title: "Ascending"},
                        { checked: true, group: "order_movies", id: "descending", title: "Descending" },
                    ] }
                ]
            },
            {
                id: "help",
                title: "Help",
                items: [
                    { id: "help", keyboard: "control h", title: "Help" }
                ]
            }
        ],
        size: "large"
    });

    var pageDialog = function(title, page) {
        Ox.debug(title, page);
        var $dialog = new Ox.Dialog({
            title: title,
            buttons: [
                {
                    value: "Ok",
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
                .addClass("OxForm"),
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
            label: "Your Email",
            labelWidth: labelWidth,
            name:'email',
            size: 'medium'
        }).width(inputWidth).addClass("margin");
        if(app.user && app.user.preferences.email) {
            u.val(app.user.preferences.email);
        }

        var form = new OxForm({
            elements: [
                u,
                new Ox.Input({
                    label: "Subject",
                    labelWidth: labelWidth,
                    name: "subject",
                    size: "medium"
                }).width(inputWidth).addClass("margin"),
                new Ox.Input({
                    label: "Message",
                    labelWidth: labelWidth,
                    type: "textarea",
                    size: "medium",
                    name: "message"
                }).width(380).height(176).addClass("margin")
            ]
        });

        var $dialog = new Ox.Dialog({
            title: "Contact",
            width: 424,
            height: 320,
            buttons: [
                {
                    value: "Cancel",
                    click: function() { $dialog.close(); }
                },
                {
                    value: "Contact",
                    click: function() {
                        app.request('contact', form.values(),
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
        this.menu.getItem('status').options('title', "User: not logged in");
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
                    label: "Username",
                    labelWidth: labelWidth,
                    name:'username',
                    size: 'medium'
                }).addClass("margin").width(inputWidth),
                new Ox.Input({
                    label: 'Password',
                    labelWidth: labelWidth,
                    name:'password',
                    type: 'password',
                    size: 'medium'
                }).addClass("margin").width(inputWidth)
            ]
        }).css({
            'padding-top': '48px',
        });

        var submit = function() {
            app.request('login', loginForm.values(), function(result) {
                if(result.status.code == 200) {
                    $dialog.close();
                    app.user = result.data.user;
                    app.menu.getItem('status').options(title, "User: " + app.user.username);
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
            orientation: "vertical"
        }).appendTo(d);

        var $dialog = new Ox.Dialog({
            title: "Login",
            width: inputWidth+24,
            height: 184,
            buttons: [
                [],[
                    {
                        value: "Cancel",
                        click: function() { $dialog.close(); }
                    },
                    {
                        value: "Login",
                        click: submit
                    }
                ]
            ]
        })
        .append(d)
        .open();
    });
    var bottomPanel = Ox.Toolbar({size: "small"})
        .css({
            zIndex: 2,
            MozBoxShadow: "0 0 4px rgb(0, 0, 0)",
            WebkitBoxShadow: "0 0 4px rgb(0, 0, 0)"
        })
        .append(
            $("<div/>")
                .addClass("bottom")
                .html(site.url + " - a rather unique kind of movie database.")
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
        orientation: "vertical"
    }).appendTo($body);

    var listPanel = new Ox.CollapsePanel({
        title: "Lists"
    }).appendTo(sidePanel);
    listPanel.$content.html("Nouvelle Vague<br/>Hollywood 40's<br/>Pirate Cinema Berlin")

    var historyPanel = new Ox.CollapsePanel({
        title: "Search History"
    }).appendTo(sidePanel);

    historyPanel.$content.html("Paris<br/>Matirx<br/>Godard")

    /*
    var tabbar = new Ox.Tabbar({
        values: ["Info", "Scenes", "Timeline", "Map", "Admin"],
        selected: 0,
    }).appendTo(mainPanel)
    */
    var content = new Ox.Container()
                        .appendTo(mainPanel);

    /*
    tabbar.bind('OxButtonToggle', function(event, data) {
        Ox.debug('tabbar selected');
        Ox.debug(data.value);
        if(data.value=='Info') {
            content.html('this is for testing purposes only, lets get down to it...');
        } else if(data.value=='Scenes') {
            content.html('what a wonderfull scene');
        } else if(data.value=='Timeline') {
            content.html('here we will see a timeline');
        } else if(data.value=='Map') {
            content.html('Here be a map of dragons');
        } else if(data.value=='Admin') {
            content.html('Here be admin');
        }
    });
    */
    app.results = new Ox.TextList({
        columns: [ {
                align: "left",
                id: "title",
                operator: "+",
                title: "Title",
                visible: true,
                width: 160
            },
            {
                align: "left",
                id: "director",
                operator: "+",
                title: "Director",
                visible: true,
                width: 160
            },
            {
                align: "right",
                id: "year",
                operator: "-",
                title: "Year",
                visible: true,
                width: 80
            }	
        ],
        request: function(options) {
            app.request("find", $.extend(options, {
                query: {
                    conditions: [],
                    operator: "&"
                }
            }), options.callback);
        },
        id: "results",
        sort: [{
            key: "year",
            operator: "-"
        }]
    }).appendTo(content);

    app.menu.bindEvent('submit_find', function(event, data) {
        app.results.options({
            request: function(options) {
                app.request("find", $.extend(options, {
                    query: {
                        key: data.option.substr(6).toLowerCase(),
                        value: data.value,
                        operator: "~"
                    }
                }), options.callback);
            },
        });
    });
    app.launch();
});

