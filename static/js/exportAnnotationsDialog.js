'use strict';

pandora.ui.exportAnnotationsDialog = function(options) {

    var annotations = pandora.$ui.editor.getCurrentAnnotations(),

        layers = pandora.site.layers.map(function(layer) {
            return {
                disabled: annotations[layer.id].length == 0,
                id: layer.id,
                title: layer.title
            }
        }),

        enabledLayers = layers.filter(function(layer) {
            return layer.disabled == false;
        }),

        layer = (enabledLayers.length ? enabledLayers : layers)[0].id,

        $content = Ox.Element().css({margin: '16px'}),

        $layerSelect = Ox.Select({
            items: layers,
            label: Ox._('Layer'),
            labelWidth: 128,
            value: layer,
            width: 384
        })
        .css({
            marginTop: '16px'
        })
        .bindEvent({
            change: function() {
                updateStatus();
                that.enableButton('export');
                !$link && addLink();
                updateLink();
            }
        })
        .appendTo($content),

        $formatSelect = Ox.Select({
            items: [
                {id: 'json', title: 'JSON'},
                {id: 'srt', title: 'SRT'}
            ],
            label: Ox._('Format'),
            labelWidth: 128,
            value: 'json',
            width: 384
        })
        .css({
            marginTop: '16px'
        })
        .bindEvent({
            change: function() {
                $link && updateLink();
            }
        })
        .appendTo($content),
    
        $status = Ox.$('<div>')
        .css({
            marginTop: '16px'
        })
        .appendTo($content),

        $link,

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'dontExport',
                    title: Ox._('Don\'t Export')
                })
                .bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    disabled: enabledLayers.length == 0,
                    id: 'export',
                    title: Ox._('Export')
                })
            ],
            closeButton: true,
            content: $content,
            fixedSize: true,
            height: 112,
            removeOnClose: true,
            title: Ox._('Export Annotations'),
            width: 416
        });

    updateStatus();

    enabledLayers.length && addLink();

    function addLink() {
        var $button = $(Ox.last(that.find('.OxButton')))
        updateLink();
        $button.wrap($('<a>'));
        // On wrap, a reference to the link would *not* be the link in the DOM
        $link = $($button.parent());
    }

    function updateLink() {
        var layer = $layerSelect.value(),
            format = $formatSelect.value(),
            items = annotations[layer].map(function(annotation) {
                var text = format == 'json'
                    ? annotation.value
                    : annotation.value
                        .replace(/\n/g, ' ')
                        .replace(/\s+/g, ' ')
                        .replace(/<br>\s+?/g, '\n');
                return {
                    'in': annotation['in'],
                    out: annotation.out,
                    text: text
                };
            });
        $link.attr({
            download: options.title + ' - '
                + Ox.getObjectById(layers, layer).title + '.' + format,
            href: 'data:text/plain;base64,' + btoa(
                format == 'json'
                ? JSON.stringify(items, null, '    ')
                : Ox.formatSRT(items)
            )
        });
    }

    function updateStatus() {
        $status.html(Ox._('All {0} currently shown will be exported.', [
            Ox.getObjectById(layers, $layerSelect.value()).title.toLowerCase()
        ]));
    }

    return that;

};