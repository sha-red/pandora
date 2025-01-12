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
        pandora.$ui.sortElement = pandora.ui.sortElement()
    );
    that.append(
        !ui.item
        ? pandora.$ui.listTitle = Ox.Label({
                textAlign: 'center',
                title: getListName(pandora.user.ui._list)
            })
            .addClass('OxSelectable')
            .css({
                position: 'absolute',
                left: getListTitleLeft() + 'px',
                top: '4px',
                right: (ui._list ? 340 : 326) + 'px',
                width: 'auto'
            })
        : pandora.$ui.itemTitle = Ox.Label({
                textAlign: 'center'
            })
            .addClass('OxSelectable')
            .css({
                position: 'absolute',
                left: '236px',
                top: '4px',
                right: (ui._list ? 340 : 326) + 'px',
                width: 'auto'
            })
            .hide()
    );
    (!ui.item ? pandora.$ui.listTitle : pandora.$ui.itemTitle).bindEvent({
        doubleclick: function() {
            if (!ui.item) {
                pandora.$ui.list && (
                    ui.listView == 'list'
                    ? pandora.$ui.list.$body
                    : pandora.$ui.list
                ).animate({
                    scrollTop: 0
                }, 250);
            } else {
                pandora.$ui.browser.scrollToSelection();
            }
        }
    })
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
                        pandora.$ui.sortElement.remove();
                    } else {
                        pandora.$ui.sortElement = pandora.ui.sortElement().insertAfter(pandora.$ui.viewSelect);
                    }
                    pandora.$ui.listTitle.css({left: getListTitleLeft() + 'px'});
                } else if ((data.value == 'clip') != (data.previousValue == 'clip')) {
                    pandora.$ui.sortElement.replaceWith(
                        pandora.$ui.sortElement = pandora.ui.sortElement()
                    );
                }
            }
        }
    });
    function getListName(listId) {
        return '<b>' + (
            listId == ''
                ? Ox._('All {0}', [Ox._(pandora.site.itemName.plural)])
                : Ox.encodeHTMLEntities(listId.slice(listId.indexOf(':') + 1))
        ) + '</b>';
    }
    function getListTitleLeft() {
        return ['map', 'calendar'].indexOf(pandora.user.ui.listView) > -1 ? 152 : 316;
    }
    that.updateListName = function(listId) {
        pandora.$ui.listTitle && pandora.$ui.listTitle.options({title: getListName(listId)});
    };
    return that;
};

