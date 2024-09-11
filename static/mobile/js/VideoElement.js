'use strict';

/*@
VideoElement <f> VideoElement Object
    options <o> Options object
        autoplay <b|false> autoplay
        items <a|[]> array of objects with src,in,out,duration
        loop <b|false> loop playback
        playbackRate <n|1> playback rate
        position <n|0> start position
    self <o> Shared private variable
    ([options[, self]]) -> <o:Element> VideoElement Object
        loadedmetadata <!> loadedmetadata
        itemchange <!> itemchange
        seeked <!> seeked
        seeking <!> seeking
        sizechange <!> sizechange
        ended <!> ended
@*/

(function() {
    var queue = [],
        queueSize = 100,
        restrictedElements = [],
        requiresUserGesture = mediaPlaybackRequiresUserGesture(),
        unblock = [];


window.VideoElement = function(options) {

    var self = {},
        that = document.createElement("div");

    self.options = {
        autoplay: false,
        items: [],
        loop: false,
        muted: false,
        playbackRate: 1,
        position: 0,
        volume: 1
    }
    Object.assign(self.options, options);
    debug(self.options)

    that.style.position = "relative"
    that.style.width = "100%"
    that.style.height = "100%"
    that.style.maxHeight = "100vh"
    that.style.margin = 'auto'
    if (self.options.aspectratio) {
        that.style.aspectRatio = self.options.aspectratio
    } else {
        that.style.height = '128px'
    }
    that.triggerEvent = function(event, data) {
        if (event != 'timeupdate') {
            debug('Video', 'triggerEvent', event, data);
        }
        event = new Event(event)
        event.data = data
        that.dispatchEvent(event)
    }


    /*
        .update({
            items: function() {
                self.loadedMetadata = false;
                loadItems(function() {
                    self.loadedMetadata = true;
                    var update = true;
                    if (self.currentItem >= self.numberOfItems) {
                        self.currentItem = 0;
                    }
                    if (!self.numberOfItems) {
                        self.video.src = '';
                        that.triggerEvent('durationchange', {
                            duration: that.duration()
                        });
                    } else {
                        if (self.currentItemId != self.items[self.currentItem].id) {
                            // check if current item is in new items
                            self.items.some(function(item, i) {
                                if (item.id == self.currentItemId) {
                                    self.currentItem = i;
                                    loadNextVideo();
                                    update = false;
                                    return true;
                                }
                            });
                            if (update) {
                                self.currentItem = 0;
                                self.currentItemId = self.items[self.currentItem].id;
                            }
                        }
                        if (!update) {
                            that.triggerEvent('seeked');
                            that.triggerEvent('durationchange', {
                                duration: that.duration()
                            });
                        } else {
                            setCurrentVideo(function() {
                                that.triggerEvent('seeked');
                                that.triggerEvent('durationchange', {
                                    duration: that.duration()
                                });
                            });
                        }
                    }
                });
            },
            playbackRate: function() {
                self.video.playbackRate = self.options.playbackRate;
            }
        })
        .css({width: '100%', height: '100%'});
    */

    debug('Video', 'VIDEO ELEMENT OPTIONS', self.options);

    self.currentItem = -1;
    self.currentTime = 0;
    self.currentVideo = 0;
    self.items = [];
    self.loadedMetadata = false;
    that.paused = self.paused = true;
    self.seeking = false;
    self.loading = true;
    self.buffering = true;
    self.videos = [getVideo(), getVideo()];
    self.video = self.videos[self.currentVideo];
    self.video.classList.add("active")
    self.volume = self.options.volume;
    self.muted = self.options.muted;
    self.brightness = document.createElement('div')
    self.brightness.style.top = '0'
    self.brightness.style.left = '0'
    self.brightness.style.width = '100%'
    self.brightness.style.height = '100%'
    self.brightness.style.background = 'rgb(0, 0, 0)'
    self.brightness.style.opacity = '0'
    self.brightness.style.position = "absolute"
    that.append(self.brightness)

    self.timeupdate = setInterval(function() {
        if (!self.paused
            && !self.loading
            && self.loadedMetadata
            && self.items[self.currentItem]
            && self.items[self.currentItem].out
            && self.video.currentTime >= self.items[self.currentItem].out) {
            setCurrentItem(self.currentItem + 1);
        }
    }, 30);

    // mobile browsers only allow playing media elements after user interaction
    if (restrictedElements.length > 0) {
        unblock.push(setSource)
        setTimeout(function() {
            that.triggerEvent('requiresusergesture');
        })
    } else {
        setSource();
    }

    function getCurrentTime() {
        var item = self.items[self.currentItem];
        return self.seeking || self.loading
            ? self.currentTime
            : item ? item.position + self.video.currentTime - item['in'] : 0;
    }

    function getset(key, value) {
        var ret;
        if (isUndefined(value)) {
            ret = self.video[key];
        } else {
            self.video[key] = value;
            ret = that;
        }
        return ret;
    }

    function getVideo() {
        var video = getVideoElement()
        video.style.display = "none"
        video.style.width = "100%"
        video.style.height = "100%"
        video.style.margin = "auto"
        video.style.background = '#000'
        if (self.options.aspectratio) {
            video.style.aspectRatio = self.options.aspectratio
        } else {
            video.style.height = '128px'
        }
        video.style.top = 0
        video.style.left = 0
        video.style.position = "absolute"
        video.preload = "metadata"
        video.addEventListener("ended", event => {
            if (self.video == video) {
                setCurrentItem(self.currentItem + 1);
            }
        })
        video.addEventListener("loadedmetadata", event => {
            //console.log("!!", video.src, "loaded", 'current?', video == self.video)
        })
        video.addEventListener("progress", event => {
            // stop buffering if buffered to end point
            var item = self.items[self.currentItem],
                nextItem = mod(self.currentItem + 1, self.numberOfItems),
                next = self.items[nextItem],
                nextVideo = self.videos[mod(self.currentVideo + 1, self.videos.length)];
            if (self.video == video && (video.preload != 'none' || self.buffering)) {
                if (clipCached(video, item)) {
                    video.preload = 'none';
                    self.buffering = false;
                    if (nextItem != self.currentItem) {
                        nextVideo.preload = 'auto';
                    }
                } else {
                    if (nextItem != self.currentItem && nextVideo.preload != 'none' && nextVideo.src) {
                        nextVideo.preload = 'none';
                    }
                }
            } else if (nextVideo == video && video.preload != 'none' && nextVideo.src) {
                if (clipCached(video, next)) {
                    video.preload = 'none';
                }
            }

            function clipCached(video, item) {
                var cached = false
                for (var i=0; i<video.buffered.length; i++) {
                    if (video.buffered.start(i) <= item['in']
                        && video.buffered.end(i) >= item.out) {
                        cached = true
                    }
                }
                return cached
            }
        })
        video.addEventListener("volumechange", event => {
            if (self.video == video) {
                that.triggerEvent('volumechange')
            }
        })
        video.addEventListener("play", event => {
            /*
            if (self.video == video) {
                that.triggerEvent('play')
            }
            */
        })
        video.addEventListener("pause", event => {
            /*
            if (self.video == video) {
                that.triggerEvent('pause')
            }
            */
        })
        video.addEventListener("timeupdate", event => {
            if (self.video == video) {
                /*
                var box = self.video.getBoundingClientRect()
                if (box.width && box.height) {
                    that.style.width = box.width + 'px'
                    that.style.height = box.height + 'px'
                }
                */
                that.triggerEvent('timeupdate', {
                    currentTime: getCurrentTime()
                })
            }
        })
        video.addEventListener("seeking", event => {
            if (self.video == video) {
                that.triggerEvent('seeking')
            }
        })
        video.addEventListener("stop", event => {
            if (self.video == video) {
                //self.video.pause();
                that.triggerEvent('ended');
            }
        })
        that.append(video)
        return video
    }

    function getVideoElement() {
        var video;
        if (requiresUserGesture) {
            if (queue.length) {
                video = queue.pop();
            } else {
                video = document.createElement('video');
                restrictedElements.push(video);
            }
        } else {
            video = document.createElement('video');
        }
        video.playsinline = true
        video.setAttribute('playsinline', 'playsinline')
        video.setAttribute('webkit-playsinline', 'webkit-playsinline')
        video.WebKitPlaysInline = true
        return video
    };

    function getVolume() {
        var volume = 1;
        if (self.items[self.currentItem] && isNumber(self.items[self.currentItem].volume)) {
            volume = self.items[self.currentItem].volume;
        }
        return self.volume * volume;
    }


    function isReady(video, callback) {
        if (video.seeking && !self.paused && !self.seeking) {
            that.triggerEvent('seeking');
            debug('Video', 'isReady', 'seeking');
            video.addEventListener('seeked', function(event) {
                debug('Video', 'isReady', 'seeked');
                that.triggerEvent('seeked');
                callback(video);
            }, {once: true})
        } else if (video.readyState) {
            callback(video);
        } else {
            that.triggerEvent('seeking');
            video.addEventListener('loadedmetadata', function(event) {
                callback(video);
            }, {once: true});
            video.addEventListener('seeked', event => {
                that.triggerEvent('seeked');
            }, {once: true})
        }
    }

    function loadItems(callback) {
        debug('loadItems')
        var currentTime = 0,
            items = self.options.items.map(function(item) {
                return isObject(item) ? {...item} : {src: item};
            });

        self.items = items;
        self.numberOfItems = self.items.length;
        items.forEach(item => {
            item['in'] = item['in'] || 0;
            item.position = currentTime;
            if (item.out) {
                item.duration = item.out - item['in'];
            }
            if (item.duration) {
                if (!item.out) {
                    item.out = item.duration;
                }
                currentTime += item.duration;
                item.id = getId(item);
            } else {
                getVideoInfo(item.src, function(info) {
                    item.duration = info.duration;
                    if (!item.out) {
                        item.out = item.duration;
                    }
                    currentTime += item.duration;
                    item.id = getId(item);
                });
            }
        })
        debug('loadItems done')
        callback && callback();

        function getId(item) {
            return item.id || item.src + '/' + item['in'] + '-' + item.out;
        }
    }

    function loadNextVideo() {
        if (self.numberOfItems <= 1) {
            return;
        }
        var item = self.items[self.currentItem],
            nextItem = mod(self.currentItem + 1, self.numberOfItems),
            next = self.items[nextItem],
            nextVideo = self.videos[mod(self.currentVideo + 1, self.videos.length)];
        nextVideo.addEventListener('loadedmetadata', function() {
            if (self.video != nextVideo) {
                nextVideo.currentTime = next['in'] || 0;
            }
        }, {once: true});
        nextVideo.src = next.src;
        nextVideo.preload = 'metadata';
    }

    function setCurrentItem(item) {
        debug('Video', 'sCI', item, self.numberOfItems);
        var interval;
        if (item >= self.numberOfItems || item < 0) {
            if (self.options.loop) {
                item = mod(item, self.numberOfItems);
            } else {
                self.seeking = false;
                self.ended = true;
                that.paused = self.paused = true;
                self.video && self.video.pause();
                that.triggerEvent('ended');
                return;
            }
        }
        self.video && self.video.pause();
        self.currentItem = item;
        self.currentItemId = self.items[self.currentItem].id;
        setCurrentVideo(function() {
            if (!self.loadedMetadata) {
                self.loadedMetadata = true;
                that.triggerEvent('loadedmetadata');
            }
            debug('Video', 'sCI', 'trigger itemchange',
                self.items[self.currentItem]['in'], self.video.currentTime, self.video.seeking);
            that.triggerEvent('sizechange');
            that.triggerEvent('itemchange', {
                item: self.currentItem
            });
        });
    }

    function setCurrentVideo(callback) {
        var css = {},
            muted = self.muted,
            item = self.items[self.currentItem],
            next;
        debug('Video', 'sCV', JSON.stringify(item));

        ['left', 'top', 'width', 'height'].forEach(function(key) {
            css[key] = self.videos[self.currentVideo].style[key];
        });
        self.currentTime = item.position;
        self.loading = true;
        if (self.video) {
            self.videos[self.currentVideo].style.display = "none"
            self.videos[self.currentVideo].classList.remove("active")
            self.video.pause();
        }
        self.currentVideo = mod(self.currentVideo + 1, self.videos.length);
        self.video = self.videos[self.currentVideo];
        self.video.classList.add("active")
        self.video.muted = true; // avoid sound glitch during load
        if (!self.video.attributes.src || self.video.attributes.src.value != item.src) {
            self.loadedMetadata && debug('Video', 'caching next item failed, reset src');
            self.video.src = item.src;
        }
        self.video.preload = 'metadata';
        self.video.volume = getVolume();
        self.video.playbackRate = self.options.playbackRate;
        Object.keys(css).forEach(key => {
            self.video.style[key] = css[key]
        })
        self.buffering = true;
        debug('Video', 'sCV', self.video.src, item['in'],
            self.video.currentTime, self.video.seeking);
        isReady(self.video, function(video) {
            var in_ = item['in'] || 0;

            function ready() {
                debug('Video', 'sCV', 'ready');
                self.seeking = false;
                self.loading = false;
                self.video.muted = muted;
                !self.paused && self.video.play();
                self.video.style.display = 'block'
                callback && callback();
                loadNextVideo();
            }
            if (video.currentTime == in_) {
                debug('Video', 'sCV', 'already at position', item.id, in_, video.currentTime);
                ready();
            } else {
                self.video.addEventListener("seeked", event => {
                    debug('Video', 'sCV', 'seeked callback');
                    ready();
                }, {once: true})
                if (!self.seeking) {
                    debug('Video', 'sCV set in', video.src, in_, video.currentTime, video.seeking);
                    self.seeking = true;
                    video.currentTime = in_;
                    if (self.paused) {
                        var promise = self.video.play();
                        if (promise !== undefined) {
                            promise.then(function() {
                                self.video.pause();
                                self.video.muted = muted;
                            }).catch(function() {
                                self.video.pause();
                                self.video.muted = muted;
                            });
                        } else {
                            self.video.pause();
                            self.video.muted = muted;
                        }
                    }
                }
            }
        });
    }

    function setCurrentItemTime(currentTime) {
        debug('Video', 'sCIT', currentTime, self.video.currentTime,
            'delta', currentTime - self.video.currentTime);
        isReady(self.video, function(video) {
            if (self.video == video) {
                if(self.video.seeking) {
                    self.video.addEventListener("seeked", event => {
                        that.triggerEvent('seeked');
                        self.seeking = false;
                    }, {once: true})
                } else if (self.seeking) {
                    that.triggerEvent('seeked');
                    self.seeking = false;
                }
                video.currentTime = currentTime;
            }
        });
    }

    function setCurrentTime(time) {
        debug('Video', 'sCT', time);
        var currentTime, currentItem;
        self.items.forEach(function(item, i) {
            if (time >= item.position
                && time < item.position + item.duration) {
                currentItem = i;
                currentTime = time - item.position + item['in'];
                return false;
            }
        });
        if (self.items.length) {
            // Set to end of items if time > duration
            if (isUndefined(currentItem) && isUndefined(currentTime)) {
                currentItem = self.items.length - 1;
                currentTime = self.items[currentItem].duration + self.items[currentItem]['in'];
            }
            debug('Video', 'sCT', time, '=>', currentItem, currentTime);
            if (currentItem != self.currentItem) {
                setCurrentItem(currentItem);
            }
            self.seeking = true;
            self.currentTime = time;
            that.triggerEvent('seeking');
            setCurrentItemTime(currentTime);
        } else {
            self.currentTime = 0;
        }
    }

    function setSource() {
        self.loadedMetadata = false;
        loadItems(function() {
            setCurrentTime(self.options.position);
            self.options.autoplay && setTimeout(function() {
                that.play();
            });
        });
    }


    /*@
    brightness <f> get/set brightness
    @*/
    that.brightness = function() {
        var ret;
        if (arguments.length == 0) {
            ret = 1 - parseFloat(self.brightness.style.opacity);
        } else {
            self.brightness.style.opacity = 1 - arguments[0]
            ret = that;
        }
        return ret;
    };

    /*@
    buffered <f> buffered
    @*/
    that.buffered = function() {
        return self.video.buffered;
    };

    /*@
    currentTime <f> get/set currentTime
    @*/
    that.currentTime = function() {
        var ret;
        if (arguments.length == 0) {
            ret = getCurrentTime();
        } else {
            self.ended = false;
            setCurrentTime(arguments[0]);
            ret = that;
        }
        return ret;
    };

    /*@
    duration <f> duration
    @*/
    that.duration = function() {
        return self.items ? self.items.reduce((duration, item) => {
            return duration + item.duration;
        }, 0) : NaN;
    };

    /*@
    muted <f> get/set muted
    @*/
    that.muted = function(value) {
        if (!isUndefined(value)) {
            self.muted = value;
        }
        return getset('muted', value);
    };

    /*@
    pause <f> pause
    @*/
    that.pause = function() {
        that.paused = self.paused = true;
        self.video.pause();
        that.paused && that.triggerEvent('pause')
    };

    /*@
    play <f> play
    @*/
    that.play = function() {
        if (self.ended) {
            that.currentTime(0);
        }
        isReady(self.video, function(video) {
            self.ended = false;
            that.paused = self.paused = false;
            self.seeking = false;
            video.play();
            that.triggerEvent('play')
        });
    };

    that.removeElement = function() {
        self.currentTime = getCurrentTime();
        self.loading = true;
        clearInterval(self.timeupdate);
        //Chrome does not properly release resources, reset manually
        //http://code.google.com/p/chromium/issues/detail?id=31014
        self.videos.forEach(function(video) {
            video.src = ''
        });
        return Ox.Element.prototype.removeElement.apply(that, arguments);
    };

    /*@
    videoHeight <f> get videoHeight
    @*/
    that.videoHeight = function() {
        return self.video.videoHeight;
    };

    /*@
    videoWidth <f> get videoWidth
    @*/
    that.videoWidth = function() {
        return self.video.videoWidth;
    };

    /*@
    volume <f> get/set volume
    @*/
    that.volume = function(value) {
        if (isUndefined(value)) {
            value = self.volume
        } else {
            self.volume = value;
            self.video.volume = getVolume();
        }
        return value;
    };

    return that;

};

// mobile browsers only allow playing media elements after user interaction

    function mediaPlaybackRequiresUserGesture() {
        // test if play() is ignored when not called from an input event handler
        var video = document.createElement('video');
        video.muted = true
        video.play();
        return video.paused;
    }


    async function removeBehaviorsRestrictions() {
        debug('Video', 'remove restrictions on video', self.video, restrictedElements.length, queue.length);
        if (restrictedElements.length > 0) {
            var rElements = restrictedElements;
            restrictedElements = [];
            rElements.forEach(async function(video) {
                await video.load();
            });
            setTimeout(function() {
                var u = unblock;
                unblock = [];
                u.forEach(function(callback) { callback(); });
            }, 1000);
        }
        while (queue.length < queueSize) {
            var video = document.createElement('video');
            video.load();
            queue.push(video);
        }
    }

    if (requiresUserGesture) {
        window.addEventListener('keydown', removeBehaviorsRestrictions);
        window.addEventListener('mousedown', removeBehaviorsRestrictions);
        window.addEventListener('touchstart', removeBehaviorsRestrictions);
    }
})();
