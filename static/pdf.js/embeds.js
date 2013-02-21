window.addEventListener('message', function(event) {
    if (event.origin != 'null' && event.data) {
        var data = JSON.parse(event.data);
        if (data.event == 'close') {
            var element = document.getElementById(data.id);
            Array.prototype.forEach.call(element.parentElement.getElementsByClassName('button'), function(element) {
                if (editable || element.className == 'button playButton') {
                    element.style.display = 'block';
                }
            });
            e.parentElement.removeChild(e);
        }
    }
});

function getEmbedURL(id, videoURL) {
    var parsed = Ox.parseURL(videoURL),
        parts = parsed.pathname.split('/'),
        item = parts[1],
        points = parts[parts.length - 1].split(','),
        outPoint = points.pop(),
        inPoint = points.pop();
    return parsed.protocol + '//' + parsed.host + '/' + item + '/embed?view=player&id=' + id
        + '&in=' + inPoint + '&out=' + outPoint
        + '&paused=false&showCloseButton=true';
}
function getVideoOverlay(page) {
    var links = embeds.filter(function(embed) {
        return embed.page == page && embed.type =='inline';
    });
    return (editable || links.length) ? {
        beginLayout: function() {
            this.counter = 0;
        },
        endLayout: function() {
        },
        appendImage: function(image) {
            var id = ++this.counter,
                video = links.filter(function(embed) {
                    return embed.id == id;
                })[0],
                $interface, $playButton, $editButton;
            if (editable || video) {
                $interface = Ox.$('<div>')
                    .addClass('interface')
                    .css({
                        left: image.left + 'px',
                        top: image.top + 'px',
                        width: image.width + 'px',
                        height: image.height + 'px'
                    });
                $playButton = Ox.$('<img>')
                    .addClass('button playButton')
                    .attr({
                        src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cG9seWdvbiBwb2ludHM9IjU2LDMyIDI0OCwxMjggNTYsMjI0IiBmaWxsPSIjRkZGRkZGIi8+PC9zdmc+PCEtLXsiY29sb3IiOiJ2aWRlbyIsIm5hbWUiOiJzeW1ib2xQbGF5IiwidGhlbWUiOiJveGRhcmsifS0tPg=='
                    })
                    .hide()
                    .appendTo($interface);
                $editButton = Ox.$('<img>')
                    .addClass('button editButton')
                    .attr({
                        src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cG9seWdvbiBwb2ludHM9IjMyLDIyNCA2NCwxNjAgOTYsMTkyIiBmaWxsPSIjRkZGRkZGIi8+PGxpbmUgeDE9Ijg4IiB5MT0iMTY4IiB4Mj0iMTg0IiB5Mj0iNzIiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSI0OCIvPjxsaW5lIHgxPSIxOTIiIHkxPSI2NCIgeDI9IjIwOCIgeTI9IjQ4IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iNDgiLz48bGluZSB4MT0iMTEyIiB5MT0iMjIwIiB4Mj0iMjI0IiB5Mj0iMjIwIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iOCIvPjxsaW5lIHgxPSIxMjgiIHkxPSIyMDQiIHgyPSIyMjQiIHkyPSIyMDQiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSI4Ii8+PGxpbmUgeDE9IjE0NCIgeTE9IjE4OCIgeDI9IjIyNCIgeTI9IjE4OCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjgiLz48L3N2Zz4=',
                        title: 'Click to add video'
                    })
                    .on({click: edit})
                    .hide()
                    .appendTo($interface);
                if (editable) {
                    $editButton.show();
                }
                if (video) {
                    enableVideoUI();
                }
                this.div.appendChild($interface[0]);
            }
            function play(e) {
                e.preventDefault();
                e.stopPropagation();
                var videoId = 'video' + page + id,
                    $iframe = Ox.$('<iframe>')
                        .attr({
                            id: videoId,
                            src: getEmbedURL(videoId, video.src),
                            width: '100%',
                            height: '100%',
                            frameborder: 0
                        })
                        .appendTo($interface);
                $playButton.hide();
                $editButton.hide();
                return false;
            }
            function edit(e) {
                var url;
                e.preventDefault();
                e.stopPropagation();
                
                url = prompt(
                    'Please enter a pan.do/ra video URL, like\n'
                    + 'https://0xdb.org/0315594/00:13:37,00:23:42 or\n'
                    + 'http://pad.ma/A/editor/00:00:00,00:01:00,00:02:00'
                    + (video ? '\n\nTo remove the video, just remove the URL.' : ''),
                    video ? video.src : ''
                );
                if (url !== null) {
                    if(!video) {
                        video = {
                            page: page,
                            id: id,
                            src: ''
                        };
                        embeds.push(video);
                    }
                    video.src = url
                    saveVideoOverlay();
                    url !== '' ? enableVideoUI() : disableVideoUI()
                }
                return false;
            }
            function enableVideoUI() {
                $interface
                    .addClass('video')
                    .attr({title: 'Click to play video'})
                    .on({click: play});
                $playButton.show();
                $editButton.attr({title: 'Click to edit or remove video'});
            }
            function disableVideoUI() {
                $interface
                    .removeClass('video')
                    .attr({title: ''})
                    .off({click: play});
                $playButton.hide();
                $editButton.attr({title: 'Click to add video'});
            }
        }
    } : null;
}

function saveVideoOverlay() {
    console.log('save not implemented, bubble to pan.do/ra?');
}
