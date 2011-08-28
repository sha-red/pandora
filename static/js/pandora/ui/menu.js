// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.mainMenu = function() {
    var isGuest = pandora.user.level == 'guest',
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
                    { id: 'signinsignout', title: isGuest ? 'Sign In...' : 'Sign Out...' }
                ] },
                { id: 'listMenu', title: 'List', items: [
                    { id: 'history', title: 'History', items: [
                        { id: 'allmovies', title: 'All ' + pandora.site.itemName.plural }
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
                    { id: 'addmovietolist', title: ['Add Selected ' + pandora.site.itemName.singular + ' to List...', 'Add Selected ' + pandora.site.itemName.plural + ' to List...'], disabled: true },
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
                    { id: 'movies', title: 'View ' + pandora.site.itemName.plural, items: [
                        { group: 'viewmovies', min: 1, max: 1, items: $.map(pandora.site.listViews, function(view, i) {
                            return Ox.extend({
                                checked: pandora.user.ui.lists[pandora.user.ui.list].listView == view.id,
                            }, view);
                        }) },
                    ]},
                    { id: 'icons', title: 'Icons', items: [
                        { group: 'viewicons', min: 1, max: 1, items: ['posters', 'frames'].map(function(icons) {
                            return {id: icons, title: Ox.toTitleCase(icons), checked: pandora.user.ui.icons == icons};
                        }) },
                        {},
                        { id: 'usesiteposter', title: 'Always Use ' + pandora.site.site.name + ' Poster' }
                    ] },
                    {},
                    { id: 'openmovie', title: ['Open ' + pandora.site.itemName.singular, 'Open ' + pandora.site.itemName.plural], items: [
                        { group: 'movieview', min: 1, max: 1, items: $.map(pandora.site.itemViews, function(view, i) {
                            return Ox.extend({
                                checked: pandora.user.ui.itemView == view.id,
                            }, view);
                        }) },
                    ]},
                    { id: 'openvideo', title: 'Open Video Links', items: [
                        { group: 'videoview', min: 1, max: 1, items: ['player', 'editor'].map(function(view) {
                            return {id: view, title: Ox.toTitleCase(view), checked: pandora.user.ui.videoView == view};
                        }) }
                    ] },
                    {},
                    { id: 'lists', title: 'Hide Lists', keyboard: 'shift l' },
                    { id: 'info', title: 'Hide Info', keyboard: 'shift i' },
                    { id: 'groups', title: 'Hide Groups', keyboard: 'shift g' },
                    { id: 'movies', title: 'Hide ' + pandora.site.itemName.plural, disabled: true, keyboard: 'shift m' }
                ]},
                { id: 'sortMenu', title: 'Sort', items: [
                    { id: 'sortmovies', title: 'Sort ' + pandora.site.itemName.plural + ' by', items: [
                        { group: 'sortmovies', min: 1, max: 1, items: $.map(pandora.site.sortKeys, function(key, i) {
                            return Ox.extend({
                                checked: pandora.user.ui.lists[pandora.user.ui.list].sort[0].key == key.id
                            }, key);
                        }) }
                    ] },
                    { id: 'ordermovies', title: 'Order ' + pandora.site.itemName.plural, items: [
                        { group: 'ordermovies', min: 1, max: 1, items: [
                            { id: 'ascending', title: 'Ascending', checked: pandora.user.ui.lists[pandora.user.ui.list].sort[0].operator == '+' },
                            { id: 'descending', title: 'Descending', checked: pandora.user.ui.lists[pandora.user.ui.list].sort[0].operator == '-' }
                        ]}
                    ] },
                    { id: 'advancedsort', title: 'Advanced Sort...', keyboard: 'shift control s' },
                    {},
                    { id: 'groupsstuff', title: 'Groups Stuff' }
                ] },
                { id: 'findMenu', title: 'Find', items: [
                    { id: 'find', title: 'Find', items: [
                        { group: 'find', min: 1, max: 1, items: pandora.site.findKeys.map(function(key, i) {
                            var index = pandora.user.ui.find.index;
                            return Ox.extend({
                                checked: index > -1 && pandora.user.ui.query.conditions[index].key
                                    ? pandora.user.ui.query.conditions[index].key == key.id
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
                    { id: 'clearcache', title: 'Clear cache'}
                ] }
            ]
        })
        .bindEvent({
            change: function(event, data) {
                var value = data.checked[0].id;
                if (data.id == 'find') {
                    pandora.$ui.findSelect.selectItem(value);
                } else if (data.id == 'movieview') {
                    var id = document.location.pathname.split('/')[1];
                    if (value == 'info')
                        url(id + '/info');
                    else
                        url(id);
                } else if (data.id == 'ordermovies') {
                    var key = pandora.user.ui.lists[pandora.user.ui.list].sort[0].key,
                        operator = value == 'ascending' ? '+' : '-';
                    pandora.$ui.list.options({
                        sort: [{key: key, operator: operator}]
                    });
                    pandora.UI.set(['lists', pandora.user.ui.list, 'sort'].join('|'), [{key: key, operator: operator}]);
                    //pandora.user.ui.lists[pandora.user.ui.list].sort[0] = {key: key, operator: operator};
                    pandora.URL.push(pandora.Query.toString());
                } else if (data.id == 'sortmovies') {
                    var operator = pandora.getSortOperator(value);
                    pandora.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + (operator == '+' ? 'ascending' : 'descending'));
                    pandora.$ui.sortSelect.selectItem(value);
                    pandora.$ui.list.options({
                        sort: [{key: value, operator: operator}]
                    });
                    pandora.UI.set(['lists', pandora.user.ui.list, 'sort'].join('|'), [{key: value, operator: operator}]);
                    //pandora.user.ui.lists[pandora.user.ui.list].sort[0] = {key: key, operator: operator};
                    pandora.URL.push(pandora.Query.toString());

                } else if (data.id == 'viewicons') {
                    var $list;
                    pandora.UI.set({icons: value});
                    if (pandora.user.ui.item) {
                        if (pandora.user.ui.itemView == 'info') {
                            pandora.$ui.item.reload();
                        }
                        $list = pandora.$ui.browser;
                    } else if (pandora.user.ui.lists[pandora.user.ui.list].listView == 'icons') {
                        $list = pandora.$ui.list
                    }
                    $list && $list.options({
                        borderRadius: value == 'posters' ? 0 : pandora.user.ui.item ? 8 : 16,
                        defaultRatio: value == 'posters' ? 5/8 : 1
                    }).reloadList(true);
                } else if (data.id == 'viewmovies') {
                    url('#view=' + value);
                }
            },
            click: function(event, data) {
                if (data.id == 'home') {
                    pandora.$ui.home = pandora.ui.home().fadeInScreen();
                } else if (['about', 'news', 'tour', 'faq', 'tos', 'contact', 'software'].indexOf(data.id) > -1) {
                    pandora.$ui.siteDialog = pandora.ui.siteDialog(data.id).open();
                    pandora.URL.push(data.id);
                } else if (data.id == 'preferences') {
                    pandora.$ui.preferencesDialog = pandora.ui.preferencesDialog().open();
                } else if (data.id == 'signup') {
                    pandora.$ui.accountDialog = pandora.ui.accountDialog('signup').open();
                } else if (data.id == 'signinsignout') {
                    pandora.$ui.accountDialog = (
                        pandora.user.level == 'guest'
                        ? pandora.ui.accountDialog('signin')
                        : pandora.ui.accountSignoutDialog()
                    ).open();
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
                                                                    change: function(event, data) {
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
                                                        submit: function(event, data) {
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
                } else if (data.id == 'resetui') {
                    pandora.api.resetUI({}, function() {
                        pandora.$ui.appPanel.reload();
                    });
                } else if (data.id == 'clearcache') {
                    Ox.Request.clearCache();
                }
            }
        });
    return that;
};

