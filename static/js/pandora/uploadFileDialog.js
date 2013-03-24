// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.uploadFileDialog = function(file, callback) {

    var extension = file.name.split('.').pop().toLowerCase(),

        extensions = ['gif', 'jpg', 'jpeg', 'pdf', 'png'],

        upload,

        $errorDialog,

        $content = Ox.Element().css({margin: '16px'}),

        $text = $('<div>')
            .html('Uploading ' + file.name)
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
                        title: 'Cancel Upload'
                    }).bindEvent({
                        click: function() {
                            if (this.options('title') == 'Cancel Upload') {
                                upload.abort();
                            }
                            $uploadDialog.close();
                        }
                    })
                ],
                content: $content,
                height: 112,
                keys: {escape: 'close'},
                width: 288,
                title: 'Upload File'
            })
            .bindEvent({
                open: function() {
                    upload = pandora.chunkupload({
                            data: {
                                filename: extension == 'jpeg'
                                    ? file.name.split('.').slice(0, -1).join('.') + '.jpg'
                                    : file.name
                            },
                            file: file,
                            url: '/api/upload/file/',
                        })
                        .bindEvent({
                            done: function(data) {
                                if (data.progress == 1) {
                                    $uploadDialog.options('buttons')[0].options({title: 'Done'});
                                    Ox.print('SUCCEEDED');
                                } else {
                                    $message.html('Upload failed.')
                                    $uploadDialog.options('buttons')[0].options({title: 'Close'});
                                    Ox.print('FAILED');
                                }
                            },
                            progress: function(data) {
                                $progress.options({progress: data.progress || 0});
                            }
                        });
                }
            });

    if (!Ox.contains(extensions, extension)) {
        return errorDialog('Supported file types are GIF, JPG, PNG and PDF.');
    } else {
        Ox.oshash(file, function(oshash) {
            pandora.api.findFiles({
                keys: ['id'],
                query: {
                    conditions: [{key: 'oshash', value: oshash, operator: '=='}],
                    operator: '&'
                },
                range: [0, 1],
                sort: [{key: 'name', operator: '+'}]
            }, function(result) {
                var id = pandora.user.name + ':' + file.name;
                if (result.data.items.length) {
                    errorDialog(
                        'The file ' + id + ' already exists' + (
                            file.name == result.data.items[0].id
                                ? ''
                                : ' as ' + result.data.items[0].id
                        ) + '.'
                    ).open();
                } else {
                    $uploadDialog.open();
                }
            })
        });
        return {open: Ox.noop};
    }

    function errorDialog(text) {
        return $errorDialog = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                        id: 'close',
                        title: 'Close'
                    })
                    .bindEvent({
                        click: function() {
                            $errorDialog.close();
                        }
                    })
            ],
            title: 'Upload File',
            text: text
        });
    }

};

