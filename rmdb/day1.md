##isolation
> 幫助developer避免race condition

####為了最大化效能，RDBMS會同時處理多個TX

* 今天CPU的單一線程效能不再跟蹤
* Backend的效能是以吞吐量(throughput)來計算的(Throughput=Concurrency level * 1/TX process time)

但是如果兩個TX在改動相同的資料，RDBMS會讓後來的TX被blocking，這樣便不會發生race condition

###Race condition 安全例子1
讓同一航班所有資料改動都要先拿到該航班的`write lock`，改動完解除`write lock`

* Zookeeper
* Redis

####缺點
萬一得到那個Write Lock的server crash，那麼便要等待write lcok到期才能更新資料。

###Race condition 安全例子2
* 為每一航班建立對應的Queue
* 對同一航班的改動，必須先把工作放到對應的Queue，然後single process順序執行
* 同一時間只有一個procress在改動同一份資料，所以不會有Race condition

####缺點
* 開發的複雜度會增加很多(需要增加MQ Server,worker,server)
* 不是所有的race condition都適用這個方法，例如A轉帳給B，那工作要放到A的queue,還是B的queue?
(不可能把工作拆成兩份,然後分別放到A,B的Queue,因為這是一個不可分割的工作)

###Race condition 安全例子3
善用RDBMS的Atomicity還有Isolation

```sql
Update seats set user =$user where flight_no = 'BR855' and flight_date= '16SEP'
and user = null
```

##RDBMS的read phenomena
###Dirty Read
讀取到尚未commit的資料

###Non-repeatable read
在同一個TX中,同一筆資料在第一次讀取與第二次讀取的時候出現不同的結果
讀取的資料包含其他已經committed的TX的update，而這些TX的commit時間發生在本TX的開始之後。

###Phantom Read
在同一個TX中,同一query在第一次和第二次執行中，出現不同的結果。
讀取的資料包含其他已經committed TX的新增或變動，而這些TX的commit時間發生在本TX開始之後。

##兩種isolation流派
* 在RDBMS中，SX lock和MVCC都能達到Isolation目的，避免Race condition

* Oracle和Postgres使用MVCC，而MySQL和MSSQL使用SX lock

* 因為底層機制不同，所以雖然大家都說自己支持ACID，支持4個isolation level，`不過其isolation的行為卻有所不同`

##Shared-exclusive lock
* 在資料庫中，每一個Record都有其SX lock(也稱作Readers-writer lock)

* 所有由TX擁有的lock，會在TX結束時自動歸還。(S Lock視isolation level決定歸還時間)

* S lock是對應資料讀取的,X lock是對應資料改動

* 因為S lock能發給多個TX，所以同一時間能有多個TX讀取同一塊資料。

* 發行X lock時，Record必須沒有其他的lock(不管是S還是X)。直到該X lock結束前，Record都不能發行其他的lock
(所以直到該TX結束前，該Record沒有辦法被其他TX讀取/變動)


##MVCC
###Multiversion concurrency control
* 簡單來說，每次的insert/update會為該Record增加額外的成本
* 所以，Record的最新版本都存有時間(或類似的資料)，讓RDBMS可以知道哪份版本是最新的。
* Record太舊的版本會被RDBMS自動刪除。

####MVCC的資料庫的Record只有X lock,沒有S lock

####MVCC在讀取的時候，會讀該Record最新的committed版本的，所以自然沒有Dirty Read

####因為只有WRITE-WRITE conflict，所以`MVCC的Read永遠不會被阻擋`。


##SX lock或是MVCC
###只考慮一個TX,MVCC使用比較多的IO還有CPU，所以比較花時間
* 因為要決定哪個版本是`最新`的
* 因為要管理舊的版本的刪除

###在高流量環境，MVCC比較高效能
* 因為MVCC的Read永遠不會被阻擋，同一時間資料庫能處理更多的TX

* MVCC只有X lock沒有S lock，其Deadlock detector 要管理的lock數會比較少，所以比較快。

##RDBMS的Isolation level
###Read Uncommitted

###Read Committed
可以避免Dirty Read

###Repeatable Reads
可以避免Dirty Read,Non-repeatable read

###Serializable
可以避免Dirty Read,Non-repeatable read,Phantom read

##基於SX lock的Read Committed
* 改動前，為Record加上X Lock，直到TX完結。
* 讀取前，為Record加上S Lock，在statement結束後立即歸還。
* 其他實圖讀取/變動這些rows的TX將會等待blocked直到本TX完成。
* `改動會阻擋讀寫`

```
TX1: start transaction read committed;

TX2: start transaction read committed;

TX1: update stock set last_price=0 whre stock_name='MSFT';
//資料被加上X lock

TX2: select last_price from stock where stock_name='MSFT';
//拿取S lock失敗，所以本TX被blocking

TX1: Rollback;
//歸還 X lock

TX2: 成功拿取S lock顯示正確股價
```

即使TX1會有錯誤的資料進行TX，然後rollback，在Read Committed Isolation下，用戶只是需要額外的等待時間。不會收到沒有commit的dirty data


##基於MVCC的Read Committed
* 進行insert/update/delete時，會先為Record其加上X Lock,直到TX完成。
* 讀取Records，只會考慮已經committed的最新版本。(即使Record已被加上X lock,Read也不會被阻擋)
* 當兩個TX想改動同一Record時，其中一個才被阻擋

```
TX1: start transaction read committed;

TX2: start transaction read committed;

TX1: update stock set last_price=0 whre stock_name='MSFT';
//資料被加上X lock，並且建立還為Commit的ver1副本

TX2: select last_price from stock where stock_name='MSFT';
//資料庫無視還未Committed的ver1副本，返回最新的ver0副本

TX1: Rollback;
//歸還 X lock

TX2: 成功拿取S lock顯示正確股價
```

即使TX1會有錯誤的資料進行TX，然後rollback，在Read Committed Isolation下，尚未committed的資料會自動忽略。不會收到沒有commit的dirty data


##基於SX lock的Repearable Read
###跟Read Committed相似，只是讀取時的S lock要在TX結束時才歸還
* 所以讀過的Record便不能被改動
* 容易引起deadlock

####因為讀寫佔了大部份，所以你的改動會常常被讀寫阻擋

```
TX1: start transaction repeatable read;

TX1: select price flight whre flight_name ='abc';
//資料被加上S lock

TX2: start transaction repeatable read;

TX2: update flight set price =300 where  flight_name='abc';
//因為無法拿到X lock所以被blocking

TX1: update user set balance =balance -(select price flight whre flight_name ='abc')
//資料的S lock提升為X lock 這時用戶會被扣除200

TX1: commit;
//返回所有鎖

TX2: 拿到X lock 執行資料變動
```

##基於MVCC的Repeatable Reads
###讀取資料時，`只考慮在TX開始前已經committed的版本`
* 別名snapshot(快照) isolation

###改動資料時，除了拿取X lock，還檢查Record是否存在TX開始後的Committed版本。如果存在，便raise exception並強制Rollback目前TX

* PostgreSQL: could not seralize access due to concurrent update
* Oracle把檢查拖延到TX commit時才進行，但影響不大。

雖然不像SX lock一般容易產生deadlock，但是Repeatable Read TX還是容易需要Rollback

###case1

```
TX1: start transaction repeatable read;

TX1: select price flight whre flight_name ='abc';
//ver0的price是200USD

TX2: start transaction repeatable read;

TX2: update flight set price =300 where  flight_name='abc';

TX2: commit
//返回所有鎖，並且把ver1副本狀態給為Committed

TX1: update user set balance =balance -(select price flight whre flight_name ='abc')
//忽略掉TX開始後才建立的ver1，用戶被扣掉200USD

TX1: commit;

```
即使TX2從中間開始並且先完成，TX1還是只使用TX1一開始時的數據。現實效果的排序為TX1,TX2

###case2

```
TX2: start transaction repeatable read;

TX2: update flight set price =300 where  flight_name='abc';

TX1: start transaction repeatable read;

TX1: select price flight whre flight_name ='abc';
//ver0的price是200USD

//因為速度很慢，tx2現在才發出commit
TX2: commit
//返回所有鎖，並且把ver1副本狀態給為Committed

TX1: update user set balance =balance -(select price flight whre flight_name ='abc')
//忽略掉TX開始後才建立的ver1，用戶被扣掉200USD

TX1: commit;

```
即使TX2先開始，現實效果的排序為TX1,TX2


##基於SX lock的serializable
* RDBMS的serializable不等於數學上的serializable( auto increment ie. 6的時候rollback,發生從5跳到7的狀況,)
* predicat lock像是where age between 20 and 35
* 在repeatable read的基礎上，在執行query時，除了為會被讀取的rows加上READ_LOCK之外，還要加上predicate lock
* 其他TX的insert/update，只要影響到的rows滿足predicate lock的範圍，那個TX也會上鎖
* 極度吃CPU也容易引起deadlock，沒特別原因不要用這個模式。

```
TX1: start transaction SERIALIZABLE;

TX1: select sum(cost) from flight_misc_cost where flight_name='abc'
//建立where flight_name='abc'的predicate lock

TX2: start transaction SERIALIZABLE;

TX2: insert into flight_misc_cost(flight_name,item_name,cost) values('abc','expense1',10)
//因為資料符合predicate lock，所以insert被阻擋

TX1: update user set balance=balance-(select sum(cost) from flight_misc_cost where flight_name='abc')

TX1: commit
//返回所有鎖

//沒有了predicate lock
TX2: 繼續執行

```

##基於MVCC的serializable
* 如果沒有使用sequence/auto increment，RDBMS的Serizable(MVCC)等於數學上的Serizable
* 在Repeatable Read的基礎上，為每個Query的Predicate加上Predicate monitoring
* 當有新版本的committed rows滿足predicat，而其版本是在本TX開始的時間點後，則本TX raise exception並且rollback
* 高CPU要求，沒有特別原因不建議使用

```
TX1: start transaction SERIALIZABLE;

TX1: select sum(cost) from flight_misc_cost where flight_name='abc'
//建立where flight_name='abc'的predicate monitoring

TX2: start transaction SERIALIZABLE;

TX2: insert into flight_misc_cost(flight_name,item_name,cost) values('abc','expense1',10)

TX2: commit
//因為資料符合predicate 提醒predicate相關的TX

TX1: 接受到predicate monitoring的exception，引起強制rokkback

TX1: rollback;
//返回所有鎖和monitoring

```

##面對Race condition的實務建議

###建議1
不要輕視Race condition

###建議2
* 在Read Committed中使用Conflict promotion來預防Non Repeatable Read，而不使用RDVMS內建的Repeatable Read Isolation level

####Conflict promotion: 在checking時，在select的指令尾部加入for share，讓所有讀取過的Record都加上S lock直到TX結束

* 這跟 Repeatable Read 效果相同，只是我們人手操作，讓RDBMS不會把非關鍵的資料S lock
* MVCC的資料庫不一定有for share，改用for update去拿X lock，也有相同的效果

```
TX1: start transaction repeatable read;

TX1: select price flight whre flight_name ='abc' for share;
//資料被加上S lock

TX2: start transaction repeatable read;

TX2: update flight set price =300 where  flight_name='abc';
//因為無法拿到X lock所以被blocking

TX1: update user set balance =balance -(select price flight whre flight_name ='abc')

TX1: commit;
//返回所有鎖

TX2: 拿到X lock 執行資料變動
```

###建議3

####在 Read Committed 中使用 Conflict promotion + Conflict materialization 來預防 Phantom Read 而不使用 RDBMS 內建的 Serializable Isolation level

####Conflict materialization

* 如果兩個table 存在parent-child 關係(flight 和 flight_misc_cost )
* 所有對child record的Read都要為其parent record加上S lock
* 所有對child record的Weite都要為其parent record加上X lock
* 所以對child table加入新Record時，便會跟其他正在讀取該範圍(同一 parent )的 TX 的S lock發生碰撞，讓其insert被阻擋

####極少數的Phantom Read發生於沒有parent table，或是select predicate 不包含parent id，這時候變需要故意創造一個人工的parent table去防範 Phantom Read

####其實大部份的系統只用上 Read Committed 中使用 Conflict promotion + Conflict materialization 便足夠了，不建議使用更高階的 isolation

###建議4

####不是每種 Race Condition 都是需要迴避的
* 如果你在賣遊戲的寶物，賣一萬件跟賣一萬零一件是沒有分別的。
* 如果你在賣火車票當然不能超賣

####最重要的關鍵在於，當 Race Condition 發生後不出現致命錯誤，讓系統朝向不致命的方向發生錯誤。

###建議5

####盡可能把checking和data processing放在同一句的statement內

* `update flight set vacancy = vacancy -1 where vacancy > 0 and flight_no = @flight_no`

###建議6
* 善用 Optimistic concurrency control (又名 optimistic lock)
* 讀取資料時，一併讀取資料的timestamp
* update時檢查這份資料的timestamp，便知道這份資料有否在期間被其他人改動(需要atomic的 check-and-set 指令)
* 如果讀取資料和改動資料的時間相距很長(>5sec) 一般來說 optimistic lock 會更好。

###建議7
* 如果單一record有數千人嘗試同時改動，小心系統當掉
* sharding/noSQL在這種情況下沒有幫助




