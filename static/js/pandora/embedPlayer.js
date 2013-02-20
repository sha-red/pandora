pandora.ui.embedPlayer = function(options, data) {

    var that = Ox.VideoPlayer(Ox.extend({
            censored: data.censored,
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
            duration: data.duration,
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
                : data.posterFrame
            ) +'.jpg',
            resolution: pandora.user.ui.videoResolution,
            scaleToFill: pandora.user.ui.videoScale == 'fill',
            subtitles: data.subtitles,
            timeline: options.playInToOut ? function(size, i) {
                return '/' + options.item
                    + '/timelineantialias'
                    + size + 'p' + i + '.jpg'
            } : '/' + options.item + '/' + 'timeline16p.png',
            title: data.title,
            video: data.video,
            volume: pandora.user.ui.videoVolume,
            width: options.width
        }, options['in'] ? {
            'in': options['in']
        } : {}, options.out ? {
            out: options.out
        } : {}));

    return that;

};