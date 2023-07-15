var pandora = {
    format: getFormat(),
    hostname: document.location.hostname || 'pad.ma'
}

var pandoraURL = document.location.hostname ? "" : `https://${pandora.hostname}`
var cache = cache || {}

async function pandoraAPI(action, data) {
    var url = pandoraURL + '/api/'
    var key = JSON.stringify([action, data])
    if (!cache[key]) {
        var response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                action: action,
                data: data
            })
        })
        cache[key] = await response.json()
    }
    return cache[key]
}

