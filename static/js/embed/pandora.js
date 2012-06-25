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
                    var that = Ox.Element(),
                        keys = [ 'duration', 'layers', 'parts', 'posterFrame', 'rightslevel', 'size', 'title', 'videoRatio' ];
                    pandora.user.ui.item = options.item;
                    pandora.api.get({id: options.item, keys: keys}, function(result) {
                        var videoOptions = getVideoOptions(result.data);
                        that.append(pandora.player = Ox.VideoPlayer({
                                censored: videoOptions.censored,
                                controlsBottom: ['play', 'volume', 'scale', 'timeline', 'settings'],
                                duration: result.data.duration,
                                enableFind: false,
                                enableFullscreen: true,
                                enableKeyboard: true,
                                enableMouse: true,
                                enableTimeline: true,
                                enableVolume: true,
                                externalControls: false,
                                height: window.innerHeight,
                                'in': options['in'],
                                out: options.out,
                                paused: options.paused,
                                position: options['in'],
                                poster: '/' + options.item + '/' + '96p' + options['in'] +'.jpg',
                                resolution: pandora.user.ui.videoResolution,
                                showMarkers: false,
                                showMilliseconds: 0,
                                subtitles: videoOptions.subtitles,
                                timeline: '/' + options.item + '/' + 'timeline16p.png',
                                title: result.data.title,
                                video: videoOptions.video,
                                width: window.innerWidth
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
                            if (
                                data.position < options['in'] - 0.04
                                || data.position > options.out
                            ) {
                                if (!pandora.player.options('paused')) {
                                    pandora.player.togglePaused();
                                }
                                pandora.player.options({
                                    position: options['in']
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
            var options = parseQuery();
            if (['video', 'player'].indexOf(options.view) > -1) {
                pandora.ui.info = pandora.clip(options)
                    .css({width: '100%', height: '100%'})
                    .appendTo(document.body);
            }
        }
    });
    function getVideoUrl(id, resolution, part) {
        var prefix = pandora.site.site.videoprefix
            .replace('{id}', id)
            .replace('{part}', part)
            .replace('{resolution}', resolution)
            .replace('{uid}', Ox.uid());
        return prefix + '/' + id + '/' + resolution + 'p' + part + '.' + pandora.user.videoFormat;
    }

    function getVideoOptions(data) {
        var canPlayClips = data.editable || pandora.site.capabilities.canPlayClips[pandora.user.level] >= data.rightslevel,
            canPlayVideo = data.editable || pandora.site.capabilities.canPlayVideo[pandora.user.level] >= data.rightslevel,
            options = {};
        options.subtitles = data.layers.subtitles
            ? data.layers.subtitles.map(function(subtitle) {
                return {'in': subtitle['in'], out: subtitle.out, text: subtitle.value};
            })
            : [];
        options.censored = canPlayVideo ? []
            : canPlayClips ? (
                options.subtitles.length
                    ? options.subtitles.map(function(subtitle, i) {
                        return {
                            'in': i == 0 ? 0 : options.subtitles[i - 1].out,
                            out: subtitle['in']
                        };
                    }).concat(
                        [{'in': Ox.last(options.subtitles).out, out: data.duration}]
                    ).filter(function(censored) {
                        // don't include gaps shorter than one second
                        return censored.out - censored['in'] >= 1;
                    })
                    : Ox.range(0, data.duration - 5, 60).map(function(position) {
                        return {
                            'in': position + 5,
                            out: Math.min(position + 60, data.duration)
                        };
                    })
            )
            : [{'in': 0, out: data.duration}];
        options.video = {};
        pandora.site.video.resolutions.forEach(function(resolution) {
            options.video[resolution] = Ox.range(data.parts).map(function(i) {
                return getVideoUrl(data.item || pandora.user.ui.item, resolution, i + 1);
            });
        });
        options.layers = [];
        pandora.site.layers.forEach(function(layer, i) { 
            options.layers[i] = Ox.extend({}, layer, {
                items: data.layers[layer.id].map(function(annotation) {
                    annotation.duration = Math.abs(annotation.out - annotation['in']);
                    annotation.editable = annotation.editable
                        || annotation.user == pandora.user.username
                        || pandora.site.capabilities['canEditAnnotations'][pandora.user.level];
                    return annotation;
                })
            });
        });
        return options;
    }

    function parseQuery() {
        var vars = window.location.search.length
                ? window.location.search.slice(1).split('&')
                : [],
            query = {
                item: window.location.pathname.slice(1).split('/')[0]
            },
            defaults = {
                view: 'video',
                'in': 0,
                out: 10,
                paused: true,
                item: ''
            };
        vars.forEach(function(v) {
            v = v.split('=');
            query[v[0]] = decodeURIComponent(v[1]);
        });
         
        return Ox.extend({}, defaults, query);
    }
});
