'use strict';

pandora.ui.embedPlayer = function() {

    var that = Ox.Element(),
        ui = pandora.user.ui,
        defaults = {
            annotationsRange: ui.annotationsRange,
            annotationsSort: ui.annotationsSort,
            invertHighlight: true,
            matchRatio: false,
            paused: true,
            playInToOut: true,
            showAnnotations: false,
            showCloseButton: false,
            showLayers: pandora.site.layers.map(function(layer) {
                return layer.id;
            }),
            showTimeline: false,
            timeline: ui.videoTimeline,
            width: window.innerWidth
        },
        options = getOptions(),
        removed = false,
        video,
        $innerPanel, $outerPanel,
        $title, $player, $controls, $timeline, $annotations;

    pandora.api.get({id: ui.item, keys: [
        'duration', 'durations', 'layers', 'parts', 'posterFrame',
        'rightslevel', 'size', 'title', 'videoRatio'
    ]}, function(result) {
        if (removed) {
            return;
        }
        video = Ox.extend(result.data, pandora.getVideoOptions(result.data));

        Ox.print('OPTIONS::::::::', options)
        var isFrame = options['in'] && options['in'] == options.out,
            sizes = getSizes();

        options.height = sizes.videoHeight;
        video.subtitles = getSubtitles(video);

        if (options.title) {
            $title = Ox.Element()
                .css({position: 'absolute'})
                .append(
                    $('<div>')
                        .css({
                            marginTop: !options.title.match(/\\n/) ? '8px' : '2px',
                            textAlign: 'center'
                        })
                        .html(options.title.replace(/\\n/g, '<br>'))
                );
        } else {
            $title = Ox.Element();
        }

        $player = Ox.VideoPlayer(Ox.extend({
                censored: video.censored,
                censoredIcon: pandora.site.cantPlay.icon,
                censoredTooltip: pandora.site.cantPlay.text,
                controlsBottom: (
                    isFrame ? [] : ['play', 'volume']
                ).concat(
                    ['scale']
                ).concat(
                    Ox.Fullscreen.available && options.showCloseButton ? ['fullscreen'] : []
                ).concat(
                    ['timeline', 'position', 'settings']
                ),
                controlsTooltips: {
                    close: Ox._('Close'),
                    open: Ox._('Watch on {0}', [pandora.site.site.name])
                },
                controlsTop: [
                    options.showCloseButton ? 'close'
                    : Ox.Fullscreen.available ? 'fullscreen'
                    : 'space16'
                ].concat(
                    ['title', 'open']
                ),
                duration: video.duration,
                enableFullscreen: Ox.Fullscreen.available,
                enableKeyboard: !isFrame,
                enableMouse: !isFrame,
                enablePosition: !isFrame,
                enableSubtitles: true,
                enableTimeline: !isFrame,
                enableVolume: !isFrame,
                height: options.height,
                invertHighlight: options.invertHighlight,
                muted: ui.videoMuted,
                paused: options.paused,
                playInToOut: options.playInToOut,
                position: options.position,
                poster: pandora.getMediaURL('/' + options.item + '/' + '96p' + (
                    options.position !== void 0 ? options.position
                    : options['in'] !== void 0 ? options['in']
                    : video.posterFrame
                ) +'.jpg'),
                resolution: ui.videoResolution,
                scaleToFill: ui.videoScale == 'fill',
                showIconOnLoad: true,
                subtitles: video.subtitles,
                timeline: options.playInToOut ? function(size, i) {
                    return pandora.getMediaURL('/' + options.item
                        + '/timelineantialias'
                        + size + 'p' + i + '.jpg');
                } : pandora.getMediaURL('/' + options.item + '/' + 'timeline16p.png'),
                /*
                timeline: options.playInToOut ? getSmallTimelineURL()
                    : '/' + options.item + '/' + 'timeline16p.png',
                */
                timelineType: options.showTimeline
                    ? options.timeline : '',
                timelineTypes: options.showTimeline
                    ? pandora.site.timelines : [],
                title: video.title,
                video: video.video,
                volume: ui.videoVolume,
                width: options.width
            }, options['in'] ? {
                'in': options['in']
            } : {}, options.out ? {
                out: options.out
            } : {}))
            .bindEvent({
                fullscreen: function(data) {
                    Ox.Fullscreen.toggle();
                    setTimeout(that.resizePanel, 100);
                },
                open: function() {
                    $player.options({paused: true});
                    var url = document.location.protocol + '//'
                        + document.location.hostname + '/'
                        + options.item + '/'
                        + Ox.formatDuration($player.options('position'));
                    window.open(url, '_blank');
                },
                playing: function(data) {
                    setPosition(data.position, true);
                },
                position: function(data) {
                    setPosition(data.position);
                },
                subtitles: function(data) {
                    options.showTimeline && $timeline.options({
                        subtitles: data.subtitles ? video.subtitles : []
                    });
                },
                timeline: function(data) {
                    options.showTimeline && $timeline.options({
                        type: data.timeline
                    });
                }
            })
            .bindEvent(function(data, event) {
                if (Ox.contains(['close', 'paused'], event)) {
                    Ox.$parent.postMessage(event, data);
                }
            });

        Ox.Fullscreen.bind('change', function(state) {
            $player.options({
                fullscreen: state
            });
        });

        $controls = Ox.Element();

        if (options.showTimeline) {
            $timeline = Ox.LargeVideoTimeline(Ox.extend({
                    disabled: isFrame,
                    duration: video.duration,
                    getImageURL: function(type, i) {
                        return pandora.getMediaURL('/' + ui.item + '/timeline' + type + '64p' + i + '.jpg');
                    },
                    position: options.position,
                    showInToOut: options.playInToOut && options['in'] < options.out,
                    subtitles: ui.videoSubtitles ? video.subtitles : [],
                    type: options.timeline,
                    width: window.innerWidth - 16
                }, options['in'] ? {
                    'in': options['in']
                } : {}, options.out ? {
                    out: options.out
                } : {}))
                .css({
                    top: '4px',
                    left: '4px'
                })
                .bindEvent({
                    mousedown: that.gainFocus,
                    position: dragTimeline
                })
                .appendTo($controls);
        }

        if (options.showAnnotations) {
            video.annotations = video.annotations.filter(function(layer) {
                return Ox.contains(options.showLayers, layer.id);
            });
            if (options.playInToOut) {
                video.annotations.forEach(function(layer) {
                    var items = [];
                    layer.items.forEach(function(item) {
                        if ((
                            item['in'] >= options['in'] && item['in'] <= options.out
                        ) || (
                            item.out >= options['in'] && item.out <= options.out
                        )) {
                            items.push(item);
                        }
                    });
                    layer.items = items;
                });
            }
            $annotations = Ox.AnnotationPanel(Ox.extend({
                clickLink: pandora.clickLink,
                layers: video.annotations,
                position: options.position,
                range: options.annotationsRange,
                showLayers: ui.showLayers,
                showUsers: true,
                sort: options.annotationsSort,
                width: window.innerWidth
            }, options['in'] ? {
                'in': options['in']
            } : {}, options.out ? {
                out: options.out
            } : {}))
            .bindEvent({
                select: selectAnnotation
            })
        } else {
            $annotations = Ox.Element();
        }

        $innerPanel = Ox.SplitPanel({
            elements: [
                {element: $title, size: options.title ? 32 : 0},
                {element: $player},
                {element: $controls, size: options.showTimeline ? 80 : 0}
            ],
            orientation: 'vertical'
        });

        $outerPanel = Ox.SplitPanel({
            elements: [
                {element: $innerPanel, size: sizes.innerHeight},
                {element: $annotations}
            ],
            orientation: 'vertical'
        });

        that.setElement($outerPanel);

        Ox.$parent.postMessage('loaded');

    });

    function dragTimeline(data) {
        var position = options.playInToOut
            ? Ox.limit(data.position, options['in'], options.out)
            : data.position;
        $player.options({position: position});
        position != data.position && $timeline.options({position: position});
        options.showAnnotations && $annotations.options({position: position});
    }

    function getOptions() {
        var options = {};
        if (ui._hash.query) {
            ui._hash.query.forEach(function(condition) {
                options[condition.key] = condition.value;
            });
        }
        options = Ox.extend(
            {item: ui.item},
            ui.videoPoints[ui.item] || {},
            defaults,
            options
        );
        if (!options.position) {
            options.position = options['in'] || 0;
        }
        if (!options['in'] && !options.out) {
            options.playInToOut = false;
        } else if (options['in'] && options['in'] == options.out) {
            options.invertHighlight = false;
            options.paused = true;
            options.playInToOut = false;
        }
        return options;
    }

    function getSizes() {
        var innerHeight,
            maxVideoHeight = window.innerHeight
                - (options.title ? 32 : 0)
                - (options.showTimeline ? 80 : 0)
                - (options.showAnnotations ? 128 : 0),
            videoHeight;
        if (options.matchRatio || options.showAnnotations) {
            videoHeight = Math.round(window.innerWidth / video.videoRatio);
            options.matchRatio = videoHeight <= maxVideoHeight;
            if (!options.matchRatio) {
                videoHeight = maxVideoHeight;
            }
        } else {
            videoHeight = window.innerHeight
                - (options.title ? 32 : 0)
                - (options.showTimeline ? 80 : 0);
        }
        innerHeight = videoHeight
            + (options.title ? 32 : 0)
            + (options.showTimeline ? 80 : 0);
        return {innerHeight: innerHeight, videoHeight: videoHeight};
    }

    function getSmallTimelineFPS() {
        return Math.floor((options.out - options['in']) * 25) < 32768 ? 25 : 1;
    }

    function getSmallTimelineURL() {
        var fps = getSmallTimelineFPS(),
            width = Math.ceil((options.out - options['in']) * fps),
            height = fps == 1 ? 16 : 64;
        pandora[
            fps == 1 ? 'getSmallClipTimelineURL' : 'getLargeClipTimelineURL'
        ](options.item, options['in'], options.out, options.timeline, function(url) {
            $player.options({timeline: url});
        });
        return Ox.$('<canvas>').attr({width: width, height: height})[0].toDataURL();
    }

    function getSubtitles(options) {
        return options.subtitlesLayer ? options.annotations.filter(function(layer) {
            return layer.id == options.subtitlesLayer;
        })[0].items.map(function(subtitle) {
            return {
                id: subtitle.id,
                'in': subtitle['in'],
                out: subtitle.out,
                text: subtitle.value.replace(/\n/g, ' ').replace(/<br\/?>/g, '\n'),
                tracks: subtitle.languages || [Ox.getLanguageNameByCode(pandora.site.language)]
            };
        }) : []
    }

    function selectAnnotation(data) {
        if (data.id) {
            setPosition(Math.max(data['in'], options['in'] || 0));
            $annotations.options({selected: ''});
        }
    }

    function setPosition(position, playing) {
        !playing && $player.options({position: position});
        options.showTimeline && $timeline.options({position: position});
        options.showAnnotations && $annotations.options({position: position});
    }

    that.reloadPanel = function(data) {
        if (Ox.isUndefined(data) || data.value != data.previousValue) {
            removed = true;
            pandora.$ui.embedPanel.replaceWith(pandora.$ui.embedPanel = pandora.ui.embedPanel());
            return pandora.$ui.embedPanel;
        }
        return that;
    };

    that.resizePanel = function() {
        var sizes = getSizes();
        $player.options({width: window.innerWidth, height: sizes.videoHeight});
        $outerPanel.size(0, sizes.innerHeight);
        options.showTimeline && $timeline.options({width: window.innerWidth - 16});
        options.showAnnotations && $annotations.options({width: window.innerWidth});
        return that;
    };

    return that;

};
