
async function loadDocument(id, args) {
    var data = window.data = {}
    var parts = id.split('/')
    data.id = parts.shift()
    data.site = pandora.hostname

    if (parts.length == 2) {
        data.page = parts.shift()
    }

    if (parts.length == 1) {
        var rect = parts[0].split(',')
        if (rect.length == 1) {
            data.page = parts[0]
        } else {
            data.crop = rect
        }
    } else if (parts.length == 2) {

    }

    var response = await pandoraAPI('getDocument', {
        id: data.id,
        keys: [
            "id",
            "title",
            "extension",
            "text",
        ]
    })
    if (response.status.code != 200) {
        return {
            site: data.site,
            error: response.status
        }
    }
    data.document = response['data']
    data.title = data.document.name
    data.link = `${pandora.proto}://${data.site}/documents/${data.document.id}`
    return data
}

async function renderDocument(data) {
    if (data.error) {
        return renderError(data)
    }
    div = document.createElement('div')
    div.className = "content"
    if (!data.document) {
        div.innerHTML = `<div style="display: flex;height: 100vh; width:100%"><div style="margin: auto">document not found</div></div>`
    } else if (data.document.extension == "html") {
        div.innerHTML = `
            <h1 class="title">${data.document.title}</h1>
            <div class="text document" lang="en">
                ${data.document.text}
            </div>
            <div class="more">
                <a href="${data.link}">Open on ${data.site}</a>
            </div>
        `
        div.querySelectorAll('.text a').forEach(a => {
            a.addEventListener("click", clickLink)

        })
    } else if (data.document.extension == "pdf" && data.page && data.crop) {
        var img = `${pandora.proto}://${data.site}/documents/${data.document.id}/1024p${data.page},${data.crop.join(',')}.jpg`
        data.link = getLink(`documents/${data.document.id}/${data.page}`)
        div.innerHTML = `
            <h1 class="title">${data.document.title}</h1>
            <div class="text document" style="display: flex; width: 100%">
                <img src="${img}" style="margin: auto;max-width: 100%">
            </div>
            <div class="more">
                <a href="${data.link}">Open pdf page</a>
            </div>
        `
    } else if (data.document.extension == "pdf") {
        var page = data.page || 1,
            file = encodeURIComponent(`/documents/${data.document.id}/${safeDocumentName(data.document.title)}.pdf`)
        div.innerHTML = `
            <h1 class="title">${data.document.title}</h1>
            <div class="text document">
                <iframe src="${pandora.proto}://${data.site}/static/pdf.js/?file=${file}#page=${page}" frameborder="0" style="width: 100%; height: calc(100vh - 8px);"></iframe>
            </div>
            <div class="more">
                <a href="${data.link}">Open on ${data.site}</a>
            </div>
        `
    } else if (data.document.extension == "jpg" || data.document.extension == "png") {
        var img = `${pandora.proto}://${data.site}/documents/${data.document.id}/${safeDocumentName(data.document.title)}.${data.document.extension}`
        var open_text = `Open on ${data.site}`
        if (data.crop) {
            img = `${pandora.proto}://${data.site}/documents/${data.document.id}/1024p${data.crop.join(',')}.jpg`
            data.link = getLink(`documents/${data.document.id}`)
            open_text = `Open image`
        }
        div.innerHTML = `
            <h1 class="title">${data.document.title}</h1>
            <div class="text" style="display: flex; width: 100%">
                <img src="${img}" style="margin: auto;max-width: 100%">
            </div>
            <div class="more">
                <a href="${data.link}">${open_text}</a>
            </div>
        `

    } else {
        div.innerHTML = `unsupported document type`
    }
    document.querySelector(".content").replaceWith(div)
}
