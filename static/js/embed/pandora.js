// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

Ox.load('UI', {
    debug: false,
    hideScreen: false,
    loadImages: true,
    showScreen: true,
    theme: 'modern'
}, function() {
    window.pandora = new Ox.App({url: '/api/'}).bindEvent({
        load: function(data) {
            Ox.extend(pandora, {
                site: data.site,
                user: data.user.level == 'guest' ? Ox.clone(data.site.user) : data.user,
                ui: {},
                clip: function(options) {
                    var that = Ox.Element();
                    pandora.api.get({id: options.item, keys: []}, function(result) {
                        var video = {};
                        pandora.site.video.resolutions.forEach(function(resolution) {
                            video[resolution] = Ox.range(result.data.parts).map(function(i) {
                                var part = (i + 1),
                                    prefix = pandora.site.site.videoprefix.replace('PART', part);
                                return prefix + '/' + options.item + '/'
                                    + resolution + 'p' + part + '.' + pandora.user.videoFormat;
                            });
                        });
                        that.append(pandora.player = Ox.VideoPlayer({
                                controlsBottom: ['play', 'volume', 'scale', 'timeline', 'position', 'settings'],
                                enableFind: false,
                                enableFullscreen: true,
                                enableKeyboard: true,
                                enableMouse: true,
                                enableTimeline: true,
                                enableVolume: true,
                                externalControls: false,
                                height: document.height,
                                'in': options['in'],
                                out: options.out,
                                paused: options.paused,
                                position: options['in'],
                                poster: '/' + options.item + '/' + '128p' + options['in'] +'.jpg',
                                resolution: pandora.user.ui.videoResolution,
                                showMarkers: false,
                                showMilliseconds: 0,
                                timeline: '/' + options.item + '/' + 'timeline16p.png',
                                title: result.data.title,
                                video: video,
                                width: document.width
                            })
                            .bindEvent({
                                playing: checkRange,
                                position: checkRange,
                                resolution: function(data) {
                                    pandora.api.setUI({'videoResolution': data.resolution});
                                },
                            })
                        );
                        Ox.UI.hideLoadingScreen();

                        function checkRange(data) {
                            if(data.position < options['in']
                               || data.position > options.out) {
                                if(!pandora.player.options('paused')) {
                                    pandora.player.togglePaused();
                                }
                                pandora.player.options({
                                    position: options['in'],
                                });
                            }
                        }
                    });
                    return that;
                }
            });
            Ox.extend(pandora.user, {
                videoFormat: Ox.UI.getVideoFormat(pandora.site.video.formats)
            });

            function parseQuery() {
                var vars = window.location.search.length
                        ? window.location.search.substring(1).split('&')
                        : [],
                    query = {
                        item: window.location.pathname.substring(1).split('/')[0]
                    },
                    defaults = {
                        view: 'video',
                        'in': 0,
                        out: 10,
                        paused: true,
                        item: ''
                    };
                vars.forEach(function(v) {
                    v= v.split('=');
                    query[v[0]] = decodeURIComponent(v[1]);
                });
                 
                return Ox.extend({}, defaults, query);
            }
            var options = parseQuery();
            if (options.view == 'video') {
                pandora.ui.info = pandora.clip(options)
                    .css({width: '100%', height: '100%'})
                    .appendTo(document.body);
            }
        }
    });
});
