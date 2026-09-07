---
title: "Quick Note: chmod Octal Cheatsheet"
date: "2026-06-11"
---

Just a short reference I keep forgetting and looking up, so writing it down here.

`chmod` takes three octal digits: owner, group, others. Each digit is a sum of:

- `4` = read
- `2` = write
- `1` = execute

So `755` means `rwxr-xr-x` &mdash; owner can read/write/execute, everyone else can read/execute
only. `644` means `rw-r--r--` &mdash; owner can read/write, everyone else read-only.

```bash
chmod 755 script.sh
chmod 644 config.yaml
```

This article intentionally has no `##` headings, to confirm the Table of Contents hides itself
when there isn't enough structure to justify one.
