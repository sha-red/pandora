// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.item = function() {

    var that = Ox.Element(),
        isVideoView = [
            'timeline', 'player', 'editor'
        ].indexOf(pandora.user.ui.itemView) > -1;

    pandora.api.get({
        id: pandora.user.ui.item,
        keys: isVideoView ? [
            'cuts', 'director', 'duration', 'layers',
            'parts', 'posterFrame', 'rendered', 'rightslevel',
            'size', 'title', 'videoRatio', 'year'
        ] : []
    }, pandora.user.ui.itemView == 'info' && pandora.site.capabilities.canEditMetadata[pandora.user.level] ? 0 : -1, function(result) {

        if (result.status.code == 200) {
            // we want to cache the title in any way, so that after closing
            // a dialog and getting to this item, the title is correct
            var documentTitle = pandora.getDocumentTitle(result.data.title);
            document.title = pandora.getPageTitle(document.location.pathname) || documentTitle;
        }

        /*if (result.status.code != 200) {
            pandora.$ui.contentPanel.replaceElement(1,
                Ox.Element()
                    .css({marginTop: '32px', fontSize: '12px', textAlign: 'center'})
                    .html(
                        'Sorry, we can\'t find the '
                        + pandora.site.itemName.singular.toLowerCase()
                        + ' you\'re looking for.'
                    )
            );
        }*/

        pandora.$ui.itemTitle
            .options({
                title: '<b>' + result.data.title
                    + (Ox.len(result.data.director)
                        ? ' (' + result.data.director.join(', ') + ')'
                        : '')
                    + (result.data.year ? ' ' + result.data.year : '') + '</b>'
            })
            .show();

        // fixme: layers have value, subtitles has text?
        isVideoView && Ox.extend(result.data, pandora.getVideoOptions(result.data));

        if (!result.data.rendered && [
            'clips', 'timeline', 'player', 'editor', 'map', 'calendar'
        ].indexOf(pandora.user.ui.itemView) > -1) {
            pandora.$ui.contentPanel.replaceElement(1,
                Ox.Element()
                    .css({marginTop: '32px', fontSize: '12px', textAlign: 'center'})
                    .html(
                        'Sorry, <i>' + result.data.title
                        + '</i> currently doesn\'t have a '
                        + pandora.user.ui.itemView + ' view.'
                    )
            );

        } else if (pandora.user.ui.itemView == 'info') {

            if (pandora.user.level == 'admin' && false) {
                var $form,
                    $edit = Ox.Element()
                    .append($form = Ox.FormElementGroup({
                        elements: Ox.map(pandora.site.sortKeys, function(key) {
                            return Ox.Input({
                                id: key.id,
                                label: key.title,
                                labelWidth: 100,
                                value: result.data[key.id],
                                type: 'text',
                                width: 500
                            });
                        }),
                        separators: [
                            {title: '', width: 0}
                        ]
                    }))
                    .append(Ox.Button({
                        title: 'Save',
                        type: 'text'
                    }).bindEvent({
                        click: function(data) {
                            // fixme: cleanup
                            var values = $form.value();
                            var changed = {};
                            Ox.map(pandora.site.itemKeys, function(key, i) {
                                if(values[i] && values[i] != ''+result.data[key.id]) {
                                    if(Ox.isArray(key.type) && key.type[0] == 'string') {
                                        changed[key.id] = values[i].split(', ');
                                    } else {
                                        changed[key.id] = values[i];
                                    }
                                }
                            });
                            if(changed) {
                                pandora.api.edit(Ox.extend(changed, {id: pandora.user.ui.item}), function(result) {
                                    //fixme just reload parts that need reloading
                                    window.location.reload();
                                });
                            }
                        }
                    }));
                pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.item = $edit);
            } else {
                pandora.$ui.contentPanel.replaceElement(1,
                    pandora.$ui.item = pandora.ui.infoView(result.data)
                        .bindEvent({
                            resize: function() {
                                pandora.$ui.item.resize();
                            }
                        })
                );
            }

        } else if (pandora.user.ui.itemView == 'clips') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.ui.clipsView(result.data.videoRatio)
            );

        } else if (pandora.user.ui.itemView == 'timeline') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.timeline = pandora.ui.timeline(result.data)
            );

        } else if (pandora.user.ui.itemView == 'player') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.player = pandora.ui.player(result.data)
            );

        } else if (pandora.user.ui.itemView == 'editor') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.editor = pandora.ui.editor(result.data)
            );

        } else if (pandora.user.ui.itemView == 'map') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.ui.navigationView('map', result.data.videoRatio)
            );

        } else if (pandora.user.ui.itemView == 'calendar') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.ui.navigationView('calendar', result.data.videoRatio)
            );

        } else if (pandora.user.ui.itemView == 'data') {

            var stats = Ox.Container();
            Ox.TreeList({
                data: result.data,
                width: pandora.$ui.mainPanel.size(1) - Ox.UI.SCROLLBAR_SIZE
            }).appendTo(stats);
            pandora.$ui.contentPanel.replaceElement(1, stats);

        } else if (pandora.user.ui.itemView == 'files') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.item = pandora.ui.filesView({
                    id: result.data.id
                })
            );

        } else if (pandora.user.ui.itemView == 'frames' || pandora.user.ui.itemView == 'posters') {

            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.item = pandora.ui.mediaView().bindEvent({
                    resize: function() {
                        pandora.$ui.item.resize();
                    }
                })
            );

        }

        if (isVideoView && result.data.rendered) {
            // handle links in annotations
            pandora.$ui[pandora.user.ui.itemView].bindEvent(
                'pandora_videopoints.' + pandora.user.ui.item.toLowerCase(),
                function(data) {
                    //Ox.print('DATA.VALUE', JSON.stringify(data.value));
                    var options = {};
                    if (data.value.annotation) {
                        options.selected = pandora.user.ui.item + '/' + data.value.annotation;
                    } else {
                        // if annotation got set to something other than '',
                        // points and position will be set in consequence,
                        // so lets try to keep events from looping
                        ['annotation', 'in', 'out', 'position'].forEach(function(key) {
                            if (!Ox.isUndefined(data.value[key])) {
                                options[key == 'annotation' ? 'selected' : key] = data.value[key];
                            }
                        });
                    }
                    pandora.$ui[pandora.user.ui.itemView].options(options);
                }
            );
        }

    });

    return that;

};

