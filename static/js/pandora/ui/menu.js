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
                getListMenu(),
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
                getSortMenu(),
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
                    { id: 'clearcache', title: 'Clear cache'},
                    { id: 'resetui', title: 'Reset UI Settings'}
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
                } else if ([
                    'newlist', 'newlistfromselection', 'newsmartlist', 'newsmartlistfromresults'
                ].indexOf(data.id) > -1) {
                    pandora.addList(data.id.indexOf('smart') > -1, data.id.indexOf('from') > -1);
                } else if (data.id == 'duplicatelist') {
                    pandora.addList(pandora.user.ui._list);
                } else if (data.id == 'editlist') {
                    pandora.ui.listDialog().open();
                } else if (data.id == 'deletelist') {
                    pandora.ui.deleteListDialog().open();
                } else if (data.id == 'stills') {
                    var id = pandora.user.ui.item || pandora.user.ui.listItem;
                    pandora.$ui.postersDialog = pandora.ui.framesDialog(id).open();
                } else if (data.id == 'posters') {
                    var id = pandora.user.ui.item || pandora.user.ui.listItem;
                    pandora.$ui.postersDialog = pandora.ui.postersDialog(id).open();
                } else if (data.id == 'places') {
                    pandora.$ui.placesDialog = pandora.ui.placesDialog().open();
                } else if (data.id == 'events') {
                    pandora.$ui.eventsDialog = pandora.ui.eventsDialog().open();
                } else if (data.id == 'users') {
                    pandora.$ui.eventsDialog = pandora.ui.usersDialog().open();
                } else if (data.id == 'lists') {
                    pandora.$ui.eventsDialog = pandora.ui.listsDialog().open();
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
            },
            pandora_find: function() {
                var action = ui._list
                    && pandora.getListData(ui._list).user == pandora.user.username
                    ? 'enableItem' : 'disableItem';
                that[action]('editlist');
                that[action]('duplicatelist');
                that[action]('deletelist');
                that[pandora.user.ui.listSelection.length ? 'enableItem' : 'disableItem']('newlistfromselection');
            },
            pandora_listselection: function(data) {
                that[data.value.length ? 'enableItem' : 'disableItem']('newlistfromselection');
            },
            pandora_listview: function(data) {
                if (pandora.isClipView() != pandora.isClipView(data.previousValue)) {
                    that.replaceMenu('sortMenu', getSortMenu());
                }
            }
        });

    function getListMenu(lists) {
        return { id: 'listMenu', title: 'List', items: Ox.merge(
            ['personal', 'favorite', 'featured'].map(function(folder) {
                return {
                    id: folder + 'lists',
                    title: Ox.toTitleCase(folder) + ' Lists',
                    items: [{
                        group: folder + 'lists',
                        min: 0,
                        max: 1,
                        items: lists ? lists[folder].map(function(list) {
                            return {
                                id: 'viewlist' + list.id,
                                title: (folder == 'favorite' ? list.user + ': ' : '') + list.name,
                                checked: list.id == pandora.user.ui._list
                            };
                        }) : [{id: 'loading', title: 'Loading...', disabled: true}]
                    }]
                };
            }),
            [
                {},
                { id: 'newlist', title: 'New List', keyboard: 'control n' },
                { id: 'newlistfromselection', title: 'New List from Selection', disabled: ui.listSelection.length == 0, keyboard: 'shift control n' },
                { id: 'newsmartlist', title: 'New Smart List', keyboard: 'alt control n' },
                { id: 'newsmartlistfromresults', title: 'New Smart List from Results', keyboard: 'shift alt control n' },
                {},
                { id: 'duplicatelist', title: 'Duplicate Selected List', disabled: !pandora.user.ui._list, keyboard: 'control d' },
                { id: 'editlist', title: 'Edit Selected List...', disabled: !pandora.user.ui._list, keyboard: 'control e' },
                { id: 'deletelist', title: 'Delete Selected List...', disabled: !pandora.user.ui._list, keyboard: 'delete' },
            ]
        )};
    };

    function getSortMenu() {
        var ui = pandora.user.ui,
            isClipView = pandora.isClipView(ui.listView);
        return { id: 'sortMenu', title: 'Sort', items: [
            { id: 'sortmovies', title: 'Sort ' + (isClipView ? 'Clips' : pandora.site.itemName.plural) + ' by', items: [
                { group: 'sortmovies', min: 1, max: 1, items: Ox.merge(isClipView ? Ox.merge(pandora.site.clipKeys.map(function(key) {
                    return Ox.extend(Ox.clone(key), {
                        checked: ui.listSort[0].key == key.id,
                        title: 'Clip ' + key.title
                    });
                }), /*{}*/[]) : [], pandora.site.sortKeys.map(function(key) {
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
    }

    // fixme: the sidebar makes the same requests.
    // is it ok to make them twice, or should the sidebar trigger the menu replace?

    var counter = 0,
        lists = {},
        queries = {
            // fixme: duplicated
            personal: {conditions: [
                {key: 'user', value: pandora.user.username, operator: '=='},
                {key: 'status', value: 'featured', operator: '!='}
            ], operator: '&'},
            favorite: {conditions: [
                {key: 'subscribed', value: true, operator: '='},
                {key: 'status', value: 'featured', operator: '!='},
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
                pandora.$ui.mainMenu.replaceMenu('listMenu', getListMenu(lists));
            }
        });
    });

    return that;

};

