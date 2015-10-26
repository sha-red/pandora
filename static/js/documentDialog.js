// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

// fixme: this is a very uncommon pattern

pandora.openDocumentDialog = function(options) {
    if (
        pandora.$ui.documentDialog && options.ids && options.ids.length == 1
        && Ox.getObjectById(pandora.$ui.documentDialog.getItems(), options.ids[0])
    ) {
        pandora.UI.set({'part.documents': options.ids[0]});
    } else if (options.ids) {
        pandora.api.findDocuments({
            query: {
                conditions: options.ids.map(function(id) {
                    return {key: 'id', value: id, operator: '=='}
                }),
                operator: '|'
            },
            range: [0, options.ids.length],
            keys: ['description', 'dimensions', 'extension', 'id', 'name', 'modified']
        }, function(result) {
            var i = 0,
                documents = Ox.sort(result.data.items, function(item) {
                    return options.ids.indexOf(item.id);
                }).map(function(document) {
                    return Ox.extend({index: i++}, document);
                });
            pandora.openDocumentDialog({documents: documents});
        });
    } else {
        if (!pandora.$ui.documentDialog) {
            pandora.$ui.documentDialog = pandora.ui.documentDialog({
                index: 0,
                items: options.documents,
            })
            .bindEvent({
                close: function() {
                    pandora.user.ui.page == 'documents' && pandora.UI.set({page: ''});
                }
            })
            .open();
        } else {
            pandora.$ui.documentDialog.update({
                index: 0,
                items: options.documents
            });
        }
        pandora.UI.set({
            page: 'documents',
            'part.documents': options.documents[0].id
        });
        return pandora.$ui.documentDialog;
    }
};

pandora.ui.documentDialog = function(options) {

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9) - 24,
        dialogWidth = Math.round(window.innerWidth * 0.9) - 48,
        isItemView = !pandora.$ui.documentsDialog,
        items = options.items,
        item = items[options.index],
    
        $content = Ox.Element(),

        that = Ox.Dialog({
                closeButton: true,
                content: $content,
                focus: false,
                height: dialogHeight,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                padding: 0,
                removeOnClose: true,
                title: '',
                width: dialogWidth
            })
            .bindEvent({
                close: function() {
                    pandora.UI.set({'part.documents': ''});
                    delete pandora.$ui.documentDialog;
                },
                resize: function(data) {
                    dialogHeight = data.height;
                    dialogWidth = data.width;
                    $content.options({
                        height: dialogHeight,
                        width: dialogWidth
                    });
                    $content.getArea && pandora.UI.set(
                        'documents.' + item.id,
                        {position: $content.getArea().map(Math.round)}
                    );
                },
                'pandora_part.documents': function(data) {
                    if (data.value) {
                        if (Ox.getObjectById(items, data.value)) {
                            item = Ox.getObjectById(items, data.value);
                            setTitle();
                            setContent();
                        } else {
                            // ...
                        }
                    } else {
                        that.close();
                    }
                },
                pandora_item: function(data) {
                    pandora.UI.set({'part.documents': ''});
                }
            }),

        $embedButton = Ox.Button({
                title: 'embed',
                tooltip: Ox._('Embed'), 
                type: 'image'
            })
            .css({
                position: 'absolute',
                right: '4px',
                top: '4px'
            })
            .bindEvent({
                click: function(data) {
                    var id = options.items[options.index].id;
                    pandora.$ui.embedDocumentDialog = pandora.ui.embedDocumentDialog(
                        id,
                        pandora.user.ui.documents[id]
                            ? pandora.user.ui.documents[id].position
                            : null
                    ).open();
                }
            }),

        $selectButton = Ox.ButtonGroup({
                buttons: [
                    {id: 'previous', title: 'left', tooltip: Ox._('Previous')},
                    {id: 'next', title: 'right', tooltip: Ox._('Next')}
                ],
                type: 'image'
            })
            .css({
                position: 'absolute',
                right: '24px',
                top: '4px'
            })
            [items.length > 1 ? 'show' : 'hide']()
            .bindEvent({
                click: function(data) {
                    pandora.$ui[
                        isItemView ? 'documents' : 'documentsDialogPanel'
                    ].selectSelected(data.id == 'previous' ? -1 : 1);
                }
            });

    $(that.find('.OxBar')[0]).append($embedButton).append($selectButton);
    // fixme: why is this needed?
    $(that.find('.OxContent')[0]).css({overflow: 'hidden'});

    setTitle();
    setContent();

    function setContent() {
        $content.replaceWith(
            $content = (
                item.extension == 'pdf'
                ? Ox.PDFViewer({
                    height: dialogHeight,
                    page: pandora.user.ui.documents[item.id]
                        ? pandora.user.ui.documents[item.id].position
                        : 1,
                    url: '/documents/' + item.id + '/'
                        + item.name + '.' + item.extension,
                    width: dialogWidth,
                    zoom: 'fit'
                })
                : Ox.ImageViewer({
                    area: pandora.user.ui.documents[item.id]
                        ? pandora.user.ui.documents[item.id].position
                        : [],
                    height: dialogHeight,
                    imageHeight: item.dimensions[1],
                    imagePreviewURL: pandora.getMediaURL('/documents/' + item.id + '/256p.jpg?' + item.modified),
                    imageURL: pandora.getMediaURL('/documents/' + item.id + '/'
                        + item.name + '.' + item.extension + '?' + item.modified),
                    imageWidth: item.dimensions[0],
                    width: dialogWidth
                })
            )
            .bindEvent({
                center: function(data) {
                    pandora.UI.set(
                        'documents.' + item.id,
                        {position: $content.getArea().map(Math.round)}
                    );
                },
                key_escape: function() {
                    pandora.$ui.documentDialog.close();
                },
                page: function(data) {
                    pandora.UI.set(
                        'documents.' + item.id,
                        {position: data.page}
                    );
                },
                zoom: function(data) {
                    pandora.UI.set(
                        'documents.' + item.id,
                        {position: $content.getArea().map(Math.round)}
                    );
                }
            })
        );
    }

    function setTitle() {
        that.options({title: item.name + '.' + item.extension});
    }

    that.getItems = function() {
        return items;
    };

    that.update = function(options) {
        items = options.items;
        item = items[options.index];
        setTitle();
        $selectButton[items.length > 1 ? 'show' : 'hide']();
        setContent();
    };

    return that;

};
