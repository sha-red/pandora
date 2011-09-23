// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.viewSelect = function() {
    var viewKey = !pandora.user.ui.item ? 'listView' : 'itemView',
        that = Ox.Select({
            id: 'viewSelect',
            items: pandora.site[viewKey + 's'].map(function(view) {
                return Ox.extend(Ox.clone(view), {
                    checked: view.id == pandora.user.ui[viewKey],
                    title: 'View ' + view.title
                });
            }),
            width: !pandora.user.ui.item ? 144 : 128
        })
        .css({
            float: 'left',
            margin: '4px 0 0 4px'
        })
        .bindEvent({
            change: function(data) {
                pandora.UI.set(viewKey, data.selected[0].id);
            }
        });
    Ox.Event.bind({
        listView: function(value) {
            that.selectItem(value);
        },
        itemView: function(value) {
            that.selectItem(value);
        }
    });    
    return that;
};

