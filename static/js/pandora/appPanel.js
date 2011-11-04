// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.appPanel = function() {
    var that = Ox.SplitPanel({
            elements: [
                {
                    element: pandora.$ui.mainMenu = pandora.ui.mainMenu(),
                    size: 20
                },
                {
                    element: pandora.$ui.mainPanel = pandora.ui.mainPanel()
                }
            ],
            orientation: 'vertical'
        });
    that.display = function() {
        // fixme: move animation into Ox.App
        var animate = $('.OxScreen').length == 0;
        Ox.Log('', 'ANIMATE?', animate)
        animate && pandora.$ui.body.css({opacity: 0});
        that.appendTo(pandora.$ui.body);
        animate && pandora.$ui.body.animate({opacity: 1}, 1000);
        return that;
    }
    that.reload = function() {
        pandora.$ui.appPanel.remove();
        pandora.$ui.appPanel = pandora.ui.appPanel().appendTo(pandora.$ui.body);
        return that;
    }
    return that;
};

