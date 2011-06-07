// vim: et:ts=4:sw=4:sts=4:ft=javascript
/***
    Pandora
***/

// fixme: never set pandora.ui.videoPosition to 0 ... set to null a.k.a. delete
// fixme: sort=-director doesn't work
// fixme: don't reload full right panel on sortSelect
// fixme: clear items cache after login/logout

Ox.load('UI', {
    debug: true,
    hideScreen: false,
    loadImages: true,
    showScreen: true,
    theme: 'modern'
}, function() {

// fixme: use Ox.extend()

Ox.load('Geo', function() {

    window.pandora = new Ox.App({url: '/api/'}).bindEvent({

        load: function(event, data) {
            $.extend(pandora, {
                requests: {},
                ui: {}
            });
            loadResources('/static/json/pandora.json', function() {
                Ox.print('Ox.App load', data);

                Ox.UI.hideLoadingScreen();

                $.extend(pandora, {
                    $ui: {
                        body: $('body'),
                        document: $(document),
                        window: $(window)
                            .resize(resizeWindow)
                            .unload(unloadWindow)
                    },
                    site: data.site,
                    user: data.user.level == 'guest' ? $.extend({}, data.site.user) : data.user
                });
                $.extend(pandora.site, {
                    findKeys: $.map(data.site.itemKeys, function(key, i) {
                        return key.find ? key : null;
                    }),
                    sectionFolders: {
                        site: $.merge([
                            {id: 'site', title: 'Site', items: $.merge([
                                {id: 'home', title: 'Home'}
                            ], $.merge(data.site.sitePages, [
                                {id: 'software', title: 'Software'},
                                {id: 'help', title: 'Help'}
                            ]))},
                            {id: 'user', title: 'User', items: [
                                {id: 'preferences', title: 'Preferences'},
                                {id: 'archives', title: 'Archives'}
                            ]}
                        ], data.user.level == 'admin' ? [
                            {id: 'admin', title: 'Admin', items: [
                                {id: 'statistics', title: 'Statistics'},
                                {id: 'users', title: 'Users'}
                            ]}
                        ] : []),
                        items: [
                            {id: 'personal', title: 'Personal Lists'},
                            {id: 'favorite', title: 'Favorite Lists', showBrowser: false},
                            {id: 'featured', title: 'Featured Lists', showBrowser: false}
                        ]
                    },
                    sortKeys: $.map(data.site.itemKeys, function(key, i) {
                        return key.columnWidth ? key : null;
                    })
                });
                pandora.site.itemViews.push(
                    {id: 'files', title: 'Files', admin: 'true'}
                );
                pandora.site.media.importPosterFrames && pandora.site.itemViews.push(
                    {id: 'frames', title: 'Frames', admin: 'true'}
                );
                pandora.site.media.importMoviePosters && pandora.site.itemViews.push(
                    {id: 'posters', title: 'Posters', admin: 'true'}
                );
                $.extend(pandora.user, {
                    infoRatio: 16 / 9,
                    sectionElement: 'buttons',
                    selectedMovies: []
                });

                if (data.user.level == 'guest' && $.browser.mozilla) {
                    pandora.user.ui.theme = 'classic';
                }

                pandora.URL.parse();
                window.onpopstate = function(event) {
                    pandora.URL.update();
                };

                Ox.Theme(pandora.user.ui.theme);
                pandora.$ui.appPanel = pandora.ui.appPanel().display();        

                Ox.Request.requests() && pandora.$ui.loadingIcon.start();
                pandora.$ui.body.ajaxStart(pandora.$ui.loadingIcon.start);
                pandora.$ui.body.ajaxStop(pandora.$ui.loadingIcon.stop);

                pandora.site.sectionButtonsWidth = pandora.$ui.sectionButtons.width() + 8;

            }, '/static/');
        }
    });

    function loadResources(json, callback, prefix) {
        prefix = prefix || '';
        $.getJSON(json, function(files) {
            var promises = [];
            files.forEach(function(file) {
                // fixme: opera doesnt fire onload for svg
                if ($.browser.opera && Ox.endsWith(file, '.svg')) {
                    return;
                }
                //Ox.print('load', file)
                var dfd = new $.Deferred();
                Ox.loadFile(prefix + file, function() {
                    dfd.resolve();
                });
                promises.push(dfd.promise());
            });
            //Ox.print('promises.length', promises.length)
            $.when.apply(null, promises)
                .done(function() {
                    //Ox.print('promises done')
                    $(function() {
                        callback();
                    });
                })
                .fail(function() {
                    throw new Error('File not found.')
                });
        });            
    }

    function resizeWindow() {
        pandora.resizeFolders();
        if (!pandora.user.ui.item) {
            pandora.$ui.list.size();
            pandora.resizeGroups(pandora.$ui.rightPanel.width());
            if (pandora.user.ui.listView == 'map') {
                pandora.$ui.map.resize();
            }
        } else {
            //Ox.print('pandora.$ui.window.resize');
            pandora.$ui.browser.scrollToSelection();
            pandora.user.ui.itemView == 'player' && pandora.$ui.player.options({
                // fixme: duplicated
                height: pandora.$ui.contentPanel.size(1),
                width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
            });
            pandora.user.ui.itemView == 'timeline' && pandora.$ui.editor.options({
                // fixme: duplicated
                height: pandora.$ui.contentPanel.size(1),
                width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
            });
            pandora.user.ui.itemView == 'frames' && pandora.$ui.item.resize();
            pandora.user.ui.itemView == 'posters' && pandora.$ui.item.resize();
        }
    }

    function unloadWindow() {
        // fixme: ajax request has to have async set to false for this to work
        pandora.user.ui.section == 'items' &&
            ['player', 'timeline'].indexOf(pandora.user.ui.itemView) > -1 &&
            pandora.user.ui.item &&
            pandora.UI.set(
                'videoPosition|' + pandora.user.ui.item,
                pandora.$ui[
                    pandora.user.ui.itemView == 'player' ? 'player' : 'editor'
                ].options('position')
            );
    }

});
});
