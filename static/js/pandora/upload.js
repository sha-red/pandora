// vi:si:et:sw=4:sts=4:ts=4
'use strict';

pandora.ui.upload = function(oshash, file) {
    var self = {},
        chunkSize = 1024*1024,
        chunkUrl,
        format = pandora.site.video.formats[0],
        maxRetry = -1,
        resolution = Ox.max(pandora.site.video.resolutions),
        retries = 0,
        that = Ox.Element(),
        uploadData = {},
        uploadUrl = '/api/upload/?profile='+resolution+'p.'+format+'&id=' + oshash;

    initUpload();

    function done() {
        that.triggerEvent('done', {
            status: that.status,
            progress: that.progress,
            responseText: that.responseText
        });
    }

    function initUpload() {
        //request upload slot from server
        that.status = 'requesting chunk upload';
        that.progress = 0;
        self.req = new XMLHttpRequest();
        self.req.addEventListener('load', function (evt) {
            var response = {};
            that.responseText = evt.target.responseText;
            try {
                response = JSON.parse(evt.target.responseText);
            } catch(e) {
                response = {};
                that.status = 'failed to parse response';
                that.progress = -1;
                done();
            }
            if (response.maxRetry) {
                maxRetry = response.maxRetry;
            }
            chunkUrl = response.uploadUrl;
            if (document.location.protocol == 'https:') {
                chunkUrl = chunkUrl.replace(/http:\/\//, 'https://');
            }
            if (chunkUrl) {
                that.status = 'uploading';
                that.progress = 0.0;
                //start upload
                uploadChunk(0);
            } else {
                that.status = 'upload failed, no upload url provided';
                that.progress = -1;
                done();
            }
        }, false);
        self.req.addEventListener('error', function (evt) {
            that.status = 'uplaod failed';
            that.progress = -1;
            that.responseText = evt.target.responseText;
            done();
        }, false);
        self.req.addEventListener('abort', function (evt) {
            that.status = 'aborted';
            that.progress = -1;
            done();
        }, false);
        var formData = new FormData();
        Ox.forEach(uploadData, function(value, key) {
            formData.append(key, value);
        });
        self.req.open('POST', uploadUrl);
        self.req.send(formData);
    }

    function progress(p) {
        that.progress = p;
        that.triggerEvent('progress', {
            progress: that.progress
        });
    }

    function uploadChunk(chunkId) {
        var bytesAvailable = file.size,
            chunk,
            chunkOffset = chunkId * chunkSize;

        if (file.mozSlice) {
            chunk = file.mozSlice(chunkOffset, chunkOffset+chunkSize, file.type);
        } else if (file.webkitSlice) {
            chunk = file.webkitSlice(chunkOffset, chunkOffset+chunkSize, file.type);
        }

        progress(parseFloat(chunkOffset)/bytesAvailable);

        self.req = new XMLHttpRequest();
        self.req.addEventListener('load', function (evt) {
            var response;
            that.responseText = evt.target.responseText;
            try {
                response = JSON.parse(evt.target.responseText);
            } catch(e) {
                response = {};
            }
            if (response.done == 1) {
                //upload finished
                that.resultUrl = response.resultUrl;
                that.progress = 1;
                that.status = 'done';
                done();
            } else if (response.result == 1) {
                //reset retry counter
                retries = 0;
                //start uploading next chunk
                uploadChunk(chunkId + 1);
            } else {
                //failed to upload, try again in 5 second
                retries++;
                if (maxRetry > 0 && retries > maxRetry) {
                    that.status = 'uplaod failed';
                    that.progress = -1;
                    done();
                } else {
                    setTimeout(function() {
                        uploadChunk(chunkId);
                    }, 5000);
                }
            }
        }, false);
        self.req.addEventListener('error', function (evt) {
            //failed to upload, try again in 3 second
            retries++;
            if (maxRetry > 0 && retries > maxRetry) {
                that.status = 'uplaod failed';
                that.progress = -1;
                done();
            } else {
                setTimeout(function() {
                    uploadChunk(chunkId);
                }, 3000);
            }
        }, false);
        self.req.upload.addEventListener('progress', function (evt) {
            if (evt.lengthComputable) {
                progress(parseFloat(chunkOffset + evt.loaded) / bytesAvailable);
            }
        }, false);
        self.req.addEventListener('abort', function (evt) {
            that.status = 'aborted';
            that.progress = -1;
            done();
        }, false);

        var formData = new FormData();
        formData.append('chunkId', chunkId);
        if (bytesAvailable <= chunkOffset + chunkSize) {
            formData.append('done', 1);
        }
        formData.append('chunk', chunk);
        self.req.open('POST', chunkUrl, true);
        self.req.send(formData);
    }

    that.abort = function() {
        if (self.req) {
            self.req.abort();
            self.req = null;
        }
    };
    return that;
};
