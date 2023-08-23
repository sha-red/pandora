
function renderItemInfo(data) {
    div = document.createElement('div')
    div.className = "content"
    div.innerHTML = `
        <h1 class="item-title">${item.title}</h1>
        <h2 class="title">${data.title}</h2>
        <div class="byline">${data.byline}</div>
        <figure>
            <img src="${data.icon}">
        </figure>
        <div class="more">
            <a href="${data.link}">Open on ${data.site}</a>
        </div>
    `
    if (!item.title) {
        div.querySelector('item-title').remove()
    }
    document.querySelector(".content").replaceWith(div)
}

function renderItem(data) {
    window.item = window.item || {}
    if (data.error) {
        return renderError(data)
    }
    if (data.view == "info") {
        return renderItemInfo(data)
    }
    div = document.createElement('div')
    div.className = "content"
    div.innerHTML = `
        <h1 class="item-title">${item.title}</h1>
        <h2 class="title">${data.title}</h2>
        <div class="byline">${data.byline}</div>
        <div class="player">
            <div class="video"></div>
        </div>
        <div class="value">
            ${data.value}
            <div class="comments"></div>
        </div>
        <div class="more">
            <a href="${data.link}">Open on ${data.site}</a>
        </div>
    `
    if (!item.title) {
        div.querySelector('.item-title').remove()
    }

    var comments = div.querySelector('.comments')
    if (window.renderComments) {
        renderComments(comments, data)
    } else {
        comments.remove()
    }

    div.querySelectorAll('.layer a').forEach(a => {
        a.addEventListener("click", clickLink)
    })

    div.querySelectorAll('.layer').forEach(layer => {
        layer.querySelector('h3').addEventListener("click", event => {
            var img = layer.querySelector('h3 .icon')
            if (layer.classList.contains("collapsed")) {
                layer.classList.remove("collapsed")
                img.innerHTML = icon.down
            } else {
                layer.classList.add("collapsed")
                img.innerHTML = icon.right
            }
        })
    })

    var video = window.video = VideoPlayer({
        items: data.videos,
        poster: data.poster,
        position: data["in"] || 0,
        duration: data.duration,
        aspectratio: data.aspectratio
    })
    div.querySelector('.video').replaceWith(video)
    video.classList.add('video')

    video.addEventListener("loadedmetadata", event => {
        //
    })
    video.addEventListener("timeupdate", event => {
        var currentTime = video.currentTime()
        if (currentTime >= data['out']) {
            if (!video.paused) {
                video.pause()
            }
            video.currentTime(data['in'])
        }
        div.querySelectorAll('.annotation').forEach(annot => {
            var now = currentTime
            var start = parseFloat(annot.dataset.in)
            var end = parseFloat(annot.dataset.out)
            if (now >= start && now <= end) {
                annot.classList.add("active")
                annot.parentElement.classList.add('active')
            } else {
                annot.classList.remove("active")
                if (!annot.parentElement.querySelector('.active')) {
                    annot.parentElement.classList.remove('active')
                }
            }
        })

    })
    if (item.next || item.previous) {
        var nav = document.createElement('nav')
        nav.classList.add('items')
        if (item.previous) {
            var a = document.createElement('a')
            a.href = item.previous
            a.innerText = '<< previous'
            nav.appendChild(a)
        }
        if (item.previous && item.next) {
            var e = document.createElement('span')
            e.innerText = ' | '
            nav.appendChild(e)
        }
        if (item.next) {
            var a = document.createElement('a')
            a.href = item.next
            a.innerText = 'next >>'
            nav.appendChild(a)
        }
        div.appendChild(nav)
    }
    document.querySelector(".content").replaceWith(div)
}

function renderError(data) {
    var link = '/' + document.location.hash.slice(1)
    div = document.createElement('div')
    div.className = "content"
    div.innerHTML = `
        <style>
            svg {
                width: 32px;
                height: 32px;
            }
        </style>
        <div style="margin: auto">
            Page not found<br>
            <a href="${link}">Open on ${data.site}</a>
        </div>
    `
    document.querySelector(".content").replaceWith(div)
}
