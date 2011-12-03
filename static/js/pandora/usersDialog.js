// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.usersDialog = function() {

    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = Math.round(window.innerWidth * 0.9),
        numberOfUsers = 0,
        userLevels = ['member', 'friend', 'staff', 'admin'],

        $guestsCheckbox = Ox.Checkbox({
                checked: true,
                title: 'Show Guests'
            })
            .css({float: 'left', margin: '4px'})
            .bindEvent({
                change: updateList
            }),

        $findSelect = Ox.Select({
                items: [
                    {id: 'all', title: 'Find: All', checked: true},
                    {id: 'username', title: 'Find: Username'},
                    {id: 'email', title: 'Find: E-Mail-Address'}
                ],
                overlap: 'right',
                type: 'image'
            })
            .bindEvent({
                change: function(data) {
                    $findInput.value() && updateList();
                    $findInput.options({
                        placeholder: data.selected[0].title
                    });
                }
            }),

        $findInput = Ox.Input({
                changeOnKeypress: true,
                clear: true,
                placeholder: 'Find: All',
                width: 192
            })
            .bindEvent({
                change: updateList
            }),

        $findElement = Ox.FormElementGroup({
                elements: [
                    $findSelect,
                    $findInput
                ]
            })
            .css({float: 'right', margin: '4px'}),

        $list = Ox.TextList({
                columns: [
                    {
                        id: 'id',
                        title: 'ID',
                        unique: true,
                        visible: false,
                    },
                    {
                        format: function(value) {
                            return $('<img>')
                                .attr({
                                    src: Ox.UI.getImageURL('symbolCheck')
                                })
                                .css({
                                    width: '10px',
                                    height: '10px',
                                    padding: '3px',
                                    opacity: value ? 0 : 1
                                });
                        },
                        id: 'disabled',
                        operator: '-',
                        title: $('<img>').attr({
                            src: Ox.UI.getImageURL('symbolCheck')
                        }),
                        visible: true,
                        width: 16
                    },
                    {
                        format: function(value, data) {
                            return '<span style="opacity: ' + (
                                data.disabled ? 0.5 : 1
                            ) + '">' + value + '</span>';
                        },
                        id: 'username',
                        operator: '+',
                        removable: false,
                        title: 'Username',
                        visible: true,
                        width: 120
                    },
                    {
                        format: function(value, data) {
                            return '<span style="opacity: ' + (
                                data.disabled ? 0.5 : 1
                            ) + '">' + value + '</span>';
                        },
                        id: 'email',
                        operator: '+',
                        title: 'E-Mail Address',
                        visible: true,
                        width: 180
                    },
                    {
                        align: 'center',
                        format: function(value) {
                            return Ox.Theme.formatColorLevel(
                                pandora.site.userLevels.indexOf(value),
                                pandora.site.userLevels.map(function(userLevel) {
                                    return Ox.toTitleCase(userLevel);
                                }),
                                [0, 240]
                            );
                        },
                        id: 'level',
                        operator: '-',
                        title: 'Level',
                        type: 'label',
                        visible: true,
                        width: 60
                    },
                    {
                        id: 'numberoflists',
                        align: 'right',
                        operator: '-',
                        title: 'Lists',
                        visible: true,
                        width: 60
                    },
                    {
                        align: 'right',
                        id: 'timesseen',
                        operator: '-',
                        title: 'Times Seen',
                        visible: true,
                        width: 90
                    },
                    {
                        align: 'right',
                        // fixme: there should be a better option for dates
                        format: function(value) {
                            return value.replace(/[TZ]/g, ' ')
                        },
                        id: 'firstseen',
                        operator: '-',
                        title: 'First Seen',
                        visible: true,
                        width: 150
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return value.replace(/[TZ]/g, ' ')
                        },
                        id: 'lastseen',
                        operator: '-',
                        title: 'Last Seen',
                        visible: true,
                        width: 150
                    },
                    {
                        align: 'right',
                        id: 'ip',
                        operator: '+',
                        title: 'IP Address',
                        visible: true,
                        width: 120
                    },
                    {
                        id: 'screensize',
                        align: 'right',
                        operator: '-',
                        title: 'Screen Size',
                        visible: true,
                        width: 90
                    },
                    {
                        align: 'right',
                        id: 'windowsize',
                        operator: '-',
                        title: 'Window Size',
                        visible: true,
                        width: 90
                    },
                    {
                        id: 'location',
                        operator: '+',
                        title: 'Location',
                        visible: true,
                        width: 160
                    },
                    {
                        id: 'browser',
                        operator: '+',
                        title: 'Browser',
                        visible: true,
                        width: 80 
                    },
                    {
                        id: 'system',
                        operator: '+',
                        title: 'System',
                        visible: true,
                        width: 80
                    },
                    {
                        id: 'useragent',
                        operator: '+',
                        title: 'User Agent',
                        visible: true,
                        width: 810
                    }
                ],
                columnsRemovable: true,
                columnsVisible: true,
                items: pandora.api.findUsers,
                keys: ['notes'],
                max: 1,
                scrollbarVisible: true,
                sort: [{key: 'lastseen', operator: '-'}]
            })
            .bindEvent({
                init: function(data) {
                    $status.html(
                        Ox.formatNumber(data.items)
                        + ' user' + (data.items == 1 ? '' : 's')
                        + (
                            $guestsCheckbox.value()
                            ? ' (' + Ox.formatNumber(data.users) + ' registered, '
                                + Ox.formatNumber(data.guests) + ' guest'
                                + (data.guests == 1 ? '' : 's')
                                + ')'
                            : ''
                        )
                    );
                },
                select: function(data) {
                    var values;
                    $user.empty();
                    if (data.ids.length) {
                        values = $list.value(data.ids[0]);
                        if(values.level != 'guest') {
                            $userLabel.options({
                                title: values.username + ' &lt;' + values.email + '&gt;'
                            });
                            $user.append(renderUserForm(values));
                        } else {
                            $userLabel.options({title: 'Guest'});
                        }
                    } else {
                        $userLabel.options({title: 'No user selected'});
                    }
                }
            }),

        $userLabel = Ox.Label({
                textAlign: 'center',
                title: 'No user selected',
                width: 248
            })
            .css({margin: '4px'}),

        $user = Ox.Element({}),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                        title: 'Export E-Mail Addresses'
                    })
                    .css({margin: '4px 4px 4px 0'})
                    .bindEvent({
                        click: function() {
                            pandora.api.findUsers({
                                query: {conditions: [], operator: '&'},
                                keys: ['email', 'username'],
                                range: [0, numberOfUsers],
                                sort: [{key: 'username', operator: '+'}]
                            }, function(result) {
                                var $dialog = Ox.Dialog({
                                        buttons: [
                                            Ox.Button({
                                                    title: 'Close'
                                                })
                                                .bindEvent({
                                                    click: function() {
                                                        $dialog.close();
                                                    }
                                                })
                                        ],
                                        content: Ox.Element()
                                            .addClass('OxSelectable')
                                            .css({margin: '16px'})
                                            .html(
                                                result.data.items.filter(function(item) {
                                                    return item.email;
                                                }).map(function(item) {
                                                    return item.username + ' &lt;' + item.email + '&gt;';
                                                }).join(', ')
                                            ),
                                        removeOnClose: true,
                                        title: 'E-Mail Addresses'
                                    })
                                    .open();
                            });
                        }
                    }),
                Ox.Button({
                        id: 'done',
                        title: 'Done',
                        width: 48
                    }).bindEvent({
                        click: function() {
                            Ox.Request.clearCache('findUsers');
                            that.close();
                        }
                    })
            ],
            closeButton: true,
            content: Ox.SplitPanel({
                elements: [
                    {
                        element: Ox.SplitPanel({
                            elements: [
                                {
                                    element: Ox.Bar({size: 24})
                                        .append($guestsCheckbox)
                                        .append($findElement),
                                    size: 24
                                },
                                {
                                    element: $list
                                }
                            ],
                            orientation: 'vertical'
                        })
                    },
                    {
                        element: Ox.SplitPanel({
                            elements: [
                                {
                                    element: Ox.Bar({size: 24})
                                        .append($userLabel),
                                    size: 24
                                },
                                {
                                    element: $user
                                }
                            ],
                            orientation: 'vertical'
                        }),
                        size: 256
                    }
                ],
                orientation: 'horizontal'
            }),
            height: height,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            padding: 0,
            removeOnClose: true,
            title: 'Manage Users',
            width: width
        }),

        $status = $('<div>')
            .css({
                position: 'absolute',
                top: '4px',
                left: '4px',
                right: '256px',
                bottom: '4px',
                paddingTop: '2px',
                fontSize: '9px',
                textAlign: 'center',
            })
            .appendTo(that.$element.find('.OxButtonsbar'));


    function renderUserForm(userData) {
        var $checkbox;
        return Ox.Form({
                items: [
                    $checkbox = Ox.Checkbox({
                            checked: !userData.disabled,
                            id: 'status',
                            label: 'Status',
                            labelWidth: 80,
                            title: 'Enabled',
                            width: 240
                        })
                        .bindEvent({
                            change: function(data) {
                                // fixme: it would be really nice to have "this" here
                                $checkbox.options({title: userData.checked ? 'Enabled' : 'Disabled'})
                            }
                        }),
                    Ox.Input({
                            id: 'username',
                            label: 'Username',
                            labelWidth: 80,
                            value: userData.username,
                            width: 240
                        })
                        .bindEvent({
                            submit: function(data) {
                                
                            }
                        }),
                    Ox.Input({
                            id: 'email',
                            label: 'E-Mail',
                            labelWidth: 80,
                            value: userData.email,
                            width: 240
                        })
                        .bindEvent({
                            submit: function(data) {

                            }
                        }),
                    Ox.Select({
                        id: 'level',
                        items: userLevels.map(function(level) {
                            return {
                                checked: level == userData.level,
                                id: level,
                                title: Ox.toTitleCase(level)
                            };
                        }),
                        label: 'Level',
                        labelWidth: 80,
                        width: 240
                    }),
                    /*
                    Ox.Label({
                        title: 'Notes'
                    }),
                    */
                    Ox.Input({
                        height: 120,
                        id: 'notes',
                        placeholder: 'Notes',
                        type: 'textarea',
                        value: userData.notes,
                        width: 240
                    })
                ],
                width: 240
            })
            .css({margin: '8px'})
            .bindEvent({
                change: function(event) {
                    var data = {id: userData.id}, key, value;
                    if (event.id == 'status') {
                        data.disabled = !event.data.checked;
                    } else if (event.id == 'level') {
                        data.level = event.data.selected[0].id;
                    } else {
                        data[event.id] = event.data.value;
                    }
                    $list.value(userData.id, event.id, data[event.id]);
                    pandora.api.editUser(data, function(result) {
                        Ox.Request.clearCache('findUsers');
                    });
                }
            });
    }

    function updateList() {
        var guests = $guestsCheckbox.value(),
            key = $findSelect.value(),
            value = $findInput.value(),
            query = {
                conditions: value
                    ? Ox.merge(
                        key != 'email' ? [{key: 'username', value: value, operator: '='}] : [],
                        key != 'username' ? [{key: 'email', value: value, operator: '='}] : []
                    )
                    : !guests ? [{key: 'level', value: 'guest', operator: '!='}] : [],
                operator: key == 'all' && value ? '|' : '&'
            };
        $list.options({
            items: function(data, callback) {
                return pandora.api.findUsers(Ox.extend(data, {
                    query: query
                }), callback);
            }
        });
    }

    return that;

};

