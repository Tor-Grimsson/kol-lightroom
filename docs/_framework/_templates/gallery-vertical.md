```img-gallery
path: <% tp.file.folder(true) %>/_assets/<% await tp.system.prompt("Set name (folder under _assets)") %>
type: vertical
columns: <% await tp.system.prompt("Columns (e.g. 2, 3, 4, 9)", "3") %>
sortby: name
sort: asc
```
