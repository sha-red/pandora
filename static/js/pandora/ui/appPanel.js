// vim: et:ts=4:sw=4:sts=4:ft=js
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
        pandora.$ui.body.css({opacity: 0});
        that.appendTo(pandora.$ui.body);
        pandora.$ui.body.animate({opacity: 1}, 1000);
        return that;
    }
    that.reload = function() {
        pandora.$ui.appPanel.removeElement();
        pandora.$ui.appPanel = pandora.ui.appPanel().appendTo(pandora.$ui.body);
        return that;
    }
    return that;
};

