// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.backButton = function() {
    var that = Ox.Button({
        title: 'Back to ' + app.site.itemName.plural,
        width: 96
    }).css({
        float: 'left',
        margin: '4px'
    })
    .bindEvent({
        click: function(event, data) {
            pandora.URL.set(pandora.Query.toString());
        }
    });
    return that;
};
