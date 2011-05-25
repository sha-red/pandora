// vim: et:ts=4:sw=4:sts=4:ft=js
/***
    Pandora
***/

// fixme: never set pandora.ui.videoPosition to 0 ... set to null a.k.a. delete
// fixme: sort=-director doesn't work
// fixme: don't reload full right panel on sortSelect
// fixme: clear items cache after login/logout
// fixme: rename config to site (site/user is better than config/user)
// fixme: replace global app object with pandora.app or move to pandora itself
Ox.load('UI', {
    debug: true,
    hideScreen: false,
    loadImages: true,
    showScreen: true,
    theme: 'modern'
}, function() {

Ox.load('Geo', function() {

    window.pandora = new Ox.App({url: '/api/'}).bindEvent({

        load: function(event, data) {
            pandora.ui = {};
            loadResources('/static/json/pandora.json', function() {
                Ox.print('Ox.App load', data);

                Ox.UI.hideLoadingScreen();

                $.extend(app, {
                    $ui: {
                        body: $('body'),
                        document: $(document),
                        window: $(window)
                            .resize(resizeWindow)
                            .unload(unloadWindow)
                    },
                    config: data.config,
                    ui: {
                        findKeys: $.map(data.config.itemKeys, function(key, i) {
                            return key.find ? key : null;
                        }),
                        infoRatio: 16 / 9,
                        sectionElement: 'buttons',
                        sectionFolders: {
                            site: $.merge([
                                {id: 'site', title: 'Site', items: $.merge([
                                    {id: 'home', title: 'Home'}
                                ], $.merge(data.config.sitePages, [
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
                            ],
                        },
                        selectedMovies: [],
                        sortKeys: $.map(data.config.itemKeys, function(key, i) {
                            return key.columnWidth ? key : null;
                        })
                    },
                    user: data.user.level == 'guest' ? $.extend({}, data.config.user) : data.user
                });

                if (data.user.level == 'guest' && $.browser.mozilla) {
                    app.user.ui.theme = 'classic';
                }

                pandora.URL.parse();
                window.onpopstate = function() {
                    pandora.URL.update();
                };

                Ox.Theme(app.user.ui.theme);
                app.$ui.appPanel = pandora.ui.appPanel().display();        

                Ox.Request.requests() && app.$ui.loadingIcon.start();
                app.$ui.body.ajaxStart(app.$ui.loadingIcon.start);
                app.$ui.body.ajaxStop(app.$ui.loadingIcon.stop);

                app.ui.sectionButtonsWidth = app.$ui.sectionButtons.width() + 8;

                window.pandora.app = app;
            }, '/static/');
        }
    });

    app = {
        requests: {}
    };

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
        if (!app.user.ui.item) {
            app.$ui.list.size();
            pandora.resizeGroups(app.$ui.rightPanel.width());
            if (app.user.ui.listView == 'map') {
                app.$ui.map.resize();
            }
        } else {
            //Ox.print('app.$ui.window.resize');
            app.$ui.browser.scrollToSelection();
            app.user.ui.itemView == 'player' && app.$ui.player.options({
                // fixme: duplicated
                height: app.$ui.contentPanel.size(1),
                width: app.$ui.document.width() - app.$ui.mainPanel.size(0) - 1
            });
            app.user.ui.itemView == 'timeline' && app.$ui.editor.options({
                // fixme: duplicated
                height: app.$ui.contentPanel.size(1),
                width: app.$ui.document.width() - app.$ui.mainPanel.size(0) - 1
            });
        }        
    }

    function unloadWindow() {
        // fixme: ajax request has to have async set to false for this to work
        app.user.ui.section == 'items' &&
            ['player', 'timeline'].indexOf(app.user.ui.itemView) > -1 &&
            app.user.ui.item &&
            pandora.UI.set(
                'videoPosition|' + app.user.ui.item,
                app.$ui[
                    app.user.ui.itemView == 'player' ? 'player' : 'editor'
                ].options('position')
            );
    }

});
});
