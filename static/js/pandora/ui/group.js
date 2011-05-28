// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.group = function(id, query) {
    //Ox.print('group', id, query);
    /*
    query && query.conditions.length && alert($.map(query.conditions, function(v) {
        return v.value;
    }));
    */
    //alert(id + ' ' + JSON.stringify(pandora.Query.toObject(id)))
    var i = app.user.ui.groups.indexOf(id),
        panelWidth = app.$ui.document.width() - (app.user.ui.showSidebar * app.user.ui.sidebarSize) - 1,
        title = Ox.getObjectById(app.site.groups, id).title,
        width = pandora.getGroupWidth(i, panelWidth),
        that = new Ox.TextList({
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
                //Ox.print('sending request', data)
                delete data.keys;
                //alert(id + " pandora.Query.toObject " + JSON.stringify(pandora.Query.toObject(id)) + ' ' + JSON.stringify(data))
                return pandora.api.find($.extend(data, {
                    group: id,
                    query: pandora.Query.toObject(id)
                }), callback);
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
                app.$ui.list.triggerEvent('paste', data);
            },
            select: function(event, data) {
                var group = app.ui.groups[i],
                    query;
                app.ui.groups[i].query.conditions = $.map(data.ids, function(v) {
                    return {
                        key: id,
                        value: v,
                        operator: '='
                    };
                });
                pandora.reloadGroups(i);
            }
        });
    new Ox.Select({
            items: $.map(app.site.groups, function(v) {
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
                i_ = app.user.ui.groups.indexOf(id_);
            if (i_ == -1) {
                // new group was not part of old group set
                if (app.ui.groups[i].query.conditions.length) {
                    // if group with selection gets replaced, reload
                    app.ui.groups[i].query.conditions = [];
                    pandora.reloadGroups(i);
                }
                app.ui.groups[i] = getGroupObject(id_);
                app.user.ui.groups[i] = id_;
                pandora.UI.set({groups: app.user.ui.groups});
                replaceGroup(i, id_);
            } else {
                // swap two existing groups
                var group = $.extend({}, app.ui.groups[i]);
                app.ui.groups[i] = app.ui.groups[i_];
                app.ui.groups[i_] = group;
                app.user.ui.groups[i] = id_;
                app.user.ui.groups[i_] = id;
                pandora.UI.set({groups: app.user.ui.groups});
                replaceGroup(i, id_, app.ui.groups[i].query);
                replaceGroup(i_, id, app.ui.groups[i_].query);
            }
            function replaceGroup(i, id, query) {
                // if query is passed, selected items will be derived from it
                var isOuter = i % 4 == 0;
                app.$ui[isOuter ? 'browser' : 'groupsInnerPanel'].replaceElement(
                    isOuter ? i / 2 : i - 1,
                    app.$ui.groups[i] = pandora.ui.group(id, query)
                );
            }
        })
        .appendTo(that.$bar.$element);
    if (!query) {
        // if query is set, group object has already been taken care of
        app.ui.groups[i] = getGroupObject(id);
    }
    function getGroupObject(id) {
        var i = app.user.ui.groups.indexOf(id),
            title = Ox.getObjectById(app.site.groups, id).title,
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
    app.ui.groups = [];
    app.user.ui.groups.forEach(function(id, i) {
        $groups[i] = pandora.ui.group(id);
    });
    return $groups;
};

pandora.ui.groupsInnerPanel = function() {
    var that = new Ox.SplitPanel({
        elements: [
            {
                element: app.$ui.groups[1],
                size: app.ui.groups[1].size
            },
            {
                element: app.$ui.groups[2],
            },
            {
                element: app.$ui.groups[3],
                size: app.ui.groups[3].size
            }
        ],
        orientation: 'horizontal'
    });
    return that;
};

