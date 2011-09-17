// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.viewSelect = function() {
    var that = Ox.Select({
            id: 'viewSelect',
            items: !pandora.user.ui.item ? pandora.site.listViews.map(function(view) {
                return $.extend($.extend({}, view), {
                    checked: pandora.user.ui.lists[pandora.user.ui.list].listView == view.id,
                    title: 'View ' + view.title
                });
            }) : pandora.site.itemViews.map(function(view) {
                return $.extend($.extend({}, view), {
                    checked: pandora.user.ui.itemView == view.id,
                    title: 'View: ' + view.title
                });
            }),
            width: !pandora.user.ui.item ? 144 : 128
        })
        .css({
            float: 'left',
            margin: '4px 0 0 4px'
        })
        .bindEvent({
            change: !pandora.user.ui.item ? function(data) {
                var view = data.selected[0].id;
                pandora.$ui.mainMenu.checkItem('viewMenu_movies_' + view);
                pandora.UI.set(['lists', pandora.user.ui.list, 'listView'].join('|'), view);
                pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.list = pandora.ui.list());
                pandora.URL.push('/' + view + '/' + document.location.search);
                // pandora.URL.set('/' + view + '/' + document.location.search);
            } : function(event, data) {
                var view = data.selected[0].id;
                //pandora.UI.set({itemView: id});
                pandora.URL.set(pandora.user.ui.item + '/' + view);
                // pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.item = pandora.ui.item());
            }
        });
    return that;
};

