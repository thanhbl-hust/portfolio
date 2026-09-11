---
title: "Kubernetes - Scheduler"
date: "2026-01-01"
tag: "Kubernetes"
---

**Scheduler** là một thành phần của Control Plane chịu trách nhiệm chọn ra các Node phù hợp cho các Pod mới. Scheduler không trực tiếp chạy Pod trên Node, nó chỉ chọn Node và giao tiếp với api-server để ghi vào etcd. 