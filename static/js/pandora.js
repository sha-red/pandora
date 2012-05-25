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

    var animationInterval,
        debug = localStorage && localStorage['pandora.debug'],
        isMSIE = /MSIE/.test(navigator.userAgent),
        theme = localStorage && localStorage['Ox.theme']
            && JSON.parse(localStorage['Ox.theme']) || 'modern';

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
            var ratio = images.logo.width / images.logo.height,
                width = 320,
                height = width / ratio;
            images.logo.style.position = 'absolute';
            images.logo.style.left = 0;
            images.logo.style.top = 0;
            images.logo.style.right = 0;
            images.logo.style.bottom = height + 'px';
            images.logo.style.width = width + 'px';
            images.logo.style.height = height + 'px';
            images.logo.style.margin = 'auto';
            if (!isMSIE) {
                images.reflection = document.createElement('img');
                images.reflection.style.position = 'absolute';
                images.reflection.style.left = 0;
                images.reflection.style.top = height + 'px';
                images.reflection.style.right = 0;
                images.reflection.style.bottom = 0;
                images.reflection.style.width = width + 'px';
                images.reflection.style.height = height + 'px';
                images.reflection.style.margin = 'auto';
                images.reflection.style.MozTransform = 'scaleY(-1)';
                images.reflection.style.MSTransform = 'scaleY(-1)';
                images.reflection.style.OTransform = 'scaleY(-1)';
                images.reflection.style.WebkitTransform = 'scaleY(-1)';
                images.reflection.src = '/static/png/logo.png';
            }
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
                + '/Ox.UI/themes/' + theme + '/svg/symbolLoading.svg';
            callback(images);
        };
        images.logo.src = '/static/png/logo.png';
    }

    function loadScreen(images) {
        
        if (!isMSIE) {
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
        }
        var loadingScreen = document.createElement('div');
        loadingScreen.setAttribute('id', 'loadingScreen');
        loadingScreen.className = 'OxScreen';
        loadingScreen.style.position = 'absolute';
        loadingScreen.style.width = '100%';
        loadingScreen.style.height = '100%';
        loadingScreen.style.backgroundColor = theme == 'classic'
            ? 'rgb(224, 224, 224)' : 'rgb(32, 32, 32)';
        loadingScreen.style.zIndex = '1002';
        loadingScreen.appendChild(images.logo);
        images.reflection && loadingScreen.appendChild(images.reflection);
        gradient && loadingScreen.appendChild(gradient);
        loadingScreen.appendChild(images.loadingIcon);

        //FF3.6 document.body can be undefined here
        window.onload = function() {
            document.body.style.margin = 0;
            document.body.appendChild(loadingScreen);
            startAnimation();
        };
        //IE8 does not call onload if already loaded before set
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
        script.src = '/static/oxjs/dev/Ox.js';
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
            url: '/api/',
        }).bindEvent({
            load: function(data) {
                data.browserSupported = browserSupported;
                Ox.extend(pandora, {
                    requests: {},
                    ui: {}
                });
                loadPandoraFiles(function() {
                    initPandora(data);
                    if (pandora.localStorage('local')) {
                        var url = pandora.localStorage('local');
                        window.pandora.local = Ox.API({
                            'url': url + '/api/'
                        }, function() {
                            pandora.site.site.videoprefix = url;
                        });
                    }
                });
            }
        });
    }

    function loadPandoraFiles(callback) {
        var prefix = '/static/';
        if (debug) {
            Ox.getJSON(prefix + 'json/pandora.json?' + Ox.random(1000), function(files) {
                Ox.loadFile(files.map(function(file) {
                    return prefix + file;
                }), callback);
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
                        beforeunload: pandora.beforeunloadWindow,
                        resize: function() {
                            pandora.resizeWindow();
                        },
                        unload: pandora.unloadWindow
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
            findKeys: data.site.itemKeys.filter(function(key) {
                return key.find;
            }),
            itemsSection: pandora.site.itemName.plural.toLowerCase(),
            map: data.site.layers.some(function(layer) {
                return layer.type == 'place'
            }) ? 'manual' : data.site.layers.some(function(layer) {
                return layer.hasPlaces;
            }) ? 'auto' : 'none',
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
            sortKeys: pandora.site.itemKeys.filter(function(key) {
                return key.sort;
            }).map(function(key) {
                return Ox.extend(key, {
                    operator: pandora.getSortOperator(key.id)
                });
            })
        });
        pandora.site.listSettings = {};
        Ox.forEach(pandora.site.user.ui, function(val, key) {
            if (/^list[A-Z]/.test(key)) {
                pandora.site.listSettings[key] = key[4].toLowerCase() + key.slice(5);
            }
        });

        Ox.extend(pandora.user, {
            sectionElement: 'buttons',
            videoFormat: Ox.UI.getVideoFormat(pandora.site.video.formats)
        });

        // set up url controller

        pandora.URL.init().parse(function() {

            if (data.browserSupported) {
                stopAnimation();
                $('#loadingScreen').remove();
            } else {
                loadBrowserMessage();
            }

            Ox.Theme(pandora.user.ui.theme);
            pandora.$ui.appPanel = pandora.ui.appPanel().display();
            Ox.Request.requests() && pandora.$ui.loadingIcon.start();
            pandora.$ui.body.ajaxStart(pandora.$ui.loadingIcon.start);
            pandora.$ui.body.ajaxStop(pandora.$ui.loadingIcon.stop);
            Ox.Request.bindEvent({
                error: pandora.ui.errorDialog,
                request: function(data) {
                    pandora.$ui.loadingIcon.options({
                        tooltip: data.requests + ' request' + (data.requests == 1 ? '' : 's')
                    });
                }
            });
            pandora.site.sectionButtonsWidth = pandora.$ui.sectionButtons.width() + 8;

        });

    }

    function loadBrowserMessage() {
        var browsers = [].concat(
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
        Ox.loadFile(images, function() {
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
                                src: Ox.PATH + 'Ox.UI/png/browser' + browser.name.replace(' ', '') + '128.png'
                            })
                            .css({width: '32px', height: '32px', border: 0, margin: '4px'})
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
        }

    }

    function startAnimation() {
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
        }, 83);
    }

    function stopAnimation() {
        clearInterval(animationInterval);
    }

}());
