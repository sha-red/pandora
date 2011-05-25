// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.folderBrowserBar = function(id) {
    var that = new Ox.Bar({
            size: 24
        });
    app.$ui.findListInput = new Ox.Input({
            placeholder: 'Find User',
            width: 184 - Ox.UI.SCROLLBAR_SIZE
        })
        .css({
            margin: '4px',
            align: 'right'
        })
        .appendTo(that);
    return that;
};

