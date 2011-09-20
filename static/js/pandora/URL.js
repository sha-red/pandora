// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.URL = (function() {

    var previousURL = '',
        regexps = {
            '^$': function(pathname, search, callback) {
                if (/^\?url=/.test(search)) {
                    document.location = decodeURIComponent(search.substr(5));
                } else {
                    if (!search && pandora.user.ui.showHome) {
                        pandora.$ui.home = pandora.ui.home().showScreen();
                        Ox.print('LIST', pandora.user.ui.list)
                        pandora.user.ui.list && pandora.Query.fromString(
                            'find=list:' + pandora.user.ui.list
                        );
                    } else {
                        pandora.Query.fromString(search);
                        pandora.UI.set({
                            section: 'items',
                            item: ''
                        });
                    }
                }
                callback();
            },
            '^home$': function(pathname, search, callback) {
                pandora.$ui.home = pandora.ui.home().showScreen();
                callback();
            },
            '^(items|edits|texts)$': function(pathname, search, callback) {
                pandora.UI.set({
                    section: pathname
                });
                callback();
            },
            '^(about|contact|faq|news|software|terms|tour)$': function(pathname, search, callback) {
                pandora.$ui.siteDialog = pandora.ui.siteDialog(pathname).open();
                callback();
            },
            '^help$': function(pathname, search, callback) {
                pandora.$ui.helpDialog = pandora.ui.helpDialog().open();
                callback();
            },
            '^(signin|signout|signup)$': function(pathname, search, callback) {
                if ((pathname == 'signout') == (pandora.user.level != 'guest')) {
                    pandora.$ui.accountDialog = (
                        pandora.user.level == 'guest'
                        ? pandora.ui.accountDialog(pathname)
                        : pandora.ui.accountSignoutDialog()
                    ).open();
                }
                callback();
            },
            '^preferences$': function(pathname, search, callback) {
                pandora.$ui.preferencesDialog = pandora.ui.preferencesDialog().open();
                callback();
            },
            '^(calendar|calendars|clip|clips|flow|grid|list|map|maps|timelines)$': function(pathname, search, callback) {
                pandora.UI.set({
                    section: 'items',
                    item: ''
                });
                pandora.UI.set('lists|' + pandora.user.ui.list + '|listView', pathname);
                pandora.Query.fromString(search);
                callback();
            },
            '.*': function(pathname, search, callback) {
                var split = pathname.split('/'),
                    item = decodeURI(split[0]),
                    points,
                    time = split.length > 1
                        ? /[\d\.:,-]+/.exec(split[split.length - 1])
                        : null,
                    view = new RegExp(
                            '^(' + pandora.site.itemViews.map(function(v) {
                                return v.id;
                            }).join('|') + ')$'
                        ).exec(split[1]);
                view = view ? view[0]
                    : time ? pandora.user.ui.videoView
                    : pandora.user.ui.itemView;
                pandora.api.get({id: item, keys: ['id']}, function(result) {
                    if (result.status.code == 200) {
                        foundItem();
                    } else {
                        pandora.api.find({
                            query: {
                                conditions: [{key: 'title', value: item, operator: ''}],
                                operator: '&'
                            },
                            sort: [{key: 'votes', operator: ''}], // fixme: not all systems have "votes"
                            range: [0, 100],
                            keys: ['id', 'title', 'votes']
                        }, function(result) {
                            if (result.data.items.length) {
                                var re = {
                                        exact: new RegExp('^' + item + '$', 'i'),
                                        word: new RegExp('\\b' + item + '\\b', 'i')
                                    };
                                item = result.data.items.sort(function(a, b) {
                                    return (parseInt(b.votes) || 0)
                                        + re.word.test(b.title) * 1000000
                                        + re.exact.test(b.title) * 2000000
                                        - (parseInt(a.votes) || 0)
                                        - re.word.test(a.title) * 1000000
                                        - re.exact.test(a.title) * 2000000;
                                })[0].id;
                                split[0] = item;
                                foundItem();
                            } else {
                                pandora.UI.set({
                                    section: 'items',
                                    item: ''
                                });
                                pandora.Query.fromString('?find=' + pathname);
                                pandora.URL.replace('?find=' + pathname);
                                callback();
                            }
                        });
                    }
                });
                function foundItem() {
                    pandora.UI.set(Ox.extend({
                        section: 'items',
                        item: item,
                        itemView: view
                    }, ['player', 'timeline'].indexOf(view) > -1 ? {
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
            }
        };

    function saveURL() {
        previousURL = document.location.pathname + document.location.search;
    }

    function updateURL() {
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
                    wasClipView = pandora.isClipView(previousList.listView);
                if (list.listView != previousList.listView) {
                    pandora.$ui.mainMenu.checkItem('viewMenu_movies_' + list.listView);
                    pandora.$ui.viewSelect.options({value: list.listView});
                    if (isClipView != wasClipView) {
                        pandora.$ui.mainMenu.replaceMenu('sortMenu', pandora.getSortMenu());
                        pandora.$ui.sortSelect.replaceWith(pandora.$ui.sortSelect = pandora.ui.sortSelect());
                        if (isClipView && !wasClipView) {
                            pandora.UI.set('lists|' + pandora.user.ui.list + '|selected', []);
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
                if (Ox.isEqual(pandora.user.ui.query, previousUI.query)) {
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
            // fixme: should be 'video', not 'player'
            if (
                previousUI.item &&
                ['player', 'timeline'].indexOf(previousUI.itemView) > -1
            ) {
                var $item = pandora.$ui[
                    previousUI.itemView == 'player' ? 'player' : 'editor'
                ];
                $item && pandora.UI.set(
                    'videoPoints|' + previousUI.item + '|position',
                    $item.options('position')
                );
            }
        });
    }

    return {

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
        },

    };

}());
