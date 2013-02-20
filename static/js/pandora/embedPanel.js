pandora.ui.embedPanel = function() {

    var that = Ox.Element(),
        options, video,
        ui = pandora.user.ui,
        $outerPanel, $innerPanel,
        $title, $player, $controls, $timeline, $annotations,
        $errorBox, $errorLogo, $errorText;

    if (pandora.user.ui.item) {

        options = getOptions();

        pandora.api.get({id: ui.item, keys: [
            'duration', 'layers', 'parts', 'posterFrame',
            'rightslevel', 'size', 'title', 'videoRatio'
        ]}, function(result) {

            var sizes = getSizes();
            options.height = sizes.videoHeight;

            video = Ox.extend(result.data, pandora.getVideoOptions(result.data));

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
                    controlsBottom: ['play', 'volume'].concat(
                        options.matchRatio ? [] : ['scale']
                    ).concat(
                        Ox.Fullscreen.available ? ['fullscreen'] : []
                    ).concat(
                        ['timeline', 'position', 'settings']
                    ),
                    controlsTooltips: {
                        close: 'Close',
                        open: 'Watch on ' + pandora.site.site.name
                    },
                    controlsTop: (options.showCloseButton ? ['close'] : []).concat(
                        ['title', 'open']
                    ),
                    duration: video.duration,
                    enableFullscreen: Ox.Fullscreen.available,
                    enableKeyboard: true,
                    enableMouse: true,
                    enablePosition: true,
                    enableSubtitles: true,
                    enableTimeline: true,
                    enableVolume: true,
                    height: options.height,
                    invertHighlight: options.invertHighlight,
                    muted: pandora.user.ui.videoMuted,
                    paused: options.paused,
                    playInToOut: options.playInToOut,
                    position: options.position,
                    poster: '/' + options.item + '/' + '96p' + (
                        options.position !== void 0 ? options.position
                        : options['in'] !== void 0 ? options['in']
                        : video.posterFrame
                    ) +'.jpg',
                    resolution: pandora.user.ui.videoResolution,
                    scaleToFill: pandora.user.ui.videoScale == 'fill',
                    subtitles: video.subtitles,
                    timeline: options.playInToOut ? function(size, i) {
                        return '/' + options.item
                            + '/timelineantialias'
                            + size + 'p' + i + '.jpg'
                    } : '/' + options.item + '/' + 'timeline16p.png',
                    title: video.title,
                    video: video.video,
                    volume: pandora.user.ui.videoVolume,
                    width: options.width
                }, options['in'] ? {
                    'in': options['in']
                } : {}, options.out ? {
                    out: options.out
                } : {}))
                .bindEvent({
                    fullscreen: function(data) {
                        Ox.Fullscreen.toggle();
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
                        $timeline.options({
                            subtitles: data.subtitles ? video.subtitles : []
                        });
                    }
                });

            $controls = Ox.Element();

            if (options.showTimeline) {
                $timeline = Ox.LargeVideoTimeline(Ox.extend({
                        duration: video.duration,
                        getImageURL: function(type, i) {
                            return '/' + ui.item + '/timeline' + type + '64p' + i + '.jpg';
                        },
                        position: options.position,
                        showInToOut: options.playInToOut,
                        subtitles: ui.videoSubtitles ? video.subtitles : [],
                        type: ui.videoTimeline,
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
                        position: changeTimeline
                    })
                    .appendTo($controls);
            }

            if (options.showAnnotations) {
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
                    font: options.annotationsFont,
                    layers: video.annotations,
                    position: options.position,
                    range: options.annotationsRange,
                    showLayers: options.showLayers,
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

        });

    } else {

        that.addClass('OxScreen')
            .css({
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            });

        $errorBox = $('<div>')
            .css({
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                width: '96px',
                height: '96px',
                padding: '16px',
                margin: 'auto'
            })
            .appendTo(that);

        $errorLogo = $('<img>')
            .css({width: '96px', opacity: 0})
            .one({
                load: function() {
                    $errorLogo.animate({opacity: 1}, 250);
                }
            })
            .attr({src: '/static/png/logo.png'})
            .appendTo($errorBox);

        $errorText = $('<div>')
            .css({marginTop: '4px', fontSize: '9px', textAlign: 'center'})
            .html('This view cannot<br>be embedded.')
            .appendTo($errorBox);

    }

    function changeTimeline(data) {
        var position = options.playInToOut
            ? Ox.limit(data.position, options['in'], options.out)
            : data.position;
        $player.options({position: position});
        position != data.position && $timeline.options({position: position});
        options.showAnnotations && $annotations.options({position: position});
    }

    function getOptions() {
        var options = {},
            defaults = {
                annotationsFont: ui.annotationsFont,
                annotationsRange: ui.annotationsRange,
                annotationsSort: ui.annotationsSort,
                invertHighlight: true,
                matchRatio: false,
                paused: true,
                playInToOut: true,
                showAnnotations: false,
                showCloseButton: false,
                showLayers: ui.showLayers,
                showTimeline: false,
                width: window.innerWidth
            };
        ui.hash.query.forEach(function(condition) {
            if (condition.key != 'embed') {
                options[condition.key] = condition.value;                
            }
        });
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
        }
        return options;
    }

    function getSizes() {
        var innerHeight,
            maxVideoHeight = window.innerHeight
                - (options.title ? 32 : 0)
                - (options.showTimeline ? 80 : 0)
                - (options.showAnnotations ? 128 : 0),
            videoHeight,
        if (options.matchRatio || options.showAnnotations) {
            videoHeight = Math.round(window.innerWidth / video.videoRatio);
            options.matchRatio = options.height <= maxVideoHeight;
            if (!options.matchRatio) {
                videoHeight = maxVideoHeight;
            }
        } else {
            videoHeight = window.innerHeight
                - (options.title ? 32 : 0)
                - (options.showTimeline ? 80 : 0);
        }
        innerHeight = options.height
            + (options.title ? 32 : 0)
            + (options.showTimeline ? 80 : 0);
        return {innerHeight: innerHeight, videoHeight: videoHeight};
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

    that.display = function() {
        // fixme: move animation into Ox.App
        var animate = $('.OxScreen').length == 0;
        Ox.Log('', 'ANIMATE?', animate)
        animate && pandora.$ui.body.css({opacity: 0});
        that.appendTo(pandora.$ui.body);
        animate && pandora.$ui.body.animate({opacity: 1}, 1000);
        return that;
    };

    $(window).on({
        resize: function() {
            var sizes = getSizes();
            $player.options({height: sizes.videoHeight});
            $outerPanel.size(0, sizes.innerHeight);
            options.showTimeline && $timeline.options({width: window.innerWidth - 16});
            options.showAnnotations && $annotations.options({width: window.innerWidth});
        }
    });

    return that;

};
