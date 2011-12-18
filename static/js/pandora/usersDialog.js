// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.usersDialog = function() {

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        formWidth = 256,
        numberOfUsers = 0,

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
                        title: 'Enabled',
                        titleImage: 'check',
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
                        format: function(value) {
                            return $('<img>')
                                .attr({
                                    src: Ox.UI.getImageURL('symbolMail')
                                })
                                .css({
                                    width: '10px',
                                    height: '10px',
                                    padding: '3px',
                                    opacity: +value
                                });
                        },
                        id: 'newsletter',
                        title: 'Newsletter',
                        titleImage: 'mail',
                        operator: '-',
                        visible: true,
                        width: 16
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
                max: -1,
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
                select: selectUsers
            }),

        $formLabel = Ox.Label({
                textAlign: 'center',
                title: 'No user selected',
                width: 212
            })
            .css({float: 'left', margin: '4px 2px 4px 4px'}),

        $formButton = Ox.ButtonGroup({
                buttons: [
                    {
                        id: 'edit',
                        selected: true,
                        title: 'edit',
                        tooltip: 'Edit'
                    },
                    {
                        id: 'mail',
                        title: 'mail',
                        tooltip: 'Mail'
                    }
                ],
                selectable: true,
                type: 'image'
            })
            .css({float: 'left', margin: '4px 4px 4px 2px'})
            .bindEvent({
                change: selectForm
            }),

        $form = Ox.Element({}),

        $editForm,

        $mailForm = renderMailForm(),

        $content = Ox.SplitPanel({
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
                                        .append($formLabel)
                                        .append($formButton),
                                    size: 24
                                },
                                {
                                    element: $form
                                }
                            ],
                            orientation: 'vertical'
                        })
                        .bindEvent({
                            resize: setWidth
                        }),
                    resizable: true,
                    resize: [256, 384, 512],
                    size: 256
                }
            ],
            orientation: 'horizontal'
        }),

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
                content: $content,
                height: dialogHeight,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                padding: 0,
                removeOnClose: true,
                title: 'Manage Users',
                width: dialogWidth
            })
            .bindEvent({
                resize: setHeight
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

    function getFormItemById(id) {
        var ret;
        Ox.forEach((
            $formButton.value() == 'edit' ? $editForm : $mailForm
        ).options('items'), function($item) {
            if ($item.options('id') == id) {
                ret = $item;
                return false;
            }
        });
        return ret;
    };

    function getTo() {
        return $list.options('selected').map(function(id) {
            return $list.value(id);
        }).filter(function(user) {
            return user.level != 'guest' && (
                $mailForm.values().include == 'users' || user.newsletter
            );
        }).map(function(user) {
            return user.username;
        });
    }

    function renderEditForm() {
        var user = $list.value($list.options('selected')[0]);
        return Ox.Form({
            items: [
                Ox.Checkbox({
                        checked: !user.disabled,
                        id: 'status',
                        label: 'Status',
                        labelWidth: 80,
                        title: !user.disabled ? 'Enabled' : 'Disabled',
                        width: formWidth - 16
                    })
                    .bindEvent({
                        change: function(data) {
                            this.options({
                                title: this.options('title') == 'Enabled'
                                    ? 'Disabled' : 'Enabled'
                            });
                        }
                    }),
                Ox.Input({
                        id: 'username',
                        label: 'Username',
                        labelWidth: 80,
                        value: user.username,
                        width: formWidth - 16
                    })
                    .bindEvent({
                        submit: function(data) {
                            
                        }
                    }),
                Ox.Input({
                        id: 'email',
                        label: 'E-Mail',
                        labelWidth: 80,
                        value: user.email,
                        width: formWidth - 16
                    })
                    .bindEvent({
                        submit: function(data) {

                        }
                    }),
                Ox.Select({
                    id: 'level',
                    items: Ox.map(pandora.site.userLevels, function(level, i) {
                        return i ? {
                            checked: level == user.level,
                            id: level,
                            title: Ox.toTitleCase(level)
                        } : null;
                    }),
                    label: 'Level',
                    labelWidth: 80,
                    width: formWidth - 16
                }),
                Ox.Checkbox({
                        checked: user.newsletter,
                        id: 'newsletter',
                        label: 'Newsletter',
                        labelWidth: 80,
                        title: user.newsletter ? 'Subscribed' : 'Unsubscribed',
                        width: formWidth - 16
                    })
                    .bindEvent({
                        change: function(data) {
                            this.options({
                                title: this.options('title') == 'Subscribed'
                                    ? 'Unsubscribed' : 'Subscribed'
                            });
                        }
                    }),
                Ox.Input({
                    height: dialogHeight - 160,
                    id: 'notes',
                    placeholder: 'Notes',
                    type: 'textarea',
                    value: user.notes,
                    width: formWidth - 16
                })
            ],
            width: 240
        })
        .css({margin: '8px'})
        .bindEvent({
            change: function(event) {
                var data = {id: user.id}, key, value;
                if (event.id == 'status') {
                    data.disabled = !event.data.checked;
                } else if (event.id == 'level') {
                    data.level = event.data.selected[0].id;
                } else if (event.id == 'newsletter') {
                    data.newsletter = event.data.checked;
                } else {
                    data[event.id] = event.data.value;
                }
                $list.value(user.id, event.id, data[event.id]);
                pandora.api.editUser(data, function(result) {
                    Ox.Request.clearCache('findUsers');
                });
            }
        });
    }

    function renderMailForm() {
        return Ox.Form({
            items: [
                Ox.Input({
                    disabled: true,
                    id: 'from',
                    label: 'From',
                    labelWidth: 80,
                    value: pandora.site.site.name + ' <' + pandora.site.site.email.contact + '>',
                    width: formWidth - 16
                }),
                Ox.Input({
                    disabled: true,
                    id: 'to',
                    label: 'To',
                    labelWidth: 80,
                    value: '',
                    width: formWidth - 16
                }),
                Ox.Select({
                        id: 'include',
                        items: [
                            {id: 'users', title: 'All users'},
                            {id: 'subscribers', title: 'Subscribers only'},
                        ],
                        label: 'Include',
                        labelWidth: 80,
                        width: formWidth - 16
                    })
                    .bindEvent({
                        change: function() {
                            setTo();
                            setSend();
                        }
                    }),
                Ox.Input({
                        id: 'subject',
                        label: 'Subject',
                        labelWidth: 80,
                        value: pandora.site.site.email.prefix + ' ',
                        width: formWidth - 16
                    })
                    .bindEvent({
                        change: setSend
                    }),
                Ox.Input({
                        height: dialogHeight - 208,
                        id: 'message',
                        placeholder: 'Message',
                        type: 'textarea',
                        value: '\n\n' + pandora.site.site.email.footer,
                        width: formWidth - 16
                    })
                    .bindEvent({
                        change: setSend
                    }),
                Ox.Select({
                        id: 'insert',
                        items: [
                            {id: 'username', title: 'Username'},
                            {id: 'email', title: 'E-Mail address'},
                        ],
                        selectable: false,
                        title: 'Insert...',
                        width: formWidth - 16
                    })
                    .bindEvent({
                        click: function(data) {
                            var $input = getFormItemById('message'),
                                textarea = $input.find('textarea')[0],
                                value = $input.options('value');
                            $input.options({
                                    value: value.substr(0, textarea.selectionStart)
                                        + '{' + data.id + '}'
                                        + value.substr(textarea.selectionEnd)
                                })
                                .focusInput(textarea.selectionStart + data.id.length + 2);                           
                        }
                    }),
                Ox.Checkbox({
                    checked: false,
                    id: 'receipt',
                    title: 'Send a receipt to ' + pandora.user.email,
                    width: formWidth - 16
                }),
                Ox.Button({
                        disabled: true,
                        id: 'send',
                        title: 'Send',
                        width: 64
                    })
                    .bindEvent({
                        click: sendMail
                    })
            ],
            width: formWidth - 16
        })
        .css({margin: '8px', textAlign: 'right'});
    }

    function selectForm(data) {
        var selected;
        if (data.selected[0] == 'edit') {
            $mailForm.detach();
            selected = $list.options('selected');
            if (selected.length == 1 && selected[0].level != 'guest') {
                $form.append($editForm = renderEditForm());
            }
        } else {
            setTo();
            setSend();
            setWidth();
            $editForm && $editForm.remove();
            $form.append($mailForm);
        }
    }

    function selectUsers(data) {
        var users = $list.options('selected').map(function(id) {
            return $list.value(id);
        });
        setLabel();
        if ($formButton.value() == 'edit') {
            $form.empty();
            if (data.ids.length == 1) {
                if (users[0].level != 'guest') {
                    $form.append($editForm = renderEditForm());
                }
            }
        } else {
            setTo();
            setSend();
        }
    }

    function sendMail() {
        pandora.api.mail({
            to: getTo(),
            subject: getFormItemById('subject').options('value'),
            message: getFormItemById('message').options('value'),
            receipt: getFormItemById('receipt').value()
        }, function(result) {
            var title = result.status.code == 200
                    ? 'Message Sent'
                    : 'Application Error',
                message = result.status.code == 200
                    ? 'Your message has been sent.'
                    : 'Your message could not be sent. Please try again.',
                $dialog = Ox.Dialog({
                    buttons: [
                        Ox.Button({
                            id: 'close',
                            title: 'Close'
                        })
                        .bindEvent({
                            click: function() {
                                $dialog.close();
                            }
                        })
                    ],
                    // FIXME: we need a template for this type of dialog
                    content: Ox.Element()
                        .append(
                            $('<img>')
                                .attr({src: '/static/png/icon64.png'})
                                .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
                        )
                        .append(
                            $('<div>')
                                .css({position: 'absolute', left: '96px', top: '16px', width: '192px'})
                                .html(message)
                        ),
                    height: 128,
                    keys: {enter: 'close', escape: 'close'},
                    removeOnClose: true,
                    title: title,
                    width: 304
                }).open();
        });
    }

    function setHeight(data) {
        var form = $formButton.options('value'),
            $item = getFormItemById(form == 'edit' ? 'notes' : 'message');
        Ox.print('$ITEM', $item)
        dialogHeight = data.height;
        $item && $item.options({
            height: dialogHeight - (form == 'edit' ? 160 : 208)
        });
    }

    function setLabel() {
        var users = $list.options('selected').map(function(id) {
                return $list.value(id);
            }),
            title = users.length == 0 ? 'No user selected'
                : users.length == 1 ? (
                    users[0].level == 'guest'
                    ? 'Guest'
                    : users[0].username + ' &lt;' + users[0].email + '&gt;'
                )
                : users.length + ' users selected';
        $formLabel.options({title: title});
    }

    function setSend() {
        getFormItemById('send').options({
            disabled: getFormItemById('to').options('value') == 'No recipients'
                || getFormItemById('subject').options('value') === ''
                || getFormItemById('message').options('value') === ''
        }); 
    }

    function setTo() {
        var recipients = getTo().length;
        $mailForm.values({
            to: (recipients || 'No') + ' recipient' + (recipients == 1 ? '' : 's')
        });
    }

    function setWidth() {
        formWidth = $content.size(1);
        $formLabel.options({width: formWidth - 44});
        (
            $formButton.value() == 'edit' ? $editForm : $mailForm
        ).options('items').forEach(function($item) {
            if ($item.options('id') != 'send') {
                $item.options({width: formWidth - 16});
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

