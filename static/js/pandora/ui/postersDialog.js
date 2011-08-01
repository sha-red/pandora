pandora.ui.postersDialog = function(id) {

    var height = Math.round(window.innerHeight * 0.9),
        width = Math.round(window.innerWidth * 0.5),
        listWidth = 144 + Ox.UI.SCROLLBAR_SIZE,
        previewWidth = width - listWidth,
        previewHeight = height - 48,
        previewRatio = previewWidth / previewHeight,
        $preview = Ox.Element(),
        $panel = Ox.SplitPanel({
            elements: [
                {
                    element: Ox.Element(),
                    size: listWidth
                },
                {
                    element: $preview
                }
            ],
            orientation: 'horizontal'
        }),
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'done',
                    title: 'Done'
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            content: $panel,
            height: height,
            padding: 0,
            title: 'Manage Posters',
            width: width
        });

    pandora.api.get({
        id: id,
        keys: ['posters']
    }, function(result) {
        var posters = result.data.posters,
            selected = [posters.filter(function(poster) {
                return poster.selected;
            })[0]['source']],
            $list = Ox.IconList({
                    item: function(data, sort, size) {
                        var ratio = data.width / data.height;
                        size = size || 128;
                        return {
                            height: ratio <= 1 ? size : size / ratio,
                            id: data['id'],
                            info: data.width + ' x ' + data.height + ' px',
                            title: data.source,
                            url: data.url,
                            width: ratio >= 1 ? size : size * ratio
                        }
                    },
                    items: posters,
                    keys: ['precedence', 'source', 'width', 'height', 'url'],
                    max: 1,
                    min: 1,
                    orientation: 'vertical',
                    selected: selected,
                    size: 128,
                    sort: [{key: 'precedence', operator: '+'}],
                    unique: 'source'
                })
                .css({background: 'rgb(16, 16, 16)'})
                .bindEvent({
                    select: function(event) {
                        var source = event.ids[0],
                            poster = posters.filter(function(poster) {
                                return poster.source == source;
                            })[0],
                            posterRatio = poster.width / poster.height,
                            posterWidth = posterRatio > previewRatio ? previewWidth : previewHeight * posterRatio,
                            posterHeight = posterRatio < previewRatio ? previewHeight : previewWidth / posterRatio;
                        $preview.html(
                            $('<img>')
                                .attr({
                                    src: poster.url
                                })
                                .css({
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    width: posterWidth + 'px',
                                    height: posterHeight + 'px',
                                    margin: 'auto'
                                })
                        );
                        pandora.api.setPoster({
                            id: id,
                            source: source
                        });
                    }
                });

        $panel.replaceElement(0, $list);
    });

    return that;

}
