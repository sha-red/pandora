// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.appPanel = function() {
    var that = new Ox.SplitPanel({
            elements: [
                {
                    element: app.$ui.mainMenu = pandora.ui.mainMenu(),
                    size: 20
                },
                {
                    element: app.$ui.mainPanel = pandora.ui.mainPanel()
                }
            ],
            orientation: 'vertical'
        });
    that.display = function() {
        // fixme: move animation into Ox.App
        app.$ui.body.css({opacity: 0});
        that.appendTo(app.$ui.body);
        app.$ui.body.animate({opacity: 1}, 1000);
        return that;
    }
    that.reload = function() {
        app.$ui.appPanel.removeElement();
        app.$ui.appPanel = pandora.ui.appPanel().appendTo(app.$ui.body);
        return that;
    }
    return that;
};

