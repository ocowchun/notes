Design Data-Intensive Applications

### 如何衡量系統的 scalability?
尋找 application 的 load parameter,
#### 什麼是 load parameter?
整個 application 關鍵行為的相關數據，以 twitter 為例, 最重要的事情是發 tweet 跟瀏覽 home timeline

所以你要做的就是去觀察這兩件事情找出 load parameter
比方說  4.5k request/sec 的 write 跟 350k request/sec 的 read
這兩個指標就會是你的 load parameter
然後你要去檢視在當前的 performance measurement 以上面的例子來說, 我們關心的是 response time
根據你的目標與限制 會去對 p50(50 % response time), p95 (95 % response time), p99, p999 做不同的要求

scalability 就是在討論當 load parameter 改變的時候, 你要如何調整 system 來讓 performance 不變, 或是不調整 system 的情況下, 如何讓 performance 維持在可接受的範圍。

## chapter2 data model
data model 是如何將實際的資料儲存
資料要用什麼樣的方式來儲存, 這邊的儲存不是硬體上的儲存, 而是邏輯上的儲存, 也就是要如何去切分彼此的界線
如何去建立 一對一, 一對多, 多對多的關係。


你的 data model 會決定你 application 的架構

主流的 data model 還是 relation data model, 也就是 RMDB 所使用的 model, 他可以有效的表現
各種資料間的關係, 缺點是複雜的資料往往要使用多個 join 來完成, 所以你會需要許多不同的表來完成多個一對多的關係。
另外 schema 是需要預先定義好的, 優點是維持了資料的一致性, 可以減少許多開發者的負擔,缺點相對的比較沒有彈性。


document model 是另外一種 data model, 他可以用一個 table 完成一對多的關係, 所以簡單的 query 就可以表達
多個一對多的關係(i.e. 一個人有多個學歷, 多個技能, 多個經歷)
不過如果一種資料在多個 document 要修改的話, 就會很麻煩, 比如學校改名 就要把所有有這個學歷的人都抓出來調整。
沒有 schema, 所以你可以允許 document 之間有許多不同的欄位, 不過你也必須要在開發時做許多的檢查。

graph model
我覺得不是很直覺, 將所有的事物使用 node 與 edge 的關係來表達,

## chapter 3 storage engine
講如何將資料儲存到硬碟的方式

不同的應用情境, 會使用不同的儲存方式來達到最好的 performance

以 OLTP 為例, 又分為 write intensive 跟 read intensive
write intensive 通常會使用 SSTable(sorted string table) 或是 LSM table(log structure merge table)
每次寫入的時候, 都只是在 log file 最後面新增一筆 log, 所以速度很快

- [ ] SSTable 怎麼做 index

read intensive 的代表是 B-tree, B-tree 把資料用存放在固定大小的 page 裡面, 每個 page 可以儲存多筆 row, B-tree 本身會有紀錄去連接到這些 rule, 比如說在 B-tree 裡面記錄 row pk 與 相對應的 page

每次寫入的時候, 都要去更新B-tee 與對應的 page, 另外因為 B-tree 本身也是用一個, 一個 block 來儲存資訊,
所以有可能新增資料的時候, 原本的 block 已經滿了, 需要分出去用新的 block 來儲存, 這都會影響 write performance

除了 B-tree 本身的 index 之外, 還可以針對 row 的其他欄位建立 secondary index, secondary 會儲存該欄位的值, 與對應的 pk, 所以使用 secondary index 尋找 row 的時候, 會先從 secondary index 找到 pk, 再用 b-tree 去找到 pk 對應的 page

主要的瓶頸會是硬碟的 seek time

OLTP 的讀取模式是每秒會產生大量的交易, 每個交易牽涉的資料量很小。 OLAP 是另外一種不同的 access pattern,
他的 query 數很少, 不過每筆 query 牽涉的資料量很大。

傳統的 data warehouse 會使用 star schema 或是snowflake(star schema 的延伸) 當作資料的 data model
star schema 就是會有一個 fact table 代表某些事實(i.e. 某一筆交易的金額, 某一天的溫度) 這個 fact table 會有多個 fk 連接到所謂的 dimension table, 這些 dimension 代表的是 fact 的某種維度, 比如說交易的商品編號, 交易的時間, 交易的店家編號, 溫度的所在地區 ...etc

因為每次讀取都會取用大量的資料, 所以 index 在這種場合派不大上用場。
主要的瓶頸會是硬碟的讀取頻寬

所以通常會將資料壓縮來改善讀取時間, 另外 column store 也是一種最近開始普及的方式, 相較於一筆 row, 一筆 row
這樣儲存資料, column store 是將一批 row 的同一個 column 儲存在一起, 因為在 OLAP 我們不見得需要知道
資料的每一個 column, 通常是對大量資料的某個 column 做運算, 所以如果讀取的時候只讀取這個 column 就可以省下許多不必要的空間, 另外將 column 一起儲存也有利於壓縮的效果。

一般來說會選擇一個 column 當作排序, 其他 column 都按照這個排序儲存。

## chapter 4 data format
簡單的說
public API 可以用 json, xml, csv
因為這些格式非常通用, 各語言都有支持，不過相對的資料是儲存成存文字格式, 檔案大小會比較大。

private API 可以用 thrift, proto buffer, avro ...etc
可以將資料儲存成二進位格式, 會有比較好的 performance
不過需要做比較多的處理, 比如說安裝對應的 library, 儲存 schema ...etc