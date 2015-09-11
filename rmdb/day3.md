##今天大綱
* 淺談在OLTP的 schema 設計
* 淺談 Index
* OLTP 的 schema anit-pattern
* 淺談 SQL 通用守則

## 淺談在OLTP的 schema 設計
* Normalization 與 modeling
* 面對 OOP 的 inheritance 
* 故意的 data redundancy
* Data Materialization
* Data partitioning

###Normalization 與 modeling
####正規化很重要
####通常會讓每一個 `class` 對應單一 database table ，每一個 `object` 對應單一 database record
* Class 和 table 應該是一對一的，別試圖把不同class的object 放到同一 table 上

###面對 OOP 的 inheritance 
####其實 inheritance 在 modeling 只是偶然發生
* 例子:在保育動物團體的系統中，`貓` 和 `兔子` 都是 `寵物` 的 subclass
* 應該建立三個錶
* 寵物 < 寵物ID,性別,體重
* 貓 < 寵物ID,毛色
* 兔子 <寵物ID,耳朵長度

####然後 ｀貓｀ 和 `兔子` 建立對寵物的 fk

###故意的 data redundancy
####Data redundancy 會違反 normalization，但實際環境下，如果涉及 aggregation 時， Redundancy 未必是壞事
####例子:在售票系統中， flight.sold_tickets 和 flight.total_seat
* 用戶想知道航次還有沒有空位，只需要拿出flight這一個record
* 不需要 `select count(1) from ticket where flight_id=@flight_id`
* 而且 Conflict promotion ， Conflict materialization 有時需要額外建立 Record的

###Data Materialization
####在 OLTP ，報表會是不停地產生和使用的，其內容卻不一定需要及時性準確。
* i.e. 討論區中的 `最熱門話題` 和 `最新話題`

####對於 `最熱門話題` 可能是每五分鐘實行一次 Query ，然後把 query result 放到一個 table(或是放到Redis/memcache)
* 之後的五分鐘，所有 `最熱門話題` 的 request 都使用這份預先準備好的數據就好

####這種使用預先計算的數據，就是 Data Materialization
* 越是大型的系統，就越需要使用 Data Materialization

####Oracle 支持全面自動化的 Materialization ，這樣連 schedule job都不用寫

###Data Materialization 注意事項

####以下是正確的 on-the-fly data materialization
* step1 如果 precomputed result set 的 timestamp 在容許範圍內，直接返回 result set
* step2 拿取 X lock
* step3 再次檢查 result set 的 timestamp 如果在容許範圍內 釋放 X lock 並且返回 result set
* step4 建立 result set
* step5 釋放 X lock
* step6 返回 result set

####如果沒有 step2,3,5 在高Concurrency系統中 precomputed result set 一旦過期，將會引發多線程同一時間建立 result set 。 如果那份 result set 需要大量資源/時間才能建立的，在新的 result set 建立前系統會變得異常緩慢。

###Data partitioning 前言
####部分資料，擁有固定的 `最長生存期限`
* 例子：在空運貨運站主系統，所有的貨運記錄只有14天的生存期(超過14天的紀錄只用作統計用途，不需要放在主系統)

####如果 schedule job 在每天系統相對空閒的時間把過期紀錄清掉
* 清理過程時會引發大量IO，大幅拖慢系統效能
* 系統又多一件事情需要監控

####Truncate table 是把整個 table 所相關的 file 刪掉再重建，沒有 UNDO 也沒有 REDO 所以效能超快的
* 所以除了DBA，普通人不應該有這個權限
####以空運貨站為例子
* 建立cargo_0,cargo_1,cargo_1.....,cargo_14 共15個 subtable
* insert cargo 時根據 daydiff('1900-01-01',record_create_date)來決定應該放到哪一個 subtable 內
* 所以同一天的 cargo record 都會集中在同一 subtable
* 每天 truncate 一個 subtable 一次性把 14天前的 cargo record 清掉

####在  Oracle 這是付費的功能，在 postgreSQL,MySQL data partitioning需要application tier配合，或是需要使用 trigger 和 view
####data partitioning 與 data sharding 不是同一種東西，而今天在 noSQL 全面普及下， data sharding 已經沒落

##淺談 Index
* index 前言
* 要增加 index 前要問自己的問題
* FK 與 index
* Loose index

###index 前言
####Oracle說過，每增加一個 index ， 該table 在 insert/update/delete 時便會慢三倍。
####每增加一個 index時
* 便有額外要改動的 index data page
* 便有額外可能性因為遇上 index page lock 而需要等待/發生 deadlock

####Bitmap index 的改動是單線程的， hash index是不安全的
* 如果你堅持在 OLTP使用 ，good luck


###要增加 index 前要問自己的問題
####如果你要增加的是 unique index,你有強烈原因不讓他作為table的Natural key嗎?
####你要增加的 index ，是幫忙 OLTP行動嗎?
####如果是 non-unique index 你假設會用上的 query ，他能幫助你把 candidate records 數目變到 100下嗎?
* 如果是 enum column(i.e. gender) B+ tree index幾乎肯定幫不了你

#### 你真的需要 `即時性` 的資料?

###是否應該用 index
####如果你的table已經做了 time-based partition
* 你的 time-based query 只會用上數個 subtable

####在OLTP Full-table scan 其實沒大家想像中可怕
* 一個擁有 1M筆紀錄的，每筆記錄大約需要 100bytes 的 table 其物理空間不會超過 500MB
* 利用 Sequential Read 所需時間不應該超過五秒
* 人們說自己的 table 很大，很多時候都是因為沒有把過期資料清掉

####如果用戶95%時候只關心 `活躍` 的Record，你可以考慮把 table 分割
* 例子: 在工作管理系統中，95%時間人們只關心還未完成的工作
* 所以不是單一的 `Task` table 而是會分割成 `unfinished_task` 和 `finished_task`
* 當工作完成時，便會從 `unfinished_task` 刪除，然後增加到 `finished_task`

###index 與 Good schema
* 良好的schema 能讓一些 secondary idnex 不用建立
* i.e. 使用者可以使用 email或是fb登入
* 如果只有一個 user table，裡面有user_name,hash_password,facebook_id 這些 columns ，便需要為 user_name 和 facebook_id 分別建立 secondary_index
* 如果是3個table user, user_name_login, user_facebook_login 便不再需要建立 secondary index
* 使用 fb login 時 `select * from user u inner join user_facebook_login fb on u.id=fb.user_id where fb.facebook_id= @facebook_id`
* 即使最終還是有3個 index 可是user_name,facebook_id 這兩個 index 卻不再包含無關的 null value 
* 讀取時變快(因為 index體積變小)
* 建立新用戶時也快 (因為不用把 null value 放到 index)

##FK 與 index
###這是 parent and children
* 你 `經常性` 地利用 parent 的 PK 去找出全部 child record (i.e. 找航次ABC123的座位表)
* 不會有大量的 child FK 指向同一 parent record
* 如果同時滿足以上兩點，你才需要考慮為 FK 建立 index

###Loose index
* 對於 composite key (colA,colB,colC)，就算你 query中只有 colA/(colA+colB)的值，RDBMS還是有機會用上 loose index
* Oracle全面支援,MySQL有限度支援,PostgreSQL不支援
* 在支援 loose index 的 RDBMS 要建立 composite PK 時，一般會把最有機會在 where-clause 的 column 放在最前面
* 如果你在能支援 loose index 的 RDBMS 使用 natural key 有機會節省 FK 的 index (i.e. 如果使用 natural key , child table 的 composite key 內很可能包含了對 parent 的 FK)
* 例子: `座位表` 的 PK 是 <航次編號,座位編號> 而航次編號正是 `航次` 的 PK

##OLTP 的 schema anti-pattern
* smart column
* denormalizaton
* 多用途 column
* 多用途 table 

###smart column
* 1NF的定義，所有 column 的 value 都必須是 atomic value
* 就是說 xml,json,array 這些東西全都違反 1NF
* xml,json,array 是部分RDBMS 的專屬功能，不一定所有 db connector 和ORM 都支援
* xml,json 內有過分高的自由性，沒有把 column value 內容拿出來前，永遠猜不到 column 內具體存了些什麼
* smart column 內部資料不能再建立 index 當報表要用上 smart column 內部資料做 filtering/joining時 不但 query難寫,其效能也會低落

###denormalizaton
####為了迴避 subquery 和 joining，有人想進行 denormalizaton ，故意地在一個table 放進 multiple data model 的數據
* 例子:因為用戶在檢查自己所買的機票時，頁面也會顯示航次出發時間/航次到達時間的資訊，有人做了 denormalizaton 在 `ticket` 這個 table 存放航次資訊
####OLTP 的 denormalizaton 一般無助提昇系統效能，反而大幅增加改動資料時的麻煩/出錯可能性
####denormalizaton 會讓 table schema 變得不直覺
* 有多少公司有真的做好 documentation ?
* 三個月後，有多少還記得自己之前做過的東西?

### denormalizaton 遇上 race condition
有人使用 denormalizaton 把航次資料存在 `tiket` table 所以改動航次資料時，也要改動所有人的 record

```
TX1: start transaction Read committed;

TX2: start transaction Read committed;

TX2: update flight set depart_time = '1815' where filght_name='abc'

TX1: select depart_time from flight where filght_name='abc';
//因為航空公司還沒有commit 所以顯示舊的 1800

TX1: insert into ticket blalala..
//把舊的 depart_time 放到 tickett

TX1: commit;

TX2: commit;

```
###多用途 column
>系統需要知道這個column/其他column的value,才知道具體怎麼去使用者個 column的內容

####例子:之前讓使用者使用 username/password或是fb登入的系統
* user table只有一個auth column
* 如果使用者使用username登入,auth內容為 username:<user_name>/<hash_password>
* 如果使用者使用fb登入,auth內容為 facebook_id:<fb_id>
* 這樣的做法看起來只使用一個column，也只有一個secondary index

####缺點
* 這設計讓使用者只能使用一種方式登入
* hash_password是以 salt 和 password 計算的，會讓index失效
* 如果要知道系統有多少facebook用戶，便需要 where auth like 'facebook_id%'

###多用途 table 
* 某一table內，大量的 column 的 value 是 null
* 這個table內有一個叫 `type` 的 column app需要先知道這個 column 的值才能決定這個 record 怎麼使用
* 多用途column的進階版本，非常危險

##淺談 SQL 通用守則

###SQL 是宣告式語言
* 一般來說 schema + query 都正確， execution plan optimizer 應該自動地找到最好的 execution plan，不應該由developer人工控制 execution plan
* 一般來說  execution plan optimizer 出錯都是因為不合理的table schema 跟奇怪的 SQL 

###SQL 是 set-based language
> 不應該輕易使用looping

###SQL 支持 check-and-set
* 現在只留的 RDBMS 還有 connection driver 在 insert/update/delete時 都會返回有多少 record受到影響
* 所以對於簡單的checking 可以跟 data procressing 合成一句 statement
* 例子 檢查航次是否還有空位，如果有空位就把空位數目減一
* `update flight set vacancy = vacancy -1 where vacancy > 0 and flight_no = @flight_no`
* 如果受影響的record數目為0，直接告訴用戶交易失敗就好。

###SQL支持 stored procedure
> 對於 data intensive 的演算法，可以考慮使用 stored procedure處理

###SQL應該很短的
* sql是宣告式語言，一行可以做很多事情
* 講者認為非報表類的sql應該10行內，報表的sql是50行
* 太長的sql不好維護
* 太長的sql,execution plan optimizer 需要的時間會幾何上升
* 越長的sql,越有可能讓 optimizer 使用 sub-optimum 的 plan

### 善用 temporary table寫報表
* 所有寫進 temporary table的資料 會在 connection close/TX commit 時被刪除
* 所以不會使用正常的table space ， 速度比一般 table 更快
* temp table 是每個 connection 專屬的，不會互相干涉(所以不會locking/blocking 速度很快)
* 如果你的sql 太長，可以考慮把 sql 變成數個 statement 然後把中間的結果放進 temp table

###對 subquery 的迷思
####Oracle和postgreSQL的 execution plan optimizer 都懂得 subquery unnesting
####下面三句query，對Oracle和postgreSQL是沒有分別的

```sql
select child.id from child inner join parent on child.parent_id=parent.id
where parent.name='abc';

select child.id from child where child.parent_id=
(select id form parent where parent.name='abc');

select child.id from child where exists ( select 1 from parent where child.parent_id=parent.id and parent.name = 'abc');

```

####在 OLTP 的query，大部份的 subquery 會被 optimizer 自動轉成 joining
####不過以下的 correlated subquery 沒法被 unnest 
* 含有 aggregation function (count/sum/group by)
* 含有 window function(rank,limits)

###對joining的迷思
* 有可能是 schema設計有問題
* 有可能是用上很奇怪且很長的query去做簡單的事情
* 有可能是用來跑真的很慢的報表

####例子
顯示機票時，連帶顯示航次的資料

```sql
select * from flight_ticket ft inner join flight f on ft.flight_id=f.id where ft.id=@ticket.id
```

* 因為有 where ft.id=@ticket.id 這個基於 PK 的filtering， flight_ticket 只有一個record 會參加 joining
* 因為f.id是 Primary key 所以會有 index,所以在 nested loop join 中，這會是內層的loop(這種joining的正確名字叫 index nested loop join, OLTP 經常用上這種 joining)

####剛才例子，RDBMS的內部運作應該是
```
step1 用where ft.id=@ticket_id 過濾 flight_ticket
step2 
for each candidate record ft in flight_ticket{
  f:=flight.getRecordByIndex(ft.flight_id)
  //如果有相配資料，便把 <f,ft>加入結果中
}

```
* 這個例子中，即使兩個table各有10M筆資料，也只有兩次getRecordByIndex便能找到結果
* 這個例子，使用joining比分拆成兩個query更快

