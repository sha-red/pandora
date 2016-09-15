'use strict';

pandora.ui.uploadButton = function() {

    var that = Ox.Button({
        style: 'symbol',
        title: 'upload',
        type: 'image'
    }).css({
        display: 'none'
    }).bindEvent({
        click: function() {
            pandora.ui.tasksDialog({
                tasks: 'uploads'
            }).open();
        }
    });

    that.update = function() {
        that.css({
            display: pandora.uploadQueue.uploading ? 'block' : 'none'
        });
    };

    return that;

};
