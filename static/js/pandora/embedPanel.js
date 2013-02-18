pandora.ui.embedPanel = function() {
    var that = Ox.Element().html('Not implemented.');
    that.display = function() {
        // fixme: move animation into Ox.App
        var animate = $('.OxScreen').length == 0;
        Ox.Log('', 'ANIMATE?', animate)
        animate && pandora.$ui.body.css({opacity: 0});
        that.appendTo(pandora.$ui.body);
        animate && pandora.$ui.body.animate({opacity: 1}, 1000);
        return that;
    };
    return that;
};