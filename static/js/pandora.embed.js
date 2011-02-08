/***
    Pandora embed
***/

var pandora = new Ox.App({
    apiURL: '/api/',
}).launch(function(data) {
    var ui = {};
    var app = {
		info: function(item) {
			var that = new Ox.Element()
		        .append(
		            ui.infoTimeline = new Ox.Element('img')
		                .css({
		                    position: 'absolute',
		                    left: 0,
		                    bottom: 0,
		                    height: '16px',
		                })
                        .attr('src', '/' + item + '/timeline.16.png')
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
        flipbook: function(item) {
            var that = new Ox.Flipbook({
                }).bindEvent('click', function(event, data) {
                    var item_url = document.location.origin + '/' + item;
                    window.top.location.href = item_url + '/timeline#t=' + data.position;
                });
                pandora.api.getItem(item, function(result) {
                    var duration = result.data.item.duration,
                        posterFrame = result.data.item.posterFrame || parseInt(duration/2),
                        steps = 24,
                        framePrefix = '/' + item + '/frame/' + that.width() + '/',
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
    };
    var item = document.location.pathname.split('/')[1];
    ui.info= new app.info(item)
      .appendTo(document.body);
});
