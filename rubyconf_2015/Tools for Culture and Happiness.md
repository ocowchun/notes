#：Tools for Culture and Happiness
講者:Ricky Pai Software Engineer, Airbnb http://github.com/rickypai

####work at Developer Infrastructure(formely Developer Happiness)

###airbnb
one of the largest rails monoliths
420k loc
314 gems
5000 commits /month

###The enginnering team is also growing
more developer => more bugs =>sadness

###how can we not be sad?
* Tests!(Help,but thet can;t catch everything)
* Microservices
* Release Managers!(but how do they know which of the hundred changes broke production?)


[don't fuck up the culture](https://medium.com/@bchesky/dont-fuck-up-the-culture-597cde9ee9d4)


##Provide Context for Judgement
Code Review的Slack 機器人,要求每個pull request都需要review
每個pull request都會自動assign developer來review

###Code Review Routing
確保對的人有review code

##Empower Action on the Judgement
###Deployboard 
*an app to overview of airbnb server

####部署機器人
先部署到staging 確認沒問題 在部署到 production

####yoda
yoda notifies when ne builds are available
yoda teachers 怎麼deploy,怎麼rollback, new relic dashboard,...(讓new developer知道怎麼做事情)

###custom your pull request
* 加入ci
* 指定code reviewer
* ...
github 
