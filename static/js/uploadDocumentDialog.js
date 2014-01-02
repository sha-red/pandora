// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.uploadDocumentDialog = function(files, callback) {

    var extensions = files.map(function(file) {
            return file.name.split('.').pop().toLowerCase()
        }),

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
                                callback({
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
                title: files.length == 1
                    ? Ox._('Upload Document')
                    : Ox._('Upload {0} Documents', [files.length])
            })
            .bindEvent({
                open: function() {
                    uploadFile(0);
                }
            });

    if (!Ox.every(extensions, function(extension) {
        return Ox.contains(supportedExtensions, extension)
    })) {
        return errorDialog(Ox._('Supported file types are GIF, JPG, PNG and PDF.'));
    } else {
        var valid = true;
        Ox.parallelForEach(files, function(file, index, array, callback) {
            var extension = file.name.split('.').pop().toLowerCase(),
                filename = file.name.split('.').slice(0, -1).join('.') + '.'
                    + (extension == 'jpeg' ? 'jpg' : extension);
            valid && Ox.oshash(file, function(oshash) {
                pandora.api.findDocuments({
                    keys: ['id', 'user', 'name', 'extension'],
                    query: {
                        conditions: [{key: 'oshash', value: oshash, operator: '=='}],
                        operator: '&'
                    },
                    range: [0, 1],
                    sort: [{key: 'name', operator: '+'}]
                }, function(result) {
                    if (result.data.items.length) {
                        var id = result.data.items[0].name + '.' + result.data.items[0].extension;
                        valid && errorDialog(filename == id
                            ? Ox._('The file {0} already exists', [filename])
                            : Ox._('The file {0} already exists as {1}', [filename, id])
                        ).open();
                        valid = false;
                    }
                    callback();
                })
            });
        } ,function() {
            valid && $uploadDialog.open();
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
        var file = files[part],
            extension = file.name.split('.').pop().toLowerCase(),
            filename = file.name.split('.').slice(0, -1).join('.') + '.'
                + (extension == 'jpeg' ? 'jpg' : extension);

            $text.html(Ox._('Uploading {0}', [file.name]));
            upload = pandora.chunkupload({
                data: {
                    filename: filename
                },
                file: file,
                url: '/api/upload/document/',
            })
            .bindEvent({
                done: function(data) {
                    if (data.progress == 1) {
                        part++;
                        if (part == files.length) {
                            $progress.options({progress: data.progress});
                            $uploadDialog.options('buttons')[0].options({title: Ox._('Done')});
                            ids.push(data.id);
                        } else {
                            uploadFile(part);
                        }
                    } else {
                        $message.html(Ox._('Upload failed.'))
                        $uploadDialog.options('buttons')[0].options({title: Ox._('Close')});
                    }
                },
                progress: function(data) {
                    var progress = data.progress || 0;
                    progress = part/files.length + 1/files.length * progress;
                    $progress.options({progress: progress});
                }
            });
    }
};

