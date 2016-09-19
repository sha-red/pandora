'use strict';

pandora.ui.mediaExistsDialog = function(options) {

    var title = options.media.length == 1 ? 'File Exists' : 'Files Exist';

    var $content = Ox.Element().addClass('OxText').css({
        margin: '16px',
        overflow: 'auto'
    }).html(
        '<p>' + (
            options.media.length == 1 && options.items.length == 1
            ? Ox._('The video file already exists:')
            : options.media.length == options.items.length
            ? Ox._(
                'All {0} video files already exist:',
                [options.media.length]
            )
            : Ox._(
                '{0} of the {1} video files already exist:',
                [options.media.length, options.items.length])
        ) + '</p>' + options.media.map(function(media) {
            return media[options.action == 'upload' ? 'name' : 'title']
                + ': <a href="/' + media.itemID + '" target="_blank">'
                + media.itemTitle + '</a>';
        }).join('<br/>')
    )

    var $buttons = options.media.length == options.items.length ? [
        Ox.Button({
            id: 'close',
            title: Ox._('Close')
        }).bindEvent({
            click: function() {
                that.close();
            }
        })
    ] : [
        Ox.Button({
            id: 'cancel',
            title: Ox._('Don\'t {0}', [Ox.toTitleCase(options.action)])
        }).bindEvent({
            click: function() {
                that.close();
            }
        }),
        Ox.Button({
            id: 'continue',
            title: Ox._(Ox.toTitleCase(options.action)) + ' '
            + (options.items.length - options.media.length) + ' '
            + Ox._(options.items.length - options.media.length == 1 ? 'File' : 'Files')
        }).bindEvent({
            click: function() {
                var existing = options.media.map(function(item) {
                        return item.id;
                    }),
                    items = options.items.filter(function(item) {
                        return existing.indexOf(item.oshash) == -1;
                    });
                that.close();
                pandora.ui.addFilesDialog({
                    action: options.action,
                    items: items
                }).open();
            }
        })
    ];

    var that = Ox.Dialog({
        buttons: $buttons,
        closeButton: true,
        content: $content,
        height: 256,
        removeOnClose: true,
        title: title,
        width: 512,
    });

    return that;

};
