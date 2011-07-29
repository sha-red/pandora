// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.sectionbar = function(mode) {
    var that = Ox.Bar({
            size: 24
        })
        .append(
            mode == 'buttons' ?
            pandora.$ui.sectionButtons = pandora.ui.sectionButtons() :
            pandora.$ui.sectionSelect = pandora.ui.sectionSelect()
        );
    that.toggle = function() {
        
    };
    return that;
};

