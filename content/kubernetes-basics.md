---
title: "Kubernetes Basics: Pods, Deployments, Services"
date: "2026-08-20"
---

## Architecture Overview

Kubernetes is a container orchestration system built around a declarative model: you describe
the desired state, and the control plane continuously reconciles the cluster toward it.

### Control Plane

The control plane is made up of a few core components:

- `kube-apiserver` — the front door for every request
- `etcd` — the cluster's source of truth
- `kube-scheduler` — decides which node a Pod runs on
- `kube-controller-manager` — runs the reconciliation loops

### Nodes

Every node runs a `kubelet` and a container runtime. The `kubelet` talks to the API server and
makes sure the containers described in its assigned Pods are actually running.

## Core Objects

### Pods

A Pod is the smallest deployable unit. It usually wraps a single container, though it can hold
more than one when they need to share network and storage.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: example-pod
spec:
  containers:
    - name: app
      image: nginx:1.27
      ports:
        - containerPort: 80
```

### Deployments

A Deployment manages a set of replica Pods and handles rolling updates for you.

```bash
kubectl apply -f deployment.yaml
kubectl rollout status deployment/example
kubectl rollout undo deployment/example
```

### Services

A Service gives a stable network identity to a set of Pods, since Pod IPs are ephemeral.

| Service Type  | Use case                                  |
| ------------- | ------------------------------------------|
| ClusterIP     | Internal-only traffic                     |
| NodePort      | Expose a port on every node                |
| LoadBalancer  | Provision an external cloud load balancer  |

> Rule of thumb: start with ClusterIP and only reach for LoadBalancer when you actually need
> external traffic.

## Conclusion

Pods, Deployments, and Services cover most of what you need for a first production workload.
Everything else &mdash; ConfigMaps, Secrets, Ingress, StatefulSets &mdash; builds on these same
primitives.
