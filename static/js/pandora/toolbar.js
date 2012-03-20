// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

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
    !ui.item && !isNavigationView && that.append(
        pandora.$ui.sortSelect = pandora.ui.sortSelect()
    ).append(
        pandora.$ui.orderButton = pandora.ui.orderButton()
    );
    that.append(
        !ui.item
        ? pandora.$ui.listTitle = Ox.Label({
                textAlign: 'center',
                title: '<b>' + getListName() + '</b>'
            })
            .css({
                position: 'absolute',
                left: getListTitleLeft() + 'px',
                top: '4px',
                right: (ui._list ? 324 : 310) + 'px',
                width: 'auto'
            })
        : pandora.$ui.itemTitle = Ox.Label({
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
    ui.item && that.append(
        
    );
    that.append(
        pandora.$ui.findElement = pandora.ui.findElement()
    );
    that.bindEvent({
        pandora_listview: function(data) {
            var isNavigationView, wasNavigationView;
            if (!pandora.user.ui.item) {
                isNavigationView = ['map', 'calendar'].indexOf(data.value) > -1;
                wasNavigationView = ['map', 'calendar'].indexOf(data.previousValue) > -1;
                if (isNavigationView != wasNavigationView) {
                    if (isNavigationView) {
                        pandora.$ui.sortSelect.remove();
                        pandora.$ui.orderButton.remove();
                    } else {
                        pandora.$ui.sortSelect = pandora.ui.sortSelect().insertAfter(pandora.$ui.viewSelect);
                        pandora.$ui.orderButton = pandora.ui.orderButton().insertAfter(pandora.$ui.sortSelect);
                    }
                    pandora.$ui.listTitle.css({left: getListTitleLeft() + 'px'});
                } else if ((data.value == 'clip') != (data.previousValue == 'clip')) {
                    pandora.$ui.sortSelect.replaceWith(
                        pandora.$ui.sortSelect = pandora.ui.sortSelect()
                    );
                }
            }
        }
    });
    function getListName() {
        return pandora.user.ui._list == ''
            ? 'All ' + pandora.site.itemName.plural
            : pandora.user.ui._list.substr(pandora.user.ui._list.indexOf(':') + 1);
    }
    function getListTitleLeft() {
        return 320 - (
            ['map', 'calendar'].indexOf(pandora.user.ui.listView) > -1 ? 168 : 0
        );
    }
    return that;
};

