// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.importAnnotationsDialog = function(data) {

    var srt,
    
        layers = pandora.site.layers.filter(function(layer) {
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
        .bindEvent({
            change: function() {
                updateLanguageSelect();
            }
        })
        .appendTo($content),

        $languageSelect = Ox.Select({
            items: languages,
            label: Ox._('Language'),
            labelWidth: 128,
            value: pandora.site.language,
            width: 384
        })
        .css({
            marginTop: '16px'
        })
        .appendTo($content),

        $fileInput = Ox.FileInput({
            label: Ox._('SRT File'),
            labelWidth: 128,
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
                    reader.onloadend = function(e) {
                        if (this.result) {
                            srt = parseSRT(this.result);
                            if (srt.length) {
                                $importButton.options({disabled: false});
                                //selectLayer.hide();
                                //selectFile.hide();
                            }
                            setStatus(
                                Ox._('File contains {0} annotation'
                                + (srt.length == 1 ? '' : 's') + '.', [srt.length])
                            );
                        }
                    };
                    reader.readAsText(data.value[0]);
                } else {
                    srt = [];
                    $importButton.options({
                        disabled: true
                    });
                }
            }
        })
        .appendTo($content),

        $status = Ox.$('<div>')
        .css({
            marginTop: '48px' // FIXME
        })
        .appendTo($content),

        $dontImportButton = Ox.Button({
            id: 'dontImport',
            title: Ox._('Don\'t Import')
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
                addAnnotations();
            }
        }),

        that = Ox.Dialog({
            buttons: [
                $dontImportButton,
                $importButton
            ],
            closeButton: true,
            content: $content,
            height: 144,
            keys: {
                escape: 'dontImport'
            },
            removeOnClose: true,
            title: Ox._('Import Annotations'),
            width: 416
        });

    updateLanguageSelect()

    function addAnnotations() {
        var annotations,
            language = $languageSelect.value(),
            layer = $layerSelect.value(),
            task;
        if (srt.length > 0) {
            setStatus(Ox._('Importing {0} annotations...', [srt.length]));
            annotations = srt.filter(function(data) {
                return !Ox.isUndefined(data['in'])
                    && !Ox.isUndefined(data.out)
                    && data.text;
            }).map(function(data) {
                var value = Ox.sanitizeHTML(data.text)
                    .replace(/<br[ /]*?>\n/g, '\n')
                    .replace(/\n\n/g, '<br>\n')
                    .replace(/\n/g, '<br>\n');
                if (language != pandora.site.language) {
                    value = '<span lang="' + language + '">' + value + '</span>';
                }
                return {
                    'in': data['in'],
                    out: data.out,
                    value: value
                };
            });
            pandora.api.addAnnotations({
                annotations: annotations,
                item: pandora.user.ui.item,
                layer: layer
            }, function(result) {
                if (result.data.taskId) {
                    setStatus(Ox._('Importing {0} annotations...', [srt.length]));
                    pandora.wait(result.data.taskId, function(result) {
                        if (result.data.status == 'SUCCESS') {
                            setStatus(Ox._('{0} annotations imported.', [annotations.length]));
                            Ox.Request.clearCache(pandora.user.ui.item);
                            pandora.$ui.contentPanel.replaceElement(
                                1, pandora.$ui.item = pandora.ui.item()
                            );
                        } else {
                            setStatus(Ox._('Import failed.'));
                        }
                    });
                } else {
                    setStatus(Ox._('Import failed.'));
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

    function updateLanguageSelect() {
        var layerType = Ox.getObjectById(
            pandora.site.layers, $layerSelect.value()
        ).type;
        if (layerType != 'text') {
            $languageSelect.value(pandora.site.language);
        }
        languages.forEach(function(language) {
            $languageSelect[
                language.id == pandora.site.language || layerType == 'text'
                ? 'enableItem' : 'disableItem'
            ](language.id);
        });
    }

    return that;

};
