/***
    Pandora embed
***/
Ox.load('UI', {
    debug: true,
    hideScreen: false,
    loadImages: true,
    showScreen: true,
    theme: 'modern'
}, function() {
window.pandora = new Ox.App({url: '/api/'}).bindEvent({
    apiURL: '/api/',
}).bindEvent('load', function(data) {
    $.extend(pandora, {
        ui: {},
		info: function(item) {
			var that = Ox.Element()
		        .append(
		            ui.infoTimeline = Ox.Element('<img>')
		                .css({
		                    position: 'absolute',
		                    left: 0,
		                    bottom: 0,
		                    height: '16px',
		                })
                        .attr('src', '/' + item + '/timeline16p.png')
		        )
		        .append(
		            ui.infoStill = new app.flipbook(item)
		                .css({
		                    position: 'absolute',
		                    left: 0,
		                    width: '100%',
		                    height: $(document).height()-16 + 'px',
		                })
		        )
		    return that;
		},
		clip: function(item, inPoint, outPoint) {
		    Ox.print('!@#!@#!@#', inPoint, outPoint);
		    var that = Ox.Element();
            pandora.api.getItem(item, function(result) {
                var video = result.data.stream,
                    format = $.support.video.supportedFormat(video.formats);
                    video.height = video.profiles[0];
                video.width = parseInt(video.height * video.aspectRatio / 2) * 2;
                video.url = video.baseUrl + '/' + video.height + 'p.' + format;
		        that.append(pandora.player = Ox.VideoPlayer({
                        controlsBottom: ['playInToOut', 'space', 'position'],
                        enableFind: false,
                        enableFullscreen: true,
                        enableVolume: true,
                        externalControls: false,
                        height: 192,
                        paused: true,
                        showMarkers: true,
                        showMilliseconds: 2,
                        width: 360,
                        'in': inPoint,
                        out: outPoint,
                        position: inPoint,
                        poster: '/' + item + '/' + '128p' + inPoint +'.jpg',
                        title: result.data.title,
                        video: video.url
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
        flipbook: function(item) {
            var that = Ox.Flipbook({
                }).bindEvent('click', function(event, data) {
                    var item_url = document.location.origin + '/' + item;
                    window.top.location.href = item_url + '/timeline#t=' + data.position;
                });
                pandora.api.getItem(item, function(result) {
                    var duration = result.data.item.duration,
                        posterFrame = result.data.item.posterFrame || parseInt(duration/2),
                        steps = 24,
                        framePrefix = '/' + item + '/' + that.height() + 'p',
                        frames = {};
                    Ox.range(0, duration, duration/steps).forEach(function(position) {
                        position = parseInt(position);
                        frames[position] = framePrefix + position + '.jpg';
                    });
                    that.options({
                        frames: frames,
                        icon: framePrefix + posterFrame + '.jpg',
                        duration: duration
                    });
                });
            return that;
        }
    });
    var item = document.location.pathname.split('/')[1];
    function getArgument(key, result) {
        var args = Ox.map(document.location.hash.substr(1).split('&'), function(a) {
            a = a.split('=');
            var key = a[0],
                value = a[1];
            return {
                'key': key,
                'value': value
            }
        });
        $.each(args, function(i, a) {
            Ox.print(i, a);
            if (a.key == key) {
                result = a.value;
                return false;
             }
        });
        return result;
    }
    var t = getArgument('t', '0,10').split(',')
    pandora.ui.info = pandora.clip(item, parseInt(t[0]), parseInt(t[1]))
                             .appendTo(document.body);
});
});
