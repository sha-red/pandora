$(function() {

    /*
    h1 is 0.5-12 times as large as h0
    w1 is 0.5-12*ratio as large as w0
    h1 = (h0 - 24) / 2 
    w1 = h1 * ratio
    w0 = pageWidth - 8 - w1
    */
    var $body = $("body"),
        $document = $(document),
        $window = $(window),
        $editor,
        $panel,
        $player = [],
        $players,
        $timelines,
        $timelineLarge,
        $timelineSmall,
        find = "cinema",
        matches = [3, 22, 24, 55, 57, 61, 70, 105, 118, 122, 150, 152, 155],
        pageWidth = $document.width() - 384 - 2,
        posterFrame = 1515,
        points = [2059, 2748],
        videoId = document.location.hash.substring(1),
        videoUrl = "/" + videoId + "/96p." + ($.support.video.webm ? "webm": "mp4");

    $.getJSON("/" + videoId + "/data/video.json", function(video) {
        var duration = video.duration,
            videoRatio = video.aspectRatio,
            videoHeight = 96,
            videoWidth = parseInt(video.aspectRatio*videoHeight),
            position = duration/2;

        videoWidth += videoWidth%2;
        //resizeVideoPlayers(pageWidth);

        Ox.Editor = function(options, self) {

            var self = self || {},
                that = new Ox.Element("div", self)
                    .defaults({
                        cuts: [],
                        duration: 0,
                        find: "",
                        largeTimeline: true,
                        matches: [],
                        points: [0, 0],
                        position: 0,
                        posterFrame: 0,
                        subtitles: [],
                        videoHeight: 0,
                        videoId: "",
                        videoWidth: 0,
                        videoSize: "large",
                        width: 0
                    })
                    .options(options || {})
                    .addClass("OxEditor");

            $.extend(self, {
                $player: [],
                $timeline: [],
                controlsHeight: 16,
                margin: 8,
                videoRatio: self.options.videoWidth / self.options.videoHeight
            });
            self.sizes = getSizes();

            $.each(["play", "in", "out"], function(i, type) {
                self.$player[i] = new Ox.VideoPlayer({
                        duration: self.options.duration,
                        find: self.options.find,
                        height: self.sizes.player[i].height,
                        id: "player" + Ox.toTitleCase(type),
                        points: self.options.points,
                        position: type == "play" ? self.options.position : self.options.points[type == "in" ? 0 : 1],
                        posterFrame: self.options.posterFrame,
                        subtitles: self.options.subtitles,
                        type: type,
                        url: videoUrl,
                        width: self.sizes.player[i].width
                    })
                    .css({
                        left: self.sizes.player[i].left + "px",
                        top: self.sizes.player[i].top + "px"
                    })
                    .appendTo(that);
                if (type == "in" || type == "out") {
                    self.$player[i].bindEvent({
                        change: function() {
                            goToPoint(type);
                        },
                        set: function() {
                            setPoint(type);
                        }
                    })
                }
            });
            self.$player[0].bindEvent("change", changePlayer);

            self.$timeline[0] = new Ox.LargeTimeline({
                    cuts: self.options.cuts,
                    duration: self.options.duration,
                    find: self.options.find,
                    id: "timelineLarge",
                    matches: self.options.matches,
                    points: self.options.points,
                    position: self.options.position,
                    subtitles: self.options.subtitles,
                    videoId: self.options.videoId,
                    width: self.sizes.timeline[0].width
                })
                .css({
                    left: self.sizes.timeline[0].left + "px",
                    top: self.sizes.timeline[0].top + "px"
                })
                .bindEvent("change", changeTimelineLarge)
                .bindEvent("changeEnd", changeTimelineLarge)
                .appendTo(that);

            self.$timeline[1] = new Ox.SmallTimeline({
                    cuts: self.options.cuts,
                    duration: self.options.duration,
                    find: self.options.find,
                    id: "timelineSmall",
                    matches: self.options.matches,
                    points: self.options.points,
                    position: self.options.position,
                    subtitles: self.options.subtitles,
                    videoId: self.options.videoId,
                    width: self.sizes.timeline[1].width
                })
                .css({
                    left: self.sizes.timeline[1].left + "px",
                    top: self.sizes.timeline[1].top + "px"
                })
                .bindEvent("change", changeTimelineSmall)
                .appendTo(that);

            that.addEvent({
                key_alt_left: function() {
                    movePositionBy(-0.04);
                },
                key_alt_right: function() {
                    movePositionBy(0.04);
                },
                key_alt_shift_left: function() {
                    movePositionTo("cut", -1);
                },
                key_alt_shift_right: function() {
                    movePositionTo("cut", 1);
                },
                key_closebracket: function() {
                    goToPoint("out");
                },
                key_comma: function() {
                    movePositionTo("subtitle", -1);
                },
                key_dot: function() {
                    movePositionTo("subtitle", 1);
                },
                key_down: function() {
                    movePositionBy(self.options.width - 2 * self.margin);
                },
                key_i: function() {
                    setPoint("in");
                },
                key_left: function() {
                    movePositionBy(-1);
                },
                key_m: toggleMute,
                key_o: function() {
                    setPoint("out");
                },
                key_openbracket: function() {
                    goToPoint("in");
                },
                key_p: playInToOut,
                key_right: function() {
                    movePositionBy(1);
                },
                key_shift_comma: function() {
                    movePositionTo("match", -1)
                },
                key_shift_dot: function() {
                    movePositionTo("match", 1)
                },
                key_shift_down: function() {
                    movePositionBy(self.options.duration);
                },
                key_shift_left: function() {
                    movePositionBy(-60);
                },
                key_shift_right: function() {
                    movePositionBy(60);
                },
                key_shift_up: function() {
                    movePositionBy(-self.options.duration);
                },
                key_space: togglePlay,
                key_up: function() {
                    movePositionBy(-(self.options.width - 2 * self.margin));
                }
            });

            that.gainFocus();

            function changePlayer(event, data) {
                self.options.position = data.position;
                self.$timeline[0].options({
                    position: data.position
                });
                self.$timeline[1].options({
                    position: data.position
                });
            }

            function changeTimelineLarge(event, data) {
                self.options.position = data.position;
                self.$player[0].options({
                    position: data.position
                });
                self.$timeline[1].options({
                    position: data.position
                });
            }

            function changeTimelineSmall(event, data) {
                self.options.position = data.position;
                self.$player[0].options({
                    position: data.position
                });
                self.$timeline[0].options({
                    position: data.position
                });
            }

            function getNextPosition(type, direction) {
                var found = false,
                    position = 0,
                    positions;
                if (type == "cut") {
                    positions = self.options.cuts;
                } else if (type == "match") {
                    positions = $.map(self.options.matches, function(v, i) {
                        return self.options.subtitles[v]["in"];
                    });
                } else if (type == "subtitle") {
                    positions = $.map(self.options.subtitles, function(v, i) {
                        return v["in"];
                    });
                }
                direction == -1 && positions.reverse();
                $.each(positions, function(i, v) {
                    if (direction == 1 ? v > self.options.position : v < self.options.position) {
                        position = v;
                        found = true;
                        return false;
                    }
                });
                direction == -1 && positions.reverse();
                if (!found) {
                    position = positions[direction == 1 ? 0 : positions.length - 1];
                }
                return position;
            }

            function getSizes() {
                var size = {
                    player: [],
                    timeline: []
                };
                size.player[0] = {
                    left: self.margin / 2,
                    top: self.margin / 2,
                    width: Math.round((self.options.width - 3 * self.margin + (self.controlsHeight + self.margin) / 2 * self.videoRatio) * 2/3),
                }
                size.player[0].height = Math.round(size.player[0].width / self.videoRatio);
                size.player[1] = {
                    left: size.player[0].left + size.player[0].width + self.margin,
                    top: size.player[0].top,
                    width: self.options.width - 3 * self.margin - size.player[0].width
                }
                size.player[1].height = Math.ceil(size.player[1].width / self.videoRatio)
                size.player[2] = {
                    left: size.player[1].left,
                    top: size.player[0].top + size.player[1].height + self.controlsHeight + self.margin,
                    width: size.player[1].width,
                    height: size.player[0].height - size.player[1].height - self.controlsHeight - self.margin
                }
                size.timeline[0] = {
                    left: self.margin / 2,
                    top: size.player[0].height + self.controlsHeight + 1.5 * self.margin,
                    width: self.options.width - 2 * self.margin,
                    height: 64
                }
                size.timeline[1] = {
                    left: size.timeline[0].left,
                    top: size.timeline[0].top + size.timeline[0].height + self.margin,
                    width: size.timeline[0].width
                }
                return size;
            }

            function goToPoint(point) {
                self.options.position = self.options.points[point == "in" ? 0 : 1];
                setPosition();
                that.triggerEvent("change", {
                    position: self.options.position
                });
            }

            function movePositionBy(sec) {
                self.options.position = Ox.limit(self.options.position + sec, 0, self.options.duration);
                setPosition();
                that.triggerEvent("change", {
                    position: self.options.position
                });
            }

            function movePositionTo(type, direction) {
                self.options.position = getNextPosition(type, direction);
                setPosition();
                that.triggerEvent("change", {
                    position: self.options.position
                });
            }

            function playInToOut() {
                self.$player[0].playInToOut();
            }

            function resizeEditor(event, data) {
                var width = data - 2 * margin + 100;
                resizeVideoPlayers(width);
                $timelineLarge.options({
                    width: width
                });
                $timelineSmall.options({
                    width: width
                });
            }

            function resizePlayers() {
                $.each(self.$player, function(i, v) {
                    v.options({
                        width: size[i].width,
                        height: size[i].height
                    })
                    .css({
                        left: size[i].left + "px",
                        top: size[i].top + "px",
                    });
                });
            }

            function setPoint(point) {
                self.options.points[point == "in" ? 0 : 1] = self.options.position;
                self.$player[point == "in" ? 1 : 2].options({
                    position: self.options.position
                });
                if (self.options.points[1] < self.options.points[0]) {
                    self.options.points[point == "in" ? 1 : 0] = self.options.position;
                    self.$player[point == "in" ? 2 : 1].options({
                        position: self.options.position
                    });
                }
                $.each(self.$player, function(i, v) {
                    v.options({
                        points: self.options.points
                    });
                });
                $.each(self.$timeline, function(i, v) {
                    v.options({
                        points: self.options.points
                    });
                });
            }

            function setPosition() {
                self.$player[0].options({
                    position: self.options.position
                });
                $.each(self.$timeline, function(i, v) {
                    v.options({
                        position: self.options.position
                    });
                });
            }

            function toggleMute() {
                self.$player[0].toggleMute();
            }

            function togglePlay() {
                self.$player[0].togglePlay();
            }

            self.onChange = function(key, value) {
                if (key == "width") {
                    self.sizes = getSizes();
                    $.each(self.$player, function(i, v) {
                        v.options({
                            height: self.sizes.player[i].height,
                            width: self.sizes.player[i].width
                        })
                        .css({
                            left: self.sizes.player[i].left + "px",
                            top: self.sizes.player[i].top + "px"
                        });
                    });
                    $.each(self.$timeline, function(i, v) {
                        v.options({
                            width: self.sizes.timeline[i].width
                        })
                        .css({
                            left: self.sizes.timeline[i].left + "px",
                            top: self.sizes.timeline[i].top + "px"
                        });
                    });
                }
            };

            return that;

        };

        Ox.LargeTimeline = function(options, self) {

            var self = self || {},
                that = new Ox.Element("div", self)
                    .defaults({
                        cuts: [],
                        duration: 0,
                        find: "",
                        matches: [],
                        points: [0, 0],
                        position: 0,
                        subtitles: [],
                        videoId: "",
                        width: 0
                    })
                    .options(options || {})
                    .addClass("OxTimelineLarge")
                    .mousedown(mousedown)
                    .mouseleave(mouseleave)
                    .mousemove(mousemove);

            $.extend(self, {
                $cuts: [],
                $markerPoint: [],
                $subtitles: [],
                $tiles: {},
                center: parseInt(self.options.width / 2),
                element: that.$element[0],
                fps: 25,
                height: 64,
                tileWidth: 1500
            });
            self.tiles = self.options.duration * self.fps / self.tileWidth;

            self.$timeline = $("<div>")
                .css({
                    left: self.center + "px"
                })
                .appendTo(that.$element)

            $.each(self.options.subtitles, function(i, v) {
                self.$subtitles[i] = $("<div>")
                    .addClass("OxSubtitle" + (self.options.matches.indexOf(i) > -1 ? " OxHighlight" : ""))
                    .css({
                        left: (v["in"] * self.fps) + "px",
                        width: (((v["out"] - v["in"]) * self.fps) - 4) + "px"
                    })
                    .html(highlight(v.text, self.options.find))
                    .appendTo(self.$timeline)
            });

            $.each(self.options.cuts, function(i, v) {
                self.$cuts[i] = $("<img>")
                    .addClass("OxCut")
                    .attr({
                        src: "/static/oxjs/build/png/ox.ui/videoMarkerCut.png"
                    })
                    .css({
                        left: (v * self.fps) + "px"
                    })
                    .appendTo(self.$timeline)
            });

            self.$markerPosition = $("<img>")
                .addClass("OxMarkerPosition")
                .attr({
                    src: "/static/oxjs/build/png/ox.ui/videoMarkerPlay.png"
                })
                .appendTo(that.$element);
            setMarker();

            $.each(["In", "Out"], function(i, v) {
                self.$markerPoint[i] = $("<img>")
                    .addClass("OxMarkerPoint" + v)
                    .attr({
                        src: "/static/oxjs/build/png/ox.ui/videoMarker" + v + ".png"
                    })
                    .appendTo(self.$timeline);
                setMarkerPoint(i);
            });

            setWidth();
            setPosition();

            function mousedown(e) {
                var mousemove = false,
                    x = e.clientX;
                $window.mousemove(function(e) {
                    mousemove = true;
                    self.options.position = Ox.limit(
                        self.options.position + (x - e.clientX) / self.fps,
                        0, self.options.duration
                    );
                    x = e.clientX;
                    setPosition();
                    that.triggerEvent("change", {
                        position: self.options.position
                    });
                });
                $window.one("mouseup", function() {
                    $window.unbind("mousemove");
                    if (!mousemove) {
                        self.options.position = Ox.limit(
                            self.options.position + (e.clientX - that.$element.offset().left - self.center) / self.fps,
                            0, self.options.duration
                        );
                        setPosition();
                    }
                    that.triggerEvent("change", {
                        position: self.options.position
                    });
                });
                e.preventDefault();
            }

            function mouseleave(e) {
                self.$tooltip.hide();
            }

            function mousemove(e) {
                if (!self.$tooltip) {
                    self.$tooltip = Ox.Tooltip();
                }
                self.$tooltip
                    .options({
                        title: Ox.formatDuration(self.options.position + (e.clientX - that.offset().left - self.center) / self.fps, 3)
                    })
                    .show(e.clientX, e.clientY);
            }

            function setMarkerPoint(i) {
                self.$markerPoint[i].css({
                    left: (self.options.points[i] * self.fps) + "px"
                });
            }

            function setMarker() {
                self.$markerPosition.css({
                    left: (self.center - 4) + "px",
                });
            }

            function setPosition() {
                self.tile = parseInt(self.options.position * self.fps / self.tileWidth);
                self.$timeline.css({
                    marginLeft: (-self.options.position * self.fps) + "px"
                });
                $.each(Ox.range(Math.max(self.tile - 1, 0), Math.min(self.tile + 2, self.tiles)), function(i, v) {
                    if (!self.$tiles[v]) {
                        self.$tiles[v] = $("<img>")
                            .attr({
                                src: "/" + self.options.videoId + "/timelines/" + (window.location.hash == "#strip" ? "strip" : "timeline") + ".64." + v + ".png"
                            })
                            .css({
                                left: (v * self.tileWidth) + "px"
                            })
                            .appendTo(self.$timeline);
                    }
                });
            }

            function setWidth() {
                self.center = parseInt(self.options.width / 2);
                that.css({
                    width: self.options.width + "px"
                });
                self.$timeline.css({
                    left: self.center + "px"
                });
                setMarker();
            }

            self.onChange = function(key, value) {
                if (key == "points") {
                    setMarkerPoint(0);
                    setMarkerPoint(1);
                } else if (key == "position") {
                    setPosition();
                } else if (key == "width") {
                    setWidth();
                }
            };

            return that;

        };

        Ox.SmallTimeline = function(options, self) {

            var self = self || {},
                that = new Ox.Element("div", self)
                    .defaults({
                        cuts: [],
                        duration: 0,
                        find: "",
                        matches: [],
                        points: [0, 0],
                        position: 0,
                        subtitles: [],
                        videoId: "",
                        width: 0
                    })
                    .options(options || {})
                    .addClass("OxTimelineSmall")
                    .mousedown(mousedown)
                    .mouseleave(mouseleave)
                    .mousemove(mousemove);

            $.extend(self, {
                $images: [],
                $lines: [],
                $markerPoint: [],
                $subtitles: [],
                height: 16,
                lines: Math.ceil(self.options.duration / self.options.width),
                margin: 8,
                subtitlesImageURL: getSubtitlesImageURL()
            });

            $.each(Ox.range(0, self.lines), function(i) {
                addLine(i);
            });

            self.$markerPosition = $("<img>")
                .addClass("OxMarkerPosition")
                .attr({
                    src: "/static/oxjs/build/png/ox.ui/videoMarkerPlay.png"
                })
                .css({
                    position: "absolute",
                    width: "9px",
                    height: "5px",
                    zIndex: 10
                })
                .appendTo(that.$element);

            setPosition();

            $.each(["in", "out"], function(i, v) {
                var titleCase = Ox.toTitleCase(v);
                self.$markerPoint[i] = $("<img>")
                    .addClass("OxMarkerPoint" + titleCase)
                    .attr({
                        src: "/static/oxjs/build/png/ox.ui/videoMarker" + titleCase + ".png"
                    })
                    .appendTo(that.$element);
                setMarkerPoint(i);
            });

            function addLine(i) {
                self.$lines[i] = new Ox.Element("div")
                    .css({
                        top: i * (self.height + self.margin) + "px",
                        width: self.options.width + "px"
                    })
                    .appendTo(that);
                self.$images[i] = $("<img>")
                    .addClass("OxTimelineSmallImage")
                    .attr({
                        src: "/" + self.options.videoId + "/timelines/timeline.16." + 0 + ".png"
                    })
                    .css({
                        marginLeft: (-i * self.options.width) + "px"
                    })
                    .appendTo(self.$lines[i].$element);
                self.$subtitles[i] = $("<img>")
                    .attr({
                        src: self.subtitlesImageURL
                    })
                    .css({
                        marginLeft: (-i * self.options.width) + "px"
                    })
                    .appendTo(self.$lines[i].$element);
            }

            function getSubtitle(position) {
                var subtitle = null;
                $.each(self.options.subtitles, function(i, v) {
                    if (v["in"] <= position && v["out"] >= position) {
                        subtitle = v;
                        return false;
                    }
                });
                return subtitle;
            }

            function getSubtitlesImageURL() {
                var height = 18,
                    width = Math.ceil(self.options.duration),
                    $canvas = $("<canvas>")
                        .attr({
                            height: height,
                            width: width
                        }),
                    canvas = $canvas[0],
                    context = canvas.getContext("2d"),
                    imageData = context.createImageData(width, height),
                    data = imageData.data;
                $.each(self.options.subtitles, function(i, v) {
                    var color = matches.indexOf(i) > -1 ? [255, 255, 0] : [255, 255, 255]
                    $.each(Ox.range(
                        Math.round(v["in"]),
                        Math.round(v["out"]) + 1
                    ), function(i, x) {
                        $.each(Ox.range(0, 18), function(i, y) {
                            var index = x * 4 + y * 4 * width;
                            data[index] = color[0];
                            data[index + 1] = color[1];
                            data[index + 2] = color[2];
                            data[index + 3] = (y == 0 || y == 17) ? 255 : 128
                        });
                    });
                });
                context.putImageData(imageData, 0, 0);
                return canvas.toDataURL()
            }

            function mousedown(e) {
                var offset = that.offset(),
                    x = e.clientX,
                    y = e.clientY
                //FIXME: this might still be broken in opera according to http://acko.net/blog/mouse-handling-and-absolute-positions-in-javascript
                self.options.position = e.offsetX?e.offsetX:e.clientX-$(e.target).offset().left;
                setPosition();
                that.triggerEvent("change", {
                    position: self.options.position
                });
                $window.mousemove(function(e) {
                    if ($(e.target).is("img")) {
                        self.options.position = e.offsetX?e.offsetX:e.clientX-$(e.target).offset().left;
                        setPosition();
                        that.triggerEvent("change", {
                            position: self.options.position
                        });
                    }
                });
                $window.one("mouseup", function() {
                    $window.unbind("mousemove");
                })
                e.preventDefault();
            }

            function mouseleave(e) {
                self.$tooltip.hide();
            }

            function mousemove(e) {
                //FIXME: this might still be broken in opera according to http://acko.net/blog/mouse-handling-and-absolute-positions-in-javascript
                var position = e.offsetX?e.offsetX:e.clientX-$(e.target).offset().left,
                    subtitle = getSubtitle(position);
                Ox.print("position", position, e)
                self.$tooltip = new Ox.Tooltip({
                        title: subtitle ?
                            "<span class=\"OxBright\">" +
                            highlight(subtitle.text, self.options.find).replace(/\n/g, "<br/>") + "</span><br/>" +
                            Ox.formatDuration(subtitle["in"], 3) + " - " + Ox.formatDuration(subtitle["out"], 3) :
                            Ox.formatDuration(position)
                    })
                    .css({
                        textAlign: "center"
                    })
                    .show(e.clientX, e.clientY);
            }

            function setMarker() {
                self.$markerPosition
                    .css({
                        left: (self.options.position % self.options.width) + "px",
                        top: (parseInt(self.options.position / self.options.width) * (self.height + self.margin) + 2) + "px",
                    });
            }

            function setMarkerPoint(i) {
                var position = self.options.points[i];
                self.$markerPoint[i]
                    .css({
                        left: (position % self.options.width) + "px",
                        top: (parseInt(position / self.options.width) * (self.height + self.margin) + 16) + "px",
                    });
            }

            function setPosition() {
                self.options.position = Ox.limit(self.options.position, 0, self.options.duration);
                setMarker();
            }

            function setWidth() {
                self.lines = Math.ceil(self.options.duration / self.options.width);
                $.each(Ox.range(self.lines), function(i, v) {
                    if (self.$lines[i]) {
                        self.$lines[i].css({
                            width: self.options.width + "px"
                        });
                        self.$images[i].css({
                            marginLeft: (-i * self.options.width) + "px"
                        });
                        self.$subtitles[i].css({
                            marginLeft: (-i * self.options.width) + "px"
                        });
                    } else {
                        addLine(i);
                    }
                });
                while (self.$lines.length > self.lines) {
                    self.$lines[self.$lines.length - 1].remove();
                    self.$lines.pop();
                }
                setMarker();
                setMarkerPoint(0);
                setMarkerPoint(1);
            }

            self.onChange = function(key, value) {
                if (key == "points") {
                    setMarkerPoint(0);
                    setMarkerPoint(1);
                } else if (key == "position") {
                    setPosition();
                } else if (key == "width") {
                    setWidth();
                }
            };

            return that;

        };

        Ox.VideoPlayer = function(options, self) {

            var self = self || {},
                that = new Ox.Element("div", self)
                    .defaults({
                        find: "",
                        height: 0,
                        points: [0, 0],
                        position: 0,
                        posterFrame: 0,
                        subtitles: [],
                        type: "play",
                        url: "",
                        width: 0
                    })
                    .options(options || {})
                    .addClass("OxVideoPlayer")
                    .css({
                        height: (self.options.height + 16) + "px",
                        width: self.options.width + "px"
                    });

            self.controlsHeight = 16;

            self.$video = $("<video preload=auto>")
                .css({
                    height: self.options.height + "px",
                    width: self.options.width + "px"
                })
                .appendTo(that.$element);

            self.video = self.$video[0];
            
            var other = $('video[src='+self.options.url+']')[0];
            if(self.video.mozLoadFrom && other)
                self.video.mozLoadFrom(other);
            else
                self.video.src = self.options.url;

            self.$subtitle = $("<div>")
                .addClass("OxSubtitle")
                .appendTo(that.$element);

            setSubtitleSize();

            self.$markerFrame = $("<div>")
                .addClass("OxMarkerFrame")
                .append(
                    $("<div>")
                        .addClass("OxFrame")
                        .css({
                            width: Math.floor((self.options.width - self.options.height) / 2) + "px",
                            height: self.options.height + "px"
                        })
                )
                .append(
                    $("<div>")
                        .addClass("OxPoster")
                        .css({
                            width: (self.options.height - 2) + "px",
                            height: (self.options.height - 2) + "px"
                        })
                )
                .append(
                    $("<div>")
                        .addClass("OxFrame")
                        .css({
                            width: Math.ceil((self.options.width - self.options.height) / 2) + "px",
                            height: self.options.height + "px"
                        })
                )
                .hide()
                .appendTo(that.$element);

            self.$markerPoint = {}
            $.each(["in", "out"], function(i, point) {
                self.$markerPoint[point] = {};
                $.each(["top", "bottom"], function(i, edge) {
                    var titleCase = Ox.toTitleCase(point) + Ox.toTitleCase(edge);
                    self.$markerPoint[point][edge] = $("<img>")
                        .addClass("OxMarkerPoint OxMarker" + titleCase)
                        .attr({
                            src: "/static/oxjs/build/png/ox.ui/videoMarker" + titleCase + ".png"
                        })
                        .hide()
                        .appendTo(that.$element);
                    if (self.options.points[point == "in" ? 0 : 1] == self.options.position) {
                        self.$markerPoint[point][edge].show();
                    }
                });
            });

            self.$controls = new Ox.Bar({
                    size: self.controlsHeight
                })
                .css({
                    marginTop: "-2px"
                })
                .appendTo(that);

            if (self.options.type == "play") {
                // fixme: $buttonPlay etc.
                self.$playButton = new Ox.Button({
                        id: self.options.id + "Play",
                        title: [
                            {id: "play", title: "play"},
                            {id: "pause", title: "pause"}
                        ],
                        tooltip: ["Play", "Pause"],
                        type: "image"
                    })
                    .bindEvent("click", togglePlay)
                    .appendTo(self.$controls);
                self.$playInToOutButton = new Ox.Button({
                        id: self.options.id + "PlayInToOut",
                        title: "PlayInToOut",
                        tooltip: "Play In to Out",
                        type: "image"
                    })
                    .bindEvent("click", function() {
                        that.playInToOut();
                    })
                    .appendTo(self.$controls);
                self.$muteButton = new Ox.Button({
                        id: self.options.id + "Mute",
                        title: [
                            {id: "mute", title: "mute"},
                            {id: "unmute", title: "unmute"}
                        ],
                        tooltip: ["Mute", "Unmute"],
                        type: "image"
                    })
                    .bindEvent("click", toggleMute)
                    .appendTo(self.$controls);
            } else {
                self.$goToPointButton = new Ox.Button({
                        id: self.options.id + "GoTo" + Ox.toTitleCase(self.options.type),
                        title: "GoTo" + Ox.toTitleCase(self.options.type),
                        tooltip: "Go to " + Ox.toTitleCase(self.options.type) + " Point",
                        type: "image"
                    })
                    .bindEvent("click", goToPoint)
                    .appendTo(self.$controls);
                self.$setPointButton = new Ox.Button({
                        id: self.options.id + "Set" + Ox.toTitleCase(self.options.type),
                        title: "Set" + Ox.toTitleCase(self.options.type),
                        tooltip: "Set " + Ox.toTitleCase(self.options.type) + " Point",
                        type: "image"
                    })
                    .bindEvent("click", setPoint)
                    .appendTo(self.$controls);
            }

            self.$positionInput = new Ox.TimeInput({
                    milliseconds: true,
                    seconds: true,
                    value: Ox.formatDuration(self.options.position)
                })
                .css({
                    float: "right",
                })
                .appendTo(self.$controls)

            self.$positionInput.css({
                width: "98px"
            });
            // fixme: children doesnt work w/o $element
            self.$positionInput.$element.children(".OxLabel").each(function(i, element) {
                $(this).css({
                    width: "22px",
                    marginLeft: (i == 0 ? 8 : 0) + "px",
                    background: "rgb(32, 32, 32)"
                });
            });
            self.$positionInput.$element.children("div.OxInput").each(function(i) {
                var marginLeft = [-82, -58, -34, -10];
                $(this).css({
                    marginLeft: marginLeft[i] + "px"
                }).addClass("foo");
            });

            self.$loadingIcon = new Ox.LoadingIcon()
                .css({
                    position: "absolute",
                    left: (parseInt(self.options.width / 2) - 8) + "px",
                    top: (parseInt(self.options.height / 2) - 8) + "px"
                })
                .appendTo(that)
                .start();

            self.loadInterval = setInterval(function() {
                if (self.video.readyState) {
                    clearInterval(self.loadInterval);
                    self.$loadingIcon.stop();
                    setPosition();
                }
            }, 50);

            function getSubtitle() {
                var subtitle = "";
                $.each(self.options.subtitles, function(i, v) {
                    if (v["in"] <= self.options.position && v["out"] > self.options.position) {
                        subtitle = v.text;
                        return false;
                    }
                });
                return subtitle;
            }

            function goToPoint() {
                that.triggerEvent("change", {
                    position: self.options.points[self.options.type == "in" ? 0 : 1]
                });
            }

            function playing() {
                self.options.position = self.video.currentTime;
                if (self.video.ended) {
                    self.$playButton.trigger("click");
                }
                if (self.playingInToOut && self.options.position >= self.options.points[1])  {
                    self.$playButton.trigger("click");
                    self.options.position = self.options.points[1];
                }
                setMarkers();
                setSubtitle();
                self.$positionInput.options({
                    value: Ox.formatDuration(self.options.position)
                });
                that.triggerEvent("change", {
                    position: self.options.position
                });
            }

            function setHeight() {
                that.css({
                    height: (self.options.height + 16) + "px"
                });
                self.$video.css({
                    height: self.options.height + "px"
                });
                setSubtitleSize();
            }

            function setMarkers() {
                self.options.position == self.options.posterFrame ? self.$markerFrame.show() : self.$markerFrame.hide();
                $.each(self.$markerPoint, function(point, markers) {
                    $.each(markers, function(edge, marker) {
                        self.options.position == self.options.points[point == "in" ? 0 : 1] ?
                                marker.show() : marker.hide();
                    });
                })
            }

            function setPoint() {
                var data = {};
                self.options.points[self.options.type == "in" ? 0 : 1] = self.options.position;
                setMarkers();
                data[self.options.type] = self.options.position;
                that.triggerEvent("set", data);
            }

            function setPosition() {
                self.video.currentTime = self.options.position;
                setMarkers();
                setSubtitle();
                self.$positionInput.options({
                    value: Ox.formatDuration(self.options.position)
                });
            }

            function setSubtitle() {
                var subtitle = getSubtitle();
                if (subtitle != self.subtitle) {
                    self.subtitle = subtitle;
                    self.$subtitle.html(highlight(self.subtitle, self.options.find).replace(/\n/g, "<br/>"));
                }
            }

            function setSubtitleSize() {
                self.$subtitle.css({
                    bottom: parseInt(self.controlsHeight + self.options.height / 16) + "px",
                    width: self.options.width + "px",
                    fontSize: parseInt(self.options.height / 20) + "px",
                    WebkitTextStroke: (self.options.height / 1000) + "px rgb(0, 0, 0)"
                });
            }

            function setWidth() {
                that.css({
                    width: self.options.width + "px"
                });
                self.$video.css({
                    width: self.options.width + "px"
                });
                setSubtitleSize();
            }

            function toggleMute() {
                self.video.muted = !self.video.muted;
            }

            function togglePlay() {
                self.video.paused ? that.play() : that.pause();
            }

            self.onChange = function(key, value) {
                if (key == "height") {
                    setHeight();
                } else if (key == "points") {
                    setMarkers();
                } else if (key == "position") {
                    setPosition();
                } else if (key == "posterFrame") {
                    setMarkers();
                } else if (key == "width") {
                    setWidth();
                }
            }

            that.mute = function() {
                self.video.muted = true;
                return that;
            };

            that.pause = function() {
                self.video.pause();
                clearInterval(self.playInterval);
                self.playingInToOut = false;
                return that;
            };

            that.play = function() {
                self.video.play();
                self.playInterval = setInterval(playing, 40);
                return that;
            };

            that.playInToOut = function() {
                self.options.position = self.options.points[0];
                setPosition();
                Ox.print("sop", self.options.position, self.options.points);
                self.playingInToOut = true;
                self.video.paused && self.$playButton.trigger("click");
                return that;
            };

            that.toggleMute = function() {
                self.$muteButton.trigger("click");
                return that;
            }

            that.togglePlay = function() {
                self.$playButton.trigger("click");
                return that;
            }

            that.unmute = function() {
                self.video.muted = false;
                return that;
            };

            return that;

        }

        $.getJSON("/" + videoId + "/data/subtitles.json", function(data) {

            subtitles = data;

            $.getJSON("/" + videoId + "/data/cuts.json", function(data) {

                cuts = data;

                $main = new Ox.SplitPanel({
                    elements: [
                        {
                            element: $lists = new Ox.Container({
                                id: "lists"
                            }),
                            resizable: true,
                            resize: [128, 192, 256],
                            size: 192
                        },
                        {
                            element: $panel = new Ox.SplitPanel({
                                elements: [
                                    {
                                        element: $annotation = new Ox.Container({
                                            id: "annotation"
                                        }),
                                        resizable: true,
                                        resize: [128, 192, 256],
                                        size: 192
                                    },
                                    {
                                        element: $editor = new Ox.Editor({
                                            cuts: cuts,
                                            duration: duration,
                                            find: find,
                                            id: "editor",
                                            largeTimeline: true,
                                            matches: matches,
                                            points: points,
                                            position: position,
                                            posterFrame: posterFrame,
                                            subtitles: subtitles,
                                            videoHeight: videoHeight,
                                            videoId: videoId,
                                            videoWidth: videoWidth,
                                            videoSize: "large",
                                            width: pageWidth
                                        })
                                    },
                                ],
                                id: "panel",
                                orientation: "horizontal",
                            })
                        }
                    ],
                    id: "main",
                    orientation: "horizontal"
                }).appendTo($body);

            });

        });
    });

    function highlight(txt, str) {
        return str ? txt.replace(
            new RegExp("(" + str + ")", "ig"),
            "<span class=\"OxHighlight\">$1</span>"
        ) : txt;
    }

    $window.resize(function() {
        $editor.options({
            width: $document.width() - 384 -2
        });
        //resizeVideoPlayers($window.width() - 384 - 2);
    })

    Ox.theme("modern")
});
