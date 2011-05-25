// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.toolbar = function() {
    var that = new Ox.Bar({
            size: 24
        }).css({
            zIndex: 2 // fixme: remove later
        });
    app.user.ui.item && that.append(
        app.$ui.backButton = pandora.ui.backButton()
    );
    that.append(
        app.$ui.viewSelect = pandora.ui.viewSelect() 
    );
    !app.user.ui.item && that.append(
        app.$ui.sortSelect = pandora.ui.sortSelect()
    );
    that.append(
        app.$ui.findElement = pandora.ui.findElement()
    );
    that.display = function() {
        app.$ui.rightPanel.replaceElement(0, app.$ui.toolbar = pandora.ui.toolbar()); // fixme: remove later
    }
    return that;
};

