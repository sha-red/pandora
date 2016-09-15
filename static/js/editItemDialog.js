'use strict';

pandora.ui.editItemDialog = function() {
    var that = Ox.Dialog({
        closeButton: true,
        content: Ox.Element().html('HERE WILL BE DRAGONS').css({'text-align': 'center', 'margin-top': '16px'}),
        height: 72,
        title: Ox._('Edit {0}', [pandora.site.itemName.singular]),
        width: 544
    });
    return that;
}
