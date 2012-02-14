// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.importSubtitles = function(data) {
    var content = Ox.Element().css({margin: '16px'}),
        file,
        height = 240,
        width = 640,
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'close',
                    title: 'Close'
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: content,
            keys: {
                'escape': 'close'
            },
            maximizeButton: true,
            height: height,
            removeOnClose: true,
            width: width,
            title: 'Import Subtitles',
        })
        .bindEvent({
            close: function(data) {
            }
        });
    Ox.Select({
            items: Ox.merge([{id: '', title: 'Select Layer'}], pandora.site.layers),
            value: '',
        })
        .bindEvent({
            change: function(data) {
                var layer = data.value;
                $('<input>')
                    .attr({
                        type: 'file'
                    })
                    .css({
                        padding: '8px'
                    })
                    .bind({
                        change: function(event) {
                            file = this.files[0];
                            var reader = new FileReader();
                            reader.onloadend = function(event) {
                                var srt = Ox.parseSRT(this.result),
                                    total = srt.length;
                                function addAnnotation() {
                                    if(srt.length>0) {
                                        var data = srt.shift();
                                        data.text = Ox.parseHTML(data.text);
                                        content.html('Importing '+total+' <b>'+ layer +'</b>: <br>\n'
                                            + Ox.formatDuration(data['in'])
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
                                        content.html('Done');
                                        Ox.Request.clearCache(pandora.user.ui.item);
                                        pandora.$ui.contentPanel.replaceElement(
                                            1, pandora.$ui.item = pandora.ui.item()
                                        );
                                    }
                                }
                                addAnnotation();
                            };
                            reader.readAsText(file);
                        }
                    })
                    .appendTo(content);
            }
        })
        .appendTo(content);
    return that;
};
