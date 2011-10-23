// vim: et:ts=4:sw=4:sts=4:ft=javascript
/***
    Pandora
***/

/*
---- UI Tree ----
appPanel
    mainMenu
    mainPanel
        leftPanel
            sectionbar
            folders
            info
        rightPanel
            toolbar
            contentPanel
                browser <-- should be filters or browser
                list or item
            statusbar
*/

// fixme: never set pandora.ui.videoPosition to 0 ... set to null a.k.a. delete
// fixme: sort=-director doesn't work
// fixme: clear items cache after login/logout

Ox.load({
    UI: {
        hideScreen: false,
        loadImages: true,
        showScreen: true,
        theme: localStorage && localStorage.theme ? localStorage.theme : 'modern'
    },
    Geo: {}
}, function(browserSupported) {

// fixme: use Ox.extend()

    window.pandora = new Ox.App({url: '/api/'}).bindEvent({

        load: function(data) {

            if (!browserSupported) {
                return;
                /*
                $('.OxLoadingScreen')
                    .css({opacity: 0.9})
                    .click($(this).remove);
                */
            }

            Ox.extend(pandora, {
                requests: {},
                ui: {}
            });

            loadResources(function() {

                Ox.print('Ox.App load', data);

                Ox.extend(pandora, {
                    $ui: {
                        body: $('body'),
                        document: $(document),
                        window: $(window)
                            .bind({
                                resize: function() {
                                    pandora.resizeWindow();
                                },
                                unload: function() {
                                    pandora.unloadWindow();
                                }
                            })
                    },
                    site: data.site,
                    user: data.user.level == 'guest' ? Ox.clone(data.site.user) : data.user
                });

                Ox.extend(pandora.site, {
                    clipKeys: Ox.map(data.site.clipKeys, function(key) {
                        return Ox.extend(key, {
                            operator: pandora.getSortOperator(key.id)
                        });
                    }),
                    findKeys: Ox.map(data.site.itemKeys, function(key) {
                        return key.find ? key : null;
                    }),
                    itemsSection: pandora.site.itemName.plural.toLowerCase(),
                    sectionFolders: {
                        items: [
                            {id: 'personal', title: 'Personal Lists'},
                            {id: 'favorite', title: 'Favorite Lists', showBrowser: false},
                            {id: 'featured', title: 'Featured Lists', showBrowser: false},
                            {id: 'volumes', title: 'Local Volumes'}
                        ],
                        edits: [
                            {id: 'personal', title: 'Personal Edits'},
                            {id: 'favorite', title: 'Favorite Edits', showBrowser: false},
                            {id: 'featured', title: 'Featured Edits', showBrowser: false}                        
                        ],
                        texts: [
                            {id: 'personal', title: 'Personal Texts'},
                            {id: 'favorite', title: 'Favorite Texts', showBrowser: false},
                            {id: 'featured', title: 'Featured Texts', showBrowser: false}                        
                        ] 
                    },
                    sortKeys: Ox.map(pandora.site.itemKeys, function(key) {
                        return key.columnWidth ? Ox.extend(key, {
                            operator: pandora.getSortOperator(key.id)
                        }) : null;
                    })
                });

                pandora.site.listSettings = {};
                Ox.map(pandora.site.user.ui, function(val, key) {
                    if (/^list[A-Z]/.test(key)) {
                        pandora.site.listSettings[key] = key[4].toLowerCase() + key.substr(5);
                    }
                });

                Ox.extend(pandora.user, {
                    sectionElement: 'buttons',
                    selectedMovies: [], // fixme: used for what?
                    videoFormat: Ox.UI.getVideoFormat(pandora.site.video.formats)
                });

                if (data.user.level == 'guest' && $.browser.mozilla) {
                    pandora.user.ui.theme = 'classic';
                }

                // set up url controller

                pandora.URL.init().parse(function() {

                    Ox.UI.hideLoadingScreen();

                    Ox.Theme(pandora.user.ui.theme);
                    pandora.$ui.appPanel = pandora.ui.appPanel().display();        
                    Ox.Request.requests() && pandora.$ui.loadingIcon.start();
                    pandora.$ui.body.ajaxStart(pandora.$ui.loadingIcon.start);
                    pandora.$ui.body.ajaxStop(pandora.$ui.loadingIcon.stop);

                    pandora.site.sectionButtonsWidth = pandora.$ui.sectionButtons.width() + 8;
                    
                });

            });
        }
    });

    function loadResources(callback) {
        var prefix = '/static/';
        if(localStorage && localStorage.debug) {
            Ox.getJSON(prefix + 'json/pandora.json', function(files) {
                var promises = [];
                files.forEach(function(file) {
                    var dfd = new $.Deferred();
                    promises.push(dfd.promise());
                    Ox.loadFile(prefix + file, function() {
                        dfd.resolve();
                    });
                });
                $.when.apply(null, promises)
                    .done(function() {
                        callback();
                    })
                    .fail(function() {
                        throw new Error('File not found.');
                    });
            });
        } else {
            Ox.loadFile(prefix + 'js/pandora.js', callback);
        }
    }

});
