// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

Ox.load('UI', {
    debug: false,
    hideScreen: false,
    loadImages: true,
    showScreen: true,
    theme: 'oxdark'
}, function() {
    var videoKeys = [ 'duration', 'layers', 'parts', 'posterFrame', 'rightslevel', 'size', 'title', 'videoRatio' ];
    window.pandora = new Ox.App({url: '/api/'}).bindEvent({
        load: function(data) {
            Ox.extend(pandora, {
                site: data.site,
                user: data.user.level == 'guest' ? Ox.clone(data.site.user) : data.user,
                $ui: {},
                ui: {
                    player: function(options) {
                        var that = Ox.Element();
                        pandora.user.ui.item = options.item;
                        pandora.api.get({id: options.item, keys: videoKeys}, function(result) {
                            var data = getVideoOptions(result.data);
                            that.append(pandora.$player = Ox.VideoPlayer(Ox.extend({
                                    censored: data.censored,
                                    censoredIcon: pandora.site.cantPlay.icon,
                                    censoredTooltip: pandora.site.cantPlay.text,
                                    controlsTooltips: {open: 'Open in ' + pandora.site.site.name},
                                    controlsTop: (Ox.Fullscreen.available ? ['fullscreen'] : []).concat(
                                        ['space', 'open']
                                    ),
                                    controlsBottom: ['play', 'volume', 'scale', 'timeline', 'position', 'settings'],
                                    duration: data.duration,
                                    enableFind: false,
                                    enableFullscreen: Ox.Fullscreen.available,
                                    enableKeyboard: true,
                                    enableMouse: true,
                                    enableTimeline: true,
                                    enableVolume: true,
                                    externalControls: false,
                                    height: window.innerHeight,
                                    invertHighlight: true,
                                    paused: options.paused,
                                    poster: '/' + options.item + '/' + '96p' + options['in'] +'.jpg',
                                    resolution: pandora.user.ui.videoResolution,
                                    showMarkers: false,
                                    showMilliseconds: 0,
                                    subtitles: data.subtitles,
                                    timeline: '/' + options.item + '/' + 'timeline16p.png',
                                    title: result.data.title,
                                    video: data.video,
                                    width: window.innerWidth
                                }, options['in'] ? {
                                    'in': options['in'],
                                    position: options['in']
                                } : {}, options.out ? {
                                    out: options.out
                                } : {}))
                                .bindEvent(Ox.extend({
                                    open: function() {
                                        pandora.$player.options({paused: true});
                                        var url = document.location.protocol
                                            + '//' + document.location.hostname
                                            + '/' + options.item + '/'
                                            + Ox.formatDuration(pandora.$player.options('position'));
                                        window.open(url, '_blank');
                                    },
                                    resolution: function(data) {
                                        pandora.api.setUI({'videoResolution': data.resolution});
                                    },
                                    fullscreen: function(data) {
                                        Ox.Fullscreen.toggle();
                                    }
                                }, options['in'] || options.out ? {
                                    playing: checkRange,
                                    position: checkRange
                                } : {}))
                            );
                            Ox.UI.hideLoadingScreen();

                        });
                        return that;
                    },
                    timeline: function(options) {
                        var that = Ox.Element();
                        pandora.user.ui.item = options.item;
                        pandora.api.get({id: options.item, keys: videoKeys}, function(result) {
                            Ox.UI.hideLoadingScreen();
                            var data = getVideoOptions(result.data),
                                ui = pandora.user.ui;
                            that.append(pandora.player = Ox.VideoTimelinePlayer({
                                    censored: data.censored,
                                    censoredIcon: pandora.site.cantPlay.icon,
                                    censoredTooltip: pandora.site.cantPlay.text,
                                    cuts: data.cuts || [],
                                    duration: data.duration,
                                    followPlayer: ui.followPlayer,
                                    getFrameURL: function(position) {
                                        return '/' + ui.item + '/' + ui.videoResolution + 'p' + position + '.jpg';
                                    },
                                    getLargeTimelineURL: function(type, i) {
                                        return '/' + ui.item + '/timeline' + type + '64p' + i + '.jpg';
                                    },
                                    height: that.height(),
                                    muted: ui.videoMuted,
                                    'in': options['in'],
                                    out: options.out,
                                    paused: options.paused,
                                    position: options['in'],
                                    resolution: pandora.site.video.resolutions[0],
                                    smallTimelineURL: '/' + ui.item + '/timeline16p.jpg',
                                    subtitles: data.subtitles,
                                    timeline: ui.videoTimeline,
                                    timelines: pandora.site.timelines,
                                    video: data.video,
                                    videoRatio: data.videoRatio,
                                    volume: ui.videoVolume,
                                    width: that.width()
                                })
                                .bindEvent({
                                    playing: checkRange,
                                    position: checkRange,
                                    resolution: function(data) {
                                        pandora.api.setUI({'videoResolution': data.resolution});
                                    },
                                })
                            );
                        });
                        return that;
                    }
                }
            });
            function checkRange(data) {
                if (
                    data.position < options['in'] - 0.04
                    || data.position > options.out
                ) {
                    if (!pandora.$player.options('paused')) {
                        pandora.$player.togglePaused();
                    }
                    pandora.$player.options({
                        position: options['in']
                    });
                }
            }
            Ox.extend(pandora.user, {
                videoFormat: Ox.UI.getVideoFormat(pandora.site.video.formats)
            });
            var options = parseQuery();
            if (['video', 'player'].indexOf(options.view) > -1) {
                pandora.$ui.player = pandora.ui.player(options)
                    .css({top: 0, bottom: 0, left: 0, right: 0, position: 'absolute'}) 
                    .appendTo(document.body);
            } else if (options.view == 'timeline') {
                pandora.$ui.timeline = pandora.ui.timeline(options)
                    .css({top: 0, bottom: 0, left: 0, right: 0, position: 'absolute'}) 
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
        options.duration = data.duration;
        options.videoRatio = data.videoRatio;
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
                paused: true,
                item: ''
            };
        vars.forEach(function(v) {
            v = v.split('=');
            query[v[0]] = decodeURIComponent(v[1]);
            query[v[0]] = {
                'true': true, 'false': false
            }[query[v[0]]] || query[v[0]];
        });
        return Ox.extend({}, defaults, query);
    }

});
