// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.group = function(id, query) {
    //Ox.print('group', id, query);
    /*
    query && query.conditions.length && alert($.map(query.conditions, function(v) {
        return v.value;
    }));
    */
    //alert(id + ' ' + JSON.stringify(pandora.Query.toObject(id)))
    var i = pandora.user.ui.groups.indexOf(id),
        panelWidth = pandora.$ui.document.width() - (pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize) - 1,
        title = Ox.getObjectById(pandora.site.groups, id).title,
        width = pandora.getGroupWidth(i, panelWidth),
        that = Ox.TextList({
            columns: [
                {
                    align: 'left',
                    id: 'name',
                    operator: id == 'year' ? '-' : '+',
                    title: title,
                    unique: true,
                    visible: true,
                    width: width.column
                },
                {
                    align: 'right',
                    id: 'items',
                    operator: '-',
                    title: '#',
                    visible: true,
                    width: 40
                }
            ],
            columnsVisible: true,
            id: 'group_' + id,
            items: function(data, callback) {
                //if (pandora.user.ui.showGroups) {
                    delete data.keys;
                    //alert(id + " pandora.Query.toObject " + JSON.stringify(pandora.Query.toObject(id)) + ' ' + JSON.stringify(data))
                    return pandora.api.find($.extend(data, {
                        group: id,
                        query: pandora.Query.toObject(id)
                    }), callback);
                //} else {
                //    callback({data: {items: data.keys ? [] : 0}});
                //}
            },
            scrollbarVisible: true,
            selected: query ? $.map(query.conditions, function(v) {
                return v.value;
            }) : [],
            sort: [
                {
                    key: id == 'year' ? 'name' : 'items',
                    operator: '-'
                }
            ]
        })
        .bindEvent({
            paste: function(event, data) {
                pandora.$ui.list.triggerEvent('paste', data);
            },
            select: function(event, data) {
                var group = pandora.user.queryGroups[i],
                    query;
                pandora.user.queryGroups[i].query.conditions = $.map(data.ids, function(v) {
                    return {
                        key: id,
                        value: v,
                        operator: '='
                    };
                });
                pandora.reloadGroups(i);
            }
        });
    Ox.Select({
            items: $.map(pandora.site.groups, function(v) {
                return {
                    checked: v.id == id,
                    id: v.id,
                    title: v.title
                }
            }),
            max: 1,
            min: 1,
            type: 'image'
        })
        .bindEvent('change', function(event, data) {
            var id_ = data.selected[0].id,
                i_ = pandora.user.ui.groups.indexOf(id_);
            if (i_ == -1) {
                // new group was not part of old group set
                if (pandora.user.queryGroups[i].query.conditions.length) {
                    // if group with selection gets replaced, reload
                    pandora.user.queryGroups[i].query.conditions = [];
                    pandora.reloadGroups(i);
                }
                pandora.user.queryGroups[i] = getGroupObject(id_);
                pandora.user.ui.groups[i] = id_;
                pandora.UI.set({groups: pandora.user.ui.groups});
                replaceGroup(i, id_);
            } else {
                // swap two existing groups
                var group = $.extend({}, pandora.user.queryGroups[i]);
                pandora.user.queryGroups[i] = pandora.user.queryGroups[i_];
                pandora.user.queryGroups[i_] = group;
                pandora.user.ui.groups[i] = id_;
                pandora.user.ui.groups[i_] = id;
                pandora.UI.set({groups: pandora.user.ui.groups});
                replaceGroup(i, id_, pandora.user.queryGroups[i].query);
                replaceGroup(i_, id, pandora.user.queryGroups[i_].query);
            }
            function replaceGroup(i, id, query) {
                // if query is passed, selected items will be derived from it
                var isOuter = i % 4 == 0;
                pandora.$ui[isOuter ? 'browser' : 'groupsInnerPanel'].replaceElement(
                    isOuter ? i / 2 : i - 1,
                    pandora.$ui.groups[i] = pandora.ui.group(id, query)
                );
            }
        })
        .appendTo(that.$bar.$element);
    if (!query) {
        // if query is set, group object has already been taken care of
        pandora.user.queryGroups[i] = getGroupObject(id);
    }
    function getGroupObject(id) {
        var i = pandora.user.ui.groups.indexOf(id),
            title = Ox.getObjectById(pandora.site.groups, id).title,
            width = pandora.getGroupWidth(i, panelWidth);
        return {
            id: id,
            element: that,
            query: {
                conditions: [],
                operator: '|'
            },
            size: width.list,
            title: title
        };
    }
    return that;
};

pandora.ui.groups = function() {
    var $groups = [];
    pandora.user.queryGroups = [];
    pandora.user.ui.groups.forEach(function(id, i) {
        $groups[i] = pandora.ui.group(id);
    });
    return $groups;
};

pandora.ui.groupsInnerPanel = function() {
    var that = Ox.SplitPanel({
        elements: [
            {
                element: pandora.$ui.groups[1],
                size: pandora.user.queryGroups[1].size
            },
            {
                element: pandora.$ui.groups[2],
            },
            {
                element: pandora.$ui.groups[3],
                size: pandora.user.queryGroups[3].size
            }
        ],
        orientation: 'horizontal'
    });
    return that;
};

