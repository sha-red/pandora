// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.statusbar = function() {
    var that = new Ox.Bar({
            size: 16
        })
        .css({
            textAlign: 'center'
        })
        .append(
            new Ox.Element()
                .css({
                    marginTop: '2px',
                    fontSize: '9px'
                })
                .append(
                    app.$ui.total = new Ox.Element('span')
                )
                .append(
                    new Ox.Element('span').html(' &mdash; ')
                )
                .append(
                    app.$ui.selected = new Ox.Element('span')
                )
        );
    return that;
};

