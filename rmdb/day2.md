###day1是關於兩個 TX 對同一份資料的活動，而引起的 blocking
* row-level lock
* 邏輯相關
* 相對長時間的

###day2是關於兩個TX所改動的資料物理位置相近，而引起的 blocking
* page-level lock
* 邏輯不相關
* 相對短時間的(直到那個data page使用完)

##今天大綱
* 資料表的內部結構
* 淺談B+ tree
* 淺談 heap table和Index-Organized Table(IOT)
* Primary Key的兩大流派
* 淺談 Primary key和Contention

##資料表的內部結構
###大部份的file system都會把硬碟分割成很多小區塊
* 區塊(blocks) 也有人叫`分頁`(pages)
* 因為硬體有這些限制

###一個檔案可以佔用多個區塊，但同一區塊只能被一個檔案佔用

###即使檔案只有1bytes，在以4 KB 為區塊大小的檔案系統中，他還是用掉4KB

###幻想中的檔案儲存方式1

* RDBMS為每一筆Record建立檔案
* 大量的空間會被浪費(因為硬碟操作是以區塊為單位，這樣會浪費大量的IO)
* 大量的file descriptor會浪費大量系統資源(如果你的系統沒有當掉)

###幻想中的檔案儲存方式2
* RDBMS建立一個巨型的檔案，並且把這個檔案看成連續性的空間。把同一table內的Record緊密地(一個接一個地)存到這個連續性的空間內。
* 在初期階段，這的確最節省空間還有IO
* 在Delete/Update(varchar變短)時,便會留下空洞
* 如果Record是需要排序的，每次的insert/update(varchar)都會引起整個table的重建

###現實中的儲存方式
#### RDBMS建立一個/數個巨型的檔案，然後把空間切成8KB(PostgresSQL,Oracle),16KB(MariaDB)的區塊
#### 一個區塊會被多個record共用，並且緊密地排列
* 不管Create/Uupdate/Delete也好，要整理8/16KB的數據還是很簡單的
#### 如果是需要排序的，區塊會用 double-linked list 的方式連結
* 即是說，每一個區塊都存有之前區塊和之後區塊的指標(Pointer)
* Insert/Create 不夠空間時，插入新區塊在 double-linked list 便好
* 如果有區塊不再存有數據，從這個 double-linked list移除便好

###使用區塊的好處
#### 能讓records緊密地儲存(雖然區塊末端還是有剩餘空間)
#### 因為空間是集中在區塊末端而不是在每一records之間
* 所以空間碎片化便會大幅減少
#### 要找到特定Record，只要知道其所在區塊就好
* index體積會比較小
* 在管理 IO 時，只需要維持(相對)簡單的 page SX lock ，不需要管 range lock

###這些和 developer 有關係嗎?
####每個page在同一時間只能被一個TX改動
* 因為page在被改動的短時間，整個 page 會被加上 page X lock 暫時沒法被讀寫
* 即使這個page在RAM，即使改動這個TX只要1ms，那麼這個 page 每秒只有1000 write
* 現在 cpu 成長開始停下來，不能再靠換上更快的 cpu 去解決

####把性質相近的Record物理性放到一起，會提高 cache hit rate 但是更容易發生 Contention

* 單一 page 能儲存越多的東西， Read 的效能會越好，但是 Weite 效能會越差
* 部分 RDVMS 會因為 page lock 發生靈異現象(i.e. MySQL5.6的index lock)

##淺談B+ tree
* 主流的 RDBMS ( PostgresSQL,MariaDB,Oracle) 用來實現 Index 的方式
* Primary Key(PK) 和 Unique Constraint 背後也是 index ( 即使用戶不提供PK, RDBMS 還是會偷偷建立)

###為何 B+ tree
####B+ tree的高度是 O(log n) 一般來說都 <=4
* 只用4個disk Read 便可以找到紀錄
* 現實世界中， B+ tree 的 non lead nodes 因為經常被使用，長期會留在 cache 中，所以真實的 disk read ~=1
* 如果兩個 TX 改動的 record 不再同一 data page 他們便能同時變動 B+ tree
* B+ tree 是 auto balancing 相對上不太需要重組資料來維持其效能。(注意 balanced和 even distributed不是相同概念)

###還是 B+ tree比較好
#### tokuDB 的 Fractal Tree Index 只是看起來很快，在現實環境中是噩夢
* Fractal Tree Index 和 Fractal (碎形)無關，是 B+ tree 的特殊變種。
* 現實環境不是單線程的， tokuDB 的所有 Write 都集中到 root node 極容易發生 contention
* 經常發生頂層的 Flushing， 讓頂層的 page 被加上 X lock 讓整顆 tree 在 flushing 期間無法被使用。

##淺談Index-Organize Table (IOT)

* 正如其名，Table本身是一個巨大的 B+ tree

###IOT優點
* 因為 Records 全都順序整理好了，在 range scan on Primary Key 時非常快
* 可以省下 sorted by PK的時間
* 只需要一次(邏輯上)Read 便能拿到資料，只需要較少的 Storage IO

###IOT缺點
#### 因為整個Records都有存放 B+ tree 的 lead node，每個 lead node 能存的rows有限
* 經常會發生 lead node 的 splitting/merging
* 因為 lead node 的 splitting/merging 引發 rows 要移動位置

#### 如果PK是有規律的(i.e. auto-increment) 讀取/寫入 很容易集中在少量的 leaf node 中，引發 Contention 問題 
* 因為 Contention 問題而發生意想不到 blocking 常常接下來引發更多的 blocking
* 同一時期產生的 rows 常常會在相近的時間 delete 這樣會 rows 不均地放到 node 中，進而需要 lead node merging

####正因為 row data 會因為 page merge/split 而改動其物理位置。所以 secondary index 只能儲存那個 record 的PK，而不是其物理位置

* 對使用 natural key 做 PK 的 table ，其 secondary index會很肥大
* 使用 secondary index 去找資料時，會需要額外的 disk READ 在 IOT 上

##淺談 Heap Table
* Heap 不是指 priority list。這是一個沒特定排序的空間。
* 最簡單來說，record data 隨意找一個 data page 存放。 PK 獨立放在 B+ tree index ，並且在 index leaf node 儲存指向 data page 的 pointer

###Heap Table 優點
###因為 index leaf node 只存放(PK+ pointer)
* 一個 index leaf node 可以存放更多的 rows ， leaf node splitting/merging 自然大減。
* 即使發生 index leaf node splitting/merging ，也不會讓 row data 需要移動位置

###因為 index 本身體積小，即使降低 fill_factor 也不會讓 index 變大太多
* 降低 fill_factor 能有效迴避 Contention 問題

###Record data 能存放在 heap 中任何一個 data page 沒有指定位置
* 即使PK適用上 auto-increment，相近 PK 的 row 會散落到整個 heap之內，先天性不容易發生 data page contention
* 在 insert new rows 時， Record data 輕易能找一個沒有正被改動中的 data page 來寫入。不容易發生 blocking

###現實中 RDBMS 會有 Free Space Management，近期被寫進資料的 data page 會優先被重用

###Heap Table缺點
####Range Scan on PK 一般需要整個table都做一次 scanning 極吃 IO
* 不過一般OLTP極少使用PK做 Range Scan 問題不大
* 如果是專門做數據分析/產生報表的 OLAP Range Scan on PK 倒是常常發生

####需要兩次(邏輯上)Read 才能拿到資料，需要較多 Storage IO

####萬一發生 index page contention 後果更糟

##小結
* Cache hit rate是應該被重視的，但不應被過分追求
* Contention需要更快的 CPU single thread 效能，這方面的成長越來越慢。
* IO throught 可以用  RAID 10 來解決 (SSD 的 Random IO throughput 也越來越好)

##Primary Key的兩大流派
### Natural Key
* 使用自然存在的 unique key 做 PK
* 例子:如果用戶使用email登入系統，可以用email做PK

###Surrogate Key
* 人工合成的key 在商業邏輯上一般沒有任何意義。
* 一般來說: auto increment 或是 UUID

###Natural Key 優點
* 不用再額外建立 Secondary index
* 一般來說，有足夠的隨機性來避免Contention
* 對於支援 loose index的RDBMS，Natural key 能減少Secondary index

###Natural Key缺點
####通常會需要更大的空間
* 用戶email總會比UUID(4 bytes) 更大
* 這會影響到 PK index 還有 Foreign Key的大下(以SSD持續下跌的價錢來看，問題不大)
* Natural Key 有可能失效(i.e. 老闆說要支援fb登入)
* 部分 ORM 對 composite key的支援不好，開發麻煩。

###Surrogate Key 優點
####不受商業邏輯的變動
####Surrogate Key的PK Index與FK 都會比較小

###Surrogate Key缺點
####Auto increment 本身是個潛在的 Contention 位置
#### 單純使用 Auto increment 會讓所有的 insert 集中在 B+ tree 的其中一邊
* Insert 時造成 contention
* Delete 時造成 B+ tree uneven distribution

####UUID 不能保證 100% 的 uniqueness，只是相撞可能性很低

##淺談 Primary key 和 Contention

###PK 與 Contention

#### 一般商業系統(不考慮爆表的部分) 90%的資料讀取/改動是基於PK的

#### 同一時期建立的 Record 他們相近時間被改動/刪除的可能性很高
* 所以為了避免發生 contention 不應該把同一時期建立的 Record 集中儲存在一起
* 但為了提升 Cache hit rate 同一時間的 Record 不應該過分分散(通常是OLAP會遇到的問題)

###Monotonic Increasing PK
* Monotonic Increasing: 就是說(大致上)持續上升的數值(i.e. auto increment,timestamp)
* MI PK的問題: 同一時期的record 集中在 PK index的最左邊
* PK index 左邊的Record 隨時間而被刪除，所以越左邊的 index lead page 的data 密度越低(這就是index uneven distribution 問題)
* 小結: MI PK會造成 PK index 右邊不停 splitting 左邊不停的merging

###MI PK與heap table
####近期新增加的 Record 的 PK 全集中在 PK index 的最右邊，引發 index page contention
####因為 B+ tree index 只存放 PK，單一 index page 能存放近千個 PK
* 所以 MI PK引起的 index page splitting/merging 還不算嚴重
* 而且 page splitting/merging 只有 PK需要移動物理位置
* 但是 MI PK 所引起的 Contention時，受災範圍卻很大

###MI PK 與 IOT
####因為 index leaf page 存放 Record PK + data 所以每一個 index leaf page不能存放太多的 Record
* 所以即使發生 Contention，受災範圍卻不太大
* 所以會引起高頻度的 page splitting/merging
* 在 MySQL5.6 page splitting和page merging都會引起 index X lock

####因為Record data放在 index leaf node,page splitting 將會引發 Row data 移動物理位置

##問題
understand B+ tree




