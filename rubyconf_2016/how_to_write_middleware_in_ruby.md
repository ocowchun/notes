# How to Write Middleware in Ruby
[tagomoris](https://twitter.com/tagomoris)

fluntd
## Linx and Mac:
thread/process scheduling
* test code must run on both
* important tests to be written: Threading

`run tests on all support platforms`

## Memory Usage:
object leak
tempa values must leak in long running process 
### some solutions
* in-process GC
* Storage with TTL
* External storages: Redis,...

`Make Sure to Collect Garbage`

## Formatting Data Into JSON

### fluentd handles JSON in many use cases
* both of parsing and generating

### Speed is not only thing;

[yajl](https://github.com/lloyd/yajl) support streaming json

`Choose Fast/Well-Designed(stable) libraries`

## Thread in Ruby
### GVL: Giant VM Lock (Global Interpreter Lock)
* just one thread in many threads can run at a itme
* ruby vm can use only 1 CPU core

### Methods for errors
#### Threads will die silently if any errors are raised
#### abort_on_exception
* raise error in threads on main thread if true
* required to make sure note to create false success

### Process crash from errors in threads
middleware SHOULD NOT crash as far as possible
an error from a TCP connection MUST NOT crash the whole process

`handle exceptions in right way`

