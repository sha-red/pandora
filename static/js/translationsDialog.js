'use strict';

pandora.ui.translationsDialog = function() {

    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = 576 + Ox.UI.SCROLLBAR_SIZE,

        $languageSelect = Ox.Select({
                id: 'selectlanguage',
                items: [{
                    id: '',
                    title: Ox._('All')
                }].concat(pandora.site.languages.filter(function(lang) {
                    return lang != 'en'
                }).map(function(lang) {
                    return {
                        id: lang,
                        title: Ox.LOCALE_NAMES[lang]
                    }
                })),
                value: pandora.site.language,
                width: 96

            })
            .css({float: 'right', margin: '4px'})
            .bindEvent({
                change: function(data) {
                    var value = $findInput.options('value')
                    var query = prepareQuery(value, data.value)
                    $list.options({
                        query: query,
                    });
                }
            }),

        $findInput = Ox.Input({
                changeOnKeypress: true,
                clear: true,
                placeholder: Ox._('Find'),
                width: 192
            })
            .css({float: 'right', margin: '4px'})
            .bindEvent({
                change: function(data) {
                    var lang = $languageSelect.options('value')
                    var query = prepareQuery(data.value, lang)
                    $list.options({
                        query: query,
                    });
                }
            }),

        $list = Ox.TableList({
                columns: [
                    {
                        id: 'id',
                        title: Ox._('ID'),
                        visible: false,
                        width: 0
                    },
                    {
                        id: 'key',
                        operator: '+',
                        removable: false,
                        title: Ox._('Key'),
                        format: function(data) {
                            return Ox.encodeHTMLEntities(data)
                        },
                        visible: true,
                        width: 240
                    },
                    {
                        editable: true,
                        id: 'value',
                        operator: '+',
                        title: Ox._('Value'),
                        format: function(data) {
                            return Ox.encodeHTMLEntities(data)
                        },
                        tooltip: Ox._('Edit Translation'),
                        visible: true,
                        width: 240
                    },
                    {
                        id: 'lang',
                        operator: '-',
                        title: Ox._('Language'),
                        format: function(lang) {
                            return Ox.LOCALE_NAMES[lang]
                        },
                        visible: true,
                        width: 96
                    },
                ],
                columnsVisible: true,
                items: pandora.api.findTranslations,
                max: 1,
                scrollbarVisible: true,
                sort: [{key: 'key', operator: '+'}],
                unique: 'id'
            })
            .bindEvent({
                init: function(data) {
                    $status.html(
                        Ox.toTitleCase(Ox.formatCount(data.items, 'translation'))
                    );
                },
                open: function(data) {
                    $list.find('.OxItem.OxSelected > .OxCell.OxColumnSortname')
                        .trigger('mousedown')
                        .trigger('mouseup');
                },
                select: function(data) {
                },
                submit: function(data) {
                    Ox.Request.clearCache('findTranslations');
                    console.log(data)
                    pandora.api.editTranslation({
                        id: data.id,
                        value: data.value
                    });
                }
            }),


        that = Ox.Dialog({
                buttons: [
                    {},
                    Ox.Button({
                        title: Ox._('Done'),
                        width: 48
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
                                )
                                .append(
                                    $languageSelect
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
                title: Ox._('Manage Translations'),
                width: width
            })
            .bindEvent({
                resizeend: function(data) {
                    var width = (data.width - 96 - Ox.UI.SCROLLBAR_SIZE) / 2;
                    [
                        {id: 'key', width: Math.ceil(width)},
                        {id: 'value', width: Math.floor(width)},
                    ].forEach(function(column) {
                        $list.resizeColumn(column.id, column.width);
                    });
                }
            }),

        $status = $('<div>')
            .css({
                position: 'absolute',
                top: '4px',
                left: '40px',
                right: '40px',
                bottom: '4px',
                paddingTop: '2px',
                fontSize: '9px',
                textAlign: 'center'
            })
            .appendTo(that.find('.OxButtonsbar'));


    function prepareQuery(value, lang) {
        var query;
        if (value) {
            query = {
                conditions: [
                    {
                        key: 'key',
                        operator: '=',
                        value: value
                    },
                    {
                        key: 'value',
                        operator: '=',
                        value: value
                    }
                ],
                operator: '|'
            }
        } else {
            query = {
                conditions: []
            };
        }
        if (lang != '') {
            query = {
                conditions: [
                    query,
                    {
                        key: 'lang',
                        operator: '==',
                        value: lang
                    }
                ],
                operator: '&'
            }
        }
        return query;
    }

    return that;

};
