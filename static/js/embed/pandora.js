/***
    Pandora embed
***/
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
                clip: function(item, inPoint, outPoint) {
                    //Ox.print('!@#!@#!@#', inPoint, outPoint);
                    var that = Ox.Element();
                    pandora.api.get({id: item, keys: []}, function(result) {
                        var video = {};
                        pandora.site.video.resolutions.forEach(function(resolution) {
                            video[resolution] = Ox.range(result.data.parts).map(function(i) {
                                var part = (i + 1),
                                    prefix = pandora.site.site.videoprefix.replace('PART', part);
                                return prefix + '/' + item + '/'
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
                                'in': inPoint,
                                out: outPoint,
                                paused: true,
                                position: inPoint,
                                poster: '/' + item + '/' + '128p' + inPoint +'.jpg',
                                showMarkers: false,
                                showMilliseconds: 0,
                                timeline: '/' + item + '/' + 'timeline16p.png',
                                title: result.data.title,
                                video: video,
                                width: document.width,
                            })
                            .bindEvent({
                                position: function(data) {
                                    if(data.position<inPoint || data.position>outPoint) {
                                        if(!pandora.player.options('paused'))
                                            pandora.player.togglePaused();
                                        pandora.player.options({
                                            position: inPoint,
                                        });
                                    }
                                }
                            })
                        );
                        Ox.UI.hideLoadingScreen();
                    });
                    return that;
                },
            });
            Ox.extend(pandora.user, {
                videoFormat: Ox.UI.getVideoFormat(pandora.site.video.formats)
            });
            var item = document.location.pathname.split('/')[1],
                inPoint = 10,
                outPoint = 15;
            pandora.ui.info = pandora.clip(item, inPoint, outPoint)
                                     .css({width: '100%', height: '100%'})
                                     .appendTo(document.body);
        }
    });
});
