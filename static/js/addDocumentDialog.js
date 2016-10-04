'use strict';

pandora.ui.addDocumentDialog = function(options) {
    options = options || {};

    var input = '';

    var selected = options.selected ? options.selected : 'upload';

    var $button;

    var $panel = Ox.TabPanel({
        content: function(id) {
            var $content = Ox.Element().css({padding: '8px'});
            var $input = Ox.Input({
                changeOnKeypress: true,
                disabled: id == 'upload',
                label: Ox._(id == 'add' ? 'Title' : id == 'upload' ? 'File': 'URL'),
                labelWidth: 64,
                placeholder: '',
                width: 512
            }).css({
                margin: '8px'
            }).bindEvent({
                change: function(data) {
                    $button.options({disabled: !data.value});
                    input = data.value;
                }
            }).appendTo($content);
            return $content;
        },
        tabs: [
            {
                id: 'add',
                title: Ox._('Add {0}', [Ox._('Document')]),
                disabled: false,
                selected: selected == 'add'
            },
            {
                id: 'upload',
                title: Ox._('Upload Documents'),
                selected: selected == 'upload'
            }
        ]
    }).bindEvent({
        change: function(data) {
            selected = data.selected;
            that.options({buttons: [createButton()]});
        }
    });

    var $screen = Ox.LoadingScreen({
        size: 16
    });

    var that = Ox.Dialog({
        buttons: [createButton()],
        closeButton: true,
        content: $panel,
        height: 72,
        removeOnClose: true,
        title: Ox._('Add {0}', [Ox._('Document')]),
        width: 544
    });

    function createButton() {
        $button = Ox[selected == 'upload' ? 'FileButton' : 'Button']({
            disabled: selected != 'upload',
            id: selected,
            title: selected == 'add'
                ? Ox._('Add {0}', ['Document'])
                : Ox._('Select Documents'),
            width: selected == 'add' ? 192 : 128
        }).bindEvent({
            click: function(data) {
                if (selected == 'add') {
                    that.options({content: $screen.start()});
                    $button.options({disabled: true});
                    pandora.api.addDocument({title: input}, function(result) {
                        Ox.Request.clearCache('find');
                        $screen.stop();
                        that.close();
                        pandora.UI.set({
                            document: result.data.id
                        });
                    });
                } else if (selected == 'upload' && data.files.length > 0) {
                    that.close();
                    pandora.ui.uploadDocumentDialog({
                        files: data.files
                    }, function(files) {
                        if (files) {
                            Ox.Request.clearCache('findDocuments');
                            if (pandora.user.ui.document) {
                                pandora.UI.set({document: ''});
                            } else {
                                pandora.$ui.list && pandora.$ui.list.reloadList();
                            }
                        }
                    }).open();
                }
            }
        });
        return $button;
    }

    return that;

};
