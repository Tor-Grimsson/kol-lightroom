```img-gallery
path: <% tp.file.folder(true) %>/_assets/<% await tp.system.prompt("Set name (folder under _assets)") %>
type: horizontal
height: <% await tp.system.prompt("Row height in px", "260") %>
sortby: name
sort: asc
```
