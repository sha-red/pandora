'use strict';

pandora.ui.backButton = function() {
    var that = Ox.Button({
        title: Ox._('Back to {0}', [
            pandora.user.ui.section == 'items'
                ? Ox._(pandora.site.itemName.plural)
                : Ox._(Ox.toTitleCase(pandora.user.ui.section))
        ]),
        width: pandora.user.ui.section == 'documents' ? 124 : 96
    }).css({
        float: 'left',
        margin: '4px 0 0 4px'
    })
    .bindEvent({
        click: function() {
            /*
            FIXME: if, on page load, one clicks back quickly,
            the item content may overwrite the list content.
            but we cannot cancel all requests, since that
            might keep the lists folders from loading.
            so we'd have to cancel with a function -- and
            it's unclear if the best place for that is here
            */
            if (['accessed', 'timesaccessed'].indexOf(pandora.user.ui.listSort[0].key) > -1) {
                Ox.Request.clearCache('find');
            }
            if (pandora.user.ui.section == 'documents') {
                pandora.UI.set({document: ''});
            } else {
                pandora.UI.set({item: ''});
            }
        }
    });
    return that;
};
