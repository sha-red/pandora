// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.viewSelect = function() {
    var that = new Ox.Select({
            id: 'viewSelect',
            items: !app.user.ui.item ? $.map(app.site.listViews, function(view) {
                return $.extend($.extend({}, view), {
                    checked: app.user.ui.lists[app.user.ui.list].listView == view.id,
                    title: 'View ' + view.title
                });
            }) : $.map(app.site.itemViews, function(view) {
                return $.extend($.extend({}, view), {
                    checked: app.user.ui.itemView == view.id,
                    title: 'View: ' + view.title
                });
            }),
            width: !app.user.ui.item ? 144 : 128
        })
        .css({
            float: 'left',
            margin: '4px 0 0 4px'
        })
        .bindEvent({
            change: !app.user.ui.item ? function(event, data) {
                var id = data.selected[0].id;
                app.$ui.mainMenu.checkItem('viewMenu_movies_' + id);
                pandora.UI.set(['lists', app.user.ui.list, 'listView'].join('|'), id);
                pandora.URL.set(pandora.Query.toString());
            } : function(event, data) {
                var id = data.selected[0].id;
                //pandora.UI.set({itemView: id});
                pandora.URL.set(app.user.ui.item + '/' + id);
                // app.$ui.contentPanel.replaceElement(1, app.$ui.item = pandora.ui.item());
            }
        });
    return that;
};

