http://db.cs.cmu.edu/papers/2017/p1009-van-aken.pdf
https://github.com/cmu-db/ottertune

## 調整 database configuration 的困難點
The problem with these knobs is that they are not standardized (i.e., two DBMSs use a different name for the same knob), not independent (i.e., changing one knob can impact others), and not universal (i.e., what works for one application may be sub-optimal for another). Worse, information about the effects of the knobs typically comes only from (expensive) experience.
* 不同的 database system 會使用不同的設定名稱
* 設定之間不是獨立的, 所以可能我調整 setting A 會影響到 setting B 的效果
* 不同的 workload 會需要不同的 configurations
* 有些設定是數值, (i.e., memory size for cache), 可以設定的範圍太廣
* 越來越多的 setting 可以選擇


## 本篇論文的做法
The crux of our approach is to train machine learning (ML) models from measurements collected from these previous tunings, and use the models to
(1) select the most important knobs,
(2) map previously unseen database workloads to known workloads, so that we can transfer previous experience, and
(3) recommend knob settings that improve a target objective (e.g., latency, throughput).


### DBA 如何 tuning DB
One common approach to tuning a DBMS is for the DBA to copy the database to another machine and manually measure the perfor- mance of a sample workload from the real application. Based on the outcome of this test, they will then tweak the DBMS’s configu- ration according to some combination of tuning guidelines and in- tuition based on past experiences. The DBA then repeats the experiment to see whether the performance improves

### 本篇論文使用的 benchmark tool YCSB(Yahoo! Cloud Serving Benchmark)
https://github.com/brianfrankcooper/YCSB


## motivation
#### knob dependencies
因為每個 knob 彼此之間不獨立, 會互相影響, 又或者硬體資源的限制, 所以當你給 setting A 太多資源的時候,
就無法給 B 足夠的資源, 因此需要把所有可能的組合都測試過才有辦法找到一個 global optimal 的 solution,
所以這會是一個 NP-hard 的 problem

#### Continuous Settings:
單就一個 knob, 可以設定的範圍太廣, 論文中提到 buffer pool size 從 10 MB 到 3 GB, 各有不同的效果

#### Non-Reusable Configurations
The effort that a DBA spends on tuning one DBMS does not make tuning the next one any easier. This is because the best configuration for one application may not be the best for another

#### Tuning Complexity
Lastly, the number of DBMS knobs is al- ways increasing as new versions and features are released.

## SYSTEM OVERVIEW

OtterTune does not require any information from the DBA about their meaning, whether they are indicative of good or bad performance, or whether metrics with different names mean the same thing in different DBMSs We discuss this metric collection in further detail in Sect. 4, along with our approach to rank the DBMS’s knobs by their importance in Sect. 5

### Assumptions & Limitations
有些設定需要重開機, 或是花時間調整, 這篇論文目前不考慮這些問題, 假設一切都可以瞬間完成。
OtterTune stores a list of the dynamic knobs that are available on each of the DBMS versions that it supports, as well as the instructions on how to update them


## WORKLOAD CHARACTERIZATION
有兩種收集資料的方法

### 1. analyze the target workload at the logical level
examining the queries and the database schema to compute metrics, such as the number of tables/columns accessed per query and the read/write ra- tio of transactions. These metrics could be further refined using the DBMS’s “what-if” optimizer API to estimate additional runtime information [15], like which indexes are accessed the most often.

#### 問題
* it is impossible to determine the impact of changing a particular knob because all of these estimates are based on the logical database and not the actual runtime behavior of queries
* how the DBMS executes a query and how the query relates to internal components that are affected by tuning knobs is dependent on many factors of the database (e.g., size, cardinalities, working set size)

### 2. DBMS’s internal runtime metrics
All modern DBMSs expose a large amount of information about the system.
For example, MySQL’s InnoDB engine provides statistics on the number of pages read/written, query cache utilization, and locking over- head.

OtterTune characterizes a workload using the runtime statis- tics recorded while executing it.

#### 優點
runtime metric 通常跟 db configuration 是直接相關的。

These metrics provide a more accurate representation of a workload because they capture more aspects of its runtime behavior. Another advantage of them is that they are directly affected by the knobs’ settings.
For example, if the knob that controls the amount of memory that the DBMS allocates to its buffer pool is too low, then these metrics would indicate an increase in the number of buffer pool cache misses

## IDENTIFYING IMPORTANT KNOBS

### Feature Selection with Lasso
The independent variables are the DBMS’s knobs (or functions of these knobs) and the dependent variables are the metrics that OtterTune collects during an observation period from the DBMS.

Before OtterTune computes this model, it executes two prepro- cessing steps to normalize the knobs data. This is necessary be- cause Lasso provides higher quality results when the features are (1) continuous, (2) have approximately the same order of magni- tude, and (3) have similar variances.


## 看不懂
map previously unseen database workloads to known workloads, so that we can transfer previous experience, and

## 問題
### 做 feature selection 使用的 independent variables 是 knobs 是當下的 obsevation 還是過去的多次 obsevation?

如果只從當下的 obsevation, 這樣 knob 都是固定的數字, 根本沒戲唱阿 = =
也就是說你一定要有多次的 obsevarions, 才有辦法在一個 knob 上有不同的數字, 這樣才能去做比較。

### data repository 一開始的資料是哪裡來的?
想要確認是否是要先自己 run 一堆不同的設定 來產生足夠的數據


### data repository 的資料是哪裡來的?
It maintains a repository of data collected from previous tuning sessions,
The client-side controller collects runtime information from the DBMS using a standard API (e.g., JDBC)

It receives the information collected from the controller and stores it in its reposi- tory with data from previous tuning sessions.
This repository does not contain any confidential information about the DBMSs or their databases; it only contains knob configurations and performance data.

OtterTune organizes this data per major DBMS version (e.g., Postgres v9.3 data is separate from Postgres v9.4). This prevents OtterTune from tuning knobs from older versions of the DBMS that may be deprecated in newer versions, or tuning knobs that only exist in newer versions.