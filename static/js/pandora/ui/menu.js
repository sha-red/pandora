// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.mainMenu = function() {
    var isGuest = app.user.level == 'guest',
        that = new Ox.MainMenu({
            extras: [
                $('<div>').html('beta').css({marginRight: '8px', color: 'rgb(128, 128, 128)'}),
                app.$ui.loadingIcon = new Ox.LoadingIcon({
                    size: 'medium'
                })
            ],
            id: 'mainMenu',
            menus: [
                { id: app.site.site.id + 'Menu', title: app.site.site.name, items: [
                    { id: 'home', title: 'Home' },
                    {},
                    { id: 'about', title: 'About ' + app.site.site.name },
                    { id: 'news', title: app.site.site.name + ' News' },
                    { id: 'tour', title: 'Take a Tour' },
                    { id: 'faq', title: 'Frequently Asked Questions' },
                    { id: 'terms', title: 'Terms of Service' },
                    {},
                    { id: 'software', title: 'Software', items: [
                        { id: 'about', title: 'About' },
                        { id: 'download', title: 'Download' },
                        { id: 'report', title: 'Report a Bug' }
                    ] },
                    {},
                    { id: 'contact', title: 'Contact ' + app.site.site.name }
                ] },
                { id: 'userMenu', title: 'User', items: [
                    { id: 'username', title: 'User: ' + (isGuest ? 'not logged in' : app.user.username), disabled: true },
                    {},
                    { id: 'preferences', title: 'Preferences...', disabled: isGuest, keyboard: 'control ,' },
                    {},
                    { id: 'register', title: 'Register...', disabled: !isGuest },
                    { id: 'loginlogout', title: isGuest ? 'Login...' : 'Logout...' }
                ] },
                { id: 'listMenu', title: 'List', items: [
                    { id: 'history', title: 'History', items: [
                        { id: 'allmovies', title: 'All ' + app.site.itemName.plural }
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
                    { id: 'addmovietolist', title: ['Add Selected ' + app.site.itemName.singular + ' to List...', 'Add Selected ' + app.site.itemName.plural + ' to List...'], disabled: true },
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
                    { id: 'movies', title: 'View ' + app.site.itemName.plural, items: [
                        { group: 'viewmovies', min: 0, max: 1, items: $.map(app.site.listViews, function(view, i) {
                            return $.extend({
                                checked: app.user.ui.lists[app.user.ui.list].listView == view.id,
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
                    { id: 'openmovie', title: ['Open ' + app.site.itemName.singular, 'Open ' + app.site.itemName.plural], disabled: true, items: [
                        { group: 'movieview', min: 0, max: 1, items: $.map(app.site.itemViews, function(view, i) {
                            return $.extend({
                                checked: app.user.ui.itemView == view.id,
                            }, view);
                        }) },
                    ]},
                    {},
                    { id: 'lists', title: 'Hide Lists', keyboard: 'shift l' },
                    { id: 'info', title: 'Hide Info', keyboard: 'shift i' },
                    { id: 'groups', title: 'Hide Groups', keyboard: 'shift g' },
                    { id: 'movies', title: 'Hide ' + app.site.itemName.plural, disabled: true, keyboard: 'shift m' }
                ]},
                { id: 'sortMenu', title: 'Sort', items: [
                    { id: 'sortmovies', title: 'Sort ' + app.site.itemName.plural + ' by', items: [
                        { group: 'sortmovies', min: 1, max: 1, items: $.map(app.ui.sortKeys, function(key, i) {
                            return $.extend({
                                checked: app.user.ui.lists[app.user.ui.list].sort[0].key == key.id,
                            }, key);
                        }) }
                    ] },
                    { id: 'ordermovies', title: 'Order ' + app.site.itemName.plural, items: [
                        { group: 'ordermovies', min: 1, max: 1, items: [
                            { id: 'ascending', title: 'Ascending', checked: app.user.ui.lists[app.user.ui.list].sort[0].operator === '' },
                            { id: 'descending', title: 'Descending', checked: app.user.ui.lists[app.user.ui.list].sort[0].operator == '-' }
                        ]}
                    ] },
                    { id: 'advancedsort', title: 'Advanced Sort...', keyboard: 'shift control s' },
                    {},
                    { id: 'groupsstuff', title: 'Groups Stuff' }
                ] },
                { id: 'findMenu', title: 'Find', items: [
                    { id: 'find', title: 'Find', items: [
                        { group: 'find', min: 1, max: 1, items: $.map(app.ui.findKeys, function(key, i) {
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
                    { id: 'help', title: app.site.site.name + ' Help', keyboard: 'shift ?' }
                ] },
                { id: 'debugMenu', title: 'Debug', items: [
                    { id: 'query', title: 'Show pandora.Query' },
                    { id: 'resetui', title: 'Reset UI Settings'}
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
                } else if (data.id == 'movieview') {
                    var view = data.checked[0].id;
                    var id = document.location.pathname.split('/')[1];
                    if (view == 'info')
                        url(id + '/info');
                    else
                        url(id);
                } else if (data.id == 'ordermovies') {
                    var id = data.checked[0].id;
                    app.$ui.list.sortList(app.user.ui.lists[app.user.ui.list].sort[0].key, id == 'ascending' ? '' : '-');
                } else if (data.id == 'sortmovies') {
                    var id = data.checked[0].id,
                        operator = pandora.getSortOperator(id);
                    app.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + (operator === '' ? 'ascending' : 'descending'));
                    app.$ui.sortSelect.selectItem(id);
                    app.$ui.list.sortList(id, operator);
                    pandora.URL.set(pandora.Query.toString());
                } else if (data.id == 'viewmovies') {
                    var view = data.checked[0].id;
                    url('#view=' + view);
                }
            },
            click: function(event, data) {
                if (data.id == 'about') {
                    var $dialog = new Ox.Dialog({
                        buttons: [
                            new Ox.Button({
                                id: 'close',
                                title: 'Close'
                            }).bindEvent({
                                click: function() {
                                    $dialog.close();
                                }
                            })
                        ],
                        id: 'about',
                        title: 'About'
                    }).open();
                } else if (data.id == 'home') {
                    var $screen = $('<div>')
                            .attr({id: 'screen'})
                            .css({
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                background: 'rgb(32, 32, 32)',
                                opacity: 0,
                                zIndex: 1000
                            })
                            .appendTo(Ox.UI.$body),
                        $logo = $('<img>')
                            .attr({
                                src: '/static/png/logo256.png'
                            })
                            .css({
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                right: 0,
                                bottom: '160px',
                                width: window.innerWidth + 'px',
                                margin: 'auto'
                            })
                            .bind({
                                click: function() {
                                    $screen.find('div').add('#screen > input').remove();
                                    $logo.animate({
                                        width: window.innerWidth + 'px'
                                    }, 500)
                                    $screen.animate({opacity: 0}, 500, function() {
                                        $screen.remove();
                                    });
                                }
                            })
                            .appendTo($screen),
                        $input = Ox.Input({
                                width: 156
                            })
                            .css({
                                position: 'absolute',
                                left: 0,
                                top: '48px',
                                right: '164px',
                                bottom: 0,
                                margin: 'auto',
                                opacity: 0
                            })
                            .click(function(e) {
                                e.stopPropagation();
                            })
                            .appendTo($screen)
                            .focusInput(),
                        $findButton = Ox.Button({
                                title: 'Find',
                                width: 74
                            })
                            .css({
                                position: 'absolute',
                                left: '82px',
                                top: '48px',
                                right: 0,
                                bottom: 0,
                                margin: 'auto',
                                opacity: 0
                            })
                            .appendTo($screen),
                        $browseButton = Ox.Button({
                                title: 'Browse',
                                width: 74
                            })
                            .css({
                                position: 'absolute',
                                left: '246px',
                                top: '48px',
                                right: 0,
                                bottom: 0,
                                margin: 'auto',
                                opacity: 0
                            })
                            .appendTo($screen),
                        $signupButton = Ox.Button({
                                title: 'Sign Up',
                                width: 74
                            })
                            .css({
                                position: 'absolute',
                                left: 0,
                                top: '112px',
                                right: '246px',
                                bottom: 0,
                                margin: 'auto',
                                opacity: 0
                            })
                            .appendTo($screen),
                        $signinButton = Ox.Button({
                                title: 'Sign In',
                                width: 74
                            })
                            .css({
                                position: 'absolute',
                                left: 0,
                                top: '112px',
                                right: '82px',
                                bottom: 0,
                                margin: 'auto',
                                opacity: 0
                            })
                            .appendTo($screen),
                        $aboutButton = Ox.Button({
                                title: 'About ' + pandora.app.site.site.name,
                                width: 156
                            })
                            .css({
                                position: 'absolute',
                                left: '164px',
                                top: '112px',
                                right: 0,
                                bottom: 0,
                                margin: 'auto',
                                opacity: 0
                            })
                            .appendTo($screen),
                        $text = $('<div>')
                            .html('A Movie Database. \u2620 2007-2011 0x2620. All Open Source.')
                            .css({
                                position: 'absolute',
                                left: 0,
                                top: '176px',
                                right: 0,
                                bottom: 0,
                                width: '360px',
                                height: '16px',
                                margin: 'auto',
                                opacity: 0,
                                textAlign: 'center'                               
                            })
                            .appendTo($screen)
                    $screen.animate({opacity: 1}, 500, function() {
                        $screen.find('div').add('#screen > input').animate({opacity: 1}, 250)
                    });
                    $logo.animate({width: '320px'}, 500);
                        
                    /*
                    var $dialog = new Ox.Dialog({
                        buttons: [
                            new Ox.Button({
                                id: 'close',
                                title: 'Close'
                            }).bindEvent({
                                click: function() {
                                    $dialog.close();
                                }
                            })
                        ],
                        height: 498,
                        id: 'home',
                        keys: {enter: 'close', escape: 'close'},
                        title: app.site.site.name,
                        width: 800
                    }).open();
                    */
                } else if (data.id == 'register') {
                    app.$ui.accountDialog = pandora.ui.accountDialog('register').open();
                } else if (data.id == 'loginlogout') {
                    app.$ui.accountDialog = (app.user.level == 'guest' ?
                        pandora.ui.accountDialog('login') : pandora.ui.accountLogoutDialog()).open();
                } else if (data.id == 'places') {
                    app.$ui.placesDialog = pandora.ui.placesDialog().open();
                    /*
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
                                                                width: 234
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
                                                        width: 246
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
                                    size: 256
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
                                                    .bindEvent({
                                                        submit: function(event, data) {
                                                            app.$ui.map.find(data.value, function(location) {
                                                                
                                                                app.$ui.placeNameInput.options({
                                                                    disabled: false,
                                                                    value: location.name
                                                                });
                                                                app.$ui.placeAliasesInput.options({
                                                                    disabled: false
                                                                });
                                                                app.$ui.placeGeonameLabel.options({
                                                                    disabled: false,
                                                                    title: location.names.join(', ')
                                                                });
                                                                app.$ui.removePlaceButton.options({
                                                                    disabled: false
                                                                });
                                                                app.$ui.addPlaceButton.options({
                                                                    disabled: false
                                                                });

                                                            });
                                                        }
                                                    })
                                                ),
                                                size: 24
                                            },
                                            {
                                                element: app.$ui.map = new Ox.Map({
                                                        places: ['Boston', 'Brussels', 'Barcelona', 'Berlin', 'Beirut', 'Bombay', 'Bangalore', 'Beijing']
                                                    })
                                                    .css({
                                                        left: 0,
                                                        top: 0,
                                                        right: 0,
                                                        bottom: 0
                                                    })
                                                    .bindEvent({
                                                        select: function(event, location) {
                                                            app.$ui.placeNameInput.options({
                                                                disabled: false,
                                                                value: location.name
                                                            });
                                                            app.$ui.placeAliasesInput.options({
                                                                disabled: false
                                                            });
                                                            app.$ui.placeGeonameLabel.options({
                                                                disabled: false,
                                                                title: location.names.join(', ')
                                                            });
                                                            app.$ui.removePlaceButton.options({
                                                                disabled: false
                                                            });
                                                            app.$ui.addPlaceButton.options({
                                                                disabled: false
                                                            });
                                                        }
                                                    })
                                            },
                                            {
                                                element: app.$ui.bottomBar = new Ox.Toolbar({
                                                    orientation: 'horizontal',
                                                    size: 24
                                                })
                                                .append(
                                                    app.$ui.placeNameInput = new Ox.Input({
                                                        disabled: true,
                                                        id: 'placeName',
                                                        placeholder: 'Name',
                                                        width: 128
                                                    })
                                                    .css({
                                                        float: 'left',
                                                        margin: '4px 0 0 4px'
                                                    })
                                                )
                                                .append(
                                                    app.$ui.placeAliasesInput = new Ox.Input({
                                                        disabled: true,
                                                        id: 'aliases',
                                                        placeholder: 'Aliases',
                                                        width: 128
                                                    })
                                                    .css({
                                                        float: 'left',
                                                        margin: '4px 0 0 4px'
                                                    })
                                                )
                                                .append(
                                                    app.$ui.placeGeonameLabel = new Ox.Label({
                                                        disabled: true,
                                                        id: 'placeGeoname',
                                                        title: 'Geoname',
                                                        width: parseInt(app.$ui.document.width() * 0.8) - 256 - 256 - 32 - 24
                                                    })
                                                    .css({
                                                        float: 'left',
                                                        margin: '4px 0 0 4px'
                                                    })
                                                )
                                                .append(
                                                    app.$ui.addPlaceButton = new Ox.Button({
                                                        disabled: true,
                                                        id: 'addPlaceButton',
                                                        title: 'add',
                                                        type: 'image'
                                                    })
                                                    .css({
                                                        float: 'right',
                                                        margin: '4px 4px 0 0'
                                                    })
                                                )
                                                .append(
                                                    app.$ui.removePlaceButton = new Ox.Button({
                                                        disabled: true,
                                                        id: 'removePlaceButton',
                                                        title: 'remove',
                                                        type: 'image'
                                                    })
                                                    .css({
                                                        float: 'right',
                                                        margin: '4px 4px 0 0'
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
                            height: parseInt(app.$ui.document.height() * 0.8),
                            id: 'places',
                            minHeight: 400,
                            minWidth: 600,
                            padding: 0,
                            title: 'Manage Places',
                            width: parseInt(app.$ui.document.width() * 0.8)
                        }).css({
                            overflow: 'hidden'
                        }).append($manage).open();
                    */
                } else if (data.id == 'query') {
                    var $dialog = new Ox.Dialog({
                        buttons: [
                            new Ox.Button({
                                id: 'close',
                                title: 'Close'
                            }).bindEvent({
                                click: function() {
                                    $dialog.close();
                                }
                            })
                        ],
                        content: new Ox.Element()
                            .html([
                                'Query: ' + JSON.stringify(pandora.Query.toObject()),
                                'findQuery: ' + JSON.stringify(app.user.ui.findQuery),
                                'listQuery: ' + JSON.stringify(app.user.ui.listQuery)
                            ].join('<br/><br/>')),
                        height: 200,
                        keys: {enter: 'close', escape: 'close'},
                        width: 400
                    }).open();
                } else if (data.id == 'resetui') {
                    pandora.api.resetUI({}, function() {
                        app.$ui.appPanel.reload();
                    });
                }
            }
        });
    return that;
};

