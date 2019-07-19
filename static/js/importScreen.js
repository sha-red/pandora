'use strict';

pandora.ui.importScreen = function() {

    var that = Ox.Element()
        .attr({id: 'importScreen'})
        .css({
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
        })
        .on({
            click: function() {
                that.remove();
            },
            dragleave: function() {
                that.remove();
            }
        });

    Ox.Element()
        .css({
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            width: pandora.hasCapability('canAddItems') ? 192 : 256,
            height: 16,
            padding: '8px 0',
            borderRadius: 8,
            margin: 'auto',
            background: 'rgba(255, 255, 255, 0.9)',
            fontSize: 13,
            color: 'rgb(0, 0, 0)',
            textAlign: 'center'
        })
        .text(
            Ox._(pandora.hasCapability('canAddItems') ? (
                'Import {0}'
            ) : (
                'You are not allowed to import {0}'
            ),
            [pandora.user.ui.section == 'documents' ? 'Documents' : pandora.site.itemName.plural])
        )
        .appendTo(that);

    return that;

};
