
pandora.ui.addRemoveKeyDialog = function(options) {
    var item = Ox.getObjectById(pandora.site.documentKeys, options.key),
        itemTitle = Ox._(item ? item.title : options.key),
        dialogTitle = Ox._('Add/Remove {0}', [itemTitle]);

    return Ox.Element('<span>')
        .addClass('OxLight')
        .html(' [+]')
        .css({
            cursor: 'pointer',
        })
        .options({
            tooltip: dialogTitle
        })
        .on('click', function(event) {
            var add, remove,
                dialog = Ox.Dialog({
                buttons: [
                    Ox.Button({
                            title: Ox._('Cancel')
                        })
                        .css({margin: '4px 4px 4px 0'})
                        .bindEvent({
                            click: function() {
                                dialog.close()
                            }
                        }),
                    Ox.Button({
                            title: Ox._('Update'),
                            width: 52
                        }).bindEvent({
                            click: function() {
                                var addValue = add.value()
                                var removeValue = remove.value()
                                if (!addValue.length && !removeValue.length) {
                                    dialog.close()
                                    return
                                }
                                var $loading = Ox.LoadingScreen({
                                    width: 256,
                                    height: 64
                                })
                                dialog.options({
                                    content: $loading.start()
                                })
                                var ids = options.ids;
                                pandora.api[{
                                    'items': 'find',
                                    'documents': 'findDocuments',
                                }[options.section]]({
                                    query: {
                                        conditions: [{key: 'id', operator: '&', value: ids}]
                                    },
                                    range: [0, ids.length],
                                    keys: ['id', options.key]

                                }, function(result) {
                                    Ox.serialForEach(result.data.items,
                                        function(item, index, items, callback) {
                                            var changed = false
                                            var value = item[options.key] || []
                                            if (addValue.length && !Ox.contains(value, addValue)) {
                                                value.push(addValue)
                                                changed = true
                                            }
                                            if (removeValue.length && Ox.contains(value, removeValue)) {
                                                value = value.filter(function(v) { return v != removeValue; } )
                                                changed = true
                                            }
                                            if (changed) {
                                                var edit = {id: item.id}
                                                edit[options.key] = value
                                                pandora.api[{
                                                    'items': 'edit',
                                                    'documents': 'editDocument',
                                                }[options.section]](edit, function(response) {
                                                    callback()
                                                })
                                            } else {
                                                callback()
                                            }
                                        },
                                        function() {
                                            $loading.stop()
                                            dialog.close()
                                        }
                                    )
                                })
                            }
                        })
                ],
                closeButton: true,
                content: Ox.Element()
                    .css({
                        padding: '8px'
                    })
                    .append(
                        add = Ox.Input({
                            width: 240,
                            type: 'input',
                            label: 'Add'
                        })
                    )
                    .append(
                        Ox.Element().html('').css({
                            height: '8px'
                        })
                    )
                    .append(
                        remove = Ox.Input({
                            width: 240,
                            type: 'input',
                            label: 'Remove'
                        })
                    ),
                height: 64,
                removeOnClose: true,
                title: dialogTitle,
                width: 256
            }).open();
        })

}
