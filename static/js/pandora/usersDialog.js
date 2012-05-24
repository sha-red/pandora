// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.usersDialog = function() {

    var browsers = [
            'Chrome', 'Chrome Frame', 'Firefox',
            'Internet Explorer', 'Opera', 'Safari', 'WebKit'
        ],
        dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        formWidth = 256,
        numberOfUsers = 0,
        systems = [
            'Android', 'BSD', 'iOS', 'Linux',
            'Mac OS X', 'Unix', 'Windows'
        ],
        userLevels = pandora.site.userLevels.map(function(userLevel) {
            return Ox.toTitleCase(userLevel);
        }).concat(['Robot']),

        $reloadButton = Ox.Button({
                title: 'redo',
                tooltip: 'Reload',
                type: 'image'
            })
            .css({float: 'left', margin: '4px 2px 4px 4px'})
            .bindEvent({
                click: function() {
                    Ox.Request.clearCache('findUsers');
                    $list.reloadList(true);
                }
            }),

        $guestsCheckbox = Ox.Checkbox({
                title: 'Include Guests',
                value: false
            })
            .css({float: 'left', margin: '4px 2px 4px 2px'})
            .bindEvent({
                change: function(data) {
                    data.value
                        ? $robotsCheckbox.show()
                        : $robotsCheckbox.hide().options({value: false});
                    updateList();
                }
            }),

        $robotsCheckbox = Ox.Checkbox({
                title: 'Include Robots',
                value: false
            })
            .css({float: 'left', margin: '4px 2px 4px 2px'})
            .hide()
            .bindEvent({
                change: updateList
            }),

        $findSelect = Ox.Select({
                items: [
                    {id: 'all', title: 'Find: All'},
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
                        placeholder: data.title
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
                        format: function(value, data) {
                            return $('<img>')
                                .attr({
                                    src: Ox.UI.getImageURL('symbolCheck')
                                })
                                .css({
                                    width: '10px',
                                    height: '10px',
                                    padding: '3px',
                                    opacity: value || [
                                        'guest', 'robot'
                                    ].indexOf(data.level) > -1 ? 0 : 1
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
                        format: function(value, data) {
                            return '<span style="opacity: ' + (
                                data.disabled ? 0.5 : 1
                            ) + '">' + Ox.encodeHTMLEntities(value) + '</span>';
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
                                userLevels.indexOf(Ox.toTitleCase(value)),
                                userLevels,
                                [0, 300]
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
                            return Ox.Element({
                                    element: '<img>',
                                    tooltip: value
                                })
                                .attr({
                                    src: Ox.getFlagByGeoname(value, 16)
                                })
                                .css({
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '4px',
                                    marginLeft: '-3px',
                                    marginTop: 0
                                });
                        },
                        id: 'location',
                        operator: '+',
                        title: 'Location',
                        titleImage: 'flag',
                        visible: true,
                        width: 16
                    },
                    {
                        format: function(value) {
                            var system;
                            Ox.forEach(systems, function(s) {
                                if (new RegExp('^' + s).test(value)) {
                                    system = s;
                                    Ox.Break();
                                }
                            });
                            return system ? Ox.Element({
                                    element: '<img>',
                                    tooltip: value
                                        .replace(/BSD \((.+)\)/, '$1')
                                        .replace(/Linux \((.+)\)/, '$1')
                                        .replace(/Unix \((.+)\)/, '$1')
                                        .replace(/Windows (NT \d+\.\d+) \((.+)\)/, 'Windows $2 ($1)')
                                })
                                .attr({
                                    src: Ox.UI.PATH + 'png/system'
                                        + system.replace(/ /g, '') + '128.png'
                                })
                                .css({
                                    width: '14px',
                                    height: '14px',
                                    marginLeft: '-3px',
                                    marginTop: 0
                                }) : '';
                        },
                        id: 'system',
                        operator: '+',
                        title: 'System',
                        titleImage: 'square',
                        visible: true,
                        width: 16
                    },
                    {
                        format: function(value) {
                            var browser;
                            Ox.forEach(browsers, function(b) {
                                if (new RegExp('^' + b).test(value)) {
                                    browser = b;
                                    Ox.Break();
                                }
                            });
                            return browser ? Ox.Element({
                                    element: '<img>',
                                    tooltip: value
                                })
                                .attr({
                                    src: Ox.UI.PATH + 'png/browser'
                                        + browser.replace(/ /g, '') + '128.png'
                                })
                                .css({
                                    width: '14px',
                                    height: '14px',
                                    marginLeft: '-3px',
                                    marginTop: 0
                                }) : '';
                        },
                        id: 'browser',
                        operator: '+',
                        title: 'Browser',
                        titleImage: 'circle',
                        visible: true,
                        width: 16 
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return Ox.formatNumber(value);
                        },
                        id: 'timesseen',
                        operator: '-',
                        title: 'Times Seen',
                        visible: true,
                        width: 90
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return Ox.formatDate(value, "%Y-%m-%d %H:%M:%S");
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
                            return Ox.formatDate(value, "%Y-%m-%d %H:%M:%S");
                        },
                        id: 'lastseen',
                        operator: '-',
                        title: 'Last Seen',
                        visible: true,
                        width: 150
                    },
                    {
                        align: 'right',
                        format: function(value, data) {
                            return ['guest', 'robot'].indexOf(data.level) > -1
                                ? '' : value;
                        },
                        id: 'numberoflists',
                        operator: '-',
                        title: 'Lists',
                        visible: true,
                        width: 60
                    },
                    {
                        id: 'groups',
                        operator: '+',
                        title: 'Groups',
                        visible: true,
                        width: 90
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
                        align: 'right',
                        id: 'ip',
                        operator: '+',
                        title: 'IP Address',
                        visible: true,
                        width: 120
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
                items: function(data, callback) {
                    pandora.api.findUsers(Ox.extend(data, {
                        query: {
                            conditions: [
                                {key: 'level', value: 'guest', operator: '!='},
                                {key: 'level', value: 'robot', operator: '!='}
                            ],
                            operator: '&'
                        }
                    }), callback);
                },
                keys: ['notes', 'groups'],
                max: -1,
                scrollbarVisible: true,
                sort: [{key: 'lastseen', operator: '-'}]
            })
            .bindEvent({
                init: function(data) {
                    numberOfUsers = data.users;
                    $status.html(
                        Ox.formatNumber(data.items)
                        + ' user' + (data.items == 1 ? '' : 's')
                        + (
                            $guestsCheckbox.value()
                            ? ' (' + Ox.formatNumber(data.users) + ' registered, '
                                + Ox.formatNumber(data.guests) + ' guest'
                                + (data.guests == 1 ? '' : 's') + ', '
                                + Ox.formatNumber(data.robots) + ' robot'
                                + (data.robots == 1 ? '' : 's')
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

        $sendButton = Ox.Button({
                disabled: true,
                id: 'send',
                title: 'Send',
                width: 64
            })
            .bindEvent({
                click: sendMail
            }),

        $mailForm = renderMailForm(),

        $content = Ox.SplitPanel({
            elements: [
                {
                    element: Ox.SplitPanel({
                        elements: [
                            {
                                element: Ox.Bar({size: 24})
                                    .append($reloadButton)
                                    .append($guestsCheckbox)
                                    .append($robotsCheckbox)
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
                        id: 'statistics',
                        title: 'Statistics...'
                    }).bindEvent({
                        click: function() {
                            that.close();
                            pandora.$ui.statisticsDialog = pandora.ui.statisticsDialog().open();
                        }
                    }),
                    {},
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
                                                        return Ox.encodeHTMLEntities(item.username)
                                                            + ' &lt;' + item.email + '&gt;';
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
                left: '128px',
                right: '384px',
                bottom: '4px',
                paddingTop: '2px',
                fontSize: '9px',
                textAlign: 'center'
            })
            .appendTo(that.find('.OxButtonsbar'));

    that.superClose = that.close;
    that.close = function() {
        Ox.Request.clearCache('findUsers');
        that.superClose();
    };

    function getFormItemById(id) {
        var ret;
        Ox.forEach((
            $formButton.value() == 'edit' ? $editForm : $mailForm
        ).options('items'), function($item) {
            if ($item.options('id') == id) {
                ret = $item;
                Ox.Break();
            }
        });
        return ret;
    };

    function getTo() {
        return $list.options('selected').map(function(id) {
            return $list.value(id);
        }).filter(function(user) {
            return ['guest', 'robot'].indexOf(user.level) == -1 && (
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
                        id: 'status',
                        label: 'Status',
                        labelWidth: 80,
                        title: !user.disabled ? 'Enabled' : 'Disabled',
                        value: !user.disabled,
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
                    items: pandora.site.userLevels.slice(1).map(function(level) {
                        return {
                            id: level,
                            title: Ox.toTitleCase(level)
                        };
                    }),
                    label: 'Level',
                    labelWidth: 80,
                    value: user.level,
                    width: formWidth - 16
                }),
                Ox.Checkbox({
                        id: 'newsletter',
                        label: 'Newsletter',
                        labelWidth: 80,
                        title: user.newsletter ? 'Subscribed' : 'Unsubscribed',
                        value: user.newsletter,
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
                        id: 'groups',
                        label: 'Groups',
                        labelWidth: 80,
                        value: user.groups ? user.groups.join(', ') : '',
                        width: formWidth - 16
                    })
                    .bindEvent({
                        submit: function(data) {

                        }
                    }),
                Ox.Input({
                    height: dialogHeight - 184,
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
                    data.disabled = !event.data.value;
                } else if (event.id == 'level') {
                    data.level = event.data.value;
                } else if (event.id == 'newsletter') {
                    data.newsletter = event.data.value;
                } else if (event.id == 'groups') {
                    data.groups = event.data.value.split(', ');
                } else {
                    data[event.id] = event.data.value;
                }
                if (event.id == 'status') {
                    $list.value(user.id, 'disabled', data.disabled);
                } else {
                    $list.value(user.id, event.id, data[event.id]);
                }
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
                Ox.MenuButton({
                        id: 'insert',
                        items: [
                            {id: 'username', title: 'Username'},
                            {id: 'email', title: 'E-Mail address'},
                        ],
                        title: 'Insert...',
                        width: formWidth - 16
                    })
                    .bindEvent({
                        click: function(data) {
                            var $input = getFormItemById('message'),
                                textarea = $input.find('textarea')[0],
                                value = $input.value();
                            $input.value(
                                    value.slice(0, textarea.selectionStart)
                                    + '{' + data.id + '}'
                                    + value.slice(textarea.selectionEnd)
                                )
                                .focusInput(textarea.selectionStart + data.id.length + 2);                           
                        }
                    }),
                Ox.Checkbox({
                    id: 'receipt',
                    title: 'Send a receipt to ' + pandora.user.email,
                    value: false,
                    width: formWidth - 16
                }),
                $sendButton
            ],
            width: formWidth - 16
        })
        .css({margin: '8px', textAlign: 'right'});
    }

    function selectForm(data) {
        var selected;
        if (data.value == 'edit') {
            $mailForm.detach();
            selected = $list.options('selected');
            if (selected.length == 1 && ['guest', 'robot'].indexOf(selected[0].level) == -1) {
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
                if (['guest', 'robot'].indexOf(users[0].level) == -1) {
                    $form.append($editForm = renderEditForm());
                }
            }
        } else {
            setTo();
            setSend();
        }
    }

    function sendMail() {
        $sendButton.options({title: 'Sending', disabled: true});
        pandora.api.mail({
            to: getTo(),
            subject: getFormItemById('subject').value(),
            message: getFormItemById('message').value(),
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
                                .attr({src: '/static/png/icon.png'})
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
            $sendButton.options({title: 'Send', disabled: false});
        });
    }

    function setHeight(data) {
        var form = $formButton.value(),
            $item = getFormItemById(form == 'edit' ? 'notes' : 'message');
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
                    ['guest', 'robot'].indexOf(users[0].level) > -1
                    ? Ox.toTitleCase(users[0].level)
                    : Ox.encodeHTMLEntities(users[0].username)
                        + ' &lt;' + users[0].email + '&gt;'
                )
                : users.length + ' users selected';
        $formLabel.options({title: title});
    }

    function setSend() {
        getFormItemById('send').options({
            disabled: getFormItemById('to').value() == 'No recipients'
                || getFormItemById('subject').value() === ''
                || getFormItemById('message').value() === ''
        }); 
    }

    function setTo() {
        var recipients = getTo().length;
        $mailForm.values({
            to: (recipients || 'No') + ' recipient' + (recipients == 1 ? '' : 's')
        });
    }

    function setWidth() {
        var $form = $formButton.value() == 'edit' ? $editForm : $mailForm;
        formWidth = $content.size(1);
        $formLabel.options({width: formWidth - 44});
        $form && $form.options('items').forEach(function($item) {
            if ($item.options('id') != 'send') {
                $item.options({width: formWidth - 16});
            }
        });
        $status.css({right: formWidth + 128 + 'px'});
    }

    function updateList() {
        var guests = $guestsCheckbox.value(),
            robots = $robotsCheckbox.value(),
            key = $findSelect.value(),
            value = $findInput.value(),
            query = {
                conditions: value
                    ? [].concat(
                        key != 'email' ? [{key: 'username', value: value, operator: '='}] : [],
                        key != 'username' ? [{key: 'email', value: value, operator: '='}] : []
                    )
                    : [].concat(
                        !guests ? [{key: 'level', value: 'guest', operator: '!='}] : [],
                        !robots ? [{key: 'level', value: 'robot', operator: '!='}] : []
                    ),
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

