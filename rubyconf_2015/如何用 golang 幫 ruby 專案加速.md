#如何用 golang 幫 ruby 專案加速
講者: tka http://github.com/tka

https://docs.google.com/presentation/d/1SPT4G-b-NcETrHU9OQMdJRe5ccUj1gsMLCzJGmxvsOA/edit#slide=id.g66c386c1d_0_312
https://github.com/tka/rubyconf-tw-2015-ruby-go

##golang shared library
讓外部的其他語言可以透過編譯過的.so檔案來進行呼叫。


[Ruby and Go Sitting in a Tree](http://blog.paracode.com/2015/08/28/ruby-and-go-sitting-in-a-tree/)

##ruby如何呼叫 go lang?
* Fiddle
* ffi

####講者建議選Ruby-FFI就對了

##C String & Golang String

###從Accept-Lanaguage 比對適合的語系

記得參考Ruby FFI Memoey Management 避免 gc產生靈異現象


###比較各個markdown的效率
https://docs.google.com/presentation/d/1SPT4G-b-NcETrHU9OQMdJRe5ccUj1gsMLCzJGmxvsOA/edit#slide=id.g66c386c1d_0_255
