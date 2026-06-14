<%*
const type = await tp.system.suggester(
  ["index", "reference", "guide", "playbook", "plan", "decisions", "audit", "narrative", "log"],
  ["index", "reference", "guide", "playbook", "plan", "decisions", "audit", "narrative", "log"]
);
const folder = tp.file.folder(true);
const tagLines = (folder && folder !== "/" && folder !== "")
  ? folder.split("/").map((_, i, arr) => "  - " + arr.slice(0, i + 1).join("/")).join("\n")
  : "  - domain/uncategorised";
const today = tp.date.now("YYYY-MM-DD");
const title = tp.file.title;
-%>
---
title: <% title %>
type: <% type %>
status: draft
updated: <% today %>
tags:
<% tagLines %>
---

# <% title %>

