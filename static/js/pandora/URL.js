// vim: et:ts=4:sw=4:sts=4:ft=js


pandora.URL = (function() {

    var old = {
            user: {
                ui: {}
            }
        },
        regexps = {
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
            '^(find)$': function() {
                pandora.Query.fromString('?find='); // fixme: silly hack
                pandora.UI.set({
                    section: 'items',
                    item: ''
                });
            },
            '^(calendar|calendars|clips|icons|flow|map|maps|timelines)$': function() {
                pandora.UI.set({
                    section: 'items',
                    item: ''
                });
                pandora.UI.set(['lists', pandora.user.ui.list, 'listView'].join('|'), url);
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
            },
            '^texts$': function() {
                pandora.UI.set({
                    section: 'texts'
                });
            }
        };

    return {

        set: function(title, url) {
            if (arguments.length == 1) { // fixme: remove later
                url = title;
            }
            history.pushState({}, pandora.site.site.name + (title ? ' - ' + title : ''), '/' + url);
            old.user.ui = $.extend({}, pandora.user.ui); // make a clone
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

        update: function() {
            this.parse();
            if (pandora.user.ui.section != old.user.ui.section) {
                pandora.$ui.appPanel.replaceElement(1, pandora.$ui.mainPanel = pandora.ui.mainPanel());
            } else if (pandora.user.ui.sitePage != old.user.ui.sitePage) {
                pandora.$ui.mainPanel.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
            } else if (!pandora.user.ui.item || !old.user.ui.item) {
                pandora.$ui.mainPanel.replaceElement(1, pandora.$ui.rightPanel = pandora.ui.rightPanel());
                pandora.$ui.leftPanel.replaceElement(2, pandora.$ui.info = pandora.ui.info());
            } else {
                pandora.$ui.contentPanel.replaceElement(1, pandora.ui.item());
                pandora.$ui.leftPanel.replaceElement(2, pandora.$ui.info = pandora.ui.info());
            }
            if (
                old.user.ui.item &&
                ['player', 'timeline'].indexOf(old.user.ui.itemView) > -1
            ) {
                pandora.UI.set(
                    'videoPosition|' + old.user.ui.item,
                    pandora.$ui[
                        old.user.ui.itemView == 'player' ? 'player' : 'editor'
                    ].options('position')
                );
            }
            //delete old.user.ui;
        }

    };

}());
