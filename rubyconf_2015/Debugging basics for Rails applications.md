#Debugging basics for Rails applications
講者: Kuniaki IGARASHI Chief Engineer, spice life, Inc. http://github.com/igaiga

##web console
https://github.com/rails/web-console

```html
<%= console%>
```

##Debugging in form

###check point1:sending requests
檢查你送出的請求是否有包含正確的參數（URL,HTTP method,Form data...etc）
chrome developer tool會是你的好朋友

###check point2:checking parameters in rails app
講者提到可以使用logger紀錄訊息,byebug設定中斷點

#####note
>我習慣使用 pry-rails 來處理

###check point3:view

```html
<%=debug @book%>
```

https://github.com/josevalim/rails-footnotes


##other useful tools

###g
>print tool on notification

https://github.com/jugyo/g

#####note
>可以用來看test有沒有過

###awesome_print
>more pretty print
https://github.com/michaeldv/awesome_print

##HTTPS
https://github.com/jugyo/tunnels

##Mail

https://github.com/igaiga/debug_basics_app
