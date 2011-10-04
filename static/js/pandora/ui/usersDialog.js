// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.usersDialog = function() {

    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = Math.round(window.innerWidth * 0.9),
        levelColors = {
            'guest': [64, 0, 0],
            'member': [64, 64, 0],
            'friend': [0, 64, 0],
            'staff': [0, 64, 64],
            'admin': [0, 0, 64]
        },
        numberOfUsers = 0,
        userLevels = ['member', 'friend', 'staff', 'admin'],

        $status = Ox.Label({
                title: 'Loading...'
            })
            .css({float: 'left', margin: '4px'}),

        $exportButton = Ox.Button({
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
                                        result.data.items.map(function(item) {
                                            return item.username + ' &lt;' + item.email + '&gt;'
                                        }).join(', ')
                                    ),
                                title: 'E-Mail Addresses'
                            })
                            .open()
                    })
                }
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
                    var key = data.selected[0].id,
                        value = $findInput.value();
                    value && updateList(key, value);
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
                change: function(data) {
                    var key = $findSelect.value(),
                        value = data.value;
                    updateList(key, value);
                }
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
                        tooltip: function(data) {
                            return data.disabled ? 'Enable User' : 'Disable User';
                        },
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
                            var dark = 'rgb(' + levelColors[value].map(function(color) {
                                    return color.toString()
                                }).join(', ') + ')',
                                light = 'rgb(' + levelColors[value].map(function(color) {
                                    return (color + 128).toString()
                                }).join(', ') + ')';
                            return $('<div>')
                                .css({
                                    borderRadius: '4px',
                                    padding: '0 3px 1px 3px',
                                    background: pandora.user.ui.theme == 'classic' ? light : dark,
                                    textAlign: 'center',                       
                                    color: pandora.user.ui.theme == 'classic' ? dark : light
                                })
                                .html(Ox.toTitleCase(value))
                        },
                        id: 'level',
                        operator: '-',
                        title: 'Level',
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
                sort: [
                    {key: 'username', operator: '+'}
                ]
            })
            .bindEvent({
                init: function(data) {
                    numberOfUsers = data.items;
                    $status.options({
                        title: Ox.formatNumber(numberOfUsers)
                            + ' user' + (numberOfUsers == 1 ? '' : 's')
                            + ' (' + Ox.formatNumber(numberOfUsers) + ' registered, 0 guests)' 
                    });
                },
                select: function(data) {
                    var values;
                    $user.empty();
                    if (data.ids.length) {
                        values = $list.value(data.ids[0]);
                        $userLabel.options({
                            title: values.username + ' &lt;' + values.email + '&gt;'
                        });
                        $user.append(renderUserForm(values))
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
                    id: 'done',
                    title: 'Done'
                }).bindEvent({
                    click: function() {
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
                                        .append($status)
                                        .append($exportButton)
                                        .append(
                                            $findElement
                                        ),
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
            title: 'Manage Users',
            width: width
        });

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
                    .css({height: '240px'})
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

    function updateList(key, value) {
        var query = {
                conditions: Ox.merge(
                    key != 'email' ? [{key: 'username', value: value, operator: '='}] : [],
                    key != 'username' ? [{key: 'email', value: value, operator: '='}] : []
                ),
                operator: key == 'all' ? '|' : '&'
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

