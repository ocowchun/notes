#RSpec for Practical Rubyist
講者: Juanito Fatas Jolly Good Coder http://github.com/JuanitoFatas

###deppbot
>help bundle update daily

####emoji is awesome

垃圾話時間0.0

####this is a How to Talk

##RSpec v.s. Minitest
in `Minitest`,test Case are class in test

in `Rspec`,test case are desribe

##Introduction

`describe` a series of test
`it` is a test
`expect` an actual onject 
`to` match something
`context` is the scenario of your code


##about rspec detail
```
expect(actual).to eq(expect_val)
```
expect(obj) 是建立一個ExpectTarget的物件
eq(obj) 是建立一個Mathcher的物件
to 是ExpectTarget的instance method他會呼叫matcher的match方法

###double
a fake object for the real object

###stub
不會確認你是否有call method

###mock
確認你是否有call method

###spy
>like null object of double

you can call anything to the spy

##test phase
`setup` everything we need 
`exercise` the real work
`verify` the result
`teardown` to the init state


###feature spec
spec/features/*_spec.rb
>test like how users use it 
User real database records Don't mock or stub objects.
EXternal can mock

use `capybara` to interact with browser
`selenium` / capybara-Webkit

###Job test
make sure job invokes correct methods


####use `webmock` to stub your web request

**Always Be Testing**
