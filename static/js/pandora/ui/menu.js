// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.mainMenu = function() {
    var isGuest = pandora.user.level == 'guest',
        ui = pandora.user.ui,
        that = Ox.MainMenu({
            extras: [
                $('<div>').html('beta').css({marginRight: '8px', color: 'rgb(128, 128, 128)'}),
                pandora.$ui.loadingIcon = Ox.LoadingIcon({
                    size: 'medium'
                })
            ],
            id: 'mainMenu',
            menus: [
                { id: pandora.site.site.id + 'Menu', title: pandora.site.site.name, items: [
                    { id: 'home', title: 'Home' },
                    {},
                    { id: 'about', title: 'About ' + pandora.site.site.name },
                    { id: 'news', title: pandora.site.site.name + ' News' },
                    { id: 'tour', title: 'Take a Tour' },
                    { id: 'faq', title: 'Frequently Asked Questions' },
                    { id: 'terms', title: 'Terms of Service' },
                    { id: 'contact', title: 'Contact ' + pandora.site.site.name },
                    {},
                    { id: 'software', title: 'Software' }
                ] },
                { id: 'userMenu', title: 'User', items: [
                    { id: 'username', title: 'User: ' + (isGuest ? 'not logged in' : pandora.user.username), disabled: true },
                    {},
                    { id: 'preferences', title: 'Preferences...', disabled: isGuest, keyboard: 'control ,' },
                    { id: 'archives', title: 'Archives...', disabled: isGuest },
                    {},
                    { id: 'signup', title: 'Sign Up...', disabled: !isGuest },
                    isGuest ? { id: 'signin', title: 'Sign In...' }
                        : { id: 'signout', title: 'Sign Out...'}
                ] },
                pandora.getListMenu(),
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
                    { id: 'movies', title: 'View ' + pandora.site.itemName.plural, items: [
                        { group: 'viewmovies', min: 1, max: 1, items: pandora.site.listViews.map(function(view) {
                            return Ox.extend({
                                checked: ui.listView == view.id,
                            }, view);
                        }) },
                    ]},
                    { id: 'icons', title: 'Icons', items: [
                        { group: 'viewicons', min: 1, max: 1, items: ['posters', 'frames'].map(function(icons) {
                            return {id: icons, title: Ox.toTitleCase(icons), checked: ui.icons == icons};
                        }) },
                        {},
                        { id: 'showsiteposter', title: 'Always Show ' + pandora.site.site.name + ' Poster', checked: ui.showSitePoster }
                    ] },
                    { id: 'columns', title: 'Columns', items: [
                        { id: 'loadcolumns', title: 'Load Layout...' },
                        { id: 'savecolumns', title: 'Save Layout...' },
                        {},
                        { id: 'resetcolumns', title: 'Reset Layout' }
                    ]},
                    {},
                    { id: 'openmovie', title: ['Open ' + pandora.site.itemName.singular, 'Open ' + pandora.site.itemName.plural], items: [
                        { group: 'itemview', min: 1, max: 1, items: pandora.site.itemViews.map(function(view) {
                            return Ox.extend({
                                checked: ui.itemView == view.id,
                            }, view);
                        }) },
                    ]},
                    { id: 'openvideo', title: 'Open Video Links', items: [
                        { group: 'videoview', min: 1, max: 1, items: ['player', 'editor'].map(function(view) {
                            return {id: view, title: Ox.toTitleCase(view), checked: ui.videoView == view};
                        }) }
                    ] },
                    {},
                    { id: 'groups', title: 'Groups', items: [
                        { group: 'groups', min: 5, max: 5, items: pandora.site.groups.map(function(group) {
                            return Ox.extend({
                                checked: Ox.getPositionById(ui.groups, group.id) > -1
                            }, group);
                        }) },
                        {},
                        { id: 'resetgroups', title: 'Reset Groups' }
                    ] },
                    {},
                    { id: 'lists', title: 'Hide Lists', keyboard: 'shift l' },
                    { id: 'info', title: 'Hide Info', keyboard: 'shift i' },
                    { id: 'groups', title: 'Hide Groups', keyboard: 'shift g' },
                    { id: 'movies', title: 'Hide ' + pandora.site.itemName.plural, disabled: true, keyboard: 'shift m' },
                    {},
                    { id: 'theme', title: 'Theme', items: [
                        { group: 'settheme', min: 1, max: 1, items: [
                            { id: 'classic', title: 'Classic', checked: ui.theme == 'classic'},
                            { id: 'modern', title: 'Modern', checked: ui.theme == 'modern' }
                        ]}
                    ] }
                ]},
                pandora.getSortMenu(),
                { id: 'findMenu', title: 'Find', items: [
                    { id: 'find', title: 'Find', items: [
                        { group: 'find', min: 1, max: 1, items: pandora.site.findKeys.map(function(key, i) {
                            var index = ui._findState.index;
                            return Ox.extend({
                                checked: index > -1 && ui.find.conditions[index].key
                                    ? ui.find.conditions[index].key == key.id
                                    : key.id == 'all'
                            }, key);
                        }) }
                    ] },
                    { id: 'advancedfind', title: 'Advanced Find...', keyboard: 'shift control f' }
                ] },
                { id: 'dataMenu', title: 'Data', items: [
                    { id: 'titles', title: 'Manage Titles...' },
                    { id: 'names', title: 'Manage Names...' },
                    {},
                    { id: 'places', title: 'Manage Places...' },
                    { id: 'events', title: 'Manage Events...' },
                    {},
                    { id: 'users', title: 'Manage Users...' },
                    { id: 'lists', title: 'Manage Lists...' },
                    {},
                    { id: 'news', title: 'Manage News...' },
                    { id: 'tour', title: 'Manage Tour...' }
                ] },
                { id: 'helpMenu', title: 'Help', items: [
                    { id: 'help', title: pandora.site.site.name + ' Help', keyboard: 'shift ?' }
                ] },
                { id: 'debugMenu', title: 'Debug', items: [
                    { id: 'query', title: 'Show pandora.Query' },
                    { id: 'resetui', title: 'Reset UI Settings'},
                    { id: 'clearcache', title: 'Clear cache'},
                    { id: 'nestedone', title: 'Some Nesting', items: [
                        { id: 'nestedtwo', title: 'Some More Nesting', items: [
                            { id: 'nestedthree', title: 'Even More Nesting' }
                        ] }
                    ] }
                ] }
            ]
        })
        .bindEvent({
            change: function(data) {
                var value = data.checked[0] ? data.checked[0].id : null;
                if (data.id == 'find') {
                    pandora.$ui.findSelect.options({value: value});
                } else if (data.id == 'itemview') {
                    pandora.UI.set({itemView: value});
                } else if (Ox.startsWith(data.id, 'ordergroup')) {
                    var groups = Ox.clone(pandora.user.ui.groups),
                        id = data.id.replace('ordergroup', ''),
                        position = Ox.getPositionById(groups, id),
                        key = groups[position].sort[0].key,
                        operator = value == 'ascending' ? '+' : '-';
                    pandora.$ui.groups[position].options({
                        sort: [{key: key, operator: operator}]
                    });
                    groups[position].sort[0].operator = operator;
                    pandora.UI.set({groups: groups});
                } else if (data.id == 'ordermovies') {
                    var key = pandora.user.ui.listSort[0].key,
                        operator = value == 'ascending' ? '+' : '-';
                    pandora.UI.set({listSort: [{key: key, operator: operator}]});
                } else if (data.id == 'settheme') {
                    Ox.Theme(value);
                    pandora.UI.set('theme', value);
                } else if (data.id == 'showsiteposter') {
                    pandora.UI.set('showSitePoster', data.checked)
                } else if (Ox.startsWith(data.id, 'sortgroup')) {
                    var groups = Ox.clone(ui.groups),
                        id = data.id.replace('sortgroup', ''),
                        position = Ox.getPositionById(groups, id),
                        type = Ox.getObjectById(pandora.site.groups, id).type,
                        key = value,
                        operator = key == 'name' && type == 'string' ? '+' : '-';
                    pandora.$ui.mainMenu.checkItem('sortMenu_ordergroups_ordergroup' + id + '_' + (operator == '+' ? 'ascending' : 'descending'))
                    pandora.$ui.groups[position].options({
                        sort: [{key: key, operator: operator}]
                    });
                    groups[position].sort[0].key = key;
                    pandora.UI.set({groups: groups});                    
                } else if (data.id == 'sortmovies') {
                    pandora.UI.set({listSort: [{key: value, operator: ''}]});
                } else if (data.id == 'viewicons') {
                    pandora.UI.set({icons: value});
                } else if (data.id == 'viewmovies') {
                    pandora.UI.set('listView', value);
                } else if (['personallists', 'favoritelists', 'featuredlists'].indexOf(value) > -1) {
                    pandora.UI.set({list: value.substr(8)});
                }
            },
            click: function(data) {
                if ([
                    'home', 'about', 'news', 'tour', 'faq', 'tos', 'contact', 'software',
                    'signup', 'signin', 'signout', 'preferences', 'help'
                ].indexOf(data.id) > -1) {
                    pandora.URL.push('/' + data.id);
                } else if (data.id == 'stills') {
                    var id = pandora.user.ui.item || pandora.user.ui.listItem;
                    pandora.$ui.postersDialog = pandora.ui.framesDialog(id).open();
                } else if (data.id == 'posters') {
                    var id = pandora.user.ui.item || pandora.user.ui.listItem;
                    pandora.$ui.postersDialog = pandora.ui.postersDialog(id).open();
                } else if (data.id == 'places') {
                    pandora.$ui.placesDialog = pandora.ui.placesDialog().open();
                    /*
                    var $manage = Ox.SplitPanel({
                            elements: [
                                {
                                    collapsible: true,
                                    element: Ox.SplitPanel({
                                        elements: [
                                            {
                                                element: Ox.Toolbar({
                                                    orientation: 'horizontal',
                                                    size: 44
                                                }).append(
                                                    pandora.$ui.findPlacesElement = Ox.FormElementGroup({
                                                        elements: [
                                                            pandora.$ui.findPlacesSelect = Ox.Select({
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
                                                                    change: function(data) {
                                                                        pandora.$ui.findPlacesSelect.loseFocus();
                                                                        pandora.$ui.findPlacesInput.options({
                                                                            placeholder: data.selected[0].title
                                                                        });
                                                                    }
                                                                }),
                                                            pandora.$ui.findPlacesInput = Ox.Input({
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
                                                    pandora.$ui.sortPlacesSelect = Ox.Select({
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
                                                element: Ox.Element('div')
                                            },
                                            {
                                                element: Ox.Toolbar({
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
                                    element: Ox.SplitPanel({
                                        elements: [
                                            {
                                                element: Ox.Toolbar({
                                                    orientation: 'horizontal',
                                                    size: 24
                                                }).append(
                                                    pandora.$ui.labelsButton = Ox.Button({
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
                                                    pandora.$ui.findMapInput = Ox.Input({
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
                                                        submit: function(data) {
                                                            pandora.$ui.map.find(data.value, function(location) {
                                                                
                                                                pandora.$ui.placeNameInput.options({
                                                                    disabled: false,
                                                                    value: location.name
                                                                });
                                                                pandora.$ui.placeAliasesInput.options({
                                                                    disabled: false
                                                                });
                                                                pandora.$ui.placeGeonameLabel.options({
                                                                    disabled: false,
                                                                    title: location.names.join(', ')
                                                                });
                                                                pandora.$ui.removePlaceButton.options({
                                                                    disabled: false
                                                                });
                                                                pandora.$ui.addPlaceButton.options({
                                                                    disabled: false
                                                                });

                                                            });
                                                        }
                                                    })
                                                ),
                                                size: 24
                                            },
                                            {
                                                element: pandora.$ui.map = Ox.Map({
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
                                                            pandora.$ui.placeNameInput.options({
                                                                disabled: false,
                                                                value: location.name
                                                            });
                                                            pandora.$ui.placeAliasesInput.options({
                                                                disabled: false
                                                            });
                                                            pandora.$ui.placeGeonameLabel.options({
                                                                disabled: false,
                                                                title: location.names.join(', ')
                                                            });
                                                            pandora.$ui.removePlaceButton.options({
                                                                disabled: false
                                                            });
                                                            pandora.$ui.addPlaceButton.options({
                                                                disabled: false
                                                            });
                                                        }
                                                    })
                                            },
                                            {
                                                element: pandora.$ui.bottomBar = Ox.Toolbar({
                                                    orientation: 'horizontal',
                                                    size: 24
                                                })
                                                .append(
                                                    pandora.$ui.placeNameInput = Ox.Input({
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
                                                    pandora.$ui.placeAliasesInput = Ox.Input({
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
                                                    pandora.$ui.placeGeonameLabel = Ox.Label({
                                                        disabled: true,
                                                        id: 'placeGeoname',
                                                        title: 'Geoname',
                                                        width: parseInt(pandora.$ui.document.width() * 0.8) - 256 - 256 - 32 - 24
                                                    })
                                                    .css({
                                                        float: 'left',
                                                        margin: '4px 0 0 4px'
                                                    })
                                                )
                                                .append(
                                                    pandora.$ui.addPlaceButton = Ox.Button({
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
                                                    pandora.$ui.removePlaceButton = Ox.Button({
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
                        $dialog = Ox.Dialog({
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
                            height: parseInt(pandora.$ui.document.height() * 0.8),
                            id: 'places',
                            minHeight: 400,
                            minWidth: 600,
                            padding: 0,
                            title: 'Manage Places',
                            width: parseInt(pandora.$ui.document.width() * 0.8)
                        }).css({
                            overflow: 'hidden'
                        }).append($manage).open();
                    */
                } else if (data.id == 'events') {
                    pandora.$ui.eventsDialog = pandora.ui.eventsDialog().open();
                } else if (data.id == 'users') {
                    pandora.$ui.eventsDialog = pandora.ui.usersDialog().open();
                } else if (data.id == 'lists') {
                    pandora.$ui.eventsDialog = pandora.ui.listsDialog().open();
                } else if (data.id == 'query') {
                    var $dialog = Ox.Dialog({
                        buttons: [
                            Ox.Button({
                                id: 'close',
                                title: 'Close'
                            }).bindEvent({
                                click: function() {
                                    $dialog.close();
                                }
                            })
                        ],
                        content: Ox.Element()
                            .css({padding: '16px'})
                            .html([
                                'Query: ' + JSON.stringify(pandora.Query.toObject()),
                                'findQuery: ' + JSON.stringify(pandora.user.ui.findQuery),
                                'listQuery: ' + JSON.stringify(pandora.user.ui.listQuery)
                            ].join('<br/><br/>')),
                        height: 192,
                        keys: {enter: 'close', escape: 'close'},
                        title: 'Query',
                        width: 384
                    }).open();
                } else if (data.id == 'resetgroups') {
                    pandora.UI.set({
                        groups: pandora.site.user.ui.groups
                    });
                    pandora.$ui.contentPanel.replaceElement(0, pandora.$ui.browser = pandora.ui.browser());
                } else if (data.id == 'resetui') {
                    pandora.api.resetUI({}, function() {
                        pandora.$ui.appPanel.reload();
                    });
                } else if (data.id == 'clearcache') {
                    Ox.Request.clearCache();
                }
            }
        });

    // fixme: the sidebar makes the same requests.
    // is it ok to make them twice, or should the sidebar trigger the menu replace?

    var counter = 0,
        lists = {},
        queries = {
            // fixme: duplicated
            personal: {conditions: [
                {key: 'user', value: pandora.user.username, operator: '='},
                {key: 'status', value: 'featured', operator: '!'}
            ], operator: '&'},
            favorite: {conditions: [
                {key: 'subscribed', value: true, operator: '='},
                {key: 'status', value: 'featured', operator: '!'},
            ], operator: '&'},
            featured: {conditions: [
                {key: 'status', value: 'featured', operator: '='}
            ], operator: '&'}
        };

    Ox.forEach(queries, function(query, folder) {
        pandora.api.findLists({
            query: query,
            keys: ['id', 'name', 'user']
        }, function(result) {
            lists[folder] = result.data.items;
            if (++counter == 3) {
                Ox.print('--------------------------------------------', lists)
                pandora.$ui.mainMenu.replaceMenu('listMenu', pandora.getListMenu(lists));
            }
        });
    });

    return that;
};

