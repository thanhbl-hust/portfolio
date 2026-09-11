---
title: "Kubernetes - Cluster Architecture"
date: "2026-01-01"
tag: "Kubernetes"
---

## Architecture Overview

**Kubernetes** là một nền tảng quản lý container mã nguồn mở (Container Orchestration), giúp tự động hóa việc triển khai, mở rộng, quản lý và phục hồi các ứng dụng đã được container hóa.

## Control Plane

### kube-apiserver

**kube-apiserver** là trung tâm đầu não của cụm Kubernetes. Nó là front-end REST duy nhất cho control-plane, nơi tất cả component còn lại giao tiếp để đọc ghi state. Nó chịu trách nhiệm xác thực, phân quyền, validate request, và là thành phần duy nhất giao tiếp trực tiếp với etcd để lưu trữ state của cluster. 

### etcd

**etcd** là kho lưu trữ state duy nhất của toàn bộ cluster — một distributed key-value store nhất quán (strongly consistent) dựa trên thuật toán Raft. Mọi thông tin về cluster (pods, services, configmaps, secrets, trạng thái nodes...) đều nằm ở đây. Chỉ có kube-apiserver được phép đọc/ghi trực tiếp vào etcd; không component nào khác kết nối thẳng tới nó.

### kube-scheduler

### kube-controller-manager

## Nodes

### kubelet

### kube-proxy

### container-runtime

## Add-ons