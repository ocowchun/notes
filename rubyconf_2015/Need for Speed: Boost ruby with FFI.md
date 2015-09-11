#Need for Speed: Boost ruby with FFI
講者: 林鈺翔(John Lin) Head of Algorithm http://github.com/johnlinvc

###we need more spped to put our app faster

講者用來處理訂單運送的問題,不過因為數量實在太多了,所以常常發生request timeout

雖然可以change language來解決performace的問題,不過他們很喜歡ruby

##Go Native 

###兩種方式
* C EXtension
* FFI

###C EXtension
write the critical part using ruby api in c
need compiler on production environment
not portable between

###FFI(Foreign Function Onterface)
don't need compiler on production environment

講者決定選擇ffi

##how libffi works in C

####note
>救命啊,我不會寫c啦
