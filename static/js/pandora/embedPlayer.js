pandora.ui.embedPlayer = function(data) {

    var options = getOptions(),
        that = Ox.VideoPlayer(Ox.extend({
            censored: data.censored,
            censoredIcon: pandora.site.cantPlay.icon,
            censoredTooltip: pandora.site.cantPlay.text,
            controlsBottom: ['play', 'volume', 'scale'].concat(
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
            paused: options.paused,
            playInToOut: options.playInToOut,
            position: options.position,
            poster: '/' + options.item + '/' + '96p' + (
                options.position !== void 0 ? options.position
                : options['in'] !== void 0 ? options['in']
                : data.posterFrame
            ) +'.jpg',
            resolution: pandora.user.ui.videoResolution,
            subtitles: data.subtitles,
            timeline: options.playInToOut ? function(size, i) {
                return '/' + options.item
                    + '/timelineantialias'
                    + size + 'p' + i + '.jpg'
            } : '/' + options.item + '/' + 'timeline16p.png',
            title: data.title,
            video: data.video,
            width: options.width
        }, options['in'] ? {
            'in': options['in']
        } : {}, options.out ? {
            out: options.out
        } : {}));

    function getOptions() {
        var ui = pandora.user.ui,
            defaults = {
                height: window.innerHeight,
                invertHighlight: true,
                paused: true,
                playInToOut: true,
                width: window.innerWidth
            },
            options = Ox.extend({
                item: ui.item
            }, ui.videoPoints[ui.item] || {}, defaults, ui.hash.query);
        if (!options.position) {
            options.position = options['in'] || 0;
        }
        if (!options['in'] && !options.out) {
            options.playInToOut = false;
        }
        return options;
    }

    return that;

};