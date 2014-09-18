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
            }
        })
        .appendTo($content),
    
        $status = Ox.$('<div>')
        .css({
            marginTop: '16px'
        })
        .appendTo($content),

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
                    .bindEvent({
                        click: exportAnnotations
                    })
            ],
            closeButton: true,
            content: $content,
            fixedSize: true,
            height: 80,
            removeOnClose: true,
            title: Ox._('Export Annotations'),
            width: 416
        });

    updateStatus();

    function exportAnnotations() {
        Ox.print(
            Ox.formatSRT(annotations[$layerSelect.value()].map(function(annotation) {
                return {
                    'in': annotation['in'],
                    out: annotation.out,
                    text: annotation.value
                        .replace(/\n/g, ' ')
                        .replace(/\s+/g, ' ')
                        .replace(/<br>/g, '\n')
                };
            }))
        );
    }

    function updateStatus() {
        $status.html(Ox._('All {0} currently shown will be exported.', [
            Ox.getObjectById(layers, $layerSelect.value()).title.toLowerCase()
        ]));
    }

    return that;

};