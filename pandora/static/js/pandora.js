$(function(){
    app = new Ox.App({
        requestURL: "/api/"
    });
    var size = window.location.hash.substr(1) || "medium",
        $body = $("body"),
        $toolbars = [];

    var sidePanel = new Ox.Panel();
    var mainPanel = new Ox.Panel().css({
        //borderLeft: "1px solid rgb(160, 160, 160)"
    });
    var middleSplitPanel = Ox.SplitPanel({
        elements: [
            {
                element: sidePanel,
                size: 256
            },
            {
                element: mainPanel
            }
        ],
        orientation: "horizontal"
    })/*.css({
        borderTop: "1px solid rgb(160, 160, 160)",
        borderBottom: "1px solid rgb(160, 160, 160)"
    })*/;

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
                                    Ox.print('app.menu.find.autocomplete: option: ', option, 'value: ', value, ', callback:',callback);
                                    Ox.print('app.menu.find.autocomplete: field: ', field);
                                    if(field == 'all') {
                                        callback([]);
                                    } else {
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
                                            sort: field,
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
                            label: ["Find: Title", "Find: All", "Find: Director", "Find: Country", "Find: Cinematographer"],
                            labelWidth: 96
                        }).width(320),
                        loadingIcon
                    ],
        menus: [
            {
                id: "oxdbMM",
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
        Ox.print(title, page);
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
    Ox.Event.bind(app.menu.id, 'click_about', function() {
        pageDialog('About ' + site.name, site.pages.about);
    });
    Ox.Event.bind(app.menu.id, 'click_faq', function() {
        pageDialog(app.menu.getItem('faq').options('title')[0],
                   site.pages.faq);
    });
    Ox.Event.bind(app.menu.id, 'click_tos', function() {
        pageDialog(app.menu.getItem('tos').options('title')[0],
                   site.pages.tos);
    });
    Ox.Event.bind(app.menu.id, 'click_sas', function() {
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

    Ox.Event.bind(app.menu.id, 'click_contact', function() {
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
    Ox.Event.bind(app.menu.id, 'click_technology', function() {
        pageDialog(app.menu.getItem('technology').options('title')[0],
                   site.pages.technology);
    });
    Ox.Event.bind(app.menu.id, 'click_source', function() {
        pageDialog(app.menu.getItem('source').options('title')[0],
                   site.pages.source);
    });
    Ox.Event.bind(app.menu.id, 'click_report', function() {
        pageDialog(app.menu.getItem('report').options('title')[0],
                   site.pages.report);
    });

    app.logout = function () {
        this.request('logout');
        this.user = {};
        this.menu.getItem('logout').toggle();
        this.menu.getItem('status').options('title', "User: not logged in");
    };
    Ox.Event.bind(app.menu.id, 'click_logout', function(event, data) {
        app.logout();
    });
    Ox.Event.bind(app.menu.id, 'click_login', function(element) {
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
                        .css({'background-color': 'red'})
                        .appendTo(mainPanel);

    /*
    tabbar.bind('OxButtonToggle', function(event, data) {
        Ox.print('tabbar selected');
        Ox.print(data.value);
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
    var results = new Ox.List({
        
    }).appendTo(content);

    
    app.launch();
});
