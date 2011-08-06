// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.flipbook = function(item) {
    var that = Ox.Flipbook({
        }).bindEvent('click', function(event, data) {
            pandora.UI.set('videoPosition|' + item, data.position);
            pandora.URL.set(item + '/timeline');
        });
        pandora.api.get({id: item, keys: ['duration', 'posterFrame']}, function(result) {
            var duration = result.data.duration,
                posterFrame = result.data.posterFrame || parseInt(duration/2),
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
};

