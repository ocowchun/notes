#lazy programmers
講者 matz

##identity

###self idetity
who are you? a programmer? a hacker? a language designer?

講者鼓勵大家設計自己的語言

**programming is a procress of designing your own DSL (Dave Thomas)**

interface is fundamentally a language
Design is difficult task

###What's the difference between popular language and non-popular language?
講者沒有想過要讓ruby變得流行,他只是想做些自己的東西,所以他沒有辦法解釋受歡迎與不受歡迎的語言差異在哪邊
有一天,有些人開始把ruby介紹給其他developer,開始寫介紹ruby的書

講者認為 `Duck typing` 跟 `DRY` 是ruby受歡迎的原因

###Duck typing
we just care how it behavior

we want computer to work,because we are the master of computer.

###DRY
avoid duplicate,avoid copy and paste,avoid spread bugs all over

we are too lazy to matain duplicates

spirit of laziness

we work so hard to become lazier

####在2015年的現在

* web applications
* huge programmers
* multi cores
* high traffic
* OOP => Functional

###Theory of Evolution
we can move on or we will be extinct.

###beaware second system syndrome
當一個系統變得老舊時,你會想要重頭設計一個新的。
但是language存活的時間比system還久
很多語言都有版本的問題(i.e. python2 and python3)
為了支援舊版本,需要花很多時間去處理

###改版的3個原則
####1. we have never thrown away everything
* we have repalced one at a time
* 一次只做一件事情
* keep compatiable as much as possible
* Never tried too drastic changes

####2. versioning illusion

####3. migration bait
* moving 1.9 had huge benefit

##ruby3的目標

###1.讓人跟機器的協作更加順利
* proactive warning
* soft typing

###2. performance

###3. concurrency
* we need more abstract concurrency model
* pipeline

https://github.com/matz/streem
