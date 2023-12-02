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
    // By default, Chrome and IE limit the .stack property to 10 frames
    if (typeof Error.stackTraceLimit === 'number') {
        Error.stackTraceLimit = Math.max(50, Error.stackTraceLimit);
    }

    window.onerror = function(error, url, line, column, errorObj) {
        if (error == 'TypeError: Attempted to assign to readonly property.') {
            return;
        }
        try {
            var stack = (errorObj && errorObj.stack) || "(no stack trace available)";

            !isMSIE && !/^resource:/.test(url) && pandora.api.logError({
                text: error + "\n\n" + stack,
                url: document.location.pathname + ' at ' + url,
                line: line
            });
        } catch(e) {}
    };

    // handle legacy embed and print URLs
    if (document.location.hash) {
        document.location.hash = document.location.hash.replace(
            /^#\?(embed|print)=true(&)?/,
            function() {
                return '#' + arguments[1] + (arguments[2] ? '?' : '');
            }
        );
    }

    var animationInterval,
        enableDebugMode = getLocalStorage('pandora.enableDebugMode'),
        enableEventLogging = getLocalStorage('pandora.enableEventLogging'),
        isEmbed = /^#embed(\?.*?)?$/.test(document.location.hash),
        isMSIE = /MSIE/.test(navigator.userAgent)
            && !(Math.round(navigator.userAgent.match(/MSIE (\d+)/)[1]) >= 10),
        isPrint = /^#print(\?.*?)?$/.test(document.location.hash),
        legacyThemes = {classic: 'oxlight', modern: 'oxdark'},
        loadUserScript = true,
        logoHeight,
        logoWidth,
        theme = getLocalStorage('Ox.theme')
            && JSON.parse(localStorage['Ox.theme']) || 'oxmedium';

    theme = legacyThemes[theme] || theme;

    document.addEventListener && document.addEventListener(
        'keydown', onKeydown
    );

    loadImages(function(images) {
        loadScreen(images);
        loadOxJS(function() {
            loadOxUI(loadPandora);
        });
    });

    function getLocalStorage(key) {
        // fails if localStorage does not exist or if third party cookies are
        // disabled
        try {
            return localStorage[key];
        } catch(e) {}
    }

    function getPandoraVersion() {
        var i, path, scripts = document.getElementsByTagName('script');
        for (i = 0; i < scripts.length; i++) {
            if (/pandora.js/.test(scripts[i].src)) {
                return scripts[i].src.replace(/.*\?/, '');
            }
        }
    }

    function loadImages(callback) {
        // Opera doesn't fire onload for SVGs,
        // so we only wait for the PNG to load.
        var images = {};
        images.logo = document.createElement('img');
        images.logo.onload = function() {
            var ratio = images.logo.width / images.logo.height;
            logoWidth = isEmbed || isPrint ? 96 : 320;
            logoHeight = Math.round(logoWidth / ratio);
            images.logo.style.position = 'absolute';
            images.logo.style.left = 0;
            images.logo.style.top = 0;
            images.logo.style.right = 0;
            images.logo.style.bottom = logoHeight + 'px';
            images.logo.style.width = logoWidth + 'px';
            images.logo.style.height = logoHeight + 'px';
            images.logo.style.margin = 'auto';
            images.logo.style.MozUserSelect = 'none';
            images.logo.style.MSUserSelect = 'none';
            images.logo.style.OUserSelect = 'none';
            images.logo.style.WebkitUserSelect = 'none';
            if (!isMSIE) {
                images.reflection = document.createElement('img');
                images.reflection.style.position = 'absolute';
                images.reflection.style.left = 0;
                images.reflection.style.top = logoHeight + 'px';
                images.reflection.style.right = 0;
                images.reflection.style.bottom = 0;
                images.reflection.style.width = logoWidth + 'px';
                images.reflection.style.height = logoHeight + 'px';
                images.reflection.style.margin = 'auto';
                images.reflection.style.MozTransform = 'scaleY(-1)';
                images.reflection.style.MSTransform = 'scaleY(-1)';
                images.reflection.style.OTransform = 'scaleY(-1)';
                images.reflection.style.WebkitTransform = 'scaleY(-1)';
                images.reflection.style.transform = 'scaleY(-1)';
                images.reflection.src = '/static/png/logo.png';
            }
            images.loadingIcon = document.createElement('img');
            images.loadingIcon.setAttribute('id', 'loadingIcon');
            images.loadingIcon.style.position = 'absolute';
            images.loadingIcon.style.left = 0;
            images.loadingIcon.style.top = isEmbed || isPrint
                ? '32px' : '80px';
            images.loadingIcon.style.right = 0;
            images.loadingIcon.style.bottom = 0;
            images.loadingIcon.style.width = isEmbed || isPrint
                ? '16px' : '32px';
            images.loadingIcon.style.height = isEmbed || isPrint
                ? '16px' : '32px';
            images.loadingIcon.style.margin = 'auto';
            images.loadingIcon.style.MozUserSelect = 'none';
            images.loadingIcon.style.MSUserSelect = 'none';
            images.loadingIcon.style.OUserSelect = 'none';
            images.loadingIcon.style.WebkitUserSelect = 'none';
            images.loadingIcon.src = '/static/oxjs/'
                + (enableDebugMode ? 'dev' : 'min')
                + '/UI/themes/' + theme + '/svg/symbolLoading.svg';
            callback(images);
        };
        images.logo.src = '/static/png/logo.png';
    }

    function loadScreen(images) {
        var gradient, loadingScreen,
            gray = theme == 'oxlight' ? 224 : theme == 'oxmedium' ? 144 : 32,
            color = window.backgroundColor ? window.backgroundColor : gray+', '+gray+', '+gray,
            background = 'linear-gradient(top, rgba('+color+', 0.75), rgba('+color+', 1), rgba('+color+', 1))',
            backgroundColor = 'rgb('+color+')';
        if (!isMSIE) {
            gradient = document.createElement('div');
            gradient.style.position = 'absolute';
            gradient.style.left = 0;
            gradient.style.top = logoHeight + 'px';
            gradient.style.right = 0;
            gradient.style.bottom = 0;
            // + 2 is a temporary fix for Chrome 26
            gradient.style.width = logoWidth + 2 + 'px';
            gradient.style.height = logoHeight + 2 + 'px';
            gradient.style.margin = 'auto';
            ['-moz-', '-ms-', '-o-', '-webkit-', ''].forEach(function(prefix) {
                gradient.style.background = prefix + background;
            });
        }
        loadingScreen = document.createElement('div');
        loadingScreen.setAttribute('id', 'loadingScreen');
        loadingScreen.className = 'OxScreen';
        loadingScreen.style.position = 'absolute';
        loadingScreen.style.width = '100%';
        loadingScreen.style.height = '100%';
        loadingScreen.style.backgroundColor = backgroundColor;
        loadingScreen.style.zIndex = '1002';
        loadingScreen.appendChild(images.logo);
        images.reflection && loadingScreen.appendChild(images.reflection);
        gradient && loadingScreen.appendChild(gradient);
        loadingScreen.appendChild(images.loadingIcon);

        // FF3.6 document.body can be undefined here
        var onloadCalled = false;
        window.onload = function() {
            if (!onloadCalled) {
                onloadCalled = true;
                document.body.style.margin = 0;
                document.body.appendChild(loadingScreen);
                startAnimation();
            }
        };
        // IE8 does not call onload if already loaded before set
        document.body && window.onload();

    }

    function loadOxJS(callback) {
        var head = document.head
                || document.getElementsByTagName('head')[0]
                || document.documentElement, 
            script = document.createElement('script');
        if (isMSIE) {
            // fixme: find a way to check if css/js have loaded in msie
            setTimeout(callback, 2500);
        } else {
            script.onload = callback;
        }
        script.src = '/static/oxjs/' + (enableDebugMode ? 'dev' : 'min')
            + '/Ox.js?' + getPandoraVersion();
        script.type = 'text/javascript';
        head.appendChild(script);
    }

    function loadOxUI(callback) {
        Ox.load({
            UI: {theme: theme},
            Geo: {}
        }, callback);
    }

    function loadPandora(browserSupported) {
        window.pandora = Ox.App({
            name: 'pandora',
            url: '/api/'
        }).bindEvent({
            load: function(data) {
                data.browserSupported = browserSupported;
                Ox.extend(pandora, {
                    requests: {},
                    ui: {}
                });
                loadPandoraFiles(function() {
                    enableEventLogging && Ox.Event.bind(pandora.logEvent);
                    initPandora(data);
                    if (pandora.localStorage('local')) {
                        var url = pandora.localStorage('local');
                        window.pandora.local = Ox.API({
                            url: url + '/api/'
                        }, function() {
                            pandora.site.site.videoprefix = url;
                        });
                    }
                });
            }
        });
        window.pandora.getVersion = getPandoraVersion
    }

    function loadPandoraFiles(callback) {
        var prefix = '/static/';
        if (enableDebugMode) {
            Ox.getJSON(
                prefix + 'json/pandora.json?' + Ox.random(1000),
                function(files) {
                    Ox.getFile(files.map(function(file) {
                        return prefix + file + '?' + getPandoraVersion();
                    }), callback);
                }
            );
        } else {
            Ox.getScript(
                prefix + 'js/pandora.min.js?' + getPandoraVersion(), callback
            );
        }
    }

    function initPandora(data) {

        Ox.Log('', 'Ox.App load', data);
        Ox.$window.on({
            beforeunload: pandora.beforeUnloadWindow,
            resize: pandora.resizeWindow,
            unload: pandora.unloadWindow
        })
        Ox.$document.on({
            dragenter: function(event) {
                if (Ox.contains(event.originalEvent.dataTransfer.types, 'Files')) {
                    event.originalEvent.preventDefault();
                    event.originalEvent.stopPropagation();
                    if (!$('#importScreen').length) {
                        pandora.ui.importScreen().appendTo(Ox.$body);
                    }
                } else {
                    console.log(event.originalEvent.dataTransfer);
                }
            },
            dragover: function(event) {
                event.originalEvent.preventDefault();
                event.originalEvent.stopPropagation();
            },
            dragstart: function(event) {
                event.originalEvent.preventDefault();
                event.originalEvent.stopPropagation();
            },
            drop: function(event) {
                $('#importScreen').remove();
                if (pandora.hasCapability('canAddItems')) {
                    if (event.originalEvent.dataTransfer.files.length) {
                        event.originalEvent.preventDefault();
                        event.originalEvent.stopPropagation();
                        pandora.uploadDroppedFiles(event.originalEvent.dataTransfer.files)
                    }
                }
            }
        });
        Ox.extend(pandora, {
            $ui: {},
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
        // make sure itemSort is valid
        if (!Ox.contains(pandora.site.itemKeys.filter(function(itemKey) {
            return itemKey.sort;
        }).map(function(itemKey) {
            return itemKey.id;
        }), pandora.user.ui.itemSort[0].key)) {
            pandora.user.ui.itemSort = pandora.site.user.ui.itemSort;
        }
        // make sure itemView is valid
        if (!Ox.contains(pandora.site.itemViews.map(function(itemView) {
            return itemView.id;
        }), pandora.user.ui.itemView)) {
            pandora.user.ui.itemView = pandora.site.user.ui.itemView;
        }
        // patch theme ... this can be removed at a later point
        pandora.user.ui.theme = legacyThemes[pandora.user.ui.theme]
            || pandora.user.ui.theme;
        // make sure theme is valid
        if (!Ox.contains(pandora.site.themes, pandora.user.ui.theme)) {
            pandora.user.ui.theme = pandora.site.user.ui.theme;
        }
        // patch itemView ... this can be removed at a later point
        if (pandora.user.ui.itemView == 'video') {
            pandora.user.ui.itemView = 'player';
        }

        Ox.extend(pandora.site, {
            calendar: data.site.layers.some(function(layer) {
                return layer.type == 'event'
            }) ? 'manual' : data.site.layers.some(function(layer) {
                return layer.hasEvents;
            }) ? 'auto' : 'none',
            clipKeys: data.site.clipKeys.map(function(key) {
                return Ox.extend(key, {
                    operator: pandora.getSortOperator(key.id)
                });
            }),
            filters: data.site.itemKeys.filter(function(key) {
                return key.filter;
            }).map(function(key) {
                return {
                    id: key.id,
                    title: key.title,
                    type: Ox.isArray(key.type) ? key.type[0] : key.type
                };
            }),
            documentFilters: data.site.documentKeys.filter(function(key) {
                return key.filter;
            }).map(function(key) {
                return {
                    id: key.id,
                    title: key.title,
                    type: Ox.isArray(key.type) ? key.type[0] : key.type
                };
            }),
            findKeys: data.site.itemKeys.filter(function(key) {
                return key.find;
            }),
            documentFindKeys: data.site.documentKeys.filter(function(key) {
                return key.find;
            }),
            itemsSection: pandora.site.itemName.plural.toLowerCase(),
            listSections: ['items', 'documents'],
            map: data.site.layers.some(function(layer) {
                return layer.type == 'place'
            }) ? 'manual' : data.site.layers.some(function(layer) {
                return layer.hasPlaces;
            }) ? 'auto' : 'none',
            sections: [
                {id: 'items', title: Ox._(pandora.site.itemName.plural)},
                {id: 'edits', title: Ox._('Edits')},
                {id: 'documents', title: Ox._('Documents')}
            ],
            sectionFolders: {
                items: [
                    {id: 'personal', title: Ox._('Personal Lists')},
                    {id: 'favorite', title: Ox._('Favorite Lists'), showBrowser: false},
                    {id: 'featured', title: Ox._('Featured Lists'), showBrowser: false},
                    {id: 'volumes', title: Ox._('Local Volumes')}
                ],
                edits: [
                    {id: 'personal', title: Ox._('Personal Edits')},
                    {id: 'favorite', title: Ox._('Favorite Edits'), showBrowser: false},
                    {id: 'featured', title: Ox._('Featured Edits'), showBrowser: false}
                ],
                documents: [
                    {id: 'personal', title: Ox._('Personal Collections')},
                    {id: 'favorite', title: Ox._('Favorite Collections'), showBrowser: false},
                    {id: 'featured', title: Ox._('Featured Collections'), showBrowser: false}
                ]
            },
            sortKeys: pandora.getSortKeys(),
            documentSortKeys: pandora.getDocumentSortKeys()
        });
        pandora.site.collectionViews = (pandora.site.collectionViews || [
            {id: 'list', title: Ox._('as List')},
            {id: 'grid', title: Ox._('as Grid')}
        ]).map(view => {
            return {id: view.id, title: Ox._('View {0}', [Ox._(view.title)])};
        });
        pandora.site.listSettings = {};
        Ox.forEach(pandora.site.user.ui, function(val, key) {
            if (/^list[A-Z]/.test(key)) {
                pandora.site.listSettings[key] = key[4].toLowerCase()+ key.slice(5);
            }
        });
        pandora.site.collectionSettings = {};
        Ox.forEach(pandora.site.user.ui, function(val, key) {
            if (/^collection[A-Z]/.test(key)) {
                pandora.site.collectionSettings[key] = key[10].toLowerCase()+ key.slice(11);
            }
        });
        pandora.site.editSettings = {
            clip: '',
            'in': 0,
            out: 0,
            position: 0,
            selection: [],
            sort: [{key: 'index', operator: '+'}],
            view: 'list'
        };
        pandora.site.textSettings = {
            position: 0,
            name: ''
        };

        Ox.extend(pandora.user, {
            sectionElement: 'buttons',
            videoFormat: Ox.getVideoFormat(pandora.site.video.formats)
        });

        pandora.site.site.url = document.location.host
        pandora.site.site.https = document.location.protocol == 'https:'

        Ox.Map.GoogleApiKey = pandora.site.site.googleapikey;

        // set locale and initialize url controller
        // data.locale is prefered language according to http header
        //pandora.setLocale(pandora.user.ui.locale || data.locale, function() {
        pandora.setLocale(pandora.user.ui.locale, function() {
            pandora.URL.init().parse(function() {
                var isHome = Ox.contains(
                        ['/', '/home'], document.location.pathname
                    );
                if (data.browserSupported) {
                    stopAnimation();
                    $('#loadingScreen').remove();
                } else {
                    loadBrowserMessage();
                }
                Ox.Theme(pandora.user.ui.theme);
                if (isEmbed) {
                    pandora.$ui.embedPanel = pandora.ui.embedPanel().display();
                    Ox.$parent.bindMessage({
                        settheme: function(data) {
                            if (Ox.contains(pandora.site.themes, data.theme)) {
                                Ox.Theme(data.theme);
                            }
                        },
                        seturl: function(data) {
                            if (pandora.isEmbedURL(data.url)) {
                                pandora.URL.push(data.url);
                            }
                        },
                        options: function(data) {
                            pandora.$ui.embedPanel.options(data);
                        }
                    });
                    pandora.localInit && pandora.localInit();
                } else if (isPrint) {
                    pandora.$ui.printView = pandora.ui.printView().display();
                } else if (isHome) {
                    pandora.$ui.home = pandora.ui.home().showScreen(
                        initPandoraApp
                    );
                } else {
                    initPandoraApp();
                }
            });
        });

    }

    function initPandoraApp() {
        pandora.clipboard = Ox.Clipboard();
        pandora.history = Ox.History();
        pandora.$ui.appPanel = pandora.ui.appPanel().display();
        pandora.$ui.loadingIcon.update(Ox.Request.requests());
        Ox.Request.bindEvent({
            error: pandora.ui.errorDialog,
            request: function(data) {
                pandora.$ui.loadingIcon.update(data.requests);
            }
        });
        Ox.Fullscreen.bind('exit', pandora.UI.set);
        pandora.site.sectionButtonsWidth = pandora.$ui.sectionButtons.width() + 8;
        // allow site scripts to run after pandora is loaded
        pandora.triggerEvent('loaded');
        !pandora.isLicensed() && pandora.openLicenseDialog();
        pandora.localInit && pandora.localInit();
        loadUserScript && pandora.loadUserScript();
        document.removeEventListener && document.removeEventListener(
            'keydown', onKeydown
        );
    }

    function loadBrowserMessage() {
        var browsers = [].concat(
                isMSIE ? [{
                    name: 'Chrome Frame', url: 'http://google.com/chromeframe/'
                }] : [],
                [
                    {name: 'Chrome', url: 'http://google.com/chrome/'},
                    {name: 'Firefox', url: 'http://mozilla.org/firefox/'},
                    {name: 'Safari', url: 'http://apple.com/safari/'}
                ]
            ),
            images = browsers.map(function(browser) {
                return Ox.PATH + 'UI/png/browser'
                    + browser.name.replace(' ', '') + '128.png';
            }),
            $loadingScreen = $('#loadingScreen');
        Ox.getFile(images, function() {
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
            stopAnimation();
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
                                src: Ox.PATH + 'UI/png/browser'
                                    + browser.name.replace(' ', '') + '128.png'
                            })
                            .css({
                                width: '32px',
                                height: '32px',
                                border: 0,
                                margin: '4px'
                            })
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

        pandora.proceed = function() {
            $loadingScreen.animate({
                opacity: 0
            }, 1000, function() {
                $loadingScreen.remove();
            });
        };

    }

    function onKeydown(e) {
        if (e.keyCode == 27) {
            loadUserScript = false;
        }
    }

    function startAnimation() {
        if (animationInterval !== undefined) {
            return;
        }

        var css, deg = 0, loadingIcon = document.getElementById('loadingIcon'),
            previousTime = +new Date();
        animationInterval = setInterval(function() {
            var currentTime = +new Date(),
                delta = (currentTime - previousTime) / 1000;
            previousTime = currentTime;
            deg = Math.round((deg + delta * 360) % 360 / 30) * 30;
            css = 'rotate(' + deg + 'deg)';
            loadingIcon.style.MozTransform = css;
            loadingIcon.style.MSTransform = css;
            loadingIcon.style.OTransform = css;
            loadingIcon.style.WebkitTransform = css;
            loadingIcon.style.transform = css;
        }, 83);
    }

    function stopAnimation() {
        if (animationInterval !== undefined) {
            clearInterval(animationInterval);
            animationInterval = undefined;
        }
    }

}());
