// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.folderBrowserBar = function(id) {
    var that = Ox.Bar({
            size: 24
        });
    pandora.$ui.findListElement[id] = Ox.FormElementGroup({
            elements: [
                pandora.$ui.findListSelect[id] = Ox.Select({
                    items: [
                        {id: 'user', title: 'Find: User', checked: true},
                        {id: 'list', title: 'Find: List'}
                    ],
                    overlap: 'right',
                    type: 'image'
                })
                .bindEvent({
                    change: function(data) {
                        var key = data.selected[0].id == 'user' ? 'user' : 'name',
                            value = pandora.$ui.findListInput[id].value();
                        value && updateItems(key, value);
                        pandora.$ui.findListInput[id].options({
                            placeholder: data.selected[0].title
                        });
                    }
                }),
                pandora.$ui.findListInput[id] = Ox.Input({
                    changeOnKeypress: true,
                    clear: true,
                    placeholder: 'Find: User',
                    width: pandora.getFoldersWidth() - 24
                })
                .bindEvent({
                    change: function(data) {
                        Ox.print('ID::', id)
                        var key = pandora.$ui.findListSelect[id].value() == 'user' ? 'user' : 'name',
                            value = data.value;
                        updateItems(key, value);
                    }
                })
            ],
        })
        .css({
            float: 'right',
            margin: '4px',
            align: 'right'
        })
        .appendTo(that);
    function updateItems(key, value) {
        pandora.$ui.folderList[id].options({
            items: function(data, callback) {
                var query = id == 'favorite' ? {conditions: [
                    {key: 'status', value: 'public', operator: '='},
                    {key: 'user', value: pandora.user.username, operator: '!'},
                    {key: key, value: value, operator: ''}
                ], operator: '&'} : {conditions: [
                    {key: 'status', value: 'private', operator: '!'},
                    {key: key, value: value, operator: ''}
                ], operator: '&'};
                return pandora.api.findLists(Ox.extend(data, {
                    query: query
                }), callback);
            }
        });
    }
    return that;
};

