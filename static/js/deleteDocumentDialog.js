// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.deleteDocumentDialog = function(files, callback) {

    var string = Ox._(files.length == 1 ? 'Document' : 'Documents'),
        that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    id: 'keep',
                    title: Ox._('Keep {0}', [string])
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    id: 'delete',
                    title: Ox._('Delete {0}', [string])
                }).bindEvent({
                    click: function() {
                        that.close();
                        pandora.api.removeDocument({
                            ids: files.map(function(file) {
                                return file.id;
                            })
                        }, callback);
                    }
                })
            ],
            content: files.length == 1
                ? Ox._('Are you sure you want to delete the document "{0}"?', [files[0].name + '.' + files[0].extension])
                : Ox._('Are you sure you want to delete {0} documents?', [files.length]),
            keys: {enter: 'delete', escape: 'keep'},
            title: files.length == 1
                ? Ox._('Delete {0}', [string])
                : Ox._('Delete {0} Documents', [files.length])
        });

    return that;

};

