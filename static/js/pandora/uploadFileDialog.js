// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.uploadFileDialog = function(file, callback) {

    var extension = file.name.split('.').pop().toLowerCase(),

        extensions = ['jpg', 'jpeg', 'pdf', 'png'],

        jpg = false,

        upload,

        $content = Ox.Element(),

        $text = $('<div>')
            .html('Uploading ' + file.name)
            .appendTo($content),

        $progress = Ox.Progressbar({
                width: 256,
                showPercent: true,
                showTime: true
            })
            .appendTo($content),

        $extensionDialog = pandora.iconDialog({
            buttons: [
                Ox.Button({
                        id: 'close',
                        title: 'Close'
                    })
                    .bindEvent({
                        click: function() {
                            $extensionDialog.close();
                        }
                    })
            ],
            title: 'Upload File',
            text: 'Supported file types are JPG, PNG and PDF.'
        }),

        $imageDialog = pandora.iconDialog({
            buttons: [
                Ox.Button({
                        id: 'png',
                        title: 'Keep as PNG',
                    })
                    .bindEvent({
                        click: function() {
                            $imageDialog.close();
                            $uploadDialog.open();
                        }
                    }),
                Ox.Button({
                        id: 'jpg'
                        title: 'Encode as JPG'
                    })
                    .bindEvent({
                        click: function() {
                            jpg = true;
                            $imageDialog.close();
                            $uploadDialog.open();
                        }
                    })
            ],
            text: 'Do you want to encode the image as JPG?<br><br>'
                + '(JPGs are significantly smaller, but do not support transparency.)',
            title: 'Upload File'
        }),

        $uploadDialog = Ox.Dialog({
                buttons: [
                    Ox.Button({
                        id: 'close',
                        title: 'Cancel Upload'
                    }).bindEvent({
                        click: function() {
                            if (that.title == 'Cancel Upload') {
                                upload.abort();
                            }
                            $uploadDialog.close();
                        }
                    })
                ],
                content: $content,
                height: 128,
                keys: {escape: 'close'},
                width: 288,
                title: 'Upload File'
            })
            .bindEvent({
                open: function() {
                    upload = pandora.chunkupload({
                            data: {
                                filename: jpg || extension == 'jpeg'
                                    ? file.name.split('.').slice(0, -1).join('.') + '.jpg'
                                    : file.name
                            },
                            file: file,
                            url: '/api/upload/file/',
                        })
                        .bindEvent({
                            done: function(data) {
                                if (data.progress == 1) {
                                    that.options('buttons')[0].options({title: 'Done'})
                                    Ox.print('SUCCEEDED');
                                } else {
                                    that.options('buttons')[0].options({title: 'Retry Upload'})
                                    Ox.print('FAILED');
                                }
                            },
                            progress: function(data) {
                                $progress.options({progress: data.progress || 0});
                            }
                        });
                }
            });

    return !Ox.contains(extensions, extension) ? $extensionDialog
        : extension == 'png' ? $imageDialog
        : $uploadDialog;

};

