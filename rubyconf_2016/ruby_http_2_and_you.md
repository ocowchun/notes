# Ruby, HTTP/2 and You
[BanzaiMan](https://github.com/BanzaiMan)

## HTTP 1.1
* plain text headers
* tcp connections are kept alive
* requests are queued on the server in the order
* session data are transmitted on eahc rquests
* browsers impose limits on the number of concurrent connections per host

## HTTP/2
* binary headers
* header compression with HPACK
* multiple full duplex connections (the server can response with any order possible)
* server pushes


``` bash
$ curl --version 
# it will show http2 in feautes if it support
```

## Still-good Practices
### Do
* put assets on CDN
* reduce DNS Lookups

### Do NOT
* redirect HTTP Requests

## Good Practices
### Do
* find out if your deployment environment allows http/2
* split assets (probably)
* test different servers

### Do NOT
* shard domains

## Ruby HTTP/2 Server code
Rails, sintara depends on Rack

Rack default receive [Status , Header Hash, Response body] as arguments, but it's not suit for http/2.

But you can use HTTP/2 Proxying, add a HTTP/2 server for client to access, and use that server to communicate with HTTP/1 server