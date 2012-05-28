// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.importAnnotations = function(data) {
    var content = Ox.Element().css({margin: '16px'}),
        file,
        height = 192,
        layers = pandora.site.layers.filter(function(layer) {
            return layer.canAddAnnotations[pandora.user.level];
        }),
        layer = layers[0].id,
        width = 384,
        srt = [],
        total = 0,
        importButton,
        selectLayer,
        selectFile,
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'close',
                    title: 'Close'
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                importButton = Ox.Button({
                    disabled: true,
                    id: 'import',
                    title: 'Import'
                }).bindEvent({
                    click: function() {
                        importButton.hide();
                        selectLayer.hide();
                        selectFile.hide();
                        addAnnotation();
                    }
                })
            ],
            closeButton: true,
            content: content,
            keys: {
                'escape': 'close'
            },
            height: height,
            removeOnClose: true,
            width: width,
            title: 'Import Annotations'
        })
        .bindEvent({
            close: function(data) {
                that.close();
            }
        }),
        $status = $('<div>').css({
            padding: '4px'
        });

    function addAnnotation() {
        if(srt.length>0) {
            var data = srt.shift();
            data.text = Ox.sanitizeHTML(data.text)
                .replace(/<br[ /]*?>\n/g, '\n')
                .replace(/\n\n/g, '<br>\n')
                .replace(/\n/g, '<br>\n');
            $status.html(Ox.formatDuration(data['in'])
                + ' to ' + Ox.formatDuration(data.out) + '<br>\n'
                + data.text);
            pandora.api.addAnnotation({
                'in': data['in'],
                out: data.out,
                value: data.text,
                item: pandora.user.ui.item,
                layer: layer
            }, function(result) {
                if (result.status.code == 200) {
                    addAnnotation();
                } else {
                    content.html('Failed');
                }
            });
        } else {
            $status.html(total + ' annotations imported.');
            Ox.Request.clearCache(pandora.user.ui.item);
            pandora.$ui.contentPanel.replaceElement(
                1, pandora.$ui.item = pandora.ui.item()
            );
        }
    }
    content.append($('<div>').css({
        padding: '4px',
        paddingBottom: '16px'
    }).html('Import annotations from .srt file:'));
    selectLayer = Ox.Select({
            items: layers,
            value: layer,
            label: 'Layer'
        })
        .bindEvent({
            change: function(data) {
                layer = data.value;
            }
        })
        .appendTo(content);

    selectFile = $('<input>')
        .attr({
            type: 'file'
        })
        .css({
            padding: '8px'
        })
        .on({
            change: function(event) {
                if(this.files.length) {
                    file = this.files[0];
                    var reader = new FileReader();
                    reader.onloadend = function(event) {
                        srt = Ox.parseSRT(this.result);
                        total = srt.length;
                        if(total) {
                            importButton.options({
                                disabled: false
                            });
                        }
                        $status.html('File contains '+ total + ' annotations.');
                    };
                    reader.readAsText(file);
                } else {
                    srt = [];
                    total = 0;
                    importButton.options({
                        disabled: true
                    });
                }
            }
        })
        .appendTo(content);
    content.append($status);
    return that;
};
