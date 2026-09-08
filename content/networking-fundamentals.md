---
title: "Networking Fundamentals for Backend Engineers"
date: "2026-07-02"
tag: "Networking"
---

## Why Networking Still Matters

Most day-to-day backend work happens well above the network layer, but debugging production
incidents almost always eventually touches it &mdash; a timeout, a dropped connection, a DNS
change that took an hour to propagate.

Below is a simplified picture of a request leaving a client, passing through NAT, and reaching
a server:

![A simple client-router-server diagram](sample-diagram.svg)

## The OSI Model, Briefly

You don't need to memorize all seven layers, but three come up constantly:

- **Layer 3 (Network)** &mdash; IP addressing and routing
- **Layer 4 (Transport)** &mdash; TCP/UDP, ports, connection state
- **Layer 7 (Application)** &mdash; HTTP, gRPC, DNS

### TCP vs UDP

TCP is connection-oriented and guarantees ordered, reliable delivery. UDP is fire-and-forget,
which makes it a better fit for latency-sensitive traffic like video or DNS queries.

## Common Debugging Commands

```bash
# check if a port is open on a remote host
nc -zv example.com 443

# trace the route packets take
traceroute example.com

# inspect DNS resolution
dig +short example.com
```

## Conclusion

You don't need to be a network engineer to ship reliable backend systems, but a working mental
model of connections, ports, and DNS will save you hours the next time something *"just times
out"* in production.
