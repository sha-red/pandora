// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.URL = (function() {

    var self = {}, that = {};

    function getState(keys) {
        Ox.print('KEYS', keys)
        var state = {};
        /*
        if (keys.indexOf('type') > -1) {
            state.type = pandora.user.ui.section == 'items'
                ? pandora.site.itemsSection
                : pandora.user.ui.section;
        }
        */
        state.type = pandora.site.itemsSection;
        if (!keys || keys.indexOf('item') > -1) {
            state.item = pandora.user.ui.item;
        }
        if (!keys || keys.indexOf('listView') > -1 || keys.indexOf('itemView') > -1) {
            if (!pandora.user.ui.item) {
                state.view = pandora.user.ui.listView;
            } else {
                state.item = pandora.user.ui.item;
                state.view = pandora.user.ui.itemView;
            }
        }
        if (!keys || keys.filter(function(key) {
            return /^videoPoints/.test(key);
        }).length) {
            var videoPoints = pandora.user.ui.videoPoints;
            state.item = pandora.user.ui.item;
            state.view = pandora.user.ui.itemView;
            state.span = [];
            if (
                pandora.user.ui.item
                && ['video', 'timeline'].indexOf(pandora.user.ui.itemView) > -1
                && videoPoints[pandora.user.ui.item]
            ) {
                videoPoints = videoPoints[pandora.user.ui.item];
                state.span = Ox.merge(
                    videoPoints.position
                        ? videoPoints.position
                        : [],
                    videoPoints['in'] || videoPoints.out
                        ? [videoPoints['in'], videoPoints.out]
                        : []
                );
            }
        }
        if (!keys || keys.indexOf('listSort') > -1 || keys.indexOf('itemSort') > -1) {
            if (!pandora.user.ui.item) {
                state.view = pandora.user.ui.listView;
                state.sort = pandora.user.ui.listSort;
            } else {
                state.item = pandora.user.ui.item;
                state.view = pandora.user.ui.itemView;
                state.sort = pandora.user.ui.itemSort;
            }
            /*
            : pandora.isClipView(pandora.user.ui.itemView)
                ? pandora.user.ui.itemSort : [],
            */
        }
        if (!state.item) {
            state.find = pandora.user.ui.find;
        }
        Ox.print('STATE .................... ->', state)
        return state;
    }

    function setState(state, callback) {

        Ox.print('SET STATE:', state)
        var find, previousUI = pandora.UI.getPrevious();

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
                /*
                pandora.UI.set({
                    section: 'items',
                    item: ''
                });
                */
            }
            callback && callback();

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
                    pandora.$ui.accountDialog = pandora.ui.accountDialog(state.page).open();
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
            callback && callback();

        } else {
            
            var set = {
                section: state.type == pandora.site.itemsSection ? 'items' : state.type,
                item: state.item,
                //find: state.find
            };

            if (state.view) {
                set[!state.item ? 'listView' : 'itemView'] = state.view;
            }

            if (state.span) {
                if (['video', 'timeline'].indexOf(state.view) > -1) {
                    // fixme: this doesn't handle annotation ids
                    set['videoPoints.' + state.item] = {
                        position: state.span[0],
                        'in': state.span[1] || 0,
                        out: state.span[2] || 0
                    }
                } else if (state.view == 'map') {
                    // fixme: this doesn't handle map coordinates
                    if (state.span[0] != '@') {
                        pandora.user.ui.mapSelection = state.span;
                        //set['mapSelection'] = state.span;
                        //set['mapFind'] = '';
                    } else {
                        pandora.user.ui.mapFind = state.span.substr(1);
                        //set['mapFind'] = state.span.substr(1);
                        //set['mapSelection'] = '';
                    }
                }
            }

            if (state.sort) {
                set[!state.item ? 'listSort' : 'itemSort'] = state.sort;
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

            if (!pandora.$ui.appPanel && state.item && pandora.user.ui.find) {
                // on page load, if item is set and there is or was a query,
                // we have to check if the item actually matches the query,
                // and otherwise reset find
                pandora.api.find({
                    query: pandora.user.ui.find,
                    positions: [state.item],
                    sort: [{key: 'id', operator: ''}]
                }, function(result) {
                    if (Ox.isUndefined(result.data.positions[state.item])) {
                        set.find = pandora.site.user.ui.find
                    }
                    pandora.UI.set(set);
                    callback && callback();
                });
            } else {
                pandora.UI.set(set);
                callback && callback();
            }

        }

        pandora.user.ui.showHome = false;
        
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
                        return key.id == pandora.user.ui.itemSort[0].key ? null : key;
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

        ///*
        window.onhashchange = function() {
            Ox.Request.cancel();
            that.parse();
        };
        window.onpopstate = function(e) {
            Ox.Request.cancel();
            self.isPopState = true;
            if (!Ox.isEmpty(e.state)) {
                Ox.print('E.STATE', e.state)
                setState(e.state);
            } else {
                that.parse();
            }
        };
        //*/

        return that;

    };

    // on page load, this sets the state from the URL
    that.parse = function(callback) {
        if (document.location.pathname.substr(0, 4) == 'url=') {
            document.location.href = decodeURI(document.location.pathname.substr(4));
        } else {
            self.URL.parse(function(state) {
                setState(state, callback); // setState -> UI.set -> URL.update
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
        if (url) {
            self.URL.push(null, '', url, setState);
        } else {
            // fixme
            //alert('DO YOU REALLY WANT TO CALL PUSH WITHOUT URL?')
            //self.URL.push(getState());
        }
        return that;
    };

    // replaces the current URL (as string or from state)
    that.replace = function(url) {
        if (url) {
            self.URL.replace(null, '', url, setState)
        } else {
            self.URL.replace(getState());
        }
        return that;
    };

    that.update = function(keys) {
        Ox.print('update.........', keys)
        // this gets called from pandora.UI
        var action;
        if (self.isPopState) {
            self.isPopState = false;
        } else {
            if (
                !pandora.$ui.appPanel
                || keys.every(function(key) {
                    return /^videoPoints/.test(key);
                })
            ) {
                action = 'replace'
            } else {
                action = 'push'
            }
            self.URL[action](getState(), 'title', getState(keys));            
        }
    };

    return that;

}());
