var cropInactive = true
var info = {}
var cache = {}
var documentId
var baseUrl = document.location.protocol + '//' + document.location.host

var div = document.createElement("div")
div.innerHTML = `
<button id="cropFile" class="toolbarButton cropFile hiddenLargeView" title="Crop" tabindex="30" data-l10n-id="crop_file">
    <span data-l10n-id="crop_file_label">Crop</span>
</button>
`
var cropFile = div.querySelector("#cropFile")

document.querySelector('#toolbarViewerRight').insertBefore(cropFile, document.querySelector('#toolbarViewerRight').firstChild)

async function archiveAPI(action, data) {
    var url = baseUrl + '/api/'
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

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function renderCropOverlay(root, documentId, page) {
    var canvas = document.createElement('canvas')
    root.appendChild(canvas)
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    var ctx = canvas.getContext('2d');
    var viewerContainer = document.querySelector('#viewerContainer')
    var bounds = root.getBoundingClientRect();
    var base = 2048
    var scale = Math.max(bounds.height, bounds.width) / base
    var last_mousex = last_mousey = 0;
    var mousex = mousey = 0;
    var mousedown = false;
    var p = {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    }

    canvas.addEventListener('mousedown', function(e) {
        let bounds = root.getBoundingClientRect();
        last_mousex = e.clientX - bounds.left;
        last_mousey = e.clientY - bounds.top;
        p.top = parseInt(last_mousey / scale)
        p.left = parseInt(last_mousex / scale)
        mousedown = true;
    });

    document.addEventListener('mouseup', function(e) {
        if (mousedown) {
            mousedown = false;
            p.bottom = parseInt(mousey / scale)
            p.right = parseInt(mousex / scale)

            if (p.top > p.bottom) {
                var t = p.top
                p.top = p.bottom
                p.bottom = t
            }
            if (p.left > p.right) {
                var t = p.left
                p.left = p.right
                p.right = t
            }
            var url = `${baseUrl}/documents/${documentId}/2048p${page},${p.left},${p.top},${p.right},${p.bottom}.jpg`
            info.url = `${baseUrl}/document/${documentId}/${page}`
            info.page = page
            if (p.left != p.right && p.top != p.bottom) {
                var context = formatOutput(info, url)
                copyToClipboard(context)
                addToRecent({
                    document: documentId,
                    page: parseInt(page),
                    title: info.title,
                    type: 'fragment',
                    link: `${baseUrl}/documents/${documentId}/${page}`,
                    src: url
                })
            }
        }
    });

    canvas.addEventListener('mousemove', function(e) {
        let bounds = root.getBoundingClientRect();
        mousex = e.clientX - bounds.left;
        mousey = e.clientY - bounds.top;

        if(mousedown) {
            ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
            ctx.beginPath()
            var width = mousex - last_mousex
            var height = mousey - last_mousey
            ctx.rect(last_mousex, last_mousey, width, height)
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}


const copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};


function getInfo(documentId) {
    archiveAPI('getDocument', {id: documentId, keys: ['title', 'pages']}).then(result => {
        info.title = result.data.title
        info.pages = result.data.pages
        info.id = documentId
    })
}

function formatOutput(info, url) {
    var output = `${url}\n${info.title}, Page ${info.page}\n${info.url}`
    return output
}

const addToRecent = obj => {
  var recent = []
  if (localStorage['recentClippings']) {
    recent = JSON.parse(localStorage['recentClippings'])
  }
  recent.unshift(obj)
  localStorage['recentClippings'] = JSON.stringify(recent)
}

function initOverlay() {
    document.querySelector('#cropFile').addEventListener('click', event=> {
        if (cropInactive) {
            event.target.style.background = 'red'
            cropInactive = false
            document.querySelectorAll('.crop-overlay.inactive').forEach(element => {
                element.classList.remove('inactive')
            })
        } else {
            event.target.style.background = ''
            cropInactive = true
            document.querySelectorAll('.crop-overlay').forEach(element => {
                element.classList.add('inactive')
            })
        }
    })
    var first = true
    PDFViewerApplication.initializedPromise.then(function() {
        PDFViewerApplication.pdfViewer.eventBus.on("pagesinit", function(event) {
            documentId = PDFViewerApplication.url.split('/').splice(-2).shift()
            getInfo(documentId)
            document.querySelector('#viewerContainer').addEventListener('scroll', event => {
                if (window.parent && window.parent.postMessage) {
                    if (first) {
                        first = false
                    } else {
                        window.parent.postMessage({event: 'scrolled', top: event.target.scrollTop})
                    }
                }
            })
        })
        PDFViewerApplication.pdfViewer.eventBus.on("pagerender", function(event) {
            var page = event.pageNumber.toString()
            var div = event.source.div
            var overlay = document.createElement('div')
            overlay.classList.add('crop-overlay')
            overlay.id = 'overlay' + page
            if (cropInactive) {
                overlay.classList.add('inactive')
            }
            div.appendChild(overlay)
            renderCropOverlay(overlay, documentId, page)
        })
    })
}

document.addEventListener('DOMContentLoaded', function() {
    window.PDFViewerApplication ? initOverlay() : document.addEventListener("webviewerloaded", initOverlay)
})
