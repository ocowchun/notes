# Large scale Rails applications
[strikyflo](https://github.com/strikyflo)

## principles
### SRP
### plan old ruby object
### IOC
### stateless objects
### DSL
### services

講者用很多人會寫出下面的 code 為例

```rb
Class User
 after_create :send_welcome_email
end
```

** 可是  signup != create **

你應該要將 signup 包裝成一個 service 然後在裡面呼叫

```rb
def call
  user.save!
  send_welcome_email
end
```
