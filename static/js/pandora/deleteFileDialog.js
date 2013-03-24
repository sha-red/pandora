// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.deleteFileDialog = function(file, callback) {

    var that = pandora.ui.iconDialog({
            buttons: [
                Ox.Button({
                    id: 'keep',
                    title: 'Keep File'
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    id: 'delete',
                    title: 'Delete File'
                }).bindEvent({
                    click: function() {
                        that.close();
                        pandora.api.removeFile({
                            id: file
                        }, function(result) {
                            Ox.Request.clearCache('findFiles');
                            callback();
                        });
                    }
                })
            ],
            keys: {enter: 'delete', escape: 'keep'},
            text: 'Are you sure you want to delete the file'
                + ' "'+ file + '"?',
            title: 'Delete File'
        });

    return that;

};

