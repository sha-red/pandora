// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.documentDialog = function(options) {

    Ox.print('OPTIONS', options)

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
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
                title: item.name + '.' + item.extension,
                width: dialogWidth
            })
            .bindEvent({
                close: function() {
                    pandora.UI.set({document: ''});
                },
                resize: function(data) {
                    $content.options({
                        height: data.height,
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
            .css({
                position: 'absolute',
                right: '4px',
                top: '4px'
            })
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

    setContent();

    function setContent() {
        $content.replaceWith(
            $content = (
                item.extension == 'pdf'
                ? Ox.Element()
                : Ox.ImageViewer({
                    height: dialogHeight,
                    imageHeight: item.dimensions[1],
                    imagePreviewURL: '/documents/' + item.id + '/256p.jpg',
                    imageURL: '/documents/' + item.id + '/'
                        + item.name + '.' + item.extension,
                    imageWidth: item.dimensions[0],
                    width: dialogWidth
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
