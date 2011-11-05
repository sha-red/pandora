// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

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
            statusbar <-- make part of content panel
*/

(function() {

    window.onerror = function(error, url, line) {
        try {
            pandora.api.log({
                text: error,
                url: url,
                line: line
            });
        } catch(e) {}
    };

    var debug = localStorage && localStorage.pandoraDebug,
        theme = localStorage && localStorage.OxTheme || 'modern';

    loadImages(function(images) {
        loadScreen(images);
        if (debug) {
            loadOxJS(function() {
                loadOxUI(loadPandora);
            });
        } else {
            loadOxUI(loadPandora);
        }
    });

    function loadImages(callback) {
        // Opera doesn't fire onload for SVGs,
        // so we only wait for the PNG to load.
        var images = {};
        images.logo = document.createElement('img');
        images.logo.onload = function() {
            callback(images);
        };
        images.logo.style.position = 'absolute';
        images.logo.style.left = 0;
        images.logo.style.top = 0;
        images.logo.style.right = 0;
        images.logo.style.bottom = '160px';
        images.logo.style.width = '320px';
        images.logo.style.height = '160px';
        images.logo.style.margin = 'auto';
        images.logo.src = '/static/png/logo256.png';
        images.reflection = document.createElement('img');
        images.reflection.style.position = 'absolute';
        images.reflection.style.left = 0;
        images.reflection.style.top = '160px';
        images.reflection.style.right = 0;
        images.reflection.style.bottom = 0;
        images.reflection.style.width = '320px';
        images.reflection.style.height = '160px';
        images.reflection.style.margin = 'auto';
        images.reflection.style.MozTransform = 'scaleY(-1)';
        images.reflection.style.OTransform = 'scaleY(-1)';
        images.reflection.style.WebkitTransform = 'scaleY(-1)';
        images.reflection.src = '/static/png/logo256.png';
        images.loadingIcon = document.createElement('img');
        images.loadingIcon.setAttribute('id', 'loadingIcon');
        images.loadingIcon.style.position = 'absolute';
        images.loadingIcon.style.left = 0;
        images.loadingIcon.style.top = '80px';
        images.loadingIcon.style.right = 0;
        images.loadingIcon.style.bottom = 0;
        images.loadingIcon.style.width = '32px';
        images.loadingIcon.style.height = '32px';
        images.loadingIcon.style.margin = 'auto';
        images.loadingIcon.src = '/static/oxjs/' + (debug ? 'dev' : 'build')
            + '/Ox.UI/themes/' + theme + '/svg/symbolLoadingAnimated.svg';
    }

    function loadScreen(images) {
        var gradient = document.createElement('div');
        gradient.style.position = 'absolute';
        gradient.style.left = 0;
        gradient.style.top = '160px';
        gradient.style.right = 0;
        gradient.style.bottom = 0;
        gradient.style.width = '320px';
        gradient.style.height = '160px';
        gradient.style.margin = 'auto';
        gradient.style.background = theme == 'classic'
            ? '-moz-linear-gradient(top, rgba(224, 224, 224, 0.75), rgba(224, 224, 224, 1), rgba(224, 224, 224, 1))'
            : '-moz-linear-gradient(top, rgba(32, 32, 32, 0.75), rgba(32, 32, 32, 1), rgba(32, 32, 32, 1))';
        gradient.style.background = theme == 'classic'
            ? '-o-linear-gradient(top, rgba(224, 224, 224, 0.75), rgba(224, 224, 224, 1), rgba(224, 224, 224, 1))'
            : '-o-linear-gradient(top, rgba(32, 32, 32, 0.75), rgba(32, 32, 32, 1), rgba(32, 32, 32, 1))';
        gradient.style.background = theme == 'classic'
            ? '-webkit-linear-gradient(top, rgba(224, 224, 224, 0.75), rgba(224, 224, 224, 1), rgba(224, 224, 224, 1))'
            : '-webkit-linear-gradient(top, rgba(32, 32, 32, 0.75), rgba(32, 32, 32, 1), rgba(32, 32, 32, 1))';
        var loadingScreen = document.createElement('div');
        loadingScreen.setAttribute('id', 'loadingScreen');
        loadingScreen.className = 'OxScreen';
        loadingScreen.style.position = 'absolute';
        loadingScreen.style.width = '100%';
        loadingScreen.style.height = '100%';
        loadingScreen.style.backgroundColor = theme == 'classic'
            ? 'rgb(224, 224, 224)' : 'rgb(32, 32, 32)';
        loadingScreen.style.zIndex = '1001';
        loadingScreen.appendChild(images.logo);
        loadingScreen.appendChild(images.reflection);
        loadingScreen.appendChild(gradient);
        loadingScreen.appendChild(images.loadingIcon);
        document.body.style.margin = 0;
        document.body.appendChild(loadingScreen);
    }

    function loadOxJS(callback) {
        var script = document.createElement('script');
        script.onload = callback;
        script.src = '/static/oxjs/dev/Ox.js';
        script.type = 'text/javascript';
        document.head.appendChild(script);
    }

    function loadOxUI(callback) {
        Ox.load({
            UI: {
                theme: theme
            },
            Geo: {}
        }, callback);
    }

    function loadPandora(browserSupported) {
        window.pandora = Ox.App({url: '/api/'}).bindEvent({
            load: function(data) {
                data.browserSupported = browserSupported;
                Ox.extend(pandora, {
                    requests: {},
                    ui: {}
                });
                loadPandoraFiles(function() {
                    initPandora(data);
                });
            }
        });
    }

    function loadPandoraFiles(callback) {
        var prefix = '/static/';
        if (localStorage && localStorage.pandoraDebug) {
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
            Ox.loadFile(prefix + 'js/pandora.min.js', callback);
        }
    }

    function initPandora(data) {

        Ox.Log('', 'Ox.App load', data);

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
            user: data.user
        });

        // make sure all valid ui settings are present
        pandora.user.ui = Ox.extend(
            Ox.clone(pandora.site.user.ui), pandora.user.ui
        );
        // make sure no invalid ui settings are present
        Object.keys(pandora.user.ui).forEach(function(key) {
            if (Ox.isUndefined(pandora.site.user.ui[key])) {
                delete pandora.user.ui[key];
            }
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

        if (data.user.level == 'guest' && $.browser.mozilla && !localStorage.OxTheme) {
            pandora.user.ui.theme = 'classic';
        }

        // set up url controller

        pandora.URL.init().parse(function() {

            if (data.browserSupported) {
                $('#loadingScreen').remove();
            } else {
                loadBrowserMessage();
            }

            Ox.Theme(pandora.user.ui.theme);
            pandora.$ui.appPanel = pandora.ui.appPanel().display();
            Ox.Request.requests() && pandora.$ui.loadingIcon.start();
            pandora.$ui.body.ajaxStart(pandora.$ui.loadingIcon.start);
            pandora.$ui.body.ajaxStop(pandora.$ui.loadingIcon.stop);

            pandora.site.sectionButtonsWidth = pandora.$ui.sectionButtons.width() + 8;

        });

    }

    function loadBrowserMessage() {

        var isMSIE = $.browser.msie,
            browsers = Ox.merge(
                isMSIE ? [{name: 'Chrome Frame', url: 'http://google.com/chromeframe/'}] : [],
                [
                    {name: 'Chrome', url: 'http://google.com/chrome/'},
                    {name: 'Firefox', url: 'http://mozilla.org/firefox/'},
                    {name: 'Safari', url: 'http://apple.com/safari/'}
                ]
            ),
            images = browsers.map(function(browser) {
                return Ox.PATH + 'Ox.UI/png/browser' + browser.name.replace(' ', '') + '128.png';
            }),
            $loadingScreen = $('#loadingScreen');

        loadImages(images, function() {
            var html = pandora.site.site.name
                    + ' requires an up-to-date web browser. Please take a moment to '
                    + (
                        isMSIE
                        ? 'install <a href="' + browsers[0].url + '">' + browsers[0].name + '</a> or '
                        : ''
                    )
                    + 'download ' + browsers.filter(function(browser) {
                        return browser.name != 'Chrome Frame';
                    }).map(function(browser, i) {
                        return '<a href="' + browser.url + '">' + browser.name + '</a>'
                            + (i == 0 ? ', ' : i == 1 ? ' or ' : '');
                    }).join('')
                    + '. Otherwise, <a href="javascript:pandora.proceed()">proceed</a> at your own risk.',
                $message = $('<div>')
                    .css({
                        position: 'absolute',
                        left: 0,
                        top: '160px',
                        right: 0,
                        bottom: 0,
                        width: '320px',
                        height: '160px',
                        margin: 'auto'
                    }),
                $images = $('<div>')
                    .css({
                        margin: '12px',
                        textAlign: 'center'
                    })
                    .appendTo($message);
            $('#loadingIcon').remove();
            $message.appendTo($loadingScreen);
            browsers.forEach(function(browser) {
                $('<a>')
                    .attr({
                        href: browser.url,
                        title: browser.name
                    })
                    .append(
                        $('<img>')
                            .attr({
                                src: Ox.PATH + 'Ox.UI/png/browser' + browser.name.replace(' ', '') + '128.png'
                            })
                            .css({width: '32px', height: '32px', margin: '4px'})
                    )
                    .appendTo($images);
            });
            $('<div>')
                .css({
                    textAlign: 'center'
                })
                .html(html)
                .appendTo($message);
        });

        function loadImages(images, callback) {
            Ox.loadFile(images.shift(), function() {
                if (images.length) {
                    loadImages(images, callback);
                } else {
                    callback();
                }
            });
        }

        pandora.proceed = function() {
            $loadingScreen.animate({
                opacity: 0
            }, 1000, function() {
                $loadingScreen.remove();
            });
        }

    }

}());
