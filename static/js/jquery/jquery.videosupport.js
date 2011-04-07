jQuery.support.video = function() {
    jQuery.browser.chrome = /chrome/.test(navigator.userAgent.toLowerCase());
    var video = {};
    var v = document.createElement('video');
    if (v) {
        video.support = true;
        video.webm = !!(v.canPlayType && v.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/, ''));
        //Disable WebM on Safari/Perian, seeking does not work
        if(video.webm && /safari/.test(navigator.userAgent.toLowerCase()) && ! /linux/.test(navigator.userAgent.toLowerCase())) {
            video.webm = false;
        }
        video.h264 = !!(v.canPlayType && v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
        if(jQuery.browser.chrome && video.webm)
            video.h264 = false;
        video.mp4 = video.h264;
        video.ogg = !!(v.canPlayType && v.canPlayType('video/ogg; codecs="theora, vorbis"').replace(/no/, ''));
        video.ogv = video.ogg;
    } else {
        video.support = false;
    }
    video.supportedFormat = function(formats) {
        var format;
        formats.forEach(function(f) {
            if(!format && video[f]) {
                format = f;
            }
        });
        return format;
    };
    return video;
}();

