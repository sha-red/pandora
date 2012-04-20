'use strict';

pandora.ui.makeListPrivateDialog = function(name, subscribers, callback) {

    var that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'keep',
                    title: 'Keep List Public'
                }).bindEvent({
                    click: function() {
                        that.close();
                        callback(false);
                    }
                }),
                Ox.Button({
                    id: 'make',
                    title: 'Make List Private'
                }).bindEvent({
                    click: function() {
                        that.close();
                        callback(true);
                    }
                })
            ],
            content: Ox.Element()
                .append(
                    $('<img>')
                        .attr({src: '/static/png/icon.png'})
                        .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
                )
                .append(
                    $('<div>')
                        .css({position: 'absolute', left: '96px', top: '16px', width: '192px'})
                        .html(
                            'Are you sure you want to make the list "'
                            + name + '" private and lose its '
                            + (subscribers == 1 ? 'subscriber' : subscribers + ' subscribers')
                            + '?'
                        )
                ),
            height: 128,
            keys: {enter: 'make', escape: 'keep'},
            title: 'Make List Private',
            width: 304
        })

    return that;

};