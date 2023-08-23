
async function loadData(id, args) {
    var data = window.data = {}
    data.id = id
    data.site = pandora.hostname

    var response = await pandoraAPI('get', {
        id: data.id.split('/')[0],
        keys: [
            "id",
            "title",
            "director",
            "source",
            "summary",
            "streams",
            "duration",
            "durations",
            "layers",
            "rightslevel",
            "videoRatio"
        ]
    })

    if (response.status.code != 200) {
        return {
            site: data.site,
            error: response.status
        }
    }
    data.item = response['data']
    if (data.item.rightslevel > pandora.site.capabilities.canPlayClips['guest']) {
        return {
            site: data.site,
            error: {
                code: 403,
                text: 'permission denied'
            }
        }
    }
    if (id.split('/').length == 1 || id.split('/')[1] == 'info') {
        data.view = 'info'
        data.title = data.item.title
        if (data.item.source) {
            data.byline = data.item.source
        } else {
            data.byline = data.item.director ? data.item.director.join(', ') : ''
        }
        data.link = `${pandora.proto}://${data.site}/${data.item.id}/info`
        let poster = pandora.site.user.ui.icons == 'posters' ? 'poster' : 'icon'
        data.icon = `${pandora.proto}://${data.site}/${data.item.id}/${poster}.jpg`
        return data
    }

    if (id.includes('-') || id.includes(',')) {
        var inout = id.split('/')[1].split(id.includes('-') ? '-' : ',').map(parseDuration)
        data.out = inout.pop()
        data['in'] = inout.pop()
    } else if (args.full) {
        data.out = data.item.duration
        data['in'] = 0
    } else {
        var annotation = await pandoraAPI('getAnnotation', {
            id: data.id,
        })
        if (annotation.status.code != 200) {
            return {
                site: data.site,
                error: annotation.status
            }
        }
        data.annotation = annotation['data']
        data['in'] = data.annotation['in']
        data.out = data.annotation['out']
    }

    data.layers = {}

    pandora.layerKeys.forEach(layer => {
        data.item.layers[layer].forEach(annot => {
            if (data.annotation) {
                if (annot.id == data.annotation.id) {
                    data.layers[layer] = data.layers[layer] || []
                    data["layers"][layer].push(annot)
                }
            } else if (annot['out'] > data['in'] && annot['in'] < data['out']) {
                if (args.users && !args.users.includes(annot.user)) {
                    return
                }
                if (args.layers && !args.layers.includes(layer)) {
                    return
                }
                data.layers[layer] = data.layers[layer] || []
                //annot['in'] = Math.max([annot['in'], data['in']])
                //annot['out'] = Math.min([annot['out'], data['out']])
                data["layers"][layer].push(annot)
            }
        })
    })
    data.videos = []
    data.item.durations.forEach((duration, idx) => {
        var oshash = data.item.streams[idx]
        var url = getVideoURL(data.item.id, 480, idx+1, '', oshash)
        data.videos.push({
            src: url,
            duration: duration
        })
    })
    var value = []
    Object.keys(data.layers).forEach(layer => {
        var html = []
        var layerData = getObjectById(pandora.site.layers, layer)
        html.push(`<h3>
            <span class="icon">${icon.down}</span>
            ${layerData.title}
        </h3>`)
        data.layers[layer].forEach(annotation => {
            if (pandora.url) {
                annotation.value = annotation.value.replace(
                    /src="\//g, `src="${pandora.url.origin}/`
                ).replace(
                    /href="\//g, `href="${pandora.url.origin}/`
                )
            }
            html.push(`
                <div class="annotation ${layerData.type}" data-in="${annotation.in}" data-out="${annotation.out}">
                    ${annotation.value}
                </div>
            `)
        })
        value.push('<div class="layer">' + html.join('\n') + '</div>')
    })
    data.value = value.join('\n')

    data.title = data.item.title
    if (data.item.source) {
        data.byline = data.item.source
    } else {
        data.byline = data.item.director ? data.item.director.join(', ') : ''
    }
    data.link = `${pandora.proto}://${data.site}/${data.item.id}/${data["in"]},${data.out}`
    data.poster = `${pandora.proto}://${data.site}/${data.item.id}/480p${data["in"]}.jpg`
    data.aspectratio = data.item.videoRatio
    if (data['in'] == data['out']) {
        data['out'] += 0.04
    }
    data.duration = data.out - data['in']
    return data
}

