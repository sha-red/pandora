// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.sectionbar = function(mode) {
    var that = new Ox.Bar({
            size: 24
        })
        .append(
            mode == 'buttons' ?
            app.$ui.sectionButtons = pandora.ui.sectionButtons() :
            app.$ui.sectionSelect = pandora.ui.sectionSelect()
        );
    that.toggle = function() {
        
    };
    return that;
};

