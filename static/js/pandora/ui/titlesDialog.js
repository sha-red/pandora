// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.titlesDialog = function() {

    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = 512 + Ox.UI.SCROLLBAR_SIZE,
        numberOfTitles = 0,

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
                                {key: 'title', value: data.value, operator: '='},
                                {key: 'sorttitle', value: data.value, operator: '='}
                            ],
                            operator: '|'
                        };
                    $list.options({
                        items: function(data, callback) {
                            return pandora.api.findTitles(Ox.extend(data, {
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
                    },
                    {
                        id: 'title',
                        operator: '+',
                        removable: false,
                        title: 'Title',
                        visible: true,
                        width: 256
                    },
                    {
                        editable: true,
                        id: 'sorttitle',
                        operator: '+',
                        title: 'Sort Title',
                        visible: true,
                        width: 256
                    },
                ],
                columnsVisible: true,
                items: pandora.api.findTitles,
                keys: [],
                max: 1,
                scrollbarVisible: true,
                sort: [{key: 'sorttitle', operator: '+'}]
            })
            .bindEvent({
                init: function(data) {
                    numberOfTitles = data.items;
                    $status.html(
                        Ox.formatNumber(numberOfTitles)
                        + ' title' + (numberOfTitles == 1 ? '' : 's')
                    );
                },
                open: function(data) {
                    $list.$element
                        .find('.OxItem.OxSelected > .OxCell.OxColumnSorttitle')
                        .trigger('mousedown');
                },
                submit: function(data) {
                    Ox.Request.clearCache('findTitles');
                    pandora.api.editTitle({
                        id: data.id,
                        sorttitle: data.value
                    });
                }
            }),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'manageNames',
                    title: 'Manage Names...'
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
            title: 'Manage Titles',
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

