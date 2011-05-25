// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.sortSelect = function() {
    var that = new Ox.Select({
            id: 'sortSelect',
            items: $.map(app.ui.sortKeys, function(key) {
                //Ox.print('????', app.user.ui.lists[app.user.ui.list].sort.key, key.id)
                return $.extend($.extend({}, key), {
                    checked: app.user.ui.lists[app.user.ui.list].sort[0].key == key.id,
                    title: 'Sort by ' + key.title
                });
            }),
            width: 144
        })
        .css({
            float: 'left',
            margin: '4px 0 0 4px'
        })
        .bindEvent({
            change: function(event, data) {
                var id = data.selected[0].id,
                    operator = pandora.getSortOperator(id);
                /*
                app.user.ui.lists[app.user.ui.list].sort[0] = {
                    key: id,
                    operator: operator
                };
                */
                app.$ui.mainMenu.checkItem('sortMenu_sortmovies_' + id);
                app.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + (operator === '' ? 'ascending' : 'descending'));
                app.$ui.list.sortList(id, operator);
                pandora.URL.set(pandora.Query.toString());
            }
        });
    return that;
};

