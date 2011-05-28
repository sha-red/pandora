// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.annotations = function() {
    var that = new Ox.Element({
            id: 'annotations'
        })
        .bindEvent({
            resize: function(event, data) {
                app.user.ui.annotationsSize = data;
            },
            resizeend: function(event, data) {
                pandora.UI.set({annotationsSize: data});
            },
            toggle: function(event, data) {
                pandora.UI.set({showAnnotations: !data.collapsed});
            }
        }),
        $bins = [];
    $.each(app.site.layers, function(i, layer) {
        var $bin = new Ox.CollapsePanel({
            id: layer.id,
            size: 16,
            title: layer.title
        });
        $bins.push($bin);
        $bin.$content.append(
            $('<div>').css({ height: '20px' }).append(
                $('<div>').css({ float: 'left', width: '16px', height: '16px', margin: '1px'}).append(
                    $('<img>').attr({ src: Ox.UI.getImagePath('iconFind.svg') }).css({ width: '16px', height: '16px', border: 0, background: 'rgb(64, 64, 64)', WebkitBorderRadius: '2px' })
                )
            ).append(
                $('<div>').css({ float: 'left', width: '122px', height: '14px', margin: '2px' }).html('Foo')
            ).append(
                $('<div>').css({ float: 'left', width: '40px', height: '14px', margin: '2px', textAlign: 'right' }).html('23')
            )
        );
    });
    $.each($bins, function(i, bin) {
        that.append(bin);
    });
    return that;
};



