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
            height: 80,
            removeOnClose: true,
            title: Ox._('Export Annotations'),
            width: 416
        });

    updateStatus();

    if (enabledLayers.length) {
        addLink();
        updateLink();
    }

    function addLink() {
        var layer = $layerSelect.value();
        $link = $('<a>').attr({
            target: '_blank'
        });
        updateLink();
        $(that.find('.OxButton')[3]).wrap($link);
    }

    function updateLink() {
        var layer = $layerSelect.value();
        $link.attr({
            download: options.title + ' - '
                + Ox.getObjectById(layers, layer).title + '.srt',
            href: 'data:text/plain;base64,' + btoa(
                Ox.formatSRT(annotations[layer].map(function(annotation) {
                    return {
                        'in': annotation['in'],
                        out: annotation.out,
                        text: annotation.value
                            .replace(/\n/g, ' ')
                            .replace(/\s+/g, ' ')
                            .replace(/<br>\s+?/g, '\n')
                    };
                }))
            )
        })
    }

    function updateStatus() {
        $status.html(Ox._('All {0} currently shown will be exported.', [
            Ox.getObjectById(layers, $layerSelect.value()).title.toLowerCase()
        ]));
    }

    return that;

};