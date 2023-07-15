
const parseDuration = function(string) {
    return string.split(':').reverse().slice(0, 4).reduce(function(p, c, i) {
        return p + (parseFloat(c) || 0) * (i == 3 ? 86400 : Math.pow(60, i));
    }, 0);
};

const formatDuration = function(seconds) {
    var parts = [
        parseInt(seconds / 86400),
        parseInt(seconds % 86400 / 3600),
        parseInt(seconds % 3600 / 60),
        s = parseInt(seconds % 60)
    ]
    return parts.map(p => { return p.toString().padStart(2, '0')}).join(':')
}

const typeOf = function(value) {
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
};
const isUndefined = function(value) {
    return typeOf(value) == 'undefined';
}
const isNumber = function(value) {
    return typeOf(value) == 'number';
};
const isObject = function(value) {
    return typeOf(value) == 'object';
};
const isNull = function(value) {
    return typeOf(value) == 'null';
};
const isString = function(value) {
    return typeOf(value) == 'string';
};
const isEmpty = function(value) {
    var type = typeOf(value)
    if (['arguments', 'array', 'nodelist', 'string'].includes(value)) {
        return value.length == 0
    }
    if (['object', 'storage'].includes(type)) {
        return Object.keys(value).length;
    }
    return false
};
const mod = function(number, by) {
    return (number % by + by) % by;
};

const getObjectById = function(array, id) {
    return array.filter(obj => { return obj.id == id})[0]
}

const debug = function() {
    if (localStorage.debug) {
        console.log.apply(null, arguments)
    }
};

const canPlayMP4 = function() {
    var video = document.createElement('video');
    if (video.canPlayType && video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace('no', '')) {
        return true
    }
    return false
};

const canPlayWebm = function() {
    var video = document.createElement('video');
    if (video.canPlayType && video.canPlayType('video/webm; codecs="vp8, vorbis"').replace('no', '')) {
        return true
    }
    return false
};

const getFormat = function() {
    //var format = canPlayWebm() ? "webm" : "mp4"
    var format = canPlayMP4() ? "mp4" : "webm"
    return format
}

const safeDocumentName = function(name) {
    ['\\?', '#', '%', '/'].forEach(function(c) {
        var r = new RegExp(c, 'g')
        name = name.replace(r, '_');
    })
    return name;
};

const getVideoInfo = function() {
    console.log("FIXME implement getvideoInfo")
}

const isIOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);


const getLink = function(fragment) {
    if (document.location.hash.length > 2) {
        return '#' + fragment
    } else {
        return '/m/' + fragment
    }
}

const clickLink = function(event) {
    var a = event.target
    while (a && a.tagName != 'A') {
        a = a.parentElement
    }
    if (!a) {
        return
    }
    var href = a.attributes.href.value
    var prefix = document.location.protocol + '//' + document.location.hostname
    if (href.startsWith(prefix)) {
        href = href.slice(prefix.length)
    }
    if (href.startsWith('/')) {
        event.preventDefault()
        event.stopPropagation()
        var link = href.split('#embed')[0]
        if (document.location.hash.length > 2) {
            if (link.startsWith('/m')) {
                link = link.slice(2)
            }
            document.location.hash = '#' + link.slice(1)
        } else {
            if (!link.startsWith('/m')) {
                link = '/m' + link
            }
            history.pushState({}, '', link);
            render()
        }
    }
}

const getUid = (function() {
    var uid = 0;
    return function() {
        return ++uid;
    };
}());


const getVideoURLName = function(id, resolution, part, track, streamId) {
    return id + '/' + resolution + 'p' + part + (track ? '.' + track : '')
        + '.' + pandora.format  + (streamId ? '?' + streamId : '');
};

const getVideoURL = function(id, resolution, part, track, streamId) {
    var uid = getUid(),
        prefix = pandora.site.site.videoprefix
            .replace('{id}', id)
            .replace('{part}', part)
            .replace('{resolution}', resolution)
            .replace('{uid}', uid)
            .replace('{uid42}', uid % 42);
    return prefix + '/' + getVideoURLName(id, resolution, part, track, streamId);
};

