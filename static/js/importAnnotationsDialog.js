// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.importAnnotationsDialog = function(data) {

    var layers = pandora.site.layers.filter(function(layer) {
            return layer.canAddAnnotations[pandora.user.level];
        }),

        languages = Ox.sortBy(Ox.LANGUAGES.map(function(language) {
            return {id: language.code, title: language.name};
        }), 'title'),
    
        $content = Ox.Element()
            .css({margin: '16px'}),

        $layerSelect = Ox.Select({
            items: layers,
            label: Ox._('Layer'),
            labelWidth: 128,
            width: 384
        })
        .css({
            marginTop: '16px'
        })
        .appendTo($content),

        $languageSelect = Ox.Select({
            items: languages,
            label: Ox._('Language'),
            labelWidth: 128,
            width: 384
        })
        .css({
            marginTop: '16px'
        })
        .appendTo($content),

        $fileInput = Ox.FileInput({
            maxFiles: 1,
            width: 384
        })
        .css({
            marginTop: '16px'
        })
        .bindEvent({
            change: function(data) {
                var reader;
                if (data.value.length) {
                    reader = new FileReader();
                    reader.onloadend = function(event) {
                        srt = parseSRT(this.result);
                        total = srt.length;
                        if (total && layer) {
                            importButton.options({disabled: false});
                            selectLayer.hide();
                            selectFile.hide();
                        }
                        setStatus(
                            Ox._('File contains {0} annotation'
                            + (total == 1 ? '' : 's') + '.', [total])
                        );
                    };
                    reader.readAsText(data.value[0]);
                } else {
                    srt = [];
                    total = 0;
                    importButton.options({
                        disabled: true
                    });
                }
            }
        })
        .appendTo($content),

        $status = Ox.$('<div>')
        .css({
            marginTop: '16px'
        })
        .html('foo')
        .appendTo($content),

        $closeButton = Ox.Button({
            id: 'close',
            title: Ox._('Close')
        })
        .bindEvent({
            click: function() {
                that.close();
            }
        }),

        $importButton = Ox.Button({
            disabled: true,
            id: 'import',
            title: Ox._('Import')
        }).bindEvent({
            click: function() {
                // ...
            }
        }),

        that = Ox.Dialog({
            buttons: [
                $closeButton,
                $importButton
            ],
            content: $content,
            height: 144,
            keys: {
                escape: 'close'
            },
            removeOnClose: true,
            title: Ox._('Import Annotations'),
            width: 416
        });

    function addAnnotations() {
        var annotations, task;
        if (srt.length > 0) {
            setStatus(Ox._('Loading...'));
            var annotations = srt.filter(function(data) {
                return !Ox.isUndefined(data['in'])
                    && !Ox.isUndefined(data.out)
                    && data.text;
            }).map(function(data) {
                return {
                    'in': data['in'],
                    out: data.out,
                    value: Ox.sanitizeHTML(data.text)
                        .replace(/<br[ /]*?>\n/g, '\n')
                        .replace(/\n\n/g, '<br>\n')
                        .replace(/\n/g, '<br>\n')
                };
            });
            pandora.api.addAnnotations({
                annotations: annotations,
                item: pandora.user.ui.item,
                layer: layer
            }, function(result) {
                if (result.data.taskId) {
                    $status.html('').append(Ox.LoadingScreen({
                        text: Ox._('Importing {0} annotations...', [srt.length])
                    }).start());
                    pandora.wait(result.data.taskId, function(result) {
                        if (result.data.status == 'SUCCESS') {
                            setStatus(Ox._('{0} annotations imported.', [annotations.length]));
                            Ox.Request.clearCache(pandora.user.ui.item);
                            pandora.$ui.contentPanel.replaceElement(
                                1, pandora.$ui.item = pandora.ui.item()
                            );
                        } else {
                            setStatus(Ox._('Importing annotations failed.'));
                        }
                    });
                } else {
                    setStatus(Ox._('Importing annotations failed.'));
                }
            });
        }
    }

    function parseSRT(data) {
        var srt = Ox.parseSRT(data),
            length = srt.length - 1;
        //pandora layers include outpoint,
        //speedtrans right now sets in to out,
        //to avoid one frame overlaps,
        //move outpoint by 0.001 seconds
        for (var i=0; i < length; i++) {
            if (srt[i].out == srt[i+1]['in']) {
                srt[i].out = srt[i].out - 0.001;
            }
        }
        return srt;
    }

    function setStatus(status) {
        $status.html(status);
    }

    return that;

};
