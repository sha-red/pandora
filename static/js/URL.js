'use strict';

pandora.URL = (function() {

    var self = {}, that = {};

    // translates UI settings to URL state
    function getState() {

        Ox.Log('URL', 'getState:, UI', pandora.user.ui)

        var state = {};

        if (pandora.user.ui.page) {

            state.page = pandora.user.ui.page;
            if (
                Ox.contains(Object.keys(pandora.site.user.ui.part), state.page)
            ) {
                state.part = pandora.user.ui.part[state.page];
                if (
                    state.page == 'document'
                    && pandora.user.ui.documents[state.part]
                    && (
                        pandora.user.ui.documents[state.part].position ||
                        pandora.user.ui.documents[state.part].name
                    )
                ) {
                    state.span = pandora.user.ui.documents[state.part].position ||
                        pandora.user.ui.documents[state.part].name;
                }
            }

        } else {

            state.type = pandora.user.ui.section == 'items'
                ? pandora.site.itemsSection : pandora.user.ui.section;
            state.item = pandora.user.ui[pandora.user.ui.section.slice(0, -1)];

            if (pandora.user.ui.section == 'items') {
                if (!pandora.user.ui.item) {
                    state.view = pandora.user.ui.listView;
                    state.sort = [pandora.user.ui.listSort[0]];
                    state.find = pandora.user.ui.find;
                } else {
                    state.view = pandora.user.ui.itemView;
                    state.sort = [pandora.user.ui.itemSort[0]];
                }
                if (state.view == 'map') {
                    state.span = pandora.user.ui.mapFind
                        ? '@' + pandora.user.ui.mapFind
                        : pandora.user.ui.mapSelection
                        ? '@' + pandora.user.ui.mapSelection
                        : '';
                } else if (state.view == 'calendar') {
                    // ...
                } else if (
                    ['timeline', 'player', 'editor'].indexOf(state.view) > -1
                ) {
                    var videoPoints = pandora.user.ui.videoPoints[state.item] || {};
                    state.span = videoPoints.annotation || [].concat(
                        videoPoints.position
                            ? videoPoints.position
                            : [],
                        videoPoints['in'] || videoPoints.out
                            ? [videoPoints['in'], videoPoints.out]
                            : []
                    );
                }
            } else if (pandora.user.ui.section == 'documents') {
                if (!pandora.user.ui.document) {
                    state.view = pandora.user.ui.collectionView;
                    state.sort = [pandora.user.ui.collectionSort[0]];
                    state.find = pandora.user.ui.findDocuments;
                } else {
                    var documentState = pandora.user.ui.documents[state.item] || {},
                        position = documentState.position || 0;
                    if (pandora.user.ui.documentView == 'view') {
                        if (documentState.name) {
                            state.span = documentState.name;
                        } else if (position) {
                            state.span = [position];
                        }
                    } else {
                        state.view = pandora.user.ui.documentView;
                    }
                    state.sort = [pandora.user.ui.collectionSort[0]];
                }
            } else if (pandora.user.ui.section == 'edits') {
                var editPoints = pandora.user.ui.edits[state.item] || {};
                if (state.item) {
                    state.view = pandora.user.ui.editView;
                    state.sort = [pandora.user.ui.editSort[0]];
                }
                state.span = editPoints.clip || [].concat(
                    editPoints.position
                        ? editPoints.position
                        : [],
                    editPoints['in'] || editPoints.out
                        ? [editPoints['in'], editPoints.out]
                        : []
                );
            } else if (pandora.user.ui.section == 'texts') {
                var textState = pandora.user.ui.texts[state.item] || {},
                    position = textState.position || 0;
                if (textState.name) {
                    state.span = textState.name;
                } else if (position) {
                    state.span = [position];
                }
            }
        }

        if (
            pandora.user.ui._hash && (
                pandora.user.ui._hash.anchor
                || !Ox.isEmpty(pandora.user.ui._hash.query)
            )
        ) {
            state.hash = {};
            if (pandora.user.ui._hash.anchor) {
                state.hash.anchor = pandora.user.ui._hash.anchor;
            }
            if (!Ox.isEmpty(pandora.user.ui._hash.query)) {
                state.hash.query = pandora.user.ui._hash.query;
            }
        }

        Ox.Log('URL', 'GOT STATE ...', state)

        return state;

    }

    // translates URL state to UI settings
    function setState(state, callback) {

        var set = {};

        Ox.Log('URL', 'setState:', state);
        if (state.type == 'texts') {
            state.type = 'documents';
        }

        pandora.user.ui._list = pandora.getListState(pandora.user.ui.find);
        pandora.user.ui._filterState = pandora.getFilterState(pandora.user.ui.find);
        pandora.user.ui._documentFilterState = pandora.getDocumentFilterState(pandora.user.ui.findDocuments);
        pandora.user.ui._findState = pandora.getFindState(pandora.user.ui.find);
        pandora.user.ui._collection = pandora.getCollectionState(pandora.user.ui.findDocuments);
        pandora.user.ui._findDocumentsState = pandora.getFindDocumentsState(pandora.user.ui.findDocuments);

        if (Ox.isEmpty(state)) {

            callback && callback();

        } else {

            pandora.user.ui._hash = state.hash;
            if (
                state.hash
                && !Ox.contains(['embed', 'print'], state.hash.anchor)
                && state.hash.query
            ) {
                state.hash.query.forEach(function(kv) {
                    set[kv.key] = kv.value;
                });
            }

            if (state.page) {

                set.page = state.page;
                if (Ox.contains(
                    Object.keys(pandora.site.user.ui.part), state.page
                ) && state.part) {
                    set['part.' + state.page] = state.part;
                }
                if (state.span) {
                    set['documents.' + state.part] = {position: state.span};
                }
                pandora.UI.set(set);
                callback && callback();

            } else {

                set.page = '';

                if (state.type) {
                    set.section = state.type == pandora.site.itemsSection
                        ? 'items' : state.type
                    set[set.section.slice(0, -1)] = state.item;
                }

                if (set.section == 'items') {

                    if (state.view) {
                        set[!state.item ? 'listView' : 'itemView'] = state.view;
                    }

                    if (state.span) {
                        if (['timeline', 'player', 'editor'].indexOf(state.view) > -1) {
                            if (Ox.isArray(state.span)) {
                                set['videoPoints.' + state.item] = {
                                    annotation: '',
                                    'in': state.span[state.span.length - 2] || 0,
                                    out: state.span.length == 1 ? 0 : Math.max(
                                        state.span[state.span.length - 2],
                                        state.span[state.span.length - 1]
                                    ),
                                    position: state.span[0]
                                };                       
                            } else {
                                set[
                                    'videoPoints.' + state.item + '.annotation'
                                ] = state.span;
                            }
                        } else if (state.view == 'map') {
                            // fixme: this doesn't handle map coordinates
                            if (state.span[0] != '@') {
                                set.mapSelection = state.span;
                                set.mapFind = '';
                            } else {
                                set.mapFind = state.span.slice(1);
                                set.mapSelection = '';
                            }
                        } else if (state.view == 'calendar') {
                            // fixme: this is still very much unclear
                            if (
                                state.span.length == 1
                                && /^\d/.test(state.span)
                            ) {
                                set.calendarFind = state.span[0];
                            } else if (state.span.length == 2) {
                                set.calendarFind = state.span[0];
                            }
                        }
                    }

                    if (state.sort) {
                        set[!state.item ? 'listSort' : 'itemSort'] = state.sort;
                    }

                    if (!state.item) {
                        if (state.find) {
                            set.find = state.find;
                        } else if (!pandora.$ui.appPanel) {
                            // when loading results without find, clear find, so that
                            // removing a query and reloading works as expected
                            set.find = pandora.site.user.ui.find;
                        }
                    }
                } else if (state.type == 'documents') {
                    if (state.view) {
                        set[!state.item ? 'collectionView' : 'documentView'] = state.view;
                    }
                    if (state.span) {
                        if (Ox.isNumber(state.span)) {
                            set['documents.' + state.item] = {position: state.span};
                        } else {
                            set['documents.' + state.item] = {name: state.span};
                        }
                    }
                    if (!state.item && state.find) {
                        set.findDocuments = state.find;
                    }
                } else if (state.type == 'edits') {

                    if (state.view) {
                        set.editView = state.view;
                    }

                    if (state.sort) {
                        set.editSort = state.sort;
                    }

                    if (state.span) {
                        var key = 'edits.' + pandora.UI.encode(state.item);
                        set[key] = {};
                        if (Ox.isArray(state.span)) {
                            set[key + '.clip'] = '';
                            set[key + '.in'] = state.span[state.span.length - 2] || 0;
                            set[key + '.out'] = state.span.length == 1 ? 0 : Math.max(
                                state.span[state.span.length - 2],
                                state.span[state.span.length - 1]
                            );
                            set[key + '.position'] = state.span[0];
                        } else {
                            set[key + '.clip'] = state.span;
                        }
                    }
                }

                Ox.Request.cancel();
                $('video').each(function() {
                    $(this).trigger('stop');
                });

                Ox.Log('URL', 'UI.set', set)
                if (!pandora.$ui.appPanel && state.item && pandora.user.ui.find) {
                    // on page load, if item is set and there was a query,
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

        }

    }

    function getOptions () {

        var itemsSection = pandora.site.itemsSection,
            sortKeys = {}, views = {};

        views[itemsSection] = {
            // listView is the default view
            list: [pandora.user.ui.listView].concat(
                pandora.site.listViews.filter(function(view) {
                    return view.id != pandora.user.ui.listView
                }).map(function(view) {
                    return view.id;
                })
            ),
            // itemView is the default view,
            // videoView is the default view if there is a duration
            item: [pandora.user.ui.itemView, pandora.user.ui.videoView].concat(
                pandora.site.itemViews.filter(function(view) {
                    return [
                        pandora.user.ui.itemView, pandora.user.ui.videoView
                    ].indexOf(view.id) == -1;
                }).map(function(view) {
                     return view.id;
                })
            )
        };

        sortKeys[itemsSection] = {list: {}, item: {}};
        views[itemsSection].list.forEach(function(view) {
            sortKeys[itemsSection].list[view] = [].concat(
                // listSort[0].key is the default sort key
                Ox.getObjectById(pandora.site.sortKeys, pandora.user.ui.listSort[0].key)
                    || pandora.isClipView(view)
                        && Ox.getObjectById(pandora.site.clipKeys, pandora.user.ui.listSort[0].key)
                    || [],
                pandora.isClipView(view) ? pandora.site.clipKeys.filter(function(key) {
                    return key.id != pandora.user.ui.listSort[0].key;
                }) : [],
                pandora.site.sortKeys.filter(function(key) {
                    return key.id != pandora.user.ui.listSort[0].key;
                })
            );
        });
        views[itemsSection].item.forEach(function(view) {
            if (pandora.isClipView(view, true)) {
                // itemSort[0].key is the default sort key
                sortKeys[itemsSection].item[view] = [
                    Ox.getObjectById(
                        pandora.site.clipKeys,
                        pandora.user.ui.itemSort[0].key
                    )
                ].concat(
                    pandora.site.clipKeys.filter(function(key) {
                        return key.id != pandora.user.ui.itemSort[0].key;
                    })
                );
            }
        });

        // Edits
        views['edits'] = {
            list: [],
            item: ['list', 'grid', 'annotations']
        };
        sortKeys['edits'] = {
            list: {},
            item: {}
        };
        views['edits'].item.forEach(function(view) {
            sortKeys['edits'].item[view] = [
                    {id: 'index', operator: '+'}
                ]
                .concat(pandora.site.clipKeys)
                .concat(pandora.site.itemKeys);
        });

        // Documents
        views['documents'] = {
            list: ['grid', 'list', 'pages'],
            item: ['view', 'info', 'data']
        };
        sortKeys['documents'] = {
            list: {
                list: pandora.site.documentKeys,
                grid: pandora.site.documentKeys,
                pages: pandora.site.documentKeys
            },
            item: {}
        };

        // Texts
        views['texts'] = {
            list: [],
            item: ['text']
        };
        sortKeys['texts'] = {
            list: {},
            item: {}
        };
        return {
            views: views,
            sortKeys: sortKeys
        };

    }

    that.init = function() {

        var itemsSection = pandora.site.itemsSection,
            findKeys = {}, spanType = {};

        spanType[itemsSection] = {
            list: {
                map: 'location',
                calendar: 'date'
            },
            item: {
                timeline: 'duration',
                player: 'duration',
                editor: 'duration',
                map: 'location',
                calendar: 'date'
            }
        };
        spanType['edits'] = {
            list: {},
            item: {
                list: 'duration',
                grid: 'duration',
                annotations: 'duration'
            }
        };
        spanType['documents'] = {
            list: {},
            item: {
                view: 'string',
            }
        };
        spanType['texts'] = {
            list: {},
            item: {text: 'string'}
        };

        findKeys[itemsSection] = [
            {id: 'list', type: 'string'},
        ].concat(pandora.site.itemKeys);

        findKeys['edits'] = [];
        findKeys['documents'] = [
            {id: 'collection', type: 'string'}
        ].concat(pandora.site.documentKeys);

        self.URL = Ox.URL(Ox.extend({
            findKeys: findKeys,
            getHash: pandora.getHash,
            getItem: pandora.getItem,
            getPart: pandora.getPart,
            getSort: pandora.getSort,
            getSpan: pandora.getSpan,
            pages: [].concat(
                ['home', 'software', 'api', 'help', 'tv', 'document', 'entities'],
                pandora.site.sitePages.map(function(page) {
                    return page.id;
                }),
                ['preferences', 'signup', 'signin', 'signout']
            ),
            spanType: spanType,
            types: [pandora.site.itemName.plural.toLowerCase(), 'edits', 'documents', 'texts'],
        }, getOptions()));

        window.addEventListener('hashchange', function() {
            Ox.Request.cancel();
            that.parse();
        });

        window.addEventListener('popstate', function(e) {
            Ox.Request.cancel();
            self.isPopState = true;
            $('.OxDialog:visible').each(function() {
                Ox.$elements[$(this).data('oxid')].close();
            });
            if (pandora.$ui.home) {
                pandora.UI.set({page: ''});
                pandora.$ui.home.fadeOutScreen();
            } else if (pandora.$ui.tv) {
                pandora.UI.set({page: ''});
                pandora.$ui.tv.fadeOutScreen();
            }
            if (
                pandora.user.ui.item
                && pandora.user.ui.itemView == 'video'
                && pandora.$ui.player
                && pandora.$ui.player.options('fullscreen')
            ) {
                pandora.$ui.player.remove();
            }
            if (e.state && !Ox.isEmpty(e.state)) {
                Ox.Log('URL', 'E.STATE', e.state)
                document.title = Ox.decodeHTMLEntities(e.state.title);
                setState(e.state);
            } else if (window.location.pathname == '/') {
                pandora.$ui.home = pandora.ui.home().fadeInScreen();
            } else {
                that.parse();
            }
        });

        return that;

    };

    // on page load, this sets the state from the URL
    // can also be used to parse a URL
    that.parse = function(url, callback) {
        if (arguments.length == 2) {
            self.URL.parse(url, callback);
        } else {
            callback = arguments[0];
            url = null;
            if (document.location.pathname.slice(0, 4) == 'url=') {
                document.location.href = Ox.decodeURI(
                    document.location.pathname.slice(4)
                );
            } else {
                self.URL.parse(function(state) {
                    // setState -> UI.set -> URL.update
                    setState(state, callback);
                });
            }
        }
        return that;
    };

    // sets the URL to the previous URL
    that.pop = function() {
        self.URL.pop() || that.update();
    };

    // pushes a new URL (as string or from state)
    that.push = function(stateOrURL, expandURL) {
        var state,
            title = pandora.getPageTitle(stateOrURL)
                || pandora.getWindowTitle(),
            url;
        pandora.replaceURL = expandURL;
        if (Ox.isObject(stateOrURL)) {
            state = stateOrURL;
        } else {
            url = stateOrURL;
        }
        self.URL.push(state, title, url, setState);
        return that;
    };

    // replaces the current URL (as string or from state)
    that.replace = function(stateOrURL, title) {
        var state,
            title = pandora.getPageTitle(stateOrURL)
                || pandora.getWindowTitle(),
            url;
        if (Ox.isObject(stateOrURL)) {
            state = stateOrURL;
        } else {
            url = stateOrURL;
        }
        self.URL.replace(state, title, url, setState);
        return that;
    };

    that.update = function(keys) {
        Ox.Log('URL', 'update.........', keys)
        // this gets called from pandora.UI
        var action, state;
        if (!keys) {
            // may get called from home screen too
            keys = !pandora.user.ui.item
                ? ['listView', 'listSort', 'find']
                : ['item', 'itemView', 'itemSort'];
        } else {
            if (keys.some(function(key) {
                return Ox.contains(
                    ['itemSort', 'itemView', 'listSort', 'listView'], key
                );
            })) {
                self.URL.options(getOptions());
            }
        }
        if (self.isPopState) {
            self.isPopState = false;
        } else {
            if (
                !pandora.$ui.appPanel
                || pandora.replaceURL
                || keys.every(function(key) {
                    return [
                            'listColumnWidth', 'listColumns', 'listSelection',
                            'mapFind', 'mapSelection'
                        ].indexOf(key) > -1
                        || /^videoPoints/.test(key)
                        || /^edits/.test(key)
                        || /^texts/.test(key);
                })
            ) {
                action = 'replace';
            } else {
                action = 'push';
            }
            state = getState();
            self.URL[action](
                state,
                pandora.getPageTitle(state) || pandora.getWindowTitle()
            );
            pandora.replaceURL = false;
        }
    };

    return that;

}());
