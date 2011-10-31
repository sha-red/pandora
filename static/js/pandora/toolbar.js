// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.toolbar = function() {
    var ui = pandora.user.ui,
        isNavigationView = !ui.item
            && ['map', 'calendar'].indexOf(ui.listView) > -1,
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
    !ui.item && that.append(
        pandora.$ui.sortSelect = pandora.ui.sortSelect()
    ).append(
        pandora.$ui.orderButton = pandora.ui.orderButton()
    );
    if (isNavigationView) {
        pandora.$ui.sortSelect.hide();
        pandora.$ui.orderButton.hide();
    }
    ui.item && that.append(
        pandora.$ui.itemTitle = Ox.Label({
            textAlign: 'center'
        })
        .css({
            position: 'absolute',
            left: '236px',
            top: '4px',
            right: (ui._list ? 324 : 310) + 'px',
            width: 'auto'
        })
        .hide()
    );
    that.append(
        pandora.$ui.findElement = pandora.ui.findElement()
    );
    that.bindEvent({
        pandora_listview: function(data) {
            var isNavigationView = ['map', 'calendar'].indexOf(data.value) > -1,
                wasNavigationView = ['map', 'calendar'].indexOf(data.previousValue) > -1,
                action = isNavigationView ? 'hide' : 'show';
            Ox.print('IS/WAS', isNavigationView, wasNavigationView);
            if (isNavigationView != wasNavigationView) {
                pandora.$ui.sortSelect[action]();
                pandora.$ui.orderButton[action]();
            }
            if (pandora.isClipView() != pandora.isClipView(data.previousValue)) {
                pandora.$ui.sortSelect.replaceWith(
                    pandora.$ui.sortSelect = pandora.ui.sortSelect()[action]()
                );
            }
        }
    })
    return that;
};

