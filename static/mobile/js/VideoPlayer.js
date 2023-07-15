(function() {

window.VideoPlayer = function(options) {

    var self = {}, that;
    self.options = {
        autoplay: false,
        controls: true,
        items: [],
        loop: false,
        muted: false,
        playbackRate: 1,
        position: 0,
        volume: 1
    }
    Object.assign(self.options, options);
    that = VideoElement(options);

    self.controls = document.createElement('div')
    self.controls.classList.add('mx-controls')
    //self.controls.style.display = "none"
    if (self.options.controls) {
        var ratio = `aspect-ratio: ${self.options.aspectratio};`
        if (!self.options.aspectratio) {
            ratio = 'height: 128px;'
        }
        self.controls.innerHTML = `
            <style>
                .fullscreen video {
                    width: 100%;
                    height: 100%;
                }
                .mx-controls {
                    position: absolute;
                    top: 0px;
                    left: 0;
                    right: 0;
                    display: flex;
                    ${ratio}
                    max-height: 100vh;
                    flex-direction: column;
                    background: rgba(0,0,0,0.3);
                    color: white;
                    z-index: 1;
                    margin: auto;
                }

                .mx-controls .toggle {
                    display: flex;
                    flex: 1;
                }
                .mx-controls .volume:hover,
                .mx-controls .fullscreen-btn:hover,
                .mx-controls .toggle:hover {
                    cursor: pointer;
                }
                .mx-controls .toggle div {
                    margin: auto;
                }
                .mx-controls .controls {
                    display: flex;
                    flex-direction: row;
                    width: 100%;
                    height: 32px;
                }
                .mx-controls .controls .position {
                    flex: 1;
                }
                .mx-controls .toggle svg {
                    width: 64px;
                    height: 64px;
                }
                .mx-controls .toggle .loading svg {
                    width: 32px;
                    height: 32px;
                }
                .mx-controls .controls .volume svg,
                .mx-controls .controls .fullscreen-btn svg {
                    width: 24px;
                    height: 24px;
                    margin: 4px;
                }
                .mx-controls .controls .volume {
                    padding-left: 4px;
                }
                .mx-controls.hidden {
                    display: none;
                }
                .fullscreen .mx-controls {
                    height: 100vh;
                    width: 100%;
                }
                .fullscreen .mx-controls video {
                    width: 100%;
                    max-height: 100%;
                    max-width: 100%;
                }
                .fullscreen .mx-controls .controls {
                    height: 64px;
                }
                .fullscreen .mx-controls .fullscreen-btn {
                    padding: 16px;
                }
                .fullscreen .mx-controls .volume {
                    padding: 16px;
                }
                .mx-controls {
                    transition: opacity 0.3s linear;
                }
                .mx-controls .controls .position {
                    display: flex;
                    justify-content: center;
                }
                .mx-controls .controls .position .bar {
                    width: calc(100% - 16px);
                    height: 4px;
                    border: solid 1px #B1B1B1;
                    margin: auto;
                }
                .fullscreen .mx-controls .controls .position .bar {
                }
                .mx-controls .controls .position .progress {
                    width: 0;
                    background: #B1B1B180;
                    height: 4px;
                }
                .mx-controls .controls .time {
                    display: flex;
                    justify-content: center;
                }
                .mx-controls .controls .time div {
                  margin: auto;
                  font-size: 12px;
                  display: flex;
                  text-align: center;
                }
            </style>
            <div class="toggle" title="Play">
                <div>${icon.play}</div>
            </div>
            <div class="controls">
                <div class="volume" title="Mute">
                    ${icon.mute}
                </div>
                <div class="position">
                    <div class="bar">
                        <div class="progress"></div>

                    </div>
                </div>
                <div class="time">
                    <div></div>
                </div>
                <div class="fullscreen-btn" title="Fullscreen">
                    ${isIOS || !self.options.aspectratio ? "" : icon.enterFullscreen}
                </div>
            </div>
        `
        var toggleVideo = event => {
            event.preventDefault()
            event.stopPropagation()
            if (that.paused) {
                that.play()
            } else {
                that.pause()
            }
        }
        async function toggleFullscreen(event) {
            if (isIOS) {
                return
            }
            event.preventDefault()
            event.stopPropagation()
            if (!document.fullscreenElement) {
                that.classList.add('fullscreen')
                if (that.webkitRequestFullscreen) {
                    await that.webkitRequestFullscreen()
                } else {
                    await that.requestFullscreen()
                }
                console.log('entered fullscreen')
                var failed = false
                if (!screen.orientation.type.startsWith("landscape")) {
                    await screen.orientation.lock("landscape").catch(err => {
                        console.log('no luck with lock', err)
                        /*
                        document.querySelector('.error').innerHTML = '' + err
                        that.classList.remove('fullscreen')
                        document.exitFullscreen();
                        screen.orientation.unlock()
                        failed = true
                        */
                    })
                }
                if (that.paused && !failed) {
                    that.play()
                }
            } else {
                that.classList.remove('fullscreen')
                document.exitFullscreen();
                screen.orientation.unlock()
            }
        }
        var toggleSound = event => {
            event.preventDefault()
            event.stopPropagation()
            if (that.muted()) {
                that.muted(false)
            } else {
                that.muted(true)
            }
        }
        var showControls
        var toggleControls = event => {
            if (self.controls.style.opacity == '0') {
                event.preventDefault()
                event.stopPropagation()
                self.controls.style.opacity = '1'
                showControls = setTimeout(() => {
                    self.controls.style.opacity = that.paused ? '1' : '0'
                    showControls = null
                }, 3000)
            } else {
                self.controls.style.opacity = '0'
            }
        }
        self.controls.addEventListener("mousemove", event => {
            if (showControls) {
                clearTimeout(showControls)
            }
            self.controls.style.opacity = '1'
            showControls = setTimeout(() => {
                self.controls.style.opacity = that.paused ? '1' : '0'
                showControls = null
            }, 3000)
        })
        self.controls.addEventListener("mouseleave", event => {
            if (showControls) {
                clearTimeout(showControls)
            }
            self.controls.style.opacity = that.paused ? '1' : '0'
            showControls = null
        })
        self.controls.addEventListener("touchstart", toggleControls)
        self.controls.querySelector('.toggle').addEventListener("click", toggleVideo)
        self.controls.querySelector('.volume').addEventListener("click", toggleSound)
        self.controls.querySelector('.fullscreen-btn').addEventListener("click", toggleFullscreen)
        document.addEventListener('fullscreenchange', event => {
            if (!document.fullscreenElement) {
                screen.orientation.unlock()
                that.classList.remove('fullscreen')
                that.querySelector('.fullscreen-btn').innerHTML = icon.enterFullscreen
            } else {
                self.controls.querySelector('.fullscreen-btn').innerHTML = icon.exitFullscreen
            }
        })
        that.append(self.controls)
    }

    function getVideoWidth() {
        if (document.fullscreenElement) {
            return ''
        }
        var av = that.querySelector('video.active')
        return av ? av.getBoundingClientRect().width + 'px' : '100%'
    }

    var playOnLoad = false
    var unblock = document.createElement("div")

    that.addEventListener("requiresusergesture", event => {
        unblock.style.position = "absolute"
        unblock.style.width = '100%'
        unblock.style.height = '100%'
        unblock.style.backgroundImage = `url(${self.options.poster})`
        unblock.style.zIndex = '1000'
        unblock.style.backgroundPosition = "top left"
        unblock.style.backgroundRepeat = "no-repeat"
        unblock.style.backgroundSize = "cover"
        unblock.style.display = 'flex'
        unblock.classList.add('mx-controls')
        unblock.classList.add('poster')
        unblock.innerHTML = `
            <div class="toggle">
                <div style="margin: auto">${icon.play}</div>
            </div>
            <div class="controls" style="height: 37px;"></div>
        `
        self.controls.style.opacity = '0'
        unblock.addEventListener("click", event => {
            event.preventDefault()
            event.stopPropagation()
            playOnLoad = true
            unblock.querySelector('.toggle').innerHTML = `
                <div style="margin: auto" class="loading">${icon.loading}</div>
            `
        }, {once: true})
        that.append(unblock)
    })
    var loading = true
    that.brightness(0)
    that.addEventListener("loadedmetadata", event => {
        //
    })
    that.addEventListener("seeked", event => {
        if (loading) {
            that.brightness(1)
            loading = false
        }
        if (playOnLoad) {
            playOnLoad = false
            var toggle = self.controls.querySelector('.toggle')
            toggle.title = 'Pause'
            toggle.querySelector('div').innerHTML = icon.pause
            self.controls.style.opacity = '0'
            unblock.remove()
            that.play()
        }
    })

    var time = that.querySelector('.controls .time div'),
        progress = that.querySelector('.controls .position .progress')
    that.querySelector('.controls .position').addEventListener("click", event => {
        var bar = event.target
        while (bar && !bar.classList.contains('bar')) {
            bar = bar.parentElement
        }
        if (bar && bar.classList.contains('bar')) {
            event.preventDefault()
            event.stopPropagation()
            var rect = bar.getBoundingClientRect()
            var x = event.clientX - rect.x
            var percent = x / rect.width
            var position = percent * self.options.duration
            if (self.options.position) {
                position += self.options.position
            }
            progress.style.width = (100 * percent) + '%'
            that.currentTime(position)
        }
    })
    that.addEventListener("timeupdate", event => {
        var currentTime = that.currentTime(),
            duration = self.options.duration
        if (self.options.position) {
            currentTime -= self.options.position
        }
        progress.style.width = (100 * currentTime / duration) + '%'
        duration = formatDuration(duration)
        currentTime = formatDuration(currentTime)
        while (duration && duration.startsWith('00:')) {
            duration = duration.slice(3)
        }
        currentTime = currentTime.slice(currentTime.length - duration.length)
        time.innerText = `${currentTime} / ${duration}`

    })

    that.addEventListener("play", event => {
        var toggle = self.controls.querySelector('.toggle')
        toggle.title = 'Pause'
        toggle.querySelector('div').innerHTML = icon.pause
        self.controls.style.opacity = '0'
    })
    that.addEventListener("pause", event => {
        var toggle = self.controls.querySelector('.toggle')
        toggle.title = 'Play'
        toggle.querySelector('div').innerHTML = icon.play
        self.controls.style.opacity = '1'
    })
    that.addEventListener("ended", event => {
        var toggle = self.controls.querySelector('.toggle')
        toggle.title = 'Play'
        toggle.querySelector('div').innerHTML = icon.play
        self.controls.style.opacity = '1'
    })
    that.addEventListener("seeking", event => {
        //console.log("seeking")

    })
    that.addEventListener("seeked", event => {
        //console.log("seeked")
    })
    that.addEventListener("volumechange", event => {
        var volume = self.controls.querySelector('.volume')
        if (that.muted()) {
            volume.innerHTML = icon.unmute
            volume.title = "Unmute"
        } else {
            volume.innerHTML = icon.mute
            volume.title = "Mute"
        }
    })
    window.addEventListener('resize', event => {
        //
    })
    return that
};

})();
