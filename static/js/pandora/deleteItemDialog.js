// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.deleteItemDialog = function(item) {
    var 
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'keep',
                    title: 'Keep ' + pandora.site.itemName.singular
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    id: 'delete',
                    title: 'Delete ' + pandora.site.itemName.singular
                }).bindEvent({
                    click: function() {
                        that.close();
                        pandora.api.remove({
                            id: item.id
                        }, function(result) {
                            Ox.Request.clearCache();
                            pandora.UI.set({item: ''});
                        });
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
                        .css({position: 'absolute', left: '96px', top: '16px', width: '256px'})
                        .html('Are you sure you want to delete the '
                            + pandora.site.itemName.singular
                            + ' "'+ item.title + '"?<br><br>All data will be lost.')
                ),
            height: 128,
            keys: {enter: 'delete', escape: 'keep'},
            removeOnClose: true,
            title: 'Delete ' + pandora.site.itemName.singular,
            width: 368
        });
    return that;

};

