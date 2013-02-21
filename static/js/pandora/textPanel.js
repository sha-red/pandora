'use strict';

pandora.ui.textPanel = function() {

    var tags = [
            'b', 'code', 'em', 'i', 's', 'span', 'strong', 'sub', 'sup', 'u',
            'blockquote', 'div', 'h1', 'h2', 'h3', 'p', 'pre',
            'li', 'ol', 'ul',
            'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr',
            'a', 'br', 'img',
            'rtl'
        ],

        that = Ox.Element();

    pandora.api.getText({id: pandora.user.ui.text}, function(result) {

        var text = result.data,

            $toolbar = Ox.Bar({size 24}), 

            $editMenu, $uploadButton,

            $find = Ox.Input({
                    clear: true,
                    placeholder: 'Find in Texts',
                    value: pandora.user.ui.textFind,
                    width: 188
                })
                .css({
                    float: 'right',
                    margin: '4px 4px 4px 2px'
                })
                .bindEvent({
                    submit: function(data) {
                        Ox.print('SUBMIT', data);
                    }
                })
                .appendTo($toolbar),

            $nextButton = Ox.Button({
                    title: 'arrowRight',
                    tooltip: 'Next Clip',
                    type: 'image'
                })
                .css({
                    float: 'right',
                    margin: '4px 2px 4px 2px'
                })
                .appendTo($toolbar),

            $currentButton = Ox.Button({
                    title: 'center',
                    tooltip: 'Current Reference',
                    type: 'image'
                })
                .css({
                    float: 'right',
                    margin: '4px 2px 4px 2px'
                })
                .appendTo($toolbar),

            $previousButton = Ox.Button({
                    title: 'arrowLeft',
                    tooltip: 'Previous Clip',
                    type: 'image'
                })
                .css({
                    float: 'right',
                    margin: '4px 2px 4px 2px'
                })
                .appendTo($toolbar),

            $statusbar = Ox.Bar({size: 16}),

            $panel = Ox.SplitPanel({
                elements: [
                    {
                        element: pandora.$ui.text = text.type == 'html'
                            ? pandora.ui.textHTML(text)
                            : pandora.ui.textPDF(text)
                    },
                    {
                        element: pandora.$ui.textEmbed = pandora.ui.textEmbed(),
                        size: pandora.user.ui.embedSize,
                        resizable: true,
                        resize: [192, 256, 320, 384, 448, 512]
                    }
                ],
                orientation: 'horizontal'
            });

        if (text.type == 'html') {
            $editMenu = Ox.MenuButton({
                    items: [
                        {id: 'inserthtml', title: 'Insert HTML...'},
                        {id: 'insertembed', title: 'Insert Embed...'}
                    ],
                    title: 'edit',
                    tooltip: 'Editing Options',
                    type: 'image'
                })
                .css({
                    float: 'left',
                    margin: '4px 2px 4px 4px'
                })
                .appendTo($toolbar);
        } else {
            $uploadButton = Ox.Button({
                    title: 'upload',
                    tooltip: 'Upload PDF',
                    type: 'image'
                })
                .css({
                    float: 'left',
                    margin: '4px 2px 4px 4px'
                })
                .appendTo($toolbar),
        }

        that.setElement(
            Ox.SplitPanel({
                elements: [
                    {element: $toolbar, size: 24},
                    {element: $panel},
                    {element: $statusbar, size: 16}
                ],
                orientation: 'vertical'
            })
        );

    });

    function getEmbeds(text) {
        
    }

    return that;

};

pandora.ui.textHTML = function(text, tags) {

    var height = getHeight(),
        width = getWidth(),

        that = Ox.Element()
            .css({margin: '16px'}),

        $title = Ox.Editable({
                height: 32,
                placeholder: text.editable ? 'Doubleclick to edit title' : 'Untitled',
                tooltip: text.editable ? 'Doubleclick to edit title' : '',
                width: width
            })
            .css({
                //position: 'absolute',
                //width: width + 'px',
                height: '32px',
                fontSize: '18px',
            })
            .bindEvent({
                submit: function(data) {
                    Ox.Request.clearCache('getText');
                    pandora.api.editText({
                        id: ui.text,
                        name: data.value
                    }, function(result) {
                        // ...
                    });
                }
            })
            .appendTo(that),

        $spaceTop = Ox.Element()
            .css({height: '16px'})
            .appendTo(that),

        $text = Ox.Editable({
                clickLink: pandora.clickLink,
                editable: text.editable,
                height: height,
                maxHeight: Infinity,
                placeholder: text.editable ? 'Doubleclick to edit text' : '',
                replaceTags: {
                    span: [
                        [
                            /<span [^<>]*?data-video="(.+?)".*?>/gi,
                            function(match) {
                                var url = Ox.parseURL(arguments[1]),
                                    query = Ox.unserialize(url.search);
                                    str = url.origin + url.pathname;
                                return 'foo';
                            }
                        ],
                        [
                            /<\/span>/gi,
                            '</span>'
                        ]
                    ]
                },
                tags: tags,
                tooltip: text.editable ? 'Doubleclick to edit text' : '',
                type: 'textarea',
                width: width
            })
            .css({
                //position: 'absolute',
                height: height + 'px',
                width: width + 'px',
                //marginTop: '48px',
                fontSize: '12px'
            })
            .bindEvent({
                submit: function(data) {
                    Ox.Request.clearCache('getText');
                    pandora.api.editText({
                        id: ui.text,
                        text: data.value
                    });
                }
            })
            .appendTo(that);

    function getHeight() {
        // 24 menu + 24 toolbar + 16 statusbar + 32 title + 32 margins
        return window.innerHeight - 128;
    }

    function getWidth() {
        return window.innerWidth - pandora.user.ui.embedSize - 1 - 32;
    }

    that.update = function() {
        $text.options({
            height: getHeight(),
            width: getWidth()
        });
        return that;
    };

};

pandora.ui.textPDF = function(text) {

    var that = Ox.Element();

    that.html('UPLOADED: ' + text.uploaded);

    return that;

};

pandora.ui.textEmbed = function(url) {

    var that = Ox.Element()
            .bindEvent({
                resizestart: function() {
                    $overlay.show();
                },
                resize: function(data) {
                    pandora.user.ui.embedSize = data.size;
                    pandora.$ui.text.updateSize();
                },
                resizeend: function() {
                    $overlay.hide();
                }
            }),

        $iframe = $('<iframe>')
            .attr({
                height: '100%',
                frameborder: 0,
                src: url,
                width: '100%'
            })
            .appendTo($element),

        $overlay = $('<div>')
            .css({
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0
            })
            .hide()
            .appendTo($element);

    that.update = function(url) {
        $iframe.attr({src: url});
        return that;
    };

    return that;

};