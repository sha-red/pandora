// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.toolbar = function() {
    var that = Ox.Bar({
            size: 24
        }).css({
            zIndex: 2 // fixme: remove later
        });
    pandora.user.ui.item && that.append(
        pandora.$ui.backButton = pandora.ui.backButton()
    );
    that.append(
        pandora.$ui.viewSelect = pandora.ui.viewSelect() 
    );
    !pandora.user.ui.item && that.append(
        pandora.$ui.sortSelect = pandora.ui.sortSelect()
    );
    that.append(
        pandora.$ui.findElement = pandora.ui.findElement()
    );
    that.display = function() {
        pandora.$ui.rightPanel.replaceElement(0, pandora.$ui.toolbar = pandora.ui.toolbar()); // fixme: remove later
    }
    return that;
};

