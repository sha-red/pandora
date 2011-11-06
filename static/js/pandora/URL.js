// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.URL = (function() {

    var self = {}, that = {};

    function getState(keys) {

        Ox.Log('GET STATE, UI', pandora.user.ui)

        var state = {};

        state.type = pandora.site.itemsSection;

        state.item = pandora.user.ui.item;

        if (!pandora.user.ui.item) {
            state.view = pandora.user.ui.listView;
            state.sort = pandora.user.ui.listSort;
            state.find = pandora.user.ui.find;
        } else {
            state.view = pandora.user.ui.itemView;
            state.sort = pandora.user.ui.itemSort;
        }

        if (state.view == 'map') {
            state.span = pandora.user.ui.mapFind
                ? '@' + pandora.user.ui.mapFind
                : pandora.user.ui.mapSelection
                ? '@' + pandora.user.ui.mapSelection
                : '';
        } else if (state.view == 'calendar') {
            // ...
        } else if (['video', 'timeline'].indexOf(state.view) > -1) {
            var videoPoints = pandora.user.ui.videoPoints[state.item] || {};
            state.span = Ox.merge(
                videoPoints.position
                    ? videoPoints.position
                    : [],
                videoPoints['in'] || videoPoints.out
                    ? [videoPoints['in'], videoPoints.out]
                    : []
            );
        }

        Ox.Log('STATE .................... ->', state)

        return state;

    }

    function setState(state, callback) {

        pandora.user.ui._list = pandora.getListState(pandora.user.ui.find);
        pandora.user.ui._filterState = pandora.getFilterState(pandora.user.ui.find);
        pandora.user.ui._findState = pandora.getFindState(pandora.user.ui.find);

        if (Ox.isEmpty(state)) {

            if (pandora.user.ui.showHome) {
                pandora.$ui.home = pandora.ui.home().showScreen();
            }
            callback && callback();

        } else if (state.page) {

            if (state.page == 'home') {
                //pandora.$ui.home = pandora.ui.home().showScreen();
                pandora.$ui.home = pandora.ui.home().fadeInScreen();
            } else if (
                Ox.getPositionById(pandora.site.sitePages, state.page) > -1
                || state.page == 'software'
            ) {
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
                item: state.item
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
                        out: Math.max(state.span[1] || 0, state.span[2] || 0)
                    }
                } else if (state.view == 'map') {
                    // fixme: this doesn't handle map coordinates
                    if (state.span[0] != '@') {
                        //pandora.user.ui.mapSelection = state.span;
                        set['mapSelection'] = state.span;
                        set['mapFind'] = '';
                    } else {
                        //pandora.user.ui.mapFind = state.span.substr(1);
                        set['mapFind'] = state.span.substr(1);
                        set['mapSelection'] = '';
                    }
                } else if (state.view == 'calendar') {
                    // ...
                }
            }

            if (state.sort) {
                set[!state.item ? 'listSort' : 'itemSort'] = state.sort;
            }

            if (state.find) {
                if (!state.item) {
                    set.find = state.find;
                } else if (pandora.isItemFind(state.find)) {
                    set.itemFind = state.find;
                }
            }

            Ox.Request.cancel();
            $('video').each(function() {
                $(this).trigger('stop');
            });

            if (!pandora.$ui.appPanel && state.item && find) {
                // on page load, if item is set and there was a query,
                // we have to check if the item actually matches the query,
                // and otherwise reset find
                pandora.api.find({
                    query: find,
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
                Ox.map(pandora.site.itemViews, function(view) {
                    return [
                        pandora.user.ui.itemView, pandora.user.ui.videoView
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
                'preferences', 'rights', 'signin', 'signout', 'signup',
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
            if (
                pandora.user.ui.item
                && pandora.user.ui.itemView == 'video'
                && pandora.$ui.player.options('fullscreen')
            ) {
                //pandora.$ui.player.options({fullscreen: false});
                $('body > .OxVideoPlayer').remove();
            }
            if (!Ox.isEmpty(e.state)) {
                Ox.Log('', 'E.STATE', e.state)
                document.title = e.state.title;
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
            self.URL.push(null, pandora.getPageTitle(), url, setState);
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
            self.URL.replace(null, pandora.getPageTitle(), url, setState)
        } else {
            self.URL.replace(getState());
        }
        return that;
    };

    that.update = function(keys) {
        Ox.Log('', 'update.........', keys)
        // this gets called from pandora.UI
        var action, state;
        if (!keys) {
            // may get called from home screen too
            keys = !pandora.user.ui.item
                ? ['listView', 'listSort', 'find']
                : ['item', 'itemView', 'itemSort'];
        }
        if (self.isPopState) {
            self.isPopState = false;
        } else {
            if (
                !pandora.$ui.appPanel
                || keys.every(function(key) {
                    return [
                            'listColumnWidth', 'listColumns', 'listSelection',
                            'mapFind', 'mapSelection'
                        ].indexOf(key) > -1
                        || /^videoPoints/.test(key);
                })
            ) {
                action = 'replace';
            } else {
                action = 'push';
            }
            state = getState();
            self.URL[action](state, pandora.getPageTitle(), state);
        }
    };

    return that;

}());
