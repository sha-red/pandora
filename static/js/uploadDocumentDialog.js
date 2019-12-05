'use strict';

pandora.ui.uploadDocumentDialog = function(options, callback) {
    var files = options.files,
        extensions = files.map(function(file) {
            return file.name.split('.').pop().toLowerCase()
        }),
        existingFiles = [],
        uploadFiles = [],

        supportedExtensions = ['gif', 'jpg', 'jpeg', 'pdf', 'png'],

        filename,

        ids = [],

        upload,

        $errorDialog,

        $content = Ox.Element().css({margin: '16px'}),

        $text = $('<div>')
            .html(Ox._('Uploading {0}', [files[0].name]))
            .appendTo($content),

        $progress = Ox.Progressbar({
                width: 256,
                showPercent: true,
                showTime: true
            })
            .css({margin: '16px 0 16px 0'})
            .appendTo($content),

        $message = $('<div>')
            .appendTo($content),

        $uploadDialog = Ox.Dialog({
                buttons: [
                    Ox.Button({
                        id: 'close',
                        title: Ox._('Cancel Upload')
                    }).bindEvent({
                        click: function() {
                            var title = this.options('title');
                            $uploadDialog.close();
                            if (title == Ox._('Cancel Upload')) {
                                upload && upload.abort();
                            } else if (title == Ox._('Done')) {
                                callback && callback({
                                    ids: ids
                                });
                            }
                        }
                    })
                ],
                content: $content,
                height: 112,
                keys: {escape: 'close'},
                width: 288,
                title: uploadFiles.length == 1
                    ? Ox._('Upload Document')
                    : Ox._('Upload {0} Documents', [uploadFiles.length])
            })
            .bindEvent({
                open: function() {
                    uploadFile(0);
                }
            });

    if (!Ox.every(extensions, function(extension) {
        return Ox.contains(supportedExtensions, extension)
    })) {
        return errorDialog(
            Ox._('Supported file types are GIF, JPG, PNG and PDF.')
        );
    } else {
        var oshashes = [];
        Ox.parallelForEach(files, function(file, index, array, callback) {
            var extension = file.name.split('.').pop().toLowerCase(),
                filename = file.name.split('.').slice(0, -1).join('.') + '.'
                    + (extension == 'jpeg' ? 'jpg' : extension);
            Ox.oshash(file, function(oshash) {
                // skip duplicate files
                if (Ox.contains(oshashes, oshash)) {
                    callback();
                } else {
                    oshashes.push(oshash)
                    pandora.api.findDocuments({
                        keys: ['id', 'user', 'title', 'extension'],
                        query: {
                            conditions: [{
                                key: 'oshash',
                                operator: '==',
                                value: oshash
                            }],
                            operator: '&'
                        },
                        range: [0, 1],
                        sort: [{key: 'title', operator: '+'}]
                    }, function(result) {
                        if (result.data.items.length) {
                            var id = result.data.items[0].title + '.'
                                + result.data.items[0].extension;
                            existingFiles.push({
                                id: id,
                                filename: filename

                            })
                        } else {
                            uploadFiles.push(file)
                        }
                        callback();
                    })
                }
            });
        } ,function() {
            if (uploadFiles.length) {
                $uploadDialog.open();
            } else if (existingFiles.length) {
                var filename = existingFiles[0].filename
                var id = existingFiles[0].id
                errorDialog(
                    filename == id
                    ? Ox._(
                        'The file "{0}" already exists.',
                        [filename]
                    )
                    : Ox._(
                        'The file "{0}" already exists as "{1}".',
                        [filename, id]
                    )
                ).open();
            }
        });
        return {open: Ox.noop};
    }

    function errorDialog(text) {
        return $errorDialog = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                        id: 'close',
                        title: Ox._('Close')
                    })
                    .bindEvent({
                        click: function() {
                            $errorDialog.close();
                        }
                    })
            ],
            content: text,
            title: Ox._('Upload Document')
        });
    }

    function uploadFile(part) {
        var data = {
            },
            file = uploadFiles[part],
            extension = file.name.split('.').pop().toLowerCase(),
            filename = file.name.split('.').slice(0, -1).join('.') + '.'
                + (extension == 'jpeg' ? 'jpg' : extension);

            $text.html(Ox._('Uploading {0}', [file.name]));
            if (options.id) {
                data.id = options.id;
            }
            data.filename = filename;
            upload = pandora.chunkupload({
                data: data,
                file: file,
                url: '/api/upload/document/',
            })
            .bindEvent({
                done: function(data) {
                    if (data.progress == 1) {
                        part++;
                        ids.push(data.response.id);
                        if (part == uploadFiles.length) {
                            $progress.options({progress: data.progress});
                            callback && callback({ids: ids});
                            $uploadDialog.close();
                        } else {
                            uploadFile(part);
                        }
                    } else {
                        $message.html(Ox._('Upload failed.'))
                        $uploadDialog.options('buttons')[0].options({
                            title: Ox._('Close')
                        });
                    }
                },
                progress: function(data) {
                    var progress = data.progress || 0;
                    progress = part / uploadFiles.length + 1 / uploadFiles.length * progress;
                    $progress.options({progress: progress});
                }
            });
    }
};

