// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.documentDialog = function(items, index) {

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        documentHeight = dialogHeight - 24,
        documentWidth = dialogWidth,
        item = items[index],
    
        $content = Ox.Element(),

        that = Ox.Dialog({
                closeButton: true,
                content: $content,
                height: dialogHeight,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                padding: 0,
                removeOnClose: true,
                title: item.name + '.' + item.extension,
                width: dialogWidth
            })
            .bindEvent({
                close: function() {
                    pandora.UI.set({document: ''});
                },
                resize: function(data) {
                    $content.options({
                        height: data.height - 24,
                        width: data.width
                    });
                },
                pandora_document: function(data) {
                    if (Ox.getObjectById(items, data.value)) {
                        
                    } else {
                        
                    }
                }
            }),

        $selectButton = Ox.ButtonGroup({
                buttons: [
                    {id: 'previous', title: 'left'},
                    {id: 'next', title: 'right'}
                ],
                type: 'image'
            })
            .css({float: 'right', margin: '4px'})
            .bindEvent({
                click: function(data) {
                    index = Ox.mod(
                        index + (data.id == 'previous' ? -1 : 1),
                        items.length
                    );
                    pandora.UI.set({document: items[index].id});
                }
            });

    $(that.find('.OxBar')[0]).append($selectButton);

    setContent();

    function setContent() {
        $content.replaceWith(
            $content = (
                item.extension == 'pdf'
                ? Ox.Element()
                : Ox.ImageViewer({
                    height: documentHeight,
                    imageHeight: item.dimensions[1],
                    imagePreviewURL: '/documents/' + item.id + '/256p.jpg',
                    imageURL: '/documents/' + item.id + '/'
                        + item.name + '.' + item.extension,
                    imageWidth: item.dimensions[0],
                    width: documentWidth
                })
            )
            .bindEvent({
                center: function() {
                    pandora.UI.set('document.' + item.id + '.center', data.center);
                },
                page: function() {
                    pandora.UI.set('document.' + item.id + '.page', data.page);
                },
                zoom: function(data) {
                    pandora.UI.set('document.' + item.id + '.zoom', data.zoom);
                }
            })
        );
    }

    return that;

};
