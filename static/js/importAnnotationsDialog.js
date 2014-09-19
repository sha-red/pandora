// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.importAnnotationsDialog = function(options) {

    var layers = pandora.site.layers.filter(function(layer) {
            return layer.canAddAnnotations[pandora.user.level];
        }),

        languages = Ox.sortBy(Ox.LANGUAGES.map(function(language) {
            return {id: language.code, title: language.name};
        }), 'title'),

        $content = Ox.Element().css({margin: '16px'}),

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
            change: updateLanguageSelect
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
            change: updateFileInput
        })
        .appendTo($content),

        $fileInput = Ox.FileInput({
            label: Ox._('File'),
            labelWidth: 128,
            maxFiles: 1,
            width: 384
        })
        .css({
            marginTop: '16px'
        })
        .bindEvent({
            change: function(data) {
                $status.empty();
                that[
                    data.value.length ? 'enableButton' : 'disableButton'
                ]('import');
            }
        })
        .appendTo($content),

        $status = Ox.$('<div>')
        .css({
            marginTop: '48px' // FIXME
        })
        .appendTo($content),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'dontImport',
                    title: Ox._('Don\'t Import')
                })
                .bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    disabled: true,
                    id: 'import',
                    title: Ox._('Import')
                }).bindEvent({
                    click: importAnnotations
                })
            ],
            closeButton: true,
            content: $content,
            fixedSize: true,
            height: 176,
            keys: {
                escape: 'dontImport'
            },
            removeOnClose: true,
            title: Ox._('Import Annotations'),
            width: 416
        });

    updateLanguageSelect();
    updateFileInput();

    function disableButtons() {
        that.disableButtons();
        that.disableCloseButton();
    }

    function enableButtons() {
        that.enableButtons();
        that.enableCloseButton();
    }

    function importAnnotations() {

        var annotations = [],
            language = $languageSelect.value(),
            layer = $layerSelect.value(),
            format = $formatSelect.value(),
            file = $fileInput.value()[0],
            reader = new FileReader();

        disableButtons();

        reader.onloadend = function(e) {
            if (this.result) {
                annotations = format == 'json'
                    ? JSON.parse(this.result)
                    : parseSRT(this.result);
            }
            if (annotations.length) {
                $status.html(Ox._(
                    'Importing {0} annotation'
                    + (annotations.length == 1 ? '' : 's') + '...',
                    [annotations.length]
                ));
                annotations = annotations.map(function(annotation) {
                    var value = Ox.sanitizeHTML(annotation.text);
                    if (format == 'srt') {
                        value = value.replace(/<br[ /]*?>\n/g, '\n')
                            .replace(/\n\n/g, '<br>\n')
                            .replace(/\n/g, '<br>\n');
                    }
                    if (language != pandora.site.language) {
                        value = '<span lang="' + language + '">'
                            + value + '</span>';
                    }
                    return {
                        'in': annotation['in'],
                        out: annotation.out,
                        value: value
                    };
                });
                pandora.api.addAnnotations({
                    annotations: annotations,
                    item: pandora.user.ui.item,
                    layer: layer
                }, function(result) {
                    if (result.data.taskId) {
                        pandora.wait(result.data.taskId, function(result) {
                            if (result.data.status == 'SUCCESS') {
                                $status.html(Ox._('Import succeeded.'));
                                Ox.Request.clearCache(pandora.user.ui.item);
                                pandora.$ui.contentPanel.replaceElement(
                                    1, pandora.$ui.item = pandora.ui.item()
                                );
                            } else {
                                $status.html(Ox._('Import failed.'));
                            }
                            enableButtons();
                        });
                    } else {
                        $status.html(Ox._('Import failed.'));
                        enableButtons();
                    }
                });
            } else {
                $status.html(Ox._('No valid annotations found.'));
                enableButtons();
            }
        };

        reader.readAsText(file);

    }

    function parseSRT(srt) {
        return Ox.parseSRT(srt).filter(function(annotation) {
            return !Ox.isUndefined(annotation['in'])
                && !Ox.isUndefined(annotation.out)
                && annotation['in'] <= annotation.out
                && annotation.out <= options.duration
                && annotation.text;
        });
    }

    function updateFileInput() {
        $fileInput.options({
            label: $formatSelect.value().toUpperCase() + ' File'
        });
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
