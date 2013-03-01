'use strict';

pandora.ui.textPanel = function() {

    var that = Ox.SplitPanel({
            elements: [
                {element: Ox.Element(), size: 24},
                {element: Ox.Element()},
                {element: Ox.Element(), size: 16}
            ],
            orientation: 'vertical'
        }),
        embedURLs,
        selected = -1,
        selectedURL;

    pandora.api.getText({id: pandora.user.ui.text}, function(result) {

        var text = result.data;
        embedURLs = text.type == 'html'
            ? getEmbedURLs(text.text)
            : [];

        var $toolbar = Ox.Bar({size: 24}),

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
                    disabled: embedURLs.length < 2,
                    title: 'arrowRight',
                    tooltip: 'Next Clip',
                    type: 'image'
                })
                .css({
                    float: 'right',
                    margin: '4px 2px 4px 2px'
                })
                .bindEvent({
                    click: function() {
                        that.selectEmbed(
                            selected < embedURLs.length - 1 ? selected + 1 : 0
                        );
                    }
                })
                .appendTo($toolbar),

            $currentButton = Ox.Button({
                    disabled: embedURLs.length < 1,
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
                    disabled: embedURLs.length < 2,
                    title: 'arrowLeft',
                    tooltip: 'Previous Clip',
                    type: 'image'
                })
                .css({
                    float: 'right',
                    margin: '4px 2px 4px 2px'
                })
                .bindEvent({
                    click: function() {
                        that.selectEmbed(
                            selected ? selected - 1 : embedURLs.length - 1
                        );
                    }
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
                        //fixme: at some point pdf will also have a sidebar
                        size: text.type == 'html' ? pandora.user.ui.embedSize : 0,
                        resizable: text.type == 'html',
                        resize: [192, 256, 320, 384, 448, 512]
                    }
                ],
                orientation: 'horizontal'
            });

        if (text.editable) {
            if (text.type == 'html') {
                $editMenu = Ox.MenuButton({
                        items: [
                            {id: 'insertHTML', title: 'Insert HTML...'},
                            {id: 'insertEmbed', title: 'Insert Embed...'}
                        ],
                        title: 'edit',
                        tooltip: 'Editing Options',
                        type: 'image'
                    })
                    .css({
                        float: 'left',
                        margin: '4px 2px 4px 4px'
                    })
                    .bindEvent({
                        click: function(data) {
                            if (data.id == 'insertEmbed') {
                                pandora.$ui.insertEmbedDialog = pandora.ui.insertEmbedDialog(function() {
                                    // ...
                                }).open();
                            }
                        }
                    })
                    .appendTo($toolbar);
            } else {
                $uploadButton = Ox.FileButton({
                        image: 'upload',
                        tooltip: 'Upload PDF',
                        type: 'image'
                    })
                    .css({
                        float: 'left',
                        margin: '4px 2px 4px 4px'
                    })
                    .bindEvent({
                        click: function(data) {
                            if(data.files.length) {
                                pandora.$ui.uploadPDFDialog = pandora.ui.uploadPDFDialog({
                                    file: data.files[0],
                                    id: pandora.user.ui.text
                                }).open();
                            }
                        }
                    })
                    .appendTo($toolbar);
            }
        }

        that.replaceElement(0, $toolbar);
        that.replaceElement(1, $panel);
        that.replaceElement(2, $statusbar);

        embedURLs.length && that.selectEmbed(0);

    });

    function getEmbedURLs(text) {
        var matches = text.match(/<a [^<>]*?href="(.+?)".*?>/gi),
            urls = [];
        if (matches) {
            matches.forEach(function(match) {
                var url = match.match(/"(.+?)"/)[1];
                if (pandora.isEmbedURL(url)) {
                    urls.push(url);
                }
            });
        }
        return urls;
    }

    that.selectEmbed = function(index) {
        if (index != selected) {
            selected = index;
            selectedURL = embedURLs[selected]
            $('.OxSpecialLink').removeClass('OxActive');
            selected > -1 && $('#embed' + selected).addClass('OxActive');
            pandora.$ui.textEmbed.update(selectedURL);
        }
    };

    that.update = function(text) {
        embedURLs = getEmbedURLs(text);
        selected = embedURLs.indexOf(selectedURL);
        if (selected == -1 && embedURLs.length) {
            selected = 0;
        }
        that.selectEmbed(selected);
    };

    return that;

};

pandora.ui.textHTML = function(text) {

    var height = getHeight(),
        width = getWidth(),

        that = Ox.Element()
            .css({
                'overflow-y': 'auto'
            }),
        $content = Ox.Element().css({
                margin: '16px',
        }).appendTo(that),

        $title = Ox.Editable({
                editable: text.editable,
                height: 32,
                placeholder: text.editable ? 'Doubleclick to edit title' : 'Untitled',
                tooltip: text.editable ? pandora.getEditTooltip('title') : '',
                value: text.name,
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
                        id: pandora.user.ui.text,
                        name: data.value
                    }, function(result) {
                        Ox.print('RESULT.DATA:', result.data);
                    });
                }
            })
            .appendTo($content),

        $spaceTop = Ox.Element()
            .css({height: '16px'})
            .appendTo($content),

        $text = Ox.Editable({
                clickLink: pandora.clickLink,
                editable: text.editable,
                format: function(text) {
                    var index = 0;
                    return text.replace(
                        /<a [^<>]*?href="(.+?)".*?>/gi,
                        function() {
                            var link = arguments[0], ret, url = arguments[1];
                            if (pandora.isEmbedURL(url)) {
                                ret = '<a id="embed' + index
                                    + '" class="OxSpecialLink" href="' + url
                                    + '">'
                                index++;
                            } else {
                                ret = link;
                            }
                            return ret;
                        }
                    );
                },
                maxHeight: height - 1,
                placeholder: text.editable ? 'Doubleclick to edit text' : '',
                tooltip: text.editable ? pandora.getEditTooltip('text') : '',
                type: 'textarea',
                width: width,
                value: text.text
            })
            .css({
                //position: 'absolute',
                //height: height + 'px',
                width: width + 'px',
                //marginTop: '48px',
                fontSize: '12px'
            })
            .bindEvent({
                submit: function(data) {
                    Ox.print('SUBMIT', data.value);
                    Ox.Request.clearCache('getText');
                    pandora.api.editText({
                        id: pandora.user.ui.text,
                        text: data.value
                    });
                    pandora.$ui.textPanel.update(data.value);
                }
            })
            .appendTo($content);

    function getHeight() {
        // 24 menu + 24 toolbar + 16 statusbar + 32 title + 32 margins
        // + 1px to ge trid of scrollbar
        return window.innerHeight - 128 -1;
    }

    function getWidth() {
        return window.innerWidth
            - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 1
            - pandora.user.ui.embedSize - 1
            - 32;
    }

    that.update = function() {
        $text.options({
            maxHeight: getHeight(),
            width: getWidth()
        });
        return that;
    };

    return that;

};

pandora.ui.textPDF = function(text) {

    var that = Ox.Element(),
        $iframe;
    if (text.uploaded) {
        $iframe = Ox.Element('<iframe>')
            .attr({
                frameborder: 0,
                height: '100%',
                src: '/texts/' + pandora.user.ui.text + '/text.pdf.html',
                width: '100%'
            })
            .onMessage(function(event, data) {
                if(event == 'edit') {
                    console.log('existing url?', data);
                    pandora.ui.insertEmbedDialog(data.src, function(url) {
                        data.src = url;
                        var embed = text.embeds.filter(function(embed) {
                            return embed.id == data.id
                                && embed.type == data.type
                                && embed.page == data.page;
                        })[0];
                        if(embed) {
                            embed.src = url;

                        } else {
                            text.embeds.push(data);
                            //fixme sort embeds by page/id
                        }
                        console.log('saving', text.embeds);
                        pandora.api.editText({
                            id: text.id,
                            embeds: text.embeds
                        }, function(result) {
                            $iframe.postMessage('update', data);
                        });
                    }).open();
                }
            })
            .appendTo(that);
    } else {
        that.html('UPLOADED: ' + text.uploaded);
    }
    return that;

};

pandora.ui.textEmbed = function() {

    var that = Ox.Element()
            .bindEvent({
                resizestart: function() {
                    $iframe.attr('src') && $overlay.show();
                },
                resize: function(data) {
                    pandora.user.ui.embedSize = data.size;
                    pandora.$ui.text.update();
                },
                resizeend: function() {
                    $iframe.attr('src') && $overlay.hide();
                }
            }),

        $message = $('<div>')
            .css({marginTop: '16px', textAlign: 'center'})
            .html('No Embeds')
            .hide()
            .appendTo(that),

        $iframe = Ox.Element('<iframe>')
            .attr({
                height: '100%',
                id: 'embed',
                frameborder: 0,
                src: '',
                width: '100%',
                allowFullScreen: true,
                mozallowfullscreen: true,
                webkitAllowFullScreen: true
            })
            .hide()
            .appendTo(that),

        $overlay = $('<div>')
            .css({
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0
            })
            .hide()
            .appendTo(that);

    that.update = function(url) {
        var parsed, src;
        if (url) {
            url = url.replace(/&amp;/g, '&') + '&matchRatio=true';
            src = $iframe.attr('src');
            parsed = {src: Ox.parseURL(src), url: Ox.parseURL(url)};
            if (
                src
                && parsed.url.protocol == parsed.src.protocol
                && parsed.url.hostname == parsed.src.hostname
            ) {
                $iframe.postMessage('seturl', {
                    url: parsed.url.pathname + parsed.url.search + parsed.url.hash
                });
            } else {
                $iframe.attr({src: url});                
            }
            $message.hide();
            $iframe.show();
        } else {
            $iframe.hide();
            $message.show();
        }
        return that;
    };

    return that;

};
