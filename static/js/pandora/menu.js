// vim: et:ts=4:sw=4:sts=4:ft=javascript
// FIXME: this should be mainMenu.js!
'use strict';
pandora.ui.mainMenu = function() {

    var isGuest = pandora.user.level == 'guest',
        ui = pandora.user.ui,
        findState = pandora.getFindState(ui.find),
        that = Ox.MainMenu({
            extras: [
                pandora.$ui.loadingIcon = Ox.LoadingIcon({
                    size: 'medium'
                })
            ],
            id: 'mainMenu',
            menus: [].concat(
                [
                    { id: pandora.site.site.id + 'Menu', title: pandora.site.site.name, items: [].concat(
                        [
                            { id: 'home', title: 'Home' },
                            {}
                        ],
                        pandora.site.sitePages,
                        [
                            {},
                            { id: 'software', title: 'Software' }
                        ]
                    ) },
                    { id: 'userMenu', title: 'User', items: [
                        { id: 'username', title: 'User: ' + (isGuest ? 'not signed in' : Ox.encodeHTMLEntities(pandora.user.username)), disabled: true },
                        {},
                        { id: 'preferences', title: 'Preferences...', disabled: isGuest, keyboard: 'control ,' },
                        { id: 'archives', title: 'Archives...', disabled: /*isGuest*/ true },
                        { id: 'upload', title: 'Upload...', disabled: !pandora.site.capabilities.canUploadVideo[pandora.user.level]},
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
                        { id: 'items', title: 'View ' + pandora.site.itemName.plural, items: [
                            { group: 'listview', min: 1, max: 1, items: pandora.site.listViews.map(function(view) {
                                return Ox.extend({
                                    checked: ui.listView == view.id
                                }, view);
                            }) },
                        ]},
                        { id: 'icons', title: 'Icons', items: [].concat([
                                { group: 'viewicons', min: 1, max: 1, items: ['posters', 'frames'].map(function(icons) {
                                    return {id: icons, title: Ox.toTitleCase(icons), checked: ui.icons == icons};
                                }) }
                            ], pandora.site.media.importPosters ? [
                                {},
                                { id: 'showsiteposters', title: 'Always Show ' + pandora.site.site.name + ' Poster', checked: ui.showSitePosters }
                            ] : []
                        ) },
                        { id: 'timelines', title: 'Timelines', items: [
                            { group: 'viewtimelines', min: 1, max: 1, items: pandora.site.timelines.map(function(mode) {
                                return {id: mode.id, title: mode.title, checked: ui.videoTimeline == mode.id, disabled: true};
                            }) }
                        ]},
                        { id: 'columns', title: 'Columns', items: [
                            { id: 'loadcolumns', title: 'Load Layout...', disabled: true },
                            { id: 'savecolumns', title: 'Save Layout...', disabled: true },
                            {},
                            { id: 'resetcolumns', title: 'Reset Layout', disabled: true }
                        ] },
                        {},
                        { id: 'item', title: ['Open ' + pandora.site.itemName.singular, 'Open ' + pandora.site.itemName.plural], items: [
                            { group: 'itemview', min: 1, max: 1, items: pandora.site.itemViews.map(function(view) {
                                return Ox.extend({
                                    checked: ui.itemView == view.id
                                }, view);
                            }) },
                        ] },
                        { id: 'clips', title: 'Open Clips', items: [
                            { group: 'videoview', min: 1, max: 1, items: ['player', 'editor', 'timeline'].map(function(view) {
                                return {id: view, title: Ox.toTitleCase(view), checked: ui.videoView == view};
                            }) }
                        ] },
                        {},
                        { id: 'filters', title: 'Filters', items: [
                            { group: 'filters', min: 5, max: 5, items: pandora.site.filters.map(function(filter) {
                                return Ox.extend({
                                    checked: Ox.getIndexById(ui.filters, filter.id) > -1
                                }, filter);
                            }) },
                            {},
                            { id: 'resetfilters', title: 'Reset Filters' }
                        ] },
                        {},
                        { id: 'showsidebar', title: (ui.showSidebar ? 'Hide' : 'Show') + ' Sidebar', keyboard: 'shift s' },
                        { id: 'showinfo', title: (ui.showInfo ? 'Hide' : 'Show') + ' Info', disabled: !ui.showSidebar, keyboard: 'shift i' },
                        { id: 'showfilters', title: (ui.showFilters ? 'Hide' : 'Show') + ' Filters', disabled: !!ui.item, keyboard: 'shift f' },
                        { id: 'showbrowser', title: (ui.showBrowser ? 'Hide' : 'Show') + ' ' + pandora.site.itemName.singular + ' Browser', disabled: !ui.item, keyboard: 'shift b' },
                        { id: 'showannotations', title: (ui.showAnnotations ? 'Hide' : 'Show') + ' Annotations', disabled: !ui.item || ['timeline', 'player', 'editor'].indexOf(ui.itemView) == -1, keyboard: 'shift a' },
                        { id: 'showtimeline', title: (ui.showTimeline ? 'Hide' : 'Show') + ' Timeline', disabled: !ui.item || ui.itemView != 'player', keyboard: 'shift t' },
                        {},
                        { id: 'fullscreen', title: 'Enter Fullscreen', disabled: !ui.item || ui.itemView != 'video' },
                        {},
                        { id: 'theme', title: 'Theme', items: [
                            { group: 'settheme', min: 1, max: 1, items: [
                                { id: 'classic', title: 'Light', checked: ui.theme == 'classic'},
                                { id: 'modern', title: 'Dark', checked: ui.theme == 'modern' }
                            ]}
                        ] }
                    ]},
                    getSortMenu(),
                    { id: 'findMenu', title: 'Find', items: [
                        { id: 'find', title: 'Find', items: [
                            { group: 'find', min: 0, max: 1, items: pandora.site.findKeys.map(function(key, i) {
                                return Ox.extend({
                                    checked: key.id == findState.key
                                }, key);
                            }) }
                        ] },
                        { id: 'advancedfind', title: 'Advanced Find...', keyboard: 'shift control f' },
                        {},
                        { id: 'findsimilar', title: 'Find Similar Clips...', disabled: true}
                    ] },
                    { id: 'dataMenu', title: 'Data', items: [
                        { id: 'titles', title: 'Manage Titles...', disabled: !pandora.site.capabilities.canManageTitlesAndNames[pandora.user.level] },
                        { id: 'names', title: 'Manage Names...', disabled: !pandora.site.capabilities.canManageTitlesAndNames[pandora.user.level] },
                        {},
                        { id: 'places', title: 'Manage Places...', disabled: !pandora.site.capabilities.canManagePlacesAndEvents[pandora.user.level] },
                        { id: 'events', title: 'Manage Events...', disabled: !pandora.site.capabilities.canManagePlacesAndEvents[pandora.user.level] },
                        {},
                        { id: 'users', title: 'Manage Users...', disabled: !pandora.site.capabilities.canManageUsers[pandora.user.level] },
                        { id: 'statistics', title: 'Statistics...', disabled: !pandora.site.capabilities.canManageUsers[pandora.user.level] }
                    ] },
                    { id: 'helpMenu', title: 'Help', items: [
                        { id: 'help', title: pandora.site.site.name + ' Help', keyboard: 'control ?' }
                    ] }
                ],
                pandora.site.capabilities.canSeeDebugMenu[pandora.user.level]
                    ? [
                        { id: 'debugMenu', title: 'Debug', items: [
                            { id: 'onload', title: 'Run on load...'},
                            { id: 'logs', title: 'View Logs...'},
                            { id: 'clearcache', title: 'Clear Cache'},
                            { id: 'reloadapplication', title: 'Reload Application'},
                            { id: 'resetui', title: 'Reset UI Settings'},
                            { id: 'debug', title: (pandora.localStorage('debug')?'Disable':'Enable')+' Debug Mode'},
                            { id: 'triggererror', title: 'Trigger JavaScript Error'},
                        ] }
                    ]
                    : []
            )
        })
        .bindKeyboard()
        .bindEvent({
            change: function(data) {
                var value = data.checked[0] ? data.checked[0].id : null;
                if (data.id == 'allitems') {
                    if (data.checked) {
                        pandora.UI.set('find', {conditions: [], operator: '&'});
                    } else {
                        that.checkItem('allitems');
                    }
                } else if (data.id == 'find') {
                    if (value) {
                        pandora.$ui.findSelect.value(value);
                        if (pandora.user.ui._findState.key == 'advanced') {
                            // fixme: autocomplete function doesn't get updated
                            pandora.$ui.findInput.options({placeholder: ''});
                        }
                    } else {
                        that.checkItem('findMenu_find_' + pandora.$ui.findSelect.value());
                    }
                    pandora.$ui.findInput.focusInput(true);
                } else if (data.id == 'itemview') {
                    pandora.UI.set({itemView: value});
                } else if (data.id == 'listview') {
                    var set = {listView: value};
                    if (
                        !pandora.isClipView(key, pandora.user.ui.item)
                        && ['title', 'position'].indexOf(pandora.user.ui.listSort[0].key) > -1
                    ) {
                        set.listSort = pandora.site.user.ui.listSort;
                    }
                    pandora.UI.set(set);
                } else if (Ox.startsWith(data.id, 'orderfilter')) {
                    var filters = Ox.clone(pandora.user.ui.filters),
                        id = data.id.replace('orderfilter', ''),
                        index = Ox.getIndexById(filters, id),
                        key = filters[index].sort[0].key,
                        operator = value == 'ascending' ? '+' : '-';
                    pandora.$ui.filters[index].options({
                        sort: [{key: key, operator: operator}]
                    });
                    filters[index].sort[0].operator = operator;
                    pandora.UI.set({filters: filters});
                } else if (data.id == 'listorder') {
                    var key = pandora.user.ui.listSort[0].key,
                        operator = value == 'ascending' ? '+' : '-';
                    pandora.UI.set({listSort: [{key: key, operator: operator}]});
                } else if (data.id == 'listsort') {
                    pandora.UI.set({listSort: [{key: value, operator: ''}]});
                } else if (data.id == 'settheme') {
                    Ox.Theme(value);
                    pandora.UI.set('theme', value);
                } else if (data.id == 'showsiteposters') {
                    pandora.UI.set('showSitePosters', data.checked)
                } else if (Ox.startsWith(data.id, 'sortfilter')) {
                    var filters = Ox.clone(ui.filters),
                        id = data.id.replace('sortfilter', ''),
                        index = Ox.getIndexById(filters, id),
                        type = Ox.getObjectById(pandora.site.filters, id).type,
                        key = value,
                        operator = key == 'name' && type == 'string' ? '+' : '-';
                    pandora.$ui.mainMenu.checkItem(
                        'sortMenu_orderfilters_orderfilter' + id + '_'
                        + (operator == '+' ? 'ascending' : 'descending')
                    );
                    pandora.$ui.filters[index].options({
                        sort: [{key: key, operator: operator}]
                    });
                    filters[index].sort[0].key = key;
                    pandora.UI.set({filters: filters});
                } else if (data.id == 'videoview') {
                    var set = {videoView: value};
                    if (
                        (value == 'timeline' && ['player', 'editor'].indexOf(ui.itemView) > -1)
                        || (value == 'player' && ['timeline', 'editor'].indexOf(ui.itemView) > -1)
                        || (value == 'editor' && ['timeline', 'player'].indexOf(ui.itemView) > -1)
                    ) {
                        set.itemView = value;
                    }
                    pandora.UI.set(set);
                } else if (data.id == 'viewicons') {
                    pandora.UI.set({icons: value});
                } else if (data.id.slice(0, 8) == 'viewlist') {
                    pandora.UI.set({
                        find: {
                            conditions: data.checked ? [
                                {key: 'list', value: data.id.slice(8), operator: '=='}
                            ] : [],
                            operator: '&'
                        }
                    });
                } else if (data.id == 'viewtimelines') {
                    pandora.UI.set({videoTimeline: value});
                }
            },
            click: function(data) {
                if ([].concat(
                    ['home', 'software'],
                    pandora.site.sitePages.map(function(page) {
                        return page.id;
                    }),
                    ['signup', 'signin', 'signout', 'preferences', 'tv', 'help']
                ).indexOf(data.id) > -1) {
                    pandora.UI.set({page: data.id});
                } else if (data.id == 'upload') {
                    pandora.$ui.uploadDialog = pandora.ui.uploadDialog().open();
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
                } else if (data.id == 'showsidebar') {
                    pandora.UI.set({showSidebar: !ui.showSidebar});
                } else if (data.id == 'showinfo') {
                    pandora.UI.set({showInfo: !ui.showInfo});
                } else if (data.id == 'showfilters') {
                    pandora.UI.set({showFilters: !ui.showFilters});
                } else if (data.id == 'showbrowser') {
                    pandora.UI.set({showBrowser: !ui.showBrowser});
                } else if (data.id == 'showannotations') {
                    pandora.UI.set({showAnnotations: !ui.showAnnotations});
                } else if (data.id == 'showtimeline') {
                    pandora.UI.set({showTimeline: !ui.showTimeline});
                } else if (data.id == 'fullscreen') {
                    pandora.$ui.player.options({fullscreen: true});
                } else if (data.id == 'advancedfind') {
                    if (!pandora.hasDialogOrScreen()) {
                        pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
                    }
                } else if (data.id == 'titles') {
                    (pandora.$ui.titlesDialog || (
                        pandora.$ui.titlesDialog = pandora.ui.titlesDialog()
                    )).open();
                } else if (data.id == 'names') {
                    (pandora.$ui.namesDialog || (
                        pandora.$ui.namesDialog = pandora.ui.namesDialog()
                    )).open();
                } else if (data.id == 'places') {
                    (pandora.$ui.placesDialog || (
                        pandora.$ui.placesDialog = pandora.ui.placesDialog()
                    )).open();
                } else if (data.id == 'events') {
                    (pandora.$ui.eventsDialog || (
                        pandora.$ui.eventsDialog = pandora.ui.eventsDialog()
                    )).open();
                } else if (data.id == 'users') {
                    pandora.$ui.usersDialog = pandora.ui.usersDialog().open();
                } else if (data.id == 'statistics') {
                    pandora.$ui.statisticsDialog = pandora.ui.statisticsDialog().open();
                } else if (data.id == 'resetfilters') {
                    pandora.UI.set({
                        filters: pandora.site.user.ui.filters
                    });
                    pandora.$ui.contentPanel.replaceElement(0, pandora.$ui.browser = pandora.ui.browser());
                } else if (data.id == 'onload') {
                    pandora.$ui.onloadDialog = pandora.ui.onloadDialog().open();
                } else if (data.id == 'logs') {
                    pandora.$ui.logsDialog = pandora.ui.logsDialog().open();
                } else if (data.id == 'clearcache') {
                    Ox.Request.clearCache();
                } else if (data.id == 'reloadapplication') {
                    Ox.Request.clearCache();
                    pandora.$ui.appPanel.reload();
                } else if (data.id == 'resetui') {
                    pandora.api.resetUI({}, function() {
                        pandora.$ui.appPanel.reload();
                    });
                } else if (data.id == 'debug') {
                    if(pandora.localStorage('debug')) {
                        pandora.localStorage['delete']('debug');
                    } else {
                        pandora.localStorage('debug', true);
                    }
                    that.setItemTitle('debug', (pandora.localStorage('debug') ? 'Disable' : 'Enable') + ' Debug Mode');
                } else if (data.id == 'triggererror') {
                    var e = error;
                }
            },
            key_backtick: function() {
                changeFocus(1);
            },
            key_control_comma: function() {
                if (!pandora.hasDialogOrScreen()) {
                    pandora.UI.set({page: 'preferences'});
                }
            },
            key_control_f: function() {
                if (!pandora.hasDialogOrScreen()) {
                    if (pandora.user.ui._findState.key != 'advanced') {
                        pandora.$ui.findInput.focusInput(true);
                    } else {
                        pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
                    }
                }
            },
            key_control_shift_f: function() {
                if (!pandora.hasDialogOrScreen()) {
                    pandora.$ui.filterDialog = pandora.ui.filterDialog().open();
                }
            },
            key_control_shift_w: function() {
                if (!pandora.hasDialogOrScreen() || (ui.item || ui._list)) {
                    pandora.UI.set({find: {conditions: [], operator: '&'}});
                }
            },
            key_control_slash: function() {
                if (!pandora.hasDialogOrScreen()) {
                    pandora.UI.set({page: 'help'});
                }
            },
            key_control_space: function() {
                if (!pandora.hasDialogOrScreen()) {
                    pandora.UI.set({page: 'tv'});
                }
            },
            key_control_w: function() {
                if (!pandora.hasDialogOrScreen()) {
                    if (ui.item) {
                        pandora.UI.set({item: ''});
                    } else if (ui._list) {
                        pandora.UI.set({find: {conditions: [], operator: '&'}});
                    }
                }
            },
            key_shift_a: function() {
                ui.item && ['timeline', 'player', 'editor'].indexOf(ui.itemView) > -1
                    && pandora.UI.set({showAnnotations: !ui.showAnnotations});
            },
            key_shift_b: function() {
                ui.item && pandora.UI.set({showBrowser: !ui.showBrowser});
            },
            key_shift_backtick: function() {
                changeFocus(-1);
            },
            key_shift_f: function() {
                !ui.item && pandora.UI.set({showFilters: !ui.showFilters});
            },
            key_shift_i: function() {
                ui.showSidebar && pandora.UI.set({showInfo: !ui.showInfo});
            },
            key_shift_s: function() {
                pandora.UI.set({showSidebar: !ui.showSidebar});
            },
            key_shift_t: function() {
                ui.item && ui.itemView == 'video'
                    && pandora.UI.set({showTimeline: !ui.showTimeline});
            },
            pandora_find: function() {
                var list = ui._list,
                    listData = pandora.getListData(),
                    previousList = pandora.UI.getPrevious()._list,
                    action = list && listData.user == pandora.user.username
                        ? 'enableItem' : 'disableItem';
                if (list != previousList) {
                    that.uncheckItem(previousList == '' ? 'allitems' : 'viewlist' + previousList);
                    that.checkItem(list == '' ? 'allitems' : 'viewlist' + list);
                }
                that[action]('editlist');
                that[action]('duplicatelist');
                that[action]('deletelist');
                that[ui.listSelection.length ? 'enableItem' : 'disableItem']('newlistfromselection');
            },
            pandora_filters: function(data) {
                that.replaceMenu('sortMenu', getSortMenu());
            },
            pandora_item: function(data) {
                if (!!data.value != !!data.previousValue) {
                    that[data.value ? 'disableItem' : 'enableItem']('showfilters');
                    that[data.value ? 'enableItem' : 'disableItem']('showbrowser');
                    that.replaceMenu('sortMenu', getSortMenu());
                }
                if (!data.value) {
                    that.disableItem('showannotations');
                    that.disableItem('showtimeline');
                    that.disableItem('fullscreen');
                } else {
                    if (['timeline', 'player', 'editor'].indexOf(ui.itemView) > -1) {
                        that.enableItem('showannotations');
                    }
                    if (ui.itemView == 'player') {
                        that.enableItem('showtimeline');
                        that.enableItem('fullscreen');
                    }
                }
            },
            pandora_itemview: function(data) {
                var action,
                    isVideoView = ['timeline', 'player', 'editor'].indexOf(data.value) > -1,
                    wasVideoView = ['timeline', 'player', 'editor'].indexOf(data.previousValue) > -1;
                that.checkItem('viewMenu_item_' + data.value);
                if (isVideoView) {
                    that.checkItem('viewMenu_clips_' + data.value);
                }
                if (isVideoView != wasVideoView) {
                    that[isVideoView ? 'enableItem' : 'disableItem']('showannotations');
                }
                if ((data.value == 'player') != (data.previousValue == 'player')) {
                    action = data.value == 'player' ? 'enableItem' : 'disableItem';
                    that[action]('showtimeline');
                    that[action]('fullscreen');
                }
            },
            pandora_listselection: function(data) {
                that[data.value.length ? 'enableItem' : 'disableItem']('newlistfromselection');
            },
            pandora_listsort: function(data) {
                that.checkItem('sortMenu_sortitems_' + data.value[0].key);
                that.checkItem('sortMenu_orderitems_' + (
                    data.value[0].operator == '+' ? 'ascending' : 'descending')
                );
            },
            pandora_listview: function(data) {
                that.checkItem('viewMenu_items_' + data.value);
                if (pandora.isClipView() != pandora.isClipView(data.previousValue)) {
                    that.replaceMenu('sortMenu', getSortMenu());
                }
            },
            pandora_showannotations: function(data) {
                that.setItemTitle('showannotations', (data.value ? 'Hide' : 'Show') + ' Annotations');
            },
            pandora_showbrowser: function(data) {
                that.setItemTitle('showbrowser', (data.value ? 'Hide' : 'Show') + ' ' + pandora.site.itemName.singular + ' Browser');
            },
            pandora_showfilters: function(data) {
                that.setItemTitle('showfilters', (data.value ? 'Hide' : 'Show') + ' Filters');
            },
            pandora_showinfo: function(data) {
                that.setItemTitle('showinfo', (data.value ? 'Hide' : 'Show') + ' Info');
            },
            pandora_showsidebar: function(data) {
                that.setItemTitle('showsidebar', (data.value ? 'Hide' : 'Show') + ' Sidebar');
                that[data.value ? 'enableItem' : 'disableItem']('showinfo');
            },
            pandora_showtimeline: function(data) {
                that.setItemTitle('showtimeline', (data.value ? 'Hide' : 'Show') + ' Timeline');
            }
        });

    function changeFocus(direction) {
        var elements = [],
            index,
            listData = pandora.getListData();
        elements[0] = !listData.folder ? pandora.$ui.allItems
            : pandora.$ui.folderList[listData.folder];
        if (!ui.item && ui.showFilters) {
            pandora.$ui.filters.forEach(function($filter) {
                if ($filter.options('selected').length) {
                    elements.push($filter);
                }
            });
        } else if (ui.item && ui.showBrowser) {
            elements.push(pandora.$ui.browser);
        }
        if (!ui.item) {
            if (['map', 'calendar'].indexOf(ui.listView) > -1) {
                elements.push(pandora.$ui[ui.listView]);
                if (pandora.$ui.clipList.options('selected').length) {
                    elements.push(pandora.$ui.clipList);
                }
            } else if (pandora.$ui.list.options('selected').length) {
                elements.push(pandora.$ui.list);
            }
        } else {
            if (['player', 'editor', 'timeline', 'map', 'calendar'].indexOf(ui.itemView) > -1) {
                elements.push(pandora.$ui[ui.itemView]);
            }
            if (
                ['clips', 'map', 'calendar'].indexOf(ui.itemView) > -1
                && pandora.$ui.clipList.options('selected').length
            ) {
                elements.push(pandora.$ui.clipList);
            }
            if (
                ui.itemView == 'data'
                && pandora.$ui.item.options('selected').length
            ) {
                elements.push(pandora.$ui.item);
            }
        }
        index = direction == 1 ? -1 : elements.length;
        Ox.forEach(elements, function(element, i) {
            if (element.hasFocus()) {
                index = i;
                Ox.Break();
            }
        });
        elements[Ox.mod((index + direction), elements.length)].gainFocus();
    }

    function getListMenu(lists) {
        return { id: 'listMenu', title: 'List', items: [].concat(
            { id: 'allitems', title: 'All ' + pandora.site.itemName.plural, checked: !ui.item && !ui._list, keyboard: 'shift control w' },
            ['personal', 'favorite', 'featured'].map(function(folder) {
                return {
                    id: folder + 'lists',
                    title: Ox.toTitleCase(folder) + ' Lists',
                    items: Ox.isUndefined(lists)
                        ? [{id: 'loading', title: 'Loading...', disabled: true}]
                        : lists[folder].length == 0
                        ? [{id: 'nolists', title: 'No ' + Ox.toTitleCase(folder) + ' Lists', disabled: true}]
                        : lists[folder].map(function(list) {
                            return {
                                id: 'viewlist' + list.id,
                                title: Ox.encodeHTMLEntities((
                                    folder == 'favorite' ? list.user + ': ' : ''
                                ) + list.name),
                                checked: list.id == pandora.user.ui._list
                            };
                        })
                };
            }),
            [
                {},
                { id: 'newlist', title: 'New List', disabled: isGuest, keyboard: 'control n' },
                { id: 'newlistfromselection', title: 'New List from Selection', disabled: isGuest || ui.listSelection.length == 0, keyboard: 'shift control n' },
                { id: 'newsmartlist', title: 'New Smart List', disabled: isGuest, keyboard: 'alt control n' },
                { id: 'newsmartlistfromresults', title: 'New Smart List from Results', disabled: isGuest, keyboard: 'shift alt control n' },
                {},
                { id: 'duplicatelist', title: 'Duplicate Selected List', disabled: isGuest || !pandora.user.ui._list, keyboard: 'control d' },
                { id: 'editlist', title: 'Edit Selected List...', disabled: isGuest || !pandora.user.ui._list, keyboard: 'control e' },
                { id: 'deletelist', title: 'Delete Selected List...', disabled: isGuest || !pandora.user.ui._list, keyboard: 'delete' },
                {},
                { id: 'tv', title: 'TV', keyboard: 'control space' }
            ]
        )};
    };

    function getSortMenu() {
        var ui = pandora.user.ui,
            isClipView = pandora.isClipView(ui.listView),
            items = isClipView ? pandora.site.clipKeys.map(function(key) {
                return Ox.extend(Ox.clone(key), {
                    checked: ui.listSort[0].key == key.id,
                    title: 'Clip ' + key.title
                });
            }) : [];
        return { id: 'sortMenu', title: 'Sort', items: [
            { id: 'sortitems', title: 'Sort ' + (isClipView || ui.item ? 'Clips' : pandora.site.itemName.plural) + ' by', items: [
                { group: 'listsort', min: 1, max: 1, items: [].concat(
                    items,
                    pandora.site.sortKeys.filter(function(key) {
                        return Ox.getIndexById(items, key.id) == -1 && (
                            !key.capability
                            || pandora.site.capabilities[key.capability][pandora.user.level]
                        );
                    }).map(function(key) {
                        return Ox.extend({
                            checked: ui.listSort[0].key == key.id
                        }, key);
                    })
                ) }
            ] },
            { id: 'orderitems', title: 'Order ' + (isClipView ? 'Clips' : pandora.site.itemName.plural), items: [
                { group: 'listorder', min: 1, max: 1, items: [
                    { id: 'ascending', title: 'Ascending', checked: (ui.listSort[0].operator || pandora.getSortOperator(ui.listSort[0].key)) == '+' },
                    { id: 'descending', title: 'Descending', checked: (ui.listSort[0].operator || pandora.getSortOperator(ui.listSort[0].key)) == '-' }
                ]}
            ] },
            { id: 'advancedsort', title: 'Advanced Sort...', keyboard: 'shift control s', disabled: true },
            {},
            { id: 'sortfilters', title: 'Sort Filters', items: pandora.user.ui.filters.map(function(filter) {
                return {
                    id: 'sortfilter' + filter.id,
                    title: 'Sort ' + Ox.getObjectById(pandora.site.filters, filter.id).title + ' Filter by',
                    items: [
                        { group: 'sortfilter' + filter.id, min: 1, max: 1, items: [
                            { id: 'name', title: 'Name', checked: filter.sort[0].key == 'name' },
                            { id: 'items', title: 'Items', checked: filter.sort[0].key == 'items' }
                        ] }
                    ]
                }
            }) },
            { id: 'orderfilters', title: 'Order Filters', items: pandora.user.ui.filters.map(function(filter) {
                return {
                    id: 'orderfilter' + filter.id,
                    title: 'Order ' + Ox.getObjectById(pandora.site.filters, filter.id).title + ' Filter',
                    items: [
                        { group: 'orderfilter' + filter.id, min: 1, max: 1, items: [
                            { id: 'ascending', title: 'Ascending', checked: filter.sort[0].operator == '+' },
                            { id: 'descending', title: 'Descending', checked: filter.sort[0].operator == '-' }
                        ] }
                    ]
                }
            }) }
        ] };
    }

    // fixme: the sidebar makes (almost) the same requests.
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
            keys: ['id', 'name', 'user'],
            sort: [{key: 'position', operator: '+'}]
        }, function(result) {
            lists[folder] = result.data.items;
            if (++counter == 3) {
                pandora.$ui.mainMenu.replaceMenu('listMenu', getListMenu(lists));
            }
        });
    });

    return that;

};

