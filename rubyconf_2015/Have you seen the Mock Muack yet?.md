#Have you seen the Mock Muack yet?
講者: 林健欣 Source Code Formatter http://github.com/godfat

http://www.godfat.org/slide/2015-09-11-mock/

##Introduction
測試只包含程式的一小部分,不包含程式全部的可能性
測試也是開發的一個過程,他應該要讓你的開發流程變得順利

###Mock object
> mock objects are simulated objects that mimic the behavior of real objects in controlled ways

##When
* Non-deterministic(i.e. current time or concurrenct)
* Diffcult to reproduce(i.e. network error or race condition)
* Too slow

###Non-deterministic

```rb
require 'time'
class Ticket < Stuce.new(:time)

  def expired?
    Time.parse(time) < Time.now
  end

end

Ticket.new('2015-09-11').expired?
```



##Muack
https://github.com/godfat/muack

###simple example
```rb
require 'pork/auto'
require 'muack'

describe 'Hello' do
  include Muack::API
  before{ Muack.reset  }
  after { Muack.verify }

  would 'puts' do
    mock(self).puts(is_a(String)){ok}
    ptus "Hello"
  end
end
```

###Non-deterministic

```rb
class Ticket < Struct.new(:time)
  def expired?
    Time.parse(time) < Time.now
  end
end

describe Ticket do
  would 'expired?' do
    mock(Time).now{ Time.parse('2015-09-12') }
    expect(Ticket.new('2015-09-11')).expired?
  end

  would 'not expired?' do
    mock(Time).now{ Time.at(0) }
    expect(Ticket.new('2015-09-11')).not.expired?
  end
end
```

也可以用dependecy injection的方式來處理 Time的問題。
>不過這樣每次都要inject一堆東西,我覺得很智障0.0


###[Mocks Aren't Stubs](http://martinfowler.com/articles/mocksArentStubs.html)
The Difference Between Mocks and Stubs
* `Dummy` are passed around but never actually used.
* `Fake` actually have working implementations,
but usually take some shortcut.
* `Stubs` provide canned answers to calls made during the test.
* `Mocks` are pre-programmed with expectations which form a specification of the calls they are expected to receive.

##Trade-Offs

##Possibilities


###使用mock
####優點
容易設定複製的物件
Test isolation -- one bug one test breaks so easier to track

####缺點
需要實做mock
mock會與測試產生耦合,如果程式的需求變動時,需要重新設計mock


可以用[webmock](https://github.com/bblimke/webmock)來處理使用到http請求的code

