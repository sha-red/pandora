pandora.ui.framesDialog = function(id) {

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
        keys: ['frames']
    }, function(result) {
        var frames = result.data.frames,
            selected = [frames.filter(function(frame) {
                return frame.selected;
            })[0]['position']],
            $list = Ox.IconList({
                    item: function(data, sort, size) {
                        console.log(data)
                        var ratio = data.width / data.height;
                        size = size || 128;
                        return {
                            height: ratio <= 1 ? size : size / ratio,
                            id: data['id'],
                            title: Ox.formatDuration(data['position'], 'short'),
                            info: '',
                            url: data.url,
                            width: ratio >= 1 ? size : size * ratio
                        };
                    },
                    items: frames,
                    keys: ['id', 'position', 'width', 'height', 'url'],
                    max: 1,
                    min: 1,
                    orientation: 'vertical',
                    selected: selected,
                    size: 128,
                    sort: [{key: 'position', operator: '+'}],
                    unique: 'id'
                })
                .css({background: 'rgb(16, 16, 16)'})
                .bindEvent({
                    select: function(event) {
                        var position = event.ids[0],
                            frame = frames.filter(function(frame) {
                                return frame.id == position;
                            })[0],
                            frameRatio = frame.width / frame.height,
                            frameWidth = frameRatio > previewRatio ? previewWidth : previewHeight * frameRatio,
                            frameHeight = frameRatio < previewRatio ? previewHeight : previewWidth / frameRatio;
                        $preview.html(
                            $('<img>')
                                .attr({
                                    src: frame.url
                                })
                                .css({
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    width: frameWidth + 'px',
                                    height: frameHeight + 'px',
                                    margin: 'auto'
                                })
                        );
                        pandora.api.setPosterFrame({
                            id: id,
                            position: position
                        });
                    }
                });

        $panel.replaceElement(0, $list);
    });

    return that;

};
