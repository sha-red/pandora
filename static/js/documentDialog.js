// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.openDocumentDialog = function(options) {

    if (pandora.$ui.documentDialog && options.ids && options.ids.length == 1
        && Ox.getObjectById(pandora.$ui.documentDialog.getItems(), options.ids[0])){
        pandora.UI.set({document: options.ids[0]});
    } else if(options.ids) {
        pandora.api.findDocuments({
            query: {
                conditions: options.ids.map(function(id) {
                    return {key: 'id', value: id, operator: '=='}
                }),
                operator: '|'
            },
            range: [0, options.ids.length],
            keys: ['description', 'dimensions', 'extension', 'id', 'name']
        }, function(result) {
            var i = 0, documents = Ox.sort(result.data.items, function(item) {
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

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9) + 24,
        dialogWidth = Math.round(window.innerWidth * 0.9),
        items = options.items,
        item = items[options.index],
        settings = getSettings(),
    
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
                    pandora.UI.set({document: ''});
                    delete pandora.$ui.documentDialog;
                },
                resize: function(data) {
                    dialogHeight = data.height;
                    dialogWidth = data.width;
                    $content.options({
                        height: dialogHeight,
                        width: dialogWidth
                    });
                },
                pandora_document: function(data) {
                    if (data.value) {
                        if (Ox.getObjectById(items, data.value)) {
                            item = Ox.getObjectById(items, data.value);
                            settings = getSettings();
                            setTitle();
                            setContent();
                        } else {
                            //
                        }
                    } else {
                        that.close();
                    }
                },
                pandora_item: function(data) {
                    pandora.UI.set({document: ''});
                }
            }),

        $selectButton = Ox.ButtonGroup({
                buttons: [
                    {id: 'previous', title: 'left'},
                    {id: 'next', title: 'right'}
                ],
                type: 'image'
            })
            .css({
                position: 'absolute',
                right: '4px',
                top: '4px'
            })
            [items.length > 1 ? 'show' : 'hide']()
            .bindEvent({
                click: function(data) {
                    options.index = Ox.mod(
                        options.index + (data.id == 'previous' ? -1 : 1),
                        items.length
                    );
                    pandora.UI.set({document: items[options.index].id});
                }
            });

    $(that.find('.OxBar')[0]).append($selectButton);
    // fixme: why is this needed?
    $(that.find('.OxContent')[0]).css({overflow: 'hidden'});

    setTitle();
    setContent();

    function getSettings() {
        return Ox.extend(item.extension == 'pdf' ? {
            page: 1,
            zoom: 'fit'
        } : {
            center: 'auto',
            zoom: 'fit'
        }, pandora.user.ui.documents[item.id] || {});
    }

    function setContent() {
        $content.replaceWith(
            $content = (
                item.extension == 'pdf'
                ? Ox.PDFViewer({
                    height: dialogHeight,
                    page: settings.page,
                    url: '/documents/' + item.id + '/'
                        + item.name + '.' + item.extension,
                    width: dialogWidth,
                    zoom: settings.zoom
                })
                : Ox.ImageViewer({
                    center: settings.center,
                    height: dialogHeight,
                    imageHeight: item.dimensions[1],
                    imagePreviewURL: '/documents/' + item.id + '/256p.jpg',
                    imageURL: '/documents/' + item.id + '/'
                        + item.name + '.' + item.extension,
                    imageWidth: item.dimensions[0],
                    width: dialogWidth,
                    zoom: settings.zoom
                })
            )
            .bindEvent({
                center: function(data) {
                    pandora.UI.set('documents.' + item.id, Ox.extend(settings, {
                        center: data.center
                    }));
                },
                key_escape: function() {
                    pandora.$ui.documentDialog.close();
                },
                page: function(data) {
                    pandora.UI.set('documents.' + item.id, Ox.extend(settings, {
                        page: data.page
                    }));
                },
                zoom: function(data) {
                    pandora.UI.set('documents.' + item.id, Ox.extend(settings, {
                        zoom: data.zoom
                    }));
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
        setContent();
    };

    return that;

};
