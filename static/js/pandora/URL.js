// vim: et:ts=4:sw=4:sts=4:ft=javascript


pandora.URL = (function() {

    var regexps = {
            '^(|home)$': function(url) {
                if (url == 'home' || pandora.user.ui.showHome) {
                    //$('.OxLoadingScreen').stop().remove();
                    pandora.$ui.home = pandora.ui.home().showScreen();
                    pandora.user.ui.showHome = false;
                }
                pandora.Query.updateGroups();
            },
            '^\\?url=': function(url) {
                Ox.print('URL', url)
                document.location = decodeURIComponent(url.substr(5));
            },
            '^\\?': function(url) {
                pandora.Query.fromString(url);
                pandora.UI.set({
                    section: 'items',
                    item: ''
                });
            },
            '^(about|faq|home|news|software|terms|tour)$': function(url) {
                pandora.$ui.siteDialog = pandora.ui.siteDialog(url).open();
                pandora.Query.updateGroups();
            },
            '^(signin|signout|signup)$': function(url) {
                if ((url == 'signout') == (pandora.user.level != 'guest')) {
                    pandora.$ui.accountDialog = (
                        pandora.user.level == 'guest'
                        ? pandora.ui.accountDialog(url)
                        : pandora.ui.accountSignoutDialog()
                    ).open();
                }
                pandora.Query.updateGroups();
            },
            '^preferences$': function() {
                pandora.$ui.preferencesDialog = pandora.ui.preferencesDialog().open();
                pandora.Query.updateGroups();
            },
            '^help$': function() {
                pandora.$ui.helpDialog = pandora.ui.helpDialog().open();
                pandora.Query.updateGroups();
            },
            '^admin': function(url) {
                var split = url.split('/'),
                    section = new RegExp(
                        '^ˆ(statistics|users)$'
                    ).exec(split[1]);
                section = section ? section[0] : 'users';
                pandora.UI.set({
                    section: 'site',
                    sitePage: url
                });
            },
            '^find$': function() {
                pandora.Query.fromString('?find='); // fixme: silly hack
                pandora.UI.set({
                    section: 'items',
                    item: ''
                });
            },
            '^(calendar|calendars|clips|icons|flow|map|maps|timelines)$': function(url) {
                pandora.UI.set({
                    section: 'items',
                    item: ''
                });
                pandora.UI.set(['lists', pandora.user.ui.list, 'listView'].join('|'), url);
            },
            '^texts$': function() {
                pandora.UI.set({
                    section: 'texts'
                });
            },
            '^[0-9A-Z]': function(url) {
                var split = url.split('/'),
                    length = split.length,
                    item = split[0],
                    view = new RegExp(
                            '^(' + $.map(pandora.site.itemViews, function(v) {
                                return v.id;
                            }).join('|') + ')$'
                        ).exec(split[1]),
                    position = length > 1
                        ? /[\d\.:-]+/.exec(split[length - 1])
                        : null;
                view = view ? view[0]
                    : position ? pandora.user.ui.videoView
                    : pandora.user.ui.itemView;
                pandora.UI.set({
                    section: 'items',
                    item: item,
                    itemView: view
                });
                Ox.print('POSITION', position)
                if (position) {
                    split[length - 1] = position[0].split('-').map(function(point, i) {
                        // fixme: this is duplicated, see Ox.VideoPlayer() parsePositionInput()
                        var parts = point.split(':').reverse();
                        while (parts.length > 3) {
                            parts.pop();
                        }
                        point = parts.reduce(function(prev, curr, i) {
                            return prev + (parseFloat(curr) || 0) * Math.pow(60, i);
                        }, 0);
                        i == 0 && pandora.UI.set(['videoPosition', item].join('|'), point);
                        return Ox.formatDuration(point, 2).replace(/\.00$/, '');
                    }).join('-');
                    pandora.URL.replace(split.join('/'))
                }
            }
        };

    return {

        set: function(title, url) {
            if (arguments.length == 1) { // fixme: remove later
                url = title;
            }
            if (url[0] != '/') {
                url = '/' + url;
            }
            history.pushState({}, pandora.site.site.name + (title ? ' - ' + title : ''), url);
            this.update();
        },

        parse: function() {
            var url = document.location.pathname.substr(1) +
                    document.location.search +
                    document.location.hash;
            Ox.forEach(regexps, function(fn, re) {
                //Ox.print(url, 're', re)
                re = new RegExp(re);
                if (re.test(url)) {
                    Ox.print('URL re ' + re);
                    fn(url);
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
            history.pushState({}, pandora.site.site.name + (title ? ' - ' + title : ''), url);
        },

        replace: function(title, url) {
            if (arguments.length == 1) { // fixme: remove later
                url = title;
            }
            if (url[0] != '/') {
                url = '/' + url;
            }
            history.replaceState({}, pandora.site.site.name + (title ? ' - ' + title : ''), url);
        },

        update: function() {
            var oldUserUI = Ox.clone(pandora.user.ui);
            Ox.Request.cancel();
            $('video').each(function() {
                $(this).trigger('stop');
            });
            this.parse();
            if (pandora.user.ui.section != oldUserUI.section) {
                pandora.$ui.appPanel.replaceElement(1, pandora.$ui.mainPanel = pandora.ui.mainPanel());
            } else if (pandora.user.ui.sitePage != oldUserUI.sitePage) {
                pandora.$ui.mainPanel.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
            } else if (!pandora.user.ui.item && !oldUserUI.item) {
                // list to list
                // fixme: isEqual doesn't work here
                if (Ox.isEqual(pandora.user.ui.findQuery, oldUserUI.findQuery) && false) {
                    Ox.print('EQUAL', pandora.user.ui.findQuery, oldUserUI.findQuery)
                    pandora.$ui.contentPanel.replaceElement(1, pandora.ui.list());
                } else {
                    pandora.$ui.leftPanel.replaceElement(2, pandora.$ui.info = pandora.ui.info());
                    pandora.$ui.mainPanel.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
                }
            } else if (!pandora.user.ui.item || !oldUserUI.item) {
                // list to item or item to list
                pandora.$ui.leftPanel.replaceElement(2, pandora.$ui.info = pandora.ui.info());
                pandora.$ui.mainPanel.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
            } else {
                // item to item
                pandora.$ui.leftPanel.replaceElement(2, pandora.$ui.info = pandora.ui.info());
                pandora.$ui.contentPanel.replaceElement(1, pandora.ui.item());
            }
            // fixme: should be 'editor', not 'timeline'
            if (
                oldUserUI.item &&
                ['player', 'timeline'].indexOf(oldUserUI.itemView) > -1
            ) {
                var $item = pandora.$ui[
                    oldUserUI.itemView == 'player' ? 'player' : 'editor'
                ];
                $item && pandora.UI.set(
                    'videoPosition|' + oldUserUI.item,
                    $item.options('position')
                );
            }
        }

    };

}());
