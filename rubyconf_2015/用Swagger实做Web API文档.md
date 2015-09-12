#用Swagger实做Web API文档
講者: 吴江 Tech Lead, D.G.Z http://github.com/nouse

##為什麼講者當時要採用swagger?
* rails application
*  API consumers
* 使用`grape`(Rest service), `doorkeeper`(oauth)

###API 文件怎麼寫?

####把握三個原則
* 重要
* 清楚
* 正確

####示範
https://api.gitcafe.com/apidoc/

####使用grape加上grape-swagger可以輕鬆的生成swagger文件

###Describe REST Service
* API routes
* Input types
* Output types
* Authorizations


https://github.com/ruby-grape/grape-swagger
https://github.com/doorkeeper-gem/doorkeeper
https://blog.yorkxin.org/posts/2013/10/10/oauth2-tutorial-grape-api-doorkeeper/
