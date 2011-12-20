// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.tv = function() {

    var that = Ox.Element()
            .addClass('OxScreen')
            .css({
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0,
                zIndex: 1000
            }),
        $player;

    function play() {
        pandora.api.tv({
            list: pandora.user.ui._list
        }, function(result) {
            var videoOptions = pandora.getVideoOptions(result.data);
            $player && $player.remove();
            $player = Ox.VideoPlayer({
                    censored: videoOptions.censored,
                    controlsBottom: ['volume', 'scale', 'timeline', 'position', 'resolution'],
                    controlsTop: ['close', 'title'],
                    duration: result.data.duration,
                    fullscreen: true,
                    logo: pandora.site.tv.showLogo ? '/static/png/logo256.png' : '',
                    position: result.data.position,
                    resolution: pandora.user.ui.videoResolution,
                    scaleToFill: pandora.user.ui.videoScale == 'fill',
                    subtitles: videoOptions.subtitles,
                    tooltips: true,
                    timeline: '/' + result.data.item + '/timeline16p.png',
                    title: pandora.site.site.name + ' &mdash; ' + (
                            pandora.user.ui._list
                            ? pandora.user.ui._list
                            : 'All ' + pandora.site.itemName.plural
                        ) + ' &mdash; '
                        + result.data.title
                        + ' (' + result.data.director.join(', ') + ') '
                        + result.data.year,
                    video: videoOptions.video,
                    volume: pandora.user.ui.videoVolume
                })
                .bindEvent({
                    close: that.fadeOutScreen,
                    ended: play,
                    resolution: function(data) {
                        pandora.UI.set('videoResolution', data.resolution);
                    }
                })
                .appendTo(that);
        });
    }

    that.fadeInScreen = function() {
        that.appendTo(Ox.UI.$body).animate({opacity: 1}, 500);
        play();
        return that;
    };

    that.fadeOutScreen = function() {
        that.animate({opacity: 0}, 500, function() {
            that.remove();
        });
        pandora.UI.set('page', '');
        return that;
    };

    that.hideScreen = function() {
        that.remove();
        pandora.UI.set('page', '');
        return that;
    };

    that.showScreen = function() {
        that.css({opacity: 1}).appendTo(Ox.UI.$body);
        play();
        return that;
    };

    return that;

}
