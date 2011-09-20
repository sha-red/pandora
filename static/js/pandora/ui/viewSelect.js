// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.viewSelect = function() {
    var that = Ox.Select({
            id: 'viewSelect',
            items: !pandora.user.ui.item ? pandora.site.listViews.map(function(view) {
                return Ox.extend(Ox.extend({}, view), {
                    checked: pandora.user.ui.lists[pandora.user.ui.list].listView == view.id,
                    title: 'View ' + view.title
                });
            }) : pandora.site.itemViews.map(function(view) {
                return Ox.extend(Ox.extend({}, view), {
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
                pandora.UI.set('lists|' + pandora.user.ui.list + '|listView', data.selected[0].id);
                pandora.URL.update();
                //pandora.URL.set('/' + data.selected[0].id + '/' + document.location.search);
            } : function(data) {
                pandora.UI.set({itemView: data.selected[0].id});
                pandora.URL.update();
                // pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.item = pandora.ui.item());
            }
        });
    return that;
};

