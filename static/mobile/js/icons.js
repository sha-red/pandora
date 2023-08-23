var icon = {}
icon.enterFullscreen = `
<svg
   width="256"
   height="256"
   viewBox="0 0 256 256"
   version="1.1"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg">
  <g
     fill="none"
     stroke="#B1B1B1"
     stroke-width="8">
    <path
       d="M 44,112 l 0,-68 l 68,0"
       />
    <path
       d="M 144,44 l 68,0 l 0,68"
       />
    <path
       d="M 212,144 l 0,68 l -68,0"
       />
    <path
       d="M 112,212 l -68,0 l 0,-68"
       />
  </g>
</svg>
`
icon.exitFullscreen = `
<svg
   width="256"
   height="256"
   viewBox="0 0 256 256"
   version="1.1"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg">
  <g
     fill="none"
     stroke="#B1B1B1"
     stroke-width="8">
    <path
       d="m 100,32 v 68 H 32"
       />
    <path
       d="M 224,100 H 156 V 32"
       />
    <path
       d="m 156,224 v -68 h 68"
       />
    <path
       d="m 32,156 h 68 v 68"
       />
  </g>
</svg>
`

icon.mute = `
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   width="256"
   height="256"
   viewBox="0 0 256 256">
  <path
     d="M 160,96 a 48,48 0 0,1 0,64"
     fill="none"
     stroke="#808080"
     stroke-width="16"
     id="path2275"
     style="opacity:1;stroke-width:8;stroke-dasharray:none;stroke:#B1B1B1" />
  <path
     d="M 176,64 a 88,88 0 0,1 0,128"
     fill="none"
     stroke="#808080"
     stroke-width="16"
     id="path2277"
     style="stroke-width:8;stroke-dasharray:none;stroke:#B1B1B1" />
  <path
     d="M 192,32 a 128,128 0 0,1 0,192"
     fill="none"
     stroke="#808080"
     stroke-width="16"
     id="path2279"
     style="stroke-width:8;stroke-dasharray:none;stroke:#B1B1B1" />
  <path
     style="fill:none;fill-rule:evenodd;stroke:#B1B1B1;stroke-width:8;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;stroke-dasharray:none"
     d="m 15.73147,87.829137 64.658698,0.143482 64.118622,-63.901556 -0.0618,208.474357 -64.560837,-65.01777 -63.594727,0.48342 z"
     id="path4946" />
</svg>
`

icon.unmute = `
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   width="256"
   height="256"
   viewBox="0 0 256 256">
  <path
     style="fill:none;fill-rule:evenodd;stroke:#B1B1B1;stroke-width:8;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;stroke-dasharray:none"
     d="m 15.73147,87.829137 64.658698,0.143482 64.118622,-63.901556 -0.0618,208.474357 -64.560837,-65.01777 -63.594727,0.48342 z"
     id="path4946" />
</svg>
`

icon.play = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <polygon points="56,32 248,128 56,224" style="fill:none;fill-rule:evenodd;stroke:#B1B1B1;stroke-width:4;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;stroke-dasharray:none"/>
</svg>
`
icon.pause = `
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   width="256"
   height="256"
   viewBox="0 0 256 256">
  <path
     style="fill:none;fill-rule:evenodd;stroke:#B1B1B1;stroke-width:4;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;stroke-dasharray:none"
     d="m 55.561915,31.764828 47.856395,0.122789 0.79397,192.070763 -48.048909,-0.50781 z"
     id="path6254" />
  <path
     style="fill:none;fill-rule:evenodd;stroke:#B1B1B1;stroke-width:4;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;stroke-dasharray:none"
     d="m 150.7755,32.038558 47.85639,0.122789 0.79397,192.070763 -48.04891,-0.50781 z"
     id="path6254-6" />
</svg>
`
icon.loading = `
<svg width="512" height="512" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="none" stroke="#B1B1B1" stroke-dasharray="15" stroke-dashoffset="15" stroke-linecap="round" stroke-width="2" d="M12 3C16.9706 3 21 7.02944 21 12">
        <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="15;0"/>
        <animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/>
    </path>
</svg>
`

icon.loading_w = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <g transform="translate(128, 128)" stroke="#404040" stroke-linecap="round" stroke-width="28">
        <line x1="0" y1="-114" x2="0" y2="-70" transform="rotate(0)" opacity="1">
            <animate attributeName="opacity" from="1" to="0" begin="0s" dur="1s" repeatCount="indefinite"></animate>
        </line>
        <line x1="0" y1="-114" x2="0" y2="-70" transform="rotate(30)" opacity="0.083333">
            <animate attributeName="opacity" from="1" to="0" begin="-0.916667s" dur="1s" repeatCount="indefinite"></animate>
        </line>
        <line x1="0" y1="-114" x2="0" y2="-70" transform="rotate(60)" opacity="0.166667">
            <animate attributeName="opacity" from="1" to="0" begin="-0.833333s" dur="1s" repeatCount="indefinite"></animate>
        </line>
        <line x1="0" y1="-114" x2="0" y2="-70" transform="rotate(90)" opacity="0.25">
            <animate attributeName="opacity" from="1" to="0" begin="-0.75s" dur="1s" repeatCount="indefinite"></animate>
        </line>
        <line x1="0" y1="-114" x2="0" y2="-70" transform="rotate(120)" opacity="0.333333">
            <animate attributeName="opacity" from="1" to="0" begin="-0.666667s" dur="1s" repeatCount="indefinite"></animate>
        </line>
        <line x1="0" y1="-114" x2="0" y2="-70" transform="rotate(150)" opacity="0.416667">
            <animate attributeName="opacity" from="1" to="0" begin="-0.583333s" dur="1s" repeatCount="indefinite"></animate>
        </line>
        <line x1="0" y1="-114" x2="0" y2="-70" transform="rotate(180)" opacity="0.5">
            <animate attributeName="opacity" from="1" to="0" begin="-0.5s" dur="1s" repeatCount="indefinite"></animate>
        </line>
        <line x1="0" y1="-114" x2="0" y2="-70" transform="rotate(210)" opacity="0.583333">
            <animate attributeName="opacity" from="1" to="0" begin="-0.416667" dur="1s" repeatCount="indefinite"></animate>
        </line>
        <line x1="0" y1="-114" x2="0" y2="-70" transform="rotate(240)" opacity="0.666667">
            <animate attributeName="opacity" from="1" to="0" begin="-0.333333s" dur="1s" repeatCount="indefinite"></animate>
        </line>
        <line x1="0" y1="-114" x2="0" y2="-70" transform="rotate(270)" opacity="0.75">
            <animate attributeName="opacity" from="1" to="0" begin="-0.25s" dur="1s" repeatCount="indefinite"></animate>
        </line>
        <line x1="0" y1="-114" x2="0" y2="-70" transform="rotate(300)" opacity="0.833333">
            <animate attributeName="opacity" from="1" to="0" begin="-0.166667s" dur="1s" repeatCount="indefinite"></animate>
        </line>
        <line x1="0" y1="-114" x2="0" y2="-70" transform="rotate(330)" opacity="0.916667">
            <animate attributeName="opacity" from="1" to="0" begin="-0.083333" dur="1s" repeatCount="indefinite"></animate>
        </line>
    </g>
</svg>
`

icon.right  = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <polygon points="56,32 248,128 56,224" fill="#808080"/>
</svg>
`
icon.left  = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <polygon points="8,128 200,32 200,224" fill="#808080"/>
</svg>
`
icon.down  = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <polygon points="32,56 224,56 128,248" fill="#808080"/>
</svg>
`

icon.publishComment = `
                    <svg width="512" height="512" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <g fill="#ef4444">
        <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293L1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7-7zm-4.208 7l-.896-.897l.707-.707l.543.543l6.646-6.647a.5.5 0 0 1 .708.708l-7 7a.5.5 0 0 1-.708 0z"/>
        <path d="m5.354 7.146l.896.897l-.707.707l-.897-.896a.5.5 0 1 1 .708-.708z"/>
    </g>
</svg>
`
