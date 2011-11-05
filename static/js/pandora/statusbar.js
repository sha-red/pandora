// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.statusbar = function() {
    var that = Ox.Bar({
            size: 16
        })
        .css({
            textAlign: 'center'
        })
        .append(
            Ox.Element()
                .css({
                    marginTop: '2px',
                    fontSize: '9px'
                })
                .append(
                    pandora.$ui.total = Ox.Element('<span>')
                )
                .append(
                    Ox.Element('<span>').html(' &mdash; ')
                )
                .append(
                    pandora.$ui.selected = Ox.Element('<span>')
                )
        );
    return that;
};

