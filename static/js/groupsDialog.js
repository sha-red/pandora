'use strict';

pandora.ui.groupsDialog = function(options) {

    var that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    title: Ox._('Done')
                })
                .bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: Ox.LoadingScreen().start(),
            height: 256,
            removeOnClose: true,
            title: Ox._('Manage Groups'),
            width: 584 + Ox.UI.SCROLLBAR_SIZE
        }),

        isItem = options.type == 'item',

        $content,
        $label,
        $groups = [],
        $checkboxes = [],
        $inputs = [],
        $labels = [],
        $removeButtons = [],
        $addButton,

        groups,
        selectedGroups;

    pandora.api[isItem ? 'get' : 'getUser']({
        id: options.id,
        keys: ['groups']
    }, function(result) {
        selectedGroups = result.data.groups;
        renderGroups();
    });

    function addGroup() {
        // disableElements();
        pandora.api.addGroup({name: Ox._('Untitled')}, function(result) {
            renderGroups(result.data.id);
        });
    }

    function disableElements() {
        $checkboxes.concat($inputs).concat($removeButtons).concat($addButton)
            .forEach(function($element) {
                $element.options({disabled: true});
            });
    }

    function edit(id) {
        selectedGroups = groups.filter(function(group, index) {
            return $checkboxes[index].value();
        }).map(function(group) {
            return group.name;
        });
        // disableElements();
        Ox.Request.clearCache(isItem ? 'get' : 'getUser');
        pandora.api[isItem ? 'edit' : 'editUser']({
            id: options.id,
            groups: selectedGroups
        }, function(result) {
            // enableElements();
            updateLabel(id);
            that.triggerEvent('groups', {groups: selectedGroups});
        });
    }

    function editGroup(id, name) {
        var index = Ox.getIndexById(groups, id),
            previousName = groups[index].name;
        // disableElements();
        pandora.api.editGroup({id: id, name: name}, function(result) {
            name = result.data.name;
            if (Ox.contains(selectedGroups, previousName)) {
                selectedGroups.splice(
                    selectedGroups.indexOf(previousName), 1, name
                );
                that.triggerEvent('groups', {groups: selectedGroups});
            }
            renderGroups();
        });
    }

    function enableElements() {
        $checkboxes.concat($inputs).concat($removeButtons).concat($addButton)
            .forEach(function($element) {
                $element.options({disabled: false});
            });
    }

    function getLabelTitle(group) {
        return (group.items ? Ox.formatNumber(group.items) : Ox._('No'))
            + ' ' + Ox._(group.items == 1 ? 'item' : 'items') + ', '
            + (group.users ? Ox.formatNumber(group.users) : Ox._('no'))
            + ' ' + Ox._(group.users == 1 ? 'user' : 'users');
    }

    function removeGroup(id) {
        // disableElements();
        pandora.api.removeGroup({id: id}, function(result) {
            var index = Ox.getIndexById(groups, id),
                name = groups[index].name;
            groups.splice(index, 1);
            index = selectedGroups.indexOf(name);
            if (index > -1) {
                selectedGroups.splice(index, 1);
                that.triggerEvent('groups', {groups: selectedGroups});
            }
            renderGroups();
        });
    }

    function renderGroup(group, index) {
        var $group = $groups[index] = Ox.$('<div>')
            .appendTo($content);
        $checkboxes[index] = Ox.Checkbox({
                value: Ox.contains(selectedGroups, group.name)
            })
            .css({
                float: 'left',
                margin: '4px'
            })
            .bindEvent({
                change: function() {
                    edit(group.id);
                }
            })
            .appendTo($group);
        $inputs[index] = Ox.Input({
                value: group.name,
                width: 192
            })
            .css({
                float: 'left',
                margin: '4px'
            })
            .bindEvent({
                change: function(data) {
                    editGroup(group.id, data.value);
                }
            })
            .appendTo($group);
        $labels[index] = Ox.Label({
                title: getLabelTitle(group),
                width: 192
            })
            .css({
                float: 'left',
                margin: '4px'
            })
            .appendTo($group),
        $removeButtons[index] = Ox.Button({
                title: Ox._('Remove Group'),
                width: 128
            })
            .css({
                float: 'left',
                margin: '4px'
            })
            .bindEvent({
                click: function() {
                    removeGroup(group.id);
                }
            })
            .appendTo($group);
    }

    function renderGroups(focusInput) {
        Ox.Request.clearCache('getGroups');
        pandora.api.getGroups(function(result) {
            groups = Ox.sortBy(result.data.groups, 'name');
            $content = Ox.Element().css({margin: '12px'});
            $label = Ox.Label({
                    textAlign: 'center',
                    title: Ox._(
                        isItem ? pandora.site.itemName.singular : 'User'
                    ) + ': ' + options.name,
                    width: 552
                })
                .css({
                    margin: '16px 4px 4px 4px'
                })
                .appendTo($content);
            groups.forEach(renderGroup);
            $addButton = Ox.Button({
                    title: Ox._('Add Group'),
                    width: 128
                })
                .css({
                    float: 'left',
                    margin: '4px 4px 16px 428px'
                })
                .bindEvent({
                    click: addGroup
                })
                .appendTo($content);
            that.options({content: $content});
            if (focusInput) {
                $inputs[Ox.getIndexById(groups, focusInput)].focusInput(true);
            }
        });
    }

    function updateLabel(id) {
        Ox.Request.clearCache('getGroup');
        pandora.api.getGroup({id: id}, function(result) {
            $labels[Ox.getIndexById(groups, id)].options({
                title: getLabelTitle(result.data)
            });
        });
    }

    return that;

};
