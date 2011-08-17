// vim: et:ts=4:sw=4:sts=4:ft=javascript


pandora.URL = (function() {

    var regexps = {
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
            '^(|about|archives|faq|help|license|home|news|preferences|software|terms|tour)$': function(url) {
                pandora.UI.set({
                    section: 'site',
                    sitePage: url || 'home'
                });
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
                    item = split[0],
                    view = new RegExp(
                        '^(' + $.map(pandora.site.itemViews, function(v) {
                            return v.id;
                        }).join('|') + ')$'
                    ).exec(split[1]);
                view = view ? view[0] : pandora.user.ui.itemView;
                pandora.UI.set({
                    section: 'items',
                    item: item,
                    itemView: view
                });
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
            $.each(regexps, function(re, fn) {
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

        update: function() {
            var oldUserUI = Ox.clone(pandora.user.ui);
            Ox.Request.cancel();
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
