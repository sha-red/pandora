// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.toolbar = function() {
    var ui = pandora.user.ui,
        that = Ox.Bar({
            size: 24
        }).css({
            zIndex: 2 // fixme: remove later
        });
    ui.item && that.append(
        pandora.$ui.backButton = pandora.ui.backButton()
    );
    that.append(
        pandora.$ui.viewSelect = pandora.ui.viewSelect() 
    );
    if (!ui.item || pandora.isClipView()) {
        that.append(
            pandora.$ui.sortSelect = pandora.ui.sortSelect()
        );
    }
    if (!ui.item) {
        that.append(
            pandora.$ui.orderButton = pandora.ui.orderButton()
        );
    }
    if (ui.item && ui.itemView == 'info' && pandora.user.level == 'admin') {
        that.append(
            Ox.Button({
                title: 'Reload Metadata'
            })
            .css({float: 'left', margin: '4px'})
            .bindEvent({
                click: function() {
                    var item = ui.item;
                    // fixme: maybe there's a better method name for this?
                    pandora.api.updateExternalData({
                        id: ui.item
                    }, function(result) { 
                        Ox.Request.clearCache(item);
                        if (ui.item == item && ui.itemView == 'info') {
                            pandora.$ui.contentPanel.replaceElement(
                                1, pandora.$ui.item = pandora.ui.item()
                            );
                        }
                    });
                }
            })
        );
    }
    that.append(
        pandora.$ui.findElement = pandora.ui.findElement()
    );
    that.bindEvent({
        pandora_listview: function(data) {
            if (pandora.isClipView() != pandora.isClipView(data.previousValue)) {
                pandora.$ui.sortSelect.replaceWith(
                    pandora.$ui.sortSelect = pandora.ui.sortSelect()
                );
            }
        }
    })
    return that;
};

