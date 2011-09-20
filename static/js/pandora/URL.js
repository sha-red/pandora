// vim: et:ts=4:sw=4:sts=4:ft=javascript


pandora.URL = (function() {

    var previousUI = {},
        previousURL = '',
        regexps = {
            '^$': function(pathname, search) {
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
            },
            '^home$': function(pathname, search) {
                pandora.$ui.home = pandora.ui.home().showScreen();
            },
            '^(items|edits|texts)$': function(pathname, search) {
                pandora.UI.set({
                    section: pathname
                });
            },
            '^(about|contact|faq|news|software|terms|tour)$': function(pathname, search) {
                pandora.$ui.siteDialog = pandora.ui.siteDialog(pathname).open();
            },
            '^help$': function(pathname, search) {
                pandora.$ui.helpDialog = pandora.ui.helpDialog().open();
            },
            '^(signin|signout|signup)$': function(pathname, search) {
                if ((pathname == 'signout') == (pandora.user.level != 'guest')) {
                    pandora.$ui.accountDialog = (
                        pandora.user.level == 'guest'
                        ? pandora.ui.accountDialog(pathname)
                        : pandora.ui.accountSignoutDialog()
                    ).open();
                }
            },
            '^preferences$': function(pathname, search) {
                pandora.$ui.preferencesDialog = pandora.ui.preferencesDialog().open();
            },
            '^(calendar|calendars|clip|clips|flow|grid|list|map|maps|timelines)$': function(pathname, search) {
                pandora.UI.set({
                    section: 'items',
                    item: ''
                });
                pandora.UI.set('lists|' + pandora.user.ui.list + '|listView', pathname);
                pandora.Query.fromString(search);
            },
            '^[0-9A-Z]': function(pathname, search) {
                var split = pathname.split('/'),
                    item = split[0],
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
                pandora.UI.set(Ox.extend({
                    section: 'items',
                    item: item,
                    itemView: view
                }, ['player', 'timeline'].indexOf(view) > -1 ? {
                    videoView: view
                } : {}));
                if (time) {
                    points = time[0].split(',');
                    if (points.length == 2) {
                        points = Ox.flatten([points[0], points[1].split('-')]);
                        if (points[2] == '') {
                            points[2] = '-1';
                        }
                    }
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
                    pandora.URL.replace(split.join('/'));
                } else if (!pandora.user.ui.videoPoints[item]) {
                    pandora.UI.set('videoPoints|' + item, {
                        'in': 0, out: 0, position: 0
                    });
                }
            },
            '.*': function(pathname, search) {
                var query = search || 'find=' + pathname;
                pandora.UI.set({
                    section: 'items',
                    item: ''
                });
                pandora.Query.fromString(query);
                pandora.URL.replace('?' + query);
            }
        };

    function saveURL() {
        previousURL = document.location.pathname + document.location.search;
    }

    return {

        parse: function() {
            var pathname = document.location.pathname.substr(1),
                search = document.location.search.substr(1);
            if (/\/$/.test(pathname)) {
                pathname = pathname.substr(0, pathname.length - 1);
            }
            /*
            var url = document.location.pathname.substr(1)
                    + document.location.search
                    + document.location.hash;
            */
            Ox.forEach(regexps, function(fn, re) {
                re = new RegExp(re);
                if (re.test(pathname)) {
                    Ox.print('URL re ' + re);
                    fn(pathname, search);
                    return false;
                }
            });
            pandora.Query.updateGroups();
            pandora.user.ui.showHome = false;
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
            this._update();
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

        _update: function() {
            // fixme: make this method private
            var previousUI = pandora.UI.getPrevious();
            Ox.print('now', pandora.user.ui, 'previously', previousUI)
            Ox.Request.cancel();
            $('video').each(function() {
                $(this).trigger('stop');
            });
            this.parse();
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
                    Ox.print('is', isClipView, 'was', wasClipView);
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
                    pandora.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + (
                        list.sort[0].operator == '' ? pandora.getSortOperator(list.sort[0].key)
                        : list.sort[0].operator == '+' ? 'ascending' : 'descending'
                    ));
                    pandora.$ui.sortSelect.options({value: list.sort[0].key});
                }
                pandora.$ui.leftPanel.replaceElement(2, pandora.$ui.info = pandora.ui.info());
                Ox.print('EQUAL?', pandora.user.ui.query, previousUI.query, Ox.isEqual(pandora.user.ui.query, previousUI.query))
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
        }

    };

}());
