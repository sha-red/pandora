// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.namesDialog = function() {

    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = 576 + Ox.UI.SCROLLBAR_SIZE,
        numberOfNames = 0,

        $findInput = Ox.Input({
                changeOnKeypress: true,
                clear: true,
                placeholder: 'Find',
                width: 192
            })
            .css({float: 'right', margin: '4px'})
            .bindEvent({
                change: function(data) {
                    var query = {
                            conditions: [
                                {key: 'name', value: data.value, operator: '='},
                                {key: 'sortname', value: data.value, operator: '='}
                            ],
                            operator: '|'
                        };
                    $list.options({
                        items: function(data, callback) {
                            return pandora.api.findNames(Ox.extend(data, {
                                query: query
                            }), callback);
                        }
                    });        
                }
            }),

        $list = Ox.TextList({
                columns: [
                    {
                        id: 'id',
                        title: 'ID',
                        unique: true,
                        visible: false,
                        width: 0
                    },
                    {
                        id: 'name',
                        operator: '+',
                        removable: false,
                        title: 'Name',
                        visible: true,
                        width: 256
                    },
                    {
                        editable: true,
                        id: 'sortname',
                        operator: '+',
                        title: 'Sort Name',
                        tooltip: 'Edit Sort Name',
                        visible: true,
                        width: 256
                    },
                    {
                        id: 'numberofnames',
                        align: 'right',
                        operator: '-',
                        title: 'Names',
                        visible: true,
                        width: 64
                    },
                ],
                columnsVisible: true,
                items: pandora.api.findNames,
                max: 1,
                scrollbarVisible: true,
                sort: [{key: 'sortname', operator: '+'}]
            })
            .bindEvent({
                init: function(data) {
                    numberOfNames = data.items;
                    $status.html(
                        Ox.formatNumber(numberOfNames)
                        + ' name' + (numberOfNames == 1 ? '' : 's')
                    );
                },
                submit: function(data) {
                    pandora.api.editName({
                        id: data.id,
                        sortname: data.value
                    });
                }
            }),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'manageTitles',
                    title: 'Manage Titles...'
                }).bindEvent({
                    click: function() {
                        // ...
                    }
                }),
                {},
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
                        element: Ox.Bar({size: 24})
                            .append($status)
                            .append(
                                $findInput
                            ),
                        size: 24
                    },
                    {
                        element: $list
                    }
                ],
                orientation: 'vertical'
            }),
            height: height,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            padding: 0,
            title: 'Manage Names',
            width: width
        }),

    $status = $('<div>')
        .css({
            position: 'absolute',
            top: '4px',
            left: '128px',
            right: '128px',
            bottom: '4px',
            paddingTop: '2px',
            fontSize: '9px',
            textAlign: 'center',
        })
        .appendTo(that.$element.find('.OxButtonsbar'));

    return that;

};

