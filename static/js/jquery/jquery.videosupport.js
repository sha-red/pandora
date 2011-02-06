jQuery.support.video = function() {
    jQuery.browser.chrome = /chrome/.test(navigator.userAgent.toLowerCase());
    var video = {};
    var v = document.createElement('video');
    if (v) {
        video.support = true;
        video.webm = !!(v.canPlayType && v.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/, ''));
        //Disable WebM on Safari/Perian, seeking does not work
        if(video.webm && jQuery.browser.safari && !jQuery.browser.chrome)
            video.webm = false;
        video.h264 = !!(v.canPlayType && v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
        video.ogg = !!(v.canPlayType && v.canPlayType('video/ogg; codecs="theora, vorbis"').replace(/no/, ''));
        video.ogv = video.ogg;
    } else {
        video.support = false;
    }
    return video;
}();

