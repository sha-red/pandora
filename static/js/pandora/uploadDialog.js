// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.uploadDialog = function(data) {
    var content = Ox.Element().css({margin: '16px'}),
        canceled = false,
        file,
        closeButton,
        actionButton,
        selectFile,
        that = Ox.Dialog({
            buttons: [
                closeButton = Ox.Button({
                    id: 'close',
                    title: 'Close'
                }).bindEvent({
                    click: function() {
                        that.triggerEvent('close');
                    }
                }),
                actionButton = Ox.Button({
                    id: 'action',
                    title: 'Select Video'
                }).bindEvent({
                    click: function() {
                        if(actionButton.options('title') == 'Select Video') {
                            if(selectVideo()) {
                                actionButton.options('title', 'Upload');
                            }
                        } else if(actionButton.options('title') == 'Close') {
                            that.close();
                        } else if(actionButton.options('title') == 'Cancel') {
                            canceled = true;
                            pandora.firefogg && pandora.firefogg.cancel();
                            pandora.$ui.upload && pandora.$ui.upload.abort();
                            actionButton.options('title', 'Select Video');
                            closeButton.show();
                        } else {
                            actionButton.options('title', 'Cancel');
                            closeButton.hide();
                            encode();
                        }
                    }
                })
            ],
            content: content,
            height: 128,
            removeOnClose: true,
            width: 368,
            title: 'Upload Video',
        })
        .bindEvent({
            close: function(data) {
                if (pandora.firefogg) {
                    pandora.firefogg.cancel();
                    delete pandora.firefogg;
                }
                that.close();
            }
        }),
        $info= $('<div>').css({
            padding: '4px'
        })
        .html('Please select the video file you want to upload.'),
        $status = $('<div>').css({
            padding: '4px',
            paddingTop: '8px'
        }),
        $progress;

    pandora._status = $status;
    pandora._info = $info;
    if(typeof(Firefogg) == 'undefined') {
        /*
        selectFile = $('<input>')
            .attr({
                type: 'file'
            })
            .css({
                padding: '8px'
            })
            .bind({
                change: function(event) {
                    if(this.files.length) {
                        file = this.files[0];
                        if(file.type == 'video/webm') {
                            $status.html('');
                            uploadButton.options({
                                disabled: false
                            });
                        } else {
                            $status.html('Currently only WebM files are supported.  (<a href="/help/encoding">Help encoding video</a>)');
                        }
                    } else {
                        uploadButton.options({
                            disabled: true
                        });
                    }
                }
            })
            .appendTo(content);
        */
        actionButton.options({
            title: 'Close'
        });
        $info.css({
            paddingTop: '16px',
            paddingBottom: '16px'
        }).html(
            'Sorry, right now upload is only supported in '
            + '<a target="_new" href="http://getfirefox.com">Firefox</a> '
            + 'with <a target="_new" href="http://firefogg.org/">Firefogg</a> installed.'
            + '<br><br>You can also use <a target="_new" href="https://wiki.0x2620.org/wiki/pandora_client">pandora_client</a> to upload videos.'
        );
    }
    content.append($info);
    content.append($status);


    function aspectratio(ratio) {
        var numerator,
            denominator;
        ratio = ratio.split(':');
        numerator = ratio[0];
        if(ratio.length == 2) {
            denominator = ratio[1];
        }
        if (Math.abs(numerator/denominator - 4/3) < 0.03) {
            numerator = 4;
            denominator = 3;
        } else if (Math.abs(numerator/denominator - 16/9) < 0.02) {
            numerator = 16;
            denominator = 9;
        }
        return {
            numerator: numerator,
            denominator: denominator,
            ratio: numerator + ':' + denominator,
            'float': numerator/denominator
        };
    }

    function resetProgress() {
        $progress = Ox.Progressbar({
            progress: 0,
            showPercent: true,
            showTime: true,
            width: 304
        });
        $status.html('').append($progress);
    }
    function encode() {
        var info = JSON.parse(pandora.firefogg.sourceInfo),
            oshash = info.oshash,
            filename = pandora.firefogg.sourceFilename,
            item;
        resetProgress();
        pandora.api.addFile({
            id: oshash,
            filename: filename,
            info: info
        }, function(result) {
            item = result.data.item;
            pandora.firefogg.encode(
                getEncodingOptions(info),
                function(result, file) {
                    result = JSON.parse(result);
                    if (result.progress != 1) {
                        if(canceled) {
                            $status.html('Encoding canceled.');
                        } else {
                            $status.html('Encoding failed.');
                        }
                        delete pandora.firefogg;
                        return;
                    }
                    setTimeout(function() {
                        //$status.html('uploading... ');
                        pandora.$ui.upload = pandora.ui.upload(oshash, file)
                            .bindEvent({
                                progress: function(data) {
                                    var progress = data.progress || 0;
                                    $progress.options({progress: 0.5 + progress/2});
                                },
                                done: function(data) {
                                    pandora.UI.set({
                                        item: item,
                                        itemView: 'files'
                                    });
                                    delete pandora.firefogg;
                                    that.close();
                               }
                            });
                    });
                },
                function(progress) {
                    progress = JSON.parse(progress).progress || 0;
                    $progress.options({progress: progress / 2});
                }
            );
        });
    }

    function getEncodingOptions(info) {
        var format = pandora.site.video.formats[0],
            resolution = Ox.max(pandora.site.video.resolutions),
            bpp = 0.17,
            fps,
            dar,
            options = {};

        if(format == 'webm') {
            options.videoCodec = 'vp8';
            options.audioCodec = 'vorbis';
        } else if (format == 'ogv') {
            options.videoCodec = 'theora';
            options.audioCodec = 'vorbis';
        }

        if (resolution == 720) {
            options.height = 720;
            options.samplerate = 48000;
            options.audioQuality = 5;
        } else if (resolution == 480) {
            options.height = 480;
            options.samplerate = 44100;
            options.audioQuality = 3;
            options.channels = 2;
        } else if (resolution == 360) {
            options.height = 320;
            options.samplerate = 44100;
            options.audioQuality = 1;
            options.channels = 1;
        } else if (resolution == 240) {
            options.height = 240;
            options.samplerate = 44100;
            options.audioQuality = 0;
            options.channels = 1;
        } else if (resolution == 96) {
            options.height = 96;
            options.samplerate = 22050;
            options.audioQuality = -1;
            options.audioBitrate = 22;
            options.channels = 1;
        }
        if (info.video && info.video[0].display_aspect_ratio) {
            dar = aspectratio(info.video[0].display_aspect_ratio);
            fps = aspectratio(info.video[0].framerate).float;
            options.width = parseInt(dar.float * options.height, 10);
            options.width += options.width % 2;

            //interlaced hdv material is detected with double framerates
            if (fps == 50) {
                options.framerate = 25;
            } else if (fps == 60) {
                options.framerate = 30;
            }

            if (Math.abs(options.width/options.height - dar.float) < 0.02) {
                options.aspect = options.width + ':' + options.height;
            } else {
                options.aspect = dar.ratio;
            }
            options.videoBitrate = Math.round(options.height*options.width*fps*bpp/1000);
            options.denoise = true; 
            options.deinterlace = true; 
        } else {
            options.noVideo = true;
        }
        if (info.audio) {
            if (options.cannels && info.audio[0].channels < options.channels) {
                delete options.channels;
            }
        } else {
            options.noAudio = true;
            delete options.samplerate;
            delete options.audioQuality;
            delete options.channels;
        }

        options.noUpscaling = true;

        if((!info.video.length || (info.video[0].codec == options.videoCodec
                && info.video[0].height <= options.height))
            && (!info.audio.length || info.audio[0].codec == options.audioCodec)) {
            options = {
                passthrough: true
            };
        }
        return JSON.stringify(options);
    }

    function formatInfo(info) {
        var html = '';
        html += '<b>' + info.path + '</b>';
        html += '<br />';
        if(info.video && info.video.length>0) {
            var video = info.video[0];
            html += video.width + 'x' + video.height  + ' (' + video.codec + ')';
        }
        if(info.video && info.video.length>0 && info.audio && info.audio.length>0) {
            html += ' / ';
        }
        if(info.audio && info.audio.length>0) {
            var audio= info.audio[0];
            html += '' + {
                1: 'mono',
                2: 'stereo',
                6: '5.1'
            }[audio.channels];
            html += ' ' + audio.samplerate/1000 + ' kHz ';
            html += '(' + audio.codec + ')';
        }
        html += '<br />';
        html += '' + Ox.formatValue(info.size, 'B');
        html += ' / ' + Ox.formatDuration(info.duration);

        return html; 
    }

    function selectVideo() {
        canceled = false;
        pandora.firefogg = new Firefogg();
        pandora.firefogg.setFormat(pandora.site.video.formats[0]);
        if(pandora.firefogg.selectVideo()) {
            var info = JSON.parse(pandora.firefogg.sourceInfo),
                options = JSON.parse(getEncodingOptions(info)),
                oshash = info.oshash,
                filename = pandora.firefogg.sourceFilename,
                item;
            pandora.api.findFiles({
                query: {
                    conditions: [{key: 'oshash', value: oshash}]
                },
                keys: ['id', 'available']
            }, function(result) {
                if(result.data.items.length === 0 || !result.data.items[0].available) {
                    $info.html(formatInfo(info));
                    $status.html(
                        options.passthrough
                        ? 'Your video will be uploaded directly.'
                        : 'Your video will be transcoded before upload.');
                } else {
                    pandora.api.find({
                        query: {
                            conditions: [{key: 'oshash', value: oshash}]
                        },
                        keys: ['id']
                    }, function(result) {
                        pandora.UI.set({
                            item: result.data.items[0].id,
                            itemView: 'files'
                        });
                        delete pandora.firefogg;
                        that.close();
                    });
                }
            });
            return true;
        }
        return false;
    }

    return that;
};
