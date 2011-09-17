// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.backButton = function() {
    var that = Ox.Button({
        title: 'Back to ' + pandora.site.itemName.plural,
        width: 96
    }).css({
        float: 'left',
        margin: '4px'
    })
    .bindEvent({
        click: function() {
            pandora.URL.set(pandora.Query.toString());
        }
    });
    return that;
};
