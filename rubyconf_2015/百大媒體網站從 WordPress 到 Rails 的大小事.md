#百大媒體網站從 WordPress 到 Rails 的大小事
講者: Ronald Hsu Technical Director https://github.com/hothero

http://www.slideshare.net/hothero0705/2015-rubyconf-wordpress-rails

幫 the news length從wordpress migrate到 rails 一年下來累積的實務經驗


##為什麼要轉到rails

1. 客製化困難
2. performance issue
3. 台灣wordpress developer的開發者不多

##migrate to rails
stage1. wordpress
stage2. rails frontend + wordpress backend
stage3. rails

wordpress的db有12個資料表

###post
一個文章(post)會有很多的附件,很多的版本,在wordpress裡面全部放在一個table(wp_post)
簡單講就是個大悲劇的table

###tag/category
使用三張資料表 wp_term_relationships,wp_term_taxonomy,wp_terms

####example
####category
wp_term_taxonomy.taxonomy='category'
wp_terms.name="Politics"

####tag
wp_term_taxonomy.taxonomy='post_tag'
wp_terms.name="Politics"

講者寫了一個gem 讓我們可以用ative record來處理wordpress的db
https://github.com/hothero/wpdb_activerecord

##server部分

###Cloudflare Page Rules
當你的post很少變動時,可以做頁面cache
同時在線數,可以衝到六千人

##editflow
>文章編輯的workflow
http://editflow.org/

一篇文章從作者寫完之後還要經過編輯,資深編輯的審閱才能發佈,這中間是個複雜的workflow

使用行事曆觀看文章的發佈狀況
使用editorial comments來討論文章內容,講者使用(`acts_as_commentable`的gem來做這件事情)

#####note
>我不是很喜歡polymorphic assciations 這樣會喪失Referential integrity

###story budge
使用看板方法來檢視文章,使用[ransack](https://github.com/activerecord-hackery/ransack)來做到這件事情

###user group
>編輯與作者的分組概念

使用STI(Single-table inheritance)來做到一個User Table對應多個User role(i.e. author,editor...etc)

##other parts
###editing lock
讓user可以知道文章目前是由誰在編輯
使用[MessageBus](https://github.com/SamSaffron/message_bus)

###media gallery
remotipart來處理檔案上傳

###globalize
使用[globalize](https://github.com/globalize/globalize)


##API Design In General
使用[has_scope](https://github.com/plataformatec/has_scope)來簡化搜尋的部分


##rails-gem-list
>awesome gems
https://github.com/hothero/rails-gem-list

###將data由wordpress migrate到rails遇到的問題
* 需要很多的細心!
* 要注意圖片轉移的部分

###為什麼不用cancan?
1. 講者覺得STI的程式碼可讀性比較好
2. 使用pundit鎖function

