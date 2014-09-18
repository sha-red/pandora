// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.importAnnotationsDialog = function(duration) {

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
                        click: addAnnotations
                    })
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

    updateLanguageSelect();

    function addAnnotations() {

        var annotations = [],
            language = $languageSelect.value(),
            layer = $layerSelect.value(),
            file = $fileInput.value()[0],
            reader = new FileReader();

        disableButtons();

        reader.onloadend = function(e) {
            if (this.result) {
                annotations = parseSRT(this.result);
            }
            if (annotations.length) {
                setStatus(Ox._(
                    'Importing {0} annotation'
                    + (annotations.length == 1 ? '' : 's') + '...',
                    [annotations.length]
                ));
                annotations = annotations.map(function(annotation) {
                    var value = Ox.sanitizeHTML(annotation.text)
                        .replace(/<br[ /]*?>\n/g, '\n')
                        .replace(/\n\n/g, '<br>\n')
                        .replace(/\n/g, '<br>\n');
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
                                setStatus(Ox._('Import succeeded.'));
                                Ox.Request.clearCache(pandora.user.ui.item);
                                pandora.$ui.contentPanel.replaceElement(
                                    1, pandora.$ui.item = pandora.ui.item()
                                );
                            } else {
                                setStatus(Ox._('Import failed.'));
                            }
                            enableButtons();
                        });
                    } else {
                        setStatus(Ox._('Import failed.'));
                        enableButtons();
                    }
                });
            } else {
                setStatus(Ox._('No valid annotations found.'));
                enableButtons();
            }
        };

        setTimeout(function() {
            reader.readAsText(file);
        }, 250);

    }

    function disableButtons() {
        that.disableButtons();
        that.disableCloseButton();
    }

    function enableButtons() {
        that.enableButtons();
        that.enableCloseButton();
    }

    function parseSRT(srt) {
        return Ox.parseSRT(srt).filter(function(annotation) {
            return !Ox.isUndefined(annotation['in'])
                && !Ox.isUndefined(annotation.out)
                && annotation['in'] <= annotation.out
                && annotation.out <= duration
                && annotation.text;
        });
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
