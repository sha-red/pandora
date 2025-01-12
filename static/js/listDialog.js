'use strict';

pandora.ui.listDialog = function(section) {

    section = section || 'general';
    var listData = pandora.getListData(),
        tabs = [].concat([
            {id: 'general', title: Ox._('General')},
            {id: 'icon', title: Ox._('Icon')}
        ], listData.type == 'smart'
            ? [{id: 'query', title: Ox._('Query')}]
            : []
        ),
        ui = pandora.user.ui,
        width = getWidth(section),
        folderItems = pandora.getFolderItems(pandora.user.ui.section),
        folderItem = folderItems.slice(0, -1);
    Ox.getObjectById(tabs, section).selected = true;

    pandora.$ui.listDialogTabPanel = Ox.TabPanel({
            content: function(id) {
                if (id == 'general') {
                    return pandora.ui.listGeneralPanel(listData);
                } else if (id == 'icon') {
                    if (pandora.user.ui.section == 'documents') {
                        pandora.$ui.listIconPanel = pandora.ui.collectionIconPanel(listData);
                    } else {
                        pandora.$ui.listIconPanel = pandora.ui.listIconPanel(listData);
                    }
                    return pandora.$ui.listIconPanel
                } else if (id == 'query') {
                    return pandora.$ui.filterForm = (pandora.user.ui.section == 'documents'
                        ? pandora.ui.documentFilterForm
                        : pandora.ui.filterForm
                    )({
                            mode: 'list',
                            list: listData
                        })
                        .css({
                            'overflow-y': 'auto'
                        })
                        .bindEvent({
                            change: function(data) {
                                listData.query = data.query;
                            }
                        });
                }
            },
            tabs: tabs
        })
        .bindEvent({
            change: function(data) {
                var width = getWidth(data.selected);
                $dialog.options({
                    maxWidth: width,
                    minWidth: width
                });
                $dialog.setSize(width, 312);
                $findElement[data.selected == 'icon' ? 'show' : 'hide']();
                $updateCheckbox[data.selected == 'query' ? 'show' : 'hide']();
                if (
                    pandora.user.ui.section == 'items'
                    && data.selected != 'query'
                    && !pandora.user.ui.updateAdvancedFindResults
                ) {
                    pandora.$ui.filterForm.updateResults();
                }
            }
        });
    pandora.$ui.listDialogTabPanel.find('.OxButtonGroup').css({width: '256px'});

    var $findElement = Ox.FormElementGroup({
            elements: [
                pandora.$ui.findIconItemSelect = Ox.Select({
                    items: (
                        pandora.user.ui.section == 'items'
                        ? pandora.site.findKeys
                        : pandora.site.documentKeys
                    ).map(function(findKey) {
                        return {id: findKey.id, title: Ox._('Find: {0}', [Ox._(findKey.title)])};
                    }),
                    overlap: 'right',
                    type: 'image'
                })
                .bindEvent({
                    change: function(data) {
                        pandora.$ui.findIconItemInput.options({
                            placeholder: data.title
                        });
                        // fixme: this is a bit weird
                        setTimeout(function() {
                            pandora.$ui.findIconItemInput.focusInput(true);
                        }, 250);
                    }
                }),
                pandora.$ui.findIconItemInput = Ox.Input({
                    changeOnKeypress: true,
                    clear: true,
                    placeholder: Ox._('Find: All'),
                    width: 128 + Ox.UI.SCROLLBAR_SIZE
                })
                .bindEvent({
                    change: function(data) {
                        pandora.$ui.listIconPanel.updateQuery(
                            pandora.$ui.findIconItemSelect.value(),
                            data.value
                        );
                    }
                })
            ],
        })
        .css({float: 'right', margin: '4px', align: 'right'})
        [section == 'icon' ? 'show' : 'hide']()
        .appendTo(pandora.$ui.listDialogTabPanel.children('.OxBar')),

        $dialog = Ox.Dialog({
            buttons: [
                Ox.Button({
                        id: 'done',
                        title: Ox._('Done')
                    })
                    .bindEvent({
                        click: function() {
                            if (
                                pandora.$ui.listDialogTabPanel.selected() == 'query'
                                && !pandora.user.ui.updateAdvancedFindResults
                            ) {
                                pandora.$ui.filterForm.updateResults();
                            }
                            $dialog.close();
                        }
                    })
            ],
            closeButton: true,
            content: pandora.$ui.listDialogTabPanel,
            maxWidth: width,
            minHeight: 312,
            minWidth: width,
            height: 312,
            // keys: {enter: 'save', escape: 'cancel'},
            removeOnClose: true,
            title: folderItem + ' &mdash; ' + Ox.encodeHTMLEntities(listData.name),
            width: width
        }),

        $updateCheckbox = Ox.Checkbox({
                title: Ox._('Update Results in the Background'),
                value: pandora.user.ui.updateAdvancedFindResults
            })
            .css({float: 'left', margin: '4px'})
            [section == 'query' ? 'show' : 'hide']()
            .bindEvent({
                change: function(data) {
                    pandora.UI.set({updateAdvancedFindResults: data.value});
                    data.value && pandora.$ui.filterForm.updateResults();
                }
            });

    $($updateCheckbox.find('.OxButton')[0]).css({margin: 0});
    $($dialog.$element.find('.OxBar')[2]).append($updateCheckbox);

    function getWidth(section) {
        return section == 'general' ? 496
            : (section == 'icon' ? 696 : 648) + Ox.UI.SCROLLBAR_SIZE;
    }

    return $dialog;

};

pandora.ui.listGeneralPanel = function(listData) {
    var that = Ox.Element(),
        ui = pandora.user.ui,
        folderItems = pandora.getFolderItems(ui.section),
        folderItem = folderItems.slice(0, -1);
    pandora.api['find' + folderItems]({
        query: {conditions: [{key: 'id', value: listData.id, operator: '=='}]},
        keys: ['description', 'subscribers']
    }, function(result) {
        var description = result.data.items[0].description,
            subscribers = result.data.items[0].subscribers,
            $icon = Ox.Element({
                    element: '<img>',
                    tooltip: Ox._('Doubleclick to edit icon')
                })
                .attr({
                    src: pandora.getListIcon(ui.section, listData.id, 256)
                })
                .css({
                    position: 'absolute',
                    left: '16px',
                    top: '16px',
                    width: '128px',
                    height: '128px',
                    borderRadius: '32px'
                })
                .bindEvent({
                    doubleclick: function() {
                        pandora.$ui.listDialogTabPanel.select('icon');
                    }
                })
                .appendTo(that),
            $nameInput = Ox.Input({
                    label: Ox._('Name'),
                    labelWidth: 80,
                    value: listData.name,
                    width: 320
                })
                .css({position: 'absolute', left: '160px', top: '16px'})
                .bindEvent({
                    blur: editName,
                    submit: editName
                })
                .appendTo(that),
            $select = (ui.section == 'items'
                ? Ox.Select({
                        items: pandora.site.listViews.map(function(view) {
                            return {id: view.id, title: view.title};
                        }),
                        label: Ox._('View'),
                        labelWidth: 80,
                        value: listData.view,
                        width: 320
                    })
                    .bindEvent({
                        change: editView
                    })
                : ui.section != 'texts'
                    ? Ox.Input({
                            disabled: true,
                            label: Ox._('Items'),
                            labelWidth: 80,
                            value: listData.items,
                            width: 320
                        })
                    : Ox.Select({
                            items: pandora.site.textRightsLevels.map(function(rightsLevel, i) {
                                return {
                                    id: i,
                                    title: rightsLevel.name,
                                };
                            }),
                            label: Ox._('Rights Level'),
                            labelWidth: 80,
                            value: listData.rightslevel,
                            width: 320
                        })
                        .bindEvent({
                            change: editRightsLevel
                        })
                )
                .css({position: 'absolute', left: '160px', top: '40px'})
                .appendTo(that),
            $statusSelect = (listData.status == 'featured'
                ? Ox.Input({
                        disabled: true,
                        label: Ox._('Status'),
                        labelWidth: 80,
                        value: 'Featured',
                        width: 320
                    })
                : Ox.Select({
                        items: [
                            {id: 'private', title: Ox._('Private')},
                            {id: 'public', title: Ox._('Public')}
                        ],
                        label: Ox._('Status'),
                        labelWidth: 80,
                        value: listData.status,
                        width: 320
                    })
                    .bindEvent({
                        change: editStatus
                    })
                )
                .css({position: 'absolute', left: '160px', top: '64px'})
                .appendTo(that),
            $groupsInput = Ox.Input({
                disabled: false,
                label: Ox._('Groups'),
                labelWidth: 80,
                value: listData.groups.join(', '),
                width: 320
            })
            .bindEvent({
                change: editGroups
            })
            .css({position: 'absolute', left: '160px', top: '88px'})
            .appendTo(that),
            /*
            $groupsLabel,
            $groupsInput = Ox.FormElementGroup({
                elements: [
                    Ox.Label({
                        overlap: 'right',
                        textAlign: 'right',
                        title: Ox._('Groups'),
                        width: 80
                    }),
                    Ox.FormElementGroup({
                        elements: [
                            $groupsLabel = Ox.Label({
                                title: listData.groups ? listData.groups.join(', ') : '',
                                width: 224
                            }),
                            Ox.Button({
                                overlap: 'left',
                                title: 'edit',
                                tooltip: Ox._('Edit Groups'),
                                type: 'image'
                            })
                            .bindEvent({
                                click: function() {
                                    pandora.$ui.groupsDialog = pandora.ui.groupsDialog({
                                            id: listData.id,
                                            name: listData.id,
                                            groups: listData.groups,
                                            type: 'list'
                                        })
                                        .bindEvent({
                                            groups: function(data) {
                                                var groups = data.groups.join(', ');
                                                editGroups({
                                                    value: data.groups
                                                })
                                                $groupsLabel.options({title: groups});
                                            }
                                        })
                                        .open();
                                }
                            })
                        ],
                        float: 'right'
                    })
                ],
                float: 'left'
            }).css({position: 'absolute', left: '160px', top: '88px'})
            .appendTo(that),
            */
            $subscribersInput = Ox.Input({
                    disabled: true,
                    label: Ox._('Subscribers'),
                    labelWidth: 80,
                    value: subscribers,
                    width: 320
                })
                .css({position: 'absolute', left: '160px', top: '112px'})
                [getSubscribersAction()]()
                .appendTo(that),
            $descriptionInput = Ox.Input({
                    height: getDescriptionHeight(),
                    placeholder: Ox._('Description'),
                    type: 'textarea',
                    value: description,
                    width: 320
                })
                .css({position: 'absolute', left: '160px', top: getDescriptionTop() + 'px'})
                .bindEvent({
                    blur: editDescription,
                    submit: editDescription
                })
                .appendTo(that);
        function editDescription(data) {
            if (data.value != description) {
                pandora.api['edit' + folderItem]({
                    id: listData.id,
                    description: data.value
                }, function(result) {
                    description = result.data.description;
                    Ox.Request.clearCache('find' + folderItems);
                    Ox.Request.clearCache('Home');
                    pandora.$ui.info.updateListInfo();
                });
            }
        }
        function editName(data) {
            if (data.value != listData.name) {
                pandora.api['edit' + folderItem]({
                    id: listData.id,
                    name: data.value
                }, function(result) {
                    if (result.data.id != listData.id) {
                        pandora.renameList(listData.id, result.data.id, result.data.name);
                        listData.id = result.data.id;
                        listData.name = result.data.name;
                        Ox.Request.clearCache('find' + folderItems);
                        pandora.$ui.info.updateListInfo();
                        pandora.$ui.listDialog.options({
                            title: Ox._(folderItem) + ' &mdash; ' + Ox.encodeHTMLEntities(listData.name)
                        });
                    }
                });
            }
        }
        function editGroups(data) {
            var groups = data.value.split(', ');
            pandora.api['edit' + folderItem]({
                id: listData.id,
                groups: groups
            }, function(result) {
                listData.groups = result.data.groups;
                pandora.$ui.folderList[listData.folder].value(
                    result.data.id, 'groups', listData.groups
                );
            });
        }
        function editStatus(data) {
            var status = data.value;
            $statusSelect.value(status == 'private' ? 'public' : 'private');
            pandora.changeFolderItemStatus(listData.id, status, function(result) {
                listData.status = result.data.status;
                if (result.data.status == 'private') {
                    subscribers = 0;
                    $subscribersInput.value(0);
                }
                $statusSelect.value(result.data.status);
                $subscribersInput[getSubscribersAction()]();
                $descriptionInput
                    .options({height: getDescriptionHeight()})
                    .css({top: getDescriptionTop() + 'px'});
                pandora.$ui.folderList[listData.folder].value(
                    result.data.id, 'status', result.data.status
                );
            });
        }
        function editRightsLevel(data) {
            var rightslevel = data.value;
            pandora.api.editText({
                id: listData.id,
                rightslevel: rightslevel
            }, function(result) {
                Ox.Request.clearCache('getText');
                //fixme: reload text and folder list
                $select.value(result.data.rightslevel);
            });
        }
        function editView(data) {
            var view = data.value;
            pandora.api.editList({
                id: listData.id,
                view: view
            }, function(result) {
                $select.value(result.data.view);
                Ox.Request.clearCache('findList');
                pandora.$ui.folderList[
                    result.data.status == 'featured'
                    ? 'featured'
                    : result.data.user == pandora.user.username
                        ? 'personal' : 'favorite'
                ].reloadList();
            });
        }
        function getDescriptionHeight() {
            return listData.status == 'private' ? 160 : 136;
        }
        function getDescriptionTop() {
            return listData.status == 'private' ? 112 : 136;
        }
        function getSubscribersAction() {
            return listData.status == 'private' ? 'hide' : 'show';
        }
    });
    return that;
};

pandora.ui.listIconPanel = function(listData) {

    var quarter = 0,
        quarters = ['top-left', 'top-right', 'bottom-left', 'bottom-right'],

        ui = pandora.user.ui,
        folderItems = pandora.getFolderItems(ui.section),
        folderItem = folderItems.slice(0, -1),


        $iconPanel = Ox.Element(),

        $icon = $('<img>')
            .attr({
                src: pandora.getListIcon(ui.section, listData.id, 256)
            })
            .css({position: 'absolute', borderRadius: '64px', margin: '16px'})
            .appendTo($iconPanel),

        $previewPanel = Ox.Element(),

        $preview,

        $list = Ox.Element(),

        ui = pandora.user.ui,

        that = Ox.SplitPanel({
            elements: [
                {
                    element: $iconPanel,
                    size: 280
                },
                {
                    element: $previewPanel
                },
                {
                    element: $list,
                    size: 144 + Ox.UI.SCROLLBAR_SIZE
                }
            ],
            orientation: 'horizontal'
        });

    pandora.api['find' + folderItems]({
        query: {
            conditions: [{key: 'id', value: listData.id, operator: '=='}],
            operator: '&'
        },
        keys: ['posterFrames']
    }, function(result) {

        var posterFrames = result.data.items[0].posterFrames,
            posterFrame = posterFrames[quarter],

            $interface = Ox.Element({
                    tooltip: function(e) {
                        var quarterName = ($(e.target).attr('id') || '').replace('-', ' ');
                        return quarterName ? Ox._('Edit ' + quarterName + ' image') : null;
                    }
                })
                .css({
                    position: 'absolute',
                    width: '256px',
                    height: '256px',
                    marginLeft: '16px',
                    marginTop: '16px',
                    cursor: 'pointer'
                })
                .on({
                    click: function(e) {
                        clickIcon(e);
                    },
                    dblclick: function(e) {
                        clickIcon(e, true);
                    }
                })
                .appendTo($iconPanel);

        renderQuarters();

        $list = Ox.IconList({
            borderRadius: 16,
            item: function(data, sort) {
                var infoKey = ['title', 'director'].indexOf(sort[0].key) > -1
                        ? pandora.site.itemKeys.filter(function(key) {
                            return ['year', 'date'].indexOf(key.id) > -1
                        }).map(function(key) {
                            return key.id;
                        })[0] : sort[0],key,
                    size = 128;
                return {
                    height: size,
                    id: data.id,
                    info: data[infoKey] || '',
                    title: pandora.getItemTitle(data),
                    url: pandora.getMediaURL('/' + data.id + '/icon' + size + '.jpg?' + data.modified),
                    width: size
                };
            },
            items: function(data, callback) {
                var listData = pandora.getListData();
                pandora.api.find(Ox.extend(data, {
                    query: {
                        conditions: ui.section == 'items'
                            ? [{key: 'list', value: listData.id, operator: '=='}]
                            : listData.query
                                ? listData.query.conditions
                                : [{key: 'duration', value: '00:00:00', operator: '>'}],
                        operator: '&'
                    }
                }), callback);
            },
            keys: ['duration', 'id', 'modified', 'posterFrame', 'videoRatio'].concat(pandora.site.itemTitleKeys),
            max: 1,
            min: 1,
            //orientation: 'vertical',
            selected: posterFrame ? [posterFrame.item] : [],
            size: 128,
            sort: ui.section == 'items' ? pandora.user.ui.listSort : pandora.site.user.ui.listSort,
            unique: 'id'
        })
        //.css({width: '144px'})
        .bindEvent({
            open: function(data) {
                setPosterFrame(data.ids[0], $list.value(data.ids[0], 'posterFrame'))
            },
            select: function(data) {
                renderPreview($list.value(data.ids[0]));
            }
        })
        .bindEventOnce({
            load: function() {
                var itemData;
                if (!posterFrame) {
                    itemData = $list.value(0);
                    $list.options({selected: [itemData.id]});
                } else {
                    itemData = $list.value(posterFrame.item);
                }
                itemData && renderPreview(itemData);
            }
        })
        .gainFocus();

        that.replaceElement(2, $list);

        function clickIcon(e, isDoubleClick) {
            quarter = quarters.indexOf($(e.target).attr('id'));
            renderQuarters();
            if (isDoubleClick && posterFrames.length) {
                var item = posterFrames[quarter].item;
                $list.options({selected: [item]});
                renderPreview($list.value(item), posterFrames[quarter].position);
            }
        }

        function renderPreview(itemData, position) {
            $preview = pandora.ui.videoPreview({
                duration: itemData.duration,
                frameRatio: itemData.videoRatio,
                height: 256,
                id: itemData.id,
                modified: itemData.modified,
                position: position,
                width: 256
            })
            .css({marginLeft: '8px', marginTop: '16px', overflow: 'hidden'})
            .bindEvent({
                click: function(data) {
                    setPosterFrame(itemData.id, data.position);
                }
            });
            /*
            // fixme: need canvas for this
            $($preview.children('.OxFrame')[0])
                .css('border-' + quarter + '-radius', '128px');
            */
            $previewPanel.empty().append($preview);
        }

        function renderQuarters() {
            $interface.empty();
            quarters.forEach(function(q, i) {
                $interface.append(
                    $('<div>')
                        .attr({id: q})
                        .css({
                            float: 'left',
                            width: '126px',
                            height: '126px',
                            border: '1px solid rgba(255, 255, 255, ' + (i == quarter ? 0.75 : 0) + ')',
                            background: 'rgba(0, 0, 0, ' + (i == quarter ? 0 : 0.75) + ')'
                        })
                        .css('border-' + q + '-radius', '64px')
                );
            });
        }

        function setPosterFrame(item, position) {
            var posterFrame = {item: item, position: position};
            if (posterFrames.length) {
                posterFrames[quarter] = posterFrame;
            } else {
                posterFrames = Ox.range(4).map(function() { return Ox.clone(posterFrame); } );
            }
            pandora.api['edit' + folderItem]({
                id: listData.id,
                posterFrames: posterFrames
            }, function() {
                $icon.attr({
                    src: pandora.getListIcon(ui.section, listData.id, 256)
                });
                pandora.$ui.folderList[listData.folder].$element
                    .find('img[src*="'
                        + pandora.getMediaURL('/' + encodeURIComponent(listData.id))
                        + '/"]'
                    )
                    .attr({
                        src: pandora.getListIcon(ui.section, listData.id, 256)
                    });
                pandora.$ui.info.updateListInfo();
            });
            $preview.options({position: position});
        }

    });

    function renderFrame() {
        $frame.css({borderRadius: 0});
        $frame.css('border-' + quarters[quarter] + '-radius', '128px');
    }

    that.updateQuery = function(key, value) {
        $list.options({
            items: function(data, callback) {
                pandora.api.find(Ox.extend(data, {
                    query: {
                        conditions: (
                            ui.section == 'items'
                            ? [{key: 'list', value: listData.id, operator: '=='}]
                            : []).concat(
                        value !== ''
                            ? [{key: key, value: value, operator: '='}]
                            : []
                        ).concat(
                            [{key: 'duration', value: '00:00:00', operator: '>'}]
                        ),
                        operator: '&'
                    }
                }), callback);
            }
        });
    };

    return that;

}
