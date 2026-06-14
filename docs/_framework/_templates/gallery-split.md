--- start-multi-column: <% tp.date.now("YYYYMMDDHHmmss") %>
```column-settings
number of columns: 2
Border: disabled
Shadow: off
```

```img-gallery
path: <% tp.file.folder(true) %>/_assets/<% await tp.system.prompt("Left gallery — set name") %>
type: vertical
columns: 1
sortby: name
sort: asc
```

--- end-column ---

```img-gallery
path: <% tp.file.folder(true) %>/_assets/<% await tp.system.prompt("Right gallery — set name") %>
type: vertical
columns: 1
sortby: name
sort: asc
```

--- end-multi-column
