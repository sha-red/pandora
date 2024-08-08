

function parseURL() {
    var url = pandora.url ? pandora.url : document.location,
        fragment = url.hash.slice(1)
    if (!fragment && url.pathname.startsWith('/m/')) {
        var prefix = url.protocol + '//' + url.hostname + '/m/'
        fragment = url.href.slice(prefix.length)
    }
    var args = fragment.split('?')
    var id = args.shift()
    if (args) {
        args = args.join('?').split('&').map(arg => {
            var kv = arg.split('=')
            k = kv.shift()
            v = kv.join('=')
            if (['users', 'layers', 'show'].includes(k)) {
                v = v.split(',')
            }
            return [k, v]
        }).filter(kv => {
            return kv[0].length
        })
        if (args) {
            args = Object.fromEntries(args);
        } else {
            args = {}
        }
    } else {
        args = {}
    }
    var type = "item"
    if (id.startsWith('document')) {
        id = id.split('/')
        id.shift()
        id = id.join('/')
        type = "document"
    } else if (id.startsWith('edits/')) {
        var parts = id.split('/')
        parts.shift()
        id = parts.shift().replace(/_/g, ' ').replace(/%09/g, '_')
        type = "edit"
        if (parts.length >= 2) {
            args.sort = parts[1]
            if (args.sort[0] == '-') {
                args.sort = {
                    key: args.sort.slice(1),
                    operator: '-'
                }
            } else if (args.sort[0] == '+') {
                args.sort = {
                    key: args.sort.slice(1),
                    operator: '+'
                }
            } else {
                args.sort = {
                    key: args.sort,
                    operator: '+'
                }
            }
        }
        args.parts = parts
    } else {
        if (id.endsWith('/player') || id.endsWith('/editor')) {
            args.full = true
        }
        id = id.replace('/editor/', '/').replace('/player/', '/')
        type = "item"
    }
    return [type, id, args]
}

function render() {
    var type, id, args;
    [type, id, args] = parseURL()
    document.querySelector(".content").innerHTML = loadingScreen
    if (type == "document") {
        loadDocument(id, args).then(renderDocument)
    } else if (type == "edit") {
        loadEdit(id, args).then(renderItem)
    } else {
        loadData(id, args).then(renderItem)
    }

}
var loadingScreen = `
    <style>
        svg {
            width: 64px;
            height: 64px;
        }
    </style>
    <div style="margin: auto;width: 64px;height: 64px;">${icon.loading}</div>
`

document.querySelector(".content").innerHTML = loadingScreen
pandoraAPI("init").then(response => {
    pandora = {
        ...pandora,
        ...response.data
    }
    pandora.proto = pandora.site.site.https ? 'https' : 'http'
    pandora.resolution = Math.max.apply(null, pandora.site.video.resolutions)
    if (pandora.site.site.videoprefix.startsWith('//')) {
        pandora.site.site.videoprefix = pandora.proto + ':' + pandora.site.site.videoprefix
    }
    var layerKeys = []
    var subtitleLayer = pandora.site.layers.filter(layer => {return layer.isSubtitles})[0]
    if (subtitleLayer) {
        layerKeys.push(subtitleLayer.id)
    }
    pandora.subtitleLayer = subtitleLayer.id
    pandora.site.layers.map(layer => {
        return layer.id
    }).filter(layer => {
        return !subtitleLayer || layer != subtitleLayer.id
    }).forEach(layer => {
        layerKeys.push(layer)
    })
    pandora.layerKeys = layerKeys
    id = document.location.hash.slice(1)
    window.addEventListener("hashchange", event => {
        render()
    })
    window.addEventListener("popstate", event => {
        console.log("popsatte")
        render()
    })
    window.addEventListener('resize', event => {
    })
    render()
})
