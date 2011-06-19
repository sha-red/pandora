// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.viewSelect = function() {
    var that = Ox.Select({
            id: 'viewSelect',
            items: !pandora.user.ui.item ? $.map(pandora.site.listViews, function(view) {
                return $.extend($.extend({}, view), {
                    checked: pandora.user.ui.lists[pandora.user.ui.list].listView == view.id,
                    title: 'View ' + view.title
                });
            }) : $.map(pandora.site.itemViews, function(view) {
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
            change: !pandora.user.ui.item ? function(event, data) {
                var id = data.selected[0].id;
                pandora.$ui.mainMenu.checkItem('viewMenu_movies_' + id);
                pandora.UI.set(['lists', pandora.user.ui.list, 'listView'].join('|'), id);
                pandora.URL.set(pandora.Query.toString());
            } : function(event, data) {
                var id = data.selected[0].id;
                //pandora.UI.set({itemView: id});
                pandora.URL.set(pandora.user.ui.item + '/' + id);
                // pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.item = pandora.ui.item());
            }
        });
    return that;
};

