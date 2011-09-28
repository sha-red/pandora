// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.URL = (function() {

    var self = {}, that = {};

    /*
    function foundItem() {
        pandora.UI.set(Ox.extend({
            section: 'items',
            item: item,
            itemView: view
        }, ['video', 'timeline'].indexOf(view) > -1 ? {
            videoView: view
        } : {}));
        if (time) {
            points = time[0].split(',');
            if (
                points.length == 2 
                && (points = Ox.flatten([points[0], points[1].split('-')]))[2] == ''
            ) {
                pandora.api.get({
                    id: item,
                    keys: ['duration']
                }, function(result) {
                    points[2] = result.data.duration.toString();
                    foundTime();
                });
            } else {
                foundTime();
            }
        } else {
            if (!pandora.user.ui.videoPoints[item]) {
                pandora.UI.set('videoPoints|' + item, {
                    'in': 0, out: 0, position: 0
                });
            }
            foundTime();
        }
        function foundTime() {
            if (time) {
                // fixme: this is duplicated, see Ox.VideoPlayer() parsePositionInput()
                points = points.map(function(point, i) {
                    var parts = point.split(':').reverse();
                    while (parts.length > 3) {
                        parts.pop();
                    }
                    return parts.reduce(function(prev, curr, i) {
                        return prev + (parseFloat(curr) || 0) * Math.pow(60, i);
                    }, 0);
                });
                pandora.UI.set('videoPoints|' + item, {
                    'in': points.length == 1 ? 0 : points[points.length - 2],
                    out: points.length == 1 ? 0 : points[points.length - 1],
                    position: points[0],
                });
                points = points.map(function(point) {
                    return point == -1 ? '' : Ox.formatDuration(point, 3).replace(/\.000$/, '');
                });
                split[split.length - 1] = points[0] + (
                    points.length == 1 ? '' : ',' + points[1] + '-' + points[2]
                );
            }
            pandora.URL.replace(split.join('/'));
            // on page load, we have to check if the item is in the previously selected list
            // if it is not, the movie browser has to be reloaded
            if (pandora.user.ui.list) {
                pandora.user.ui.query = {
                    conditions: [{key: 'list', value: pandora.user.ui.list, operator: ''}],
                    operator: '&'
                };
                pandora.api.find({
                    query: pandora.user.ui.query,
                    positions: [pandora.user.ui.item],
                    sort: [{key: 'id', operator: ''}]
                }, function(result) {
                    if (Ox.isUndefined(result.data.positions[pandora.user.ui.item])) {
                        pandora.UI.set({list: ''});
                        pandora.user.ui.query = {conditions:[], operator: '&'};
                    }
                    callback();
                });
            } else {
                callback();
            }
        }
    }
    */


    function getState() {
        return {
            type: pandora.user.ui.section == 'items'
                ? pandora.site.itemsSection
                : pandora.user.ui.section,
            item: pandora.user.ui.item,
            view: !pandora.user.ui.item
                ? pandora.user.ui.listView
                : pandora.user.ui.itemView,
            sort: !pandora.user.ui.item
                ? pandora.user.ui.listSort
                : pandora.isClipView(pandora.user.ui.itemView)
                    ? pandora.user.ui.itemSort : [],
            find: !pandora.user.ui.item
                ? pandora.user.ui.find
                : ''
        };
    }

    function setState(state) {
        Ox.print('STATE:', state)
        var previousUI = pandora.UI.getPrevious();
        // var previousUI = Ox.clone(pandora.user.ui);
        Ox.Request.cancel();
        $('video').each(function() {
            $(this).trigger('stop');
        });
        pandora.user.ui._groupsState = pandora.getGroupsState(pandora.user.ui.find);
        pandora.user.ui._findState = pandora.getFindState(pandora.user.ui.find);
        if (Ox.isEmpty(state)) {
            if (pandora.user.ui.showHome) {
                pandora.$ui.home = pandora.ui.home().showScreen();
                /*
                Ox.print('LIST', pandora.user.ui._list)
                pandora.user.ui._list && pandora.Query.fromString(
                    'find=list:' + pandora.user.ui._list
                );
                */
            } else {
                pandora.UI.set({
                    section: 'items',
                    item: ''
                });
            }                
        } else if (state.page) {
            if (state.page == 'home') {
                //pandora.$ui.home = pandora.ui.home().showScreen();
                pandora.$ui.home = pandora.ui.home().fadeInScreen();
            } else if ([
                'about', 'contact', 'faq', 'news', 'software', 'terms', 'tour'
            ].indexOf(state.page) > -1) {
                pandora.$ui.siteDialog = pandora.ui.siteDialog(state.page).open();
            } else if (state.page == 'help') {
                pandora.$ui.helpDialog = pandora.ui.helpDialog().open();
            } else if (['signup', 'signin'].indexOf(state.page) > -1) {
                if (pandora.user.level == 'guest') {
                    pandora.ui.accountDialog(state.page).open();
                } else {
                    pandora.URL.replace('/');
                }
            } else if (['preferences', 'signout'].indexOf(state.page) > -1) {
                if (pandora.user.level == 'guest') {
                    pandora.URL.replace('/');
                } else if (state.page == 'preferences') {
                    pandora.ui.preferencesDialog().open();
                } else {
                    pandora.ui.accountSignoutDialog().open();
                }
            } else if (state.page == 'api') {
                document.location.href = '/api/';
            }
        } else {
            
            var set = {
                section: state.type == pandora.site.itemsSection ? 'items' : state.type,
                item: state.item,
                //find: state.find
            };

            if (state.view) {
                set[!pandora.user.ui.item ? 'listView' : 'itemView'] = state.view;
            }

            if (state.sort) {
                set[!pandora.user.ui.item ? 'listSort' : 'itemSort'] = state.sort;
            }

            ///*
            if (state.find) {
                set.find = state.find;
            } else {
                var find = pandora.user.ui.find;
                pandora.user.ui._list = pandora.getListsState(find)
                pandora.user.ui._groupsState = pandora.getGroupsState(find);
                pandora.user.ui._findState = pandora.getFindState(find);
            }
            //*/
                
            if (['video', 'timeline'].indexOf(pandora.user.ui.itemView) > -1) {
                if (state.span) {
                    set['videoPoints.' + pandora.user.ui.item] = {
                        position: state.span[0],
                        'in': state.span[1] || 0,
                        out: state.span[2] || 0
                    }
                } else if (!pandora.user.ui.videoPoints[pandora.user.ui.item]) {
                    set['videoPoints.' + pandora.user.ui.item] = {
                        position: 0,
                        'in': 0,
                        out: 0
                    }
                }
            }


            pandora.UI.set(set);

            /*
            if (!pandora.$ui.appPanel) {
                return;
            }

            if (pandora.user.ui.section != previousUI.section) {
                // new section
                pandora.$ui.appPanel.replaceElement(1, pandora.$ui.mainPanel = pandora.ui.mainPanel());
            } else if (!pandora.user.ui.item && !previousUI.item) {
                // list to list
                Ox.print('pUI', previousUI);
                var isClipView = pandora.isClipView(),
                    list = pandora.user.ui.lists[pandora.user.ui.list],
                    previousList = previousUI.lists[previousUI.list],
                    wasClipView = pandora.isClipView(previousList.view);
                if (pandora.user.ui.list != previousUI.list) {
                    pandora.$ui.findElement.replaceWith(pandora.$ui.findElement = pandora.ui.findElement());
                }
                if (list.view != previousList.view) {
                    pandora.$ui.mainMenu.checkItem('viewMenu_movies_' + list.view);
                    pandora.$ui.viewSelect.options({value: list.view});
                    if (isClipView != wasClipView) {
                        pandora.$ui.mainMenu.replaceMenu('sortMenu', pandora.getSortMenu());
                        pandora.$ui.sortSelect.replaceWith(pandora.$ui.sortSelect = pandora.ui.sortSelect());
                        if (isClipView && !wasClipView) {
                            pandora.UI.set('lists.' + pandora.user.ui.list + '.selected', []);
                        }
                    }                    
                }
                if (!Ox.isEqual(list.sort, previousList.sort)) {
                    pandora.$ui.mainMenu.checkItem('sortMenu_sortmovies_' + list.sort[0].key);
                    pandora.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + ((
                        list.sort[0].operator || pandora.getSortOperator(list.sort[0].key)
                    ) == '+' ? 'ascending' : 'descending'));
                    pandora.$ui.sortSelect.options({value: list.sort[0].key});
                }
                pandora.$ui.leftPanel.replaceElement(2, pandora.$ui.info = pandora.ui.info());
                if (Ox.isEqual(pandora.user.ui.find, previousUI.find)) {
                    pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.list = pandora.ui.list());
                } else {
                    pandora.user.ui._groupsState.forEach(function(data, i) {
                        if (!Ox.isEqual(data.find, previousUI._groupsState[i].find)) {
                            pandora.$ui.groups[i].reloadList();
                        }
                    });
                    pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.list = pandora.ui.list());
                    //pandora.$ui.mainPanel.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
                }
                // fixme: should list selection and deselection happen here?
                // (home and menu may cause a list switch)
            } else if (!pandora.user.ui.item || !previousUI.item) {
                // list to item or item to list
                pandora.$ui.leftPanel.replaceElement(2, pandora.$ui.info = pandora.ui.info());
                pandora.$ui.mainPanel.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
            } else {
                // item to item
                if (pandora.user.ui.item != previousUI.item) {
                    pandora.$ui.leftPanel.replaceElement(2, pandora.$ui.info = pandora.ui.info());
                }
                pandora.$ui.contentPanel.replaceElement(1, pandora.ui.item());
            }
            if (
                previousUI.item
                && ['video', 'timeline'].indexOf(previousUI.itemView) > -1
            ) {
                var $item = pandora.$ui[
                    previousUI.itemView == 'video' ? 'player' : 'editor'
                ];
                $item && pandora.UI.set(
                    'videoPoints.' + previousUI.item + '.position',
                    $item.options('position')
                );
            }
            */
            
        }
        pandora.user.ui.showHome = false;
        
    }

    function updateUI() {
        // remove later
        var previousUI = pandora.UI.getPrevious();
        Ox.Request.cancel();
        $('video').each(function() {
            $(this).trigger('stop');
        });
        pandora.URL.parse(function() {
            if (pandora.user.ui.section != previousUI.section) {
                pandora.$ui.appPanel.replaceElement(1, pandora.$ui.mainPanel = pandora.ui.mainPanel());
            } else if (!pandora.user.ui.item && !previousUI.item) {
                // list to list
                var isClipView = pandora.isClipView(),
                    list = pandora.user.ui.lists[pandora.user.ui.list],
                    previousList = previousUI.lists[previousUI.list],
                    wasClipView = pandora.isClipView(previousList.view);
                if (list.view != previousList.view) {
                    pandora.$ui.mainMenu.checkItem('viewMenu_movies_' + list.view);
                    pandora.$ui.viewSelect.options({value: list.view});
                    if (isClipView != wasClipView) {
                        pandora.$ui.mainMenu.replaceMenu('sortMenu', pandora.getSortMenu());
                        pandora.$ui.sortSelect.replaceWith(pandora.$ui.sortSelect = pandora.ui.sortSelect());
                        if (isClipView && !wasClipView) {
                            pandora.UI.set('lists.' + pandora.user.ui.list + '.selected', []);
                        }
                    }                    
                }
                if (!Ox.isEqual(list.sort, previousList.sort)) {
                    pandora.$ui.mainMenu.checkItem('sortMenu_sortmovies_' + list.sort[0].key);
                    pandora.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + ((
                        list.sort[0].operator || pandora.getSortOperator(list.sort[0].key)
                    ) == '+' ? 'ascending' : 'descending'));
                    pandora.$ui.sortSelect.options({value: list.sort[0].key});
                }
                pandora.$ui.leftPanel.replaceElement(2, pandora.$ui.info = pandora.ui.info());
                if (Ox.isEqual(pandora.user.ui.find, previousUI.find)) {
                    pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.list = pandora.ui.list());
                } else {
                    pandora.$ui.mainPanel.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
                }
                // fixme: should list selection and deselection happen here?
                // (home and menu may cause a list switch)
            } else if (!pandora.user.ui.item || !previousUI.item) {
                // list to item or item to list
                pandora.$ui.leftPanel.replaceElement(2, pandora.$ui.info = pandora.ui.info());
                pandora.$ui.mainPanel.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
            } else {
                // item to item
                if (pandora.user.ui.item != previousUI.item) {
                    pandora.$ui.leftPanel.replaceElement(2, pandora.$ui.info = pandora.ui.info());
                }
                pandora.$ui.contentPanel.replaceElement(1, pandora.ui.item());
            }
            if (
                previousUI.item &&
                ['video', 'timeline'].indexOf(previousUI.itemView) > -1
            ) {
                var $item = pandora.$ui[
                    previousUI.itemView == 'video' ? 'player' : 'editor'
                ];
                $item && pandora.UI.set(
                    'videoPoints.' + previousUI.item + '.position',
                    $item.options('position')
                );
            }
        });
    }

    that.init = function() {

        var itemsSection = pandora.site.itemsSection,
            findKeys, sortKeys = {}, spanType = {}, views = {};

        views[itemsSection] = {
            list: Ox.merge(
                // listView is the default view
                [pandora.user.ui.listView],
                Ox.map(pandora.site.listViews, function(view) {
                    return view.id == pandora.user.ui.listView ? null : view.id;
                })
            ),
            item: Ox.merge(
                // itemView is the default view,
                // videoView is the default view if there is a duration
                [pandora.user.ui.itemView, pandora.user.ui.videoView],
                pandora.site.itemViews.map(function(view) {
                    return [
                        'info', pandora.user.ui.videoView
                    ].indexOf(view.id) > -1 ? null : view.id;
                })
            )
        };

        sortKeys[itemsSection] = {list: {}, item: {}};
        views[itemsSection].list.forEach(function(view) {
            sortKeys[itemsSection].list[view] = Ox.merge(
                // listSort[0].key is the default sort key
                Ox.getObjectById(pandora.site.sortKeys, pandora.user.ui.listSort[0].key)
                    || pandora.isClipView(view)
                        && Ox.getObjectById(pandora.site.clipKeys, pandora.user.ui.listSort[0].key)
                    || [],
                pandora.isClipView(view) ? Ox.map(pandora.site.clipKeys, function(key) {
                    return key.id == pandora.user.ui.listSort[0].key ? null : key;
                }) : [],
                Ox.map(pandora.site.sortKeys, function(key) {
                    return key.id == pandora.user.ui.listSort[0].key ? null : key;
                })
            );
        });
        views[itemsSection].item.forEach(function(view) {
            if (pandora.isClipView(view, true)) {
                sortKeys[itemsSection].item[view] = Ox.merge(
                    // itemSort[0].key is the default sort key
                    [Ox.getObjectById(pandora.site.clipKeys, pandora.user.ui.itemSort[0].key)],
                    Ox.map(pandora.site.clipKeys, function(key) {
                        return key.id == pandora.user.ui.itemSort ? null : key;
                    })
                );
            }
        });

        spanType[itemsSection] = {
            list: {
                map: 'location',
                calendar: 'date'
            },
            item: {
                video: 'duration',
                timeline: 'duration',
                map: 'location',
                calendar: 'date'
            }
        };

        findKeys = Ox.merge([{id: 'list', type: 'string'}], pandora.site.itemKeys);

        self.URL = Ox.URL({
            findKeys: findKeys,
            getItem: pandora.getItemByIdOrTitle,
            getSpan: pandora.getMetadataByIdOrName,
            pages: [
                'about', 'api', 'contact', 'faq', 'help', 'home', 'news',
                'preferences', 'signin', 'signout', 'signup',
                'software', 'terms', 'tour'
            ],
            sortKeys: sortKeys,
            spanType: spanType,
            types: [pandora.site.itemName.plural.toLowerCase(), 'edits', 'texts'],
            views: views
        });

        return that;

    };

    // on page load, this sets the state from the URL
    that.parse = function(callback) {
        if (document.location.pathname.substr(0, 4) == 'url=') {
            document.location.href = decodeURI(document.location.pathname.substr(4));
        } else {
            self.URL.parse(function(state) {
                setState(state);
                callback();
            });
        }
        return that;
    };

    // sets the URL to the previous URL
    that.pop = function() {
        self.URL.pop();
    };

    // pushes a new URL (as string or from state)
    that.push = function(url) {
        Ox.print('push', arguments[0])
        if (url) {
            self.URL.push(url, setState);
        } else {
            var state = getState();
            Ox.print('&&&&&&&', state)
            self.URL.push(state);
            //setState(state);
        }
        return that;
    };

    // replaces the current URL (as string or from state)
    that.replace = function(url) {
        if (url) {
            self.URL.replace(url, setState)
        } else {
            self.URL.replace(getState());
        }
        return that;
    };

    return that;

    /*
        parse: function(callback) {
            var pathname = document.location.pathname.substr(1),
                search = document.location.search.substr(1);
            if (/\/$/.test(pathname)) {
                pathname = pathname.substr(0, pathname.length - 1);
            }
            Ox.forEach(regexps, function(fn, re) {
                re = new RegExp(re);
                if (re.test(pathname)) {
                    Ox.print('URL re ' + re);
                    fn(pathname, search, function() {
                        pandora.Query.updateGroups();
                        pandora.user.ui.showHome = false;
                        callback();
                    });
                    return false;
                }
            });
        },

        push: function(title, url) {
            if (arguments.length == 1) { // fixme: remove later
                url = title;
            }
            if (url[0] != '/') {
                url = '/' + url;
            }
            saveURL();
            history.pushState({}, pandora.site.site.name + (title ? ' - ' + title : ''), url);
        },

        pushPrevious: function() {
            history.pushState({}, '', previousURL);
        },

        set: function(title, url) {
            if (arguments.length == 1) { // fixme: remove later
                url = title;
            }
            if (url[0] != '/') {
                url = '/' + url;
            }
            history.pushState({}, pandora.site.site.name + (title ? ' - ' + title : ''), url);
            updateURL();
        },

        replace: function(title, url) {
            if (arguments.length == 1) { // fixme: remove later
                url = title;
            }
            if (url[0] != '/') {
                url = '/' + url;
            }
            saveURL();
            history.replaceState({}, pandora.site.site.name + (title ? ' - ' + title : ''), url);
        },

        update: function() {
            this.set(pandora.Query.toString());
        }

    */

}());
