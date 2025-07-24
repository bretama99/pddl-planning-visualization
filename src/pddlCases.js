export const prob1_classic = `(define (problem logistics-multi-city)
  (:domain logistics)
  
  (:objects
    milan rome naples - city
    malpensa fiumicino capodichino - airport
    milancenter milanstation - location
    romecenter termini - location
    naplescenter naplesport - location
    pack1 pack2 pack3 pack4 pack5 - package
    truckmilan truckrome trucknaples - truck
    plane1 plane2 - airplane
  )
  
  (:init
    (in-city malpensa milan)
    (in-city milancenter milan)
    (in-city milanstation milan)
    (in-city fiumicino rome)
    (in-city romecenter rome)
    (in-city termini rome)
    (in-city capodichino naples)
    (in-city naplescenter naples)
    (in-city naplesport naples)
    (at truckmilan milancenter)
    (at truckrome romecenter)
    (at trucknaples naplesport)
    (at plane1 malpensa)
    (at plane2 fiumicino)
    (at pack1 milanstation)
    (at pack2 milancenter)
    (at pack3 termini)
    (at pack4 romecenter)
    (at pack5 naplescenter)
  )
  
  (:goal
    (and
      (at pack1 romecenter)
      (at pack2 naplesport)
      (at pack3 milancenter)
      (at pack4 naplescenter)
      (at pack5 termini)
    )
  )
)`;
export const plan1_classic = `domain parsed
problem parsed
grounding..
grounding time: 45
aibr preprocessing
|f|:85
|x|:0
|a|:195
|p|:0
|e|:0
h1 setup time (msec): 14
 g(n)= 1.0 h(n)=48.0
 g(n)= 2.0 h(n)=46.0
 g(n)= 3.0 h(n)=45.0
 g(n)= 4.0 h(n)=43.0
 g(n)= 5.0 h(n)=42.0
 g(n)= 6.0 h(n)=41.0
 g(n)= 7.0 h(n)=40.0
 g(n)= 8.0 h(n)=39.0
 g(n)= 9.0 h(n)=38.0
 g(n)= 11.0 h(n)=37.0
 g(n)= 12.0 h(n)=36.0
 g(n)= 13.0 h(n)=35.0
 g(n)= 14.0 h(n)=34.0
 g(n)= 15.0 h(n)=33.0
 g(n)= 16.0 h(n)=32.0
 g(n)= 17.0 h(n)=31.0
 g(n)= 19.0 h(n)=30.0
 g(n)= 20.0 h(n)=29.0
 g(n)= 24.0 h(n)=27.0
 g(n)= 25.0 h(n)=26.0
 g(n)= 26.0 h(n)=25.0
 g(n)= 27.0 h(n)=24.0
 g(n)= 28.0 h(n)=23.0
 g(n)= 29.0 h(n)=22.0
 g(n)= 30.0 h(n)=21.0
 g(n)= 31.0 h(n)=20.0
 g(n)= 33.0 h(n)=19.0
 g(n)= 34.0 h(n)=18.0
 g(n)= 35.0 h(n)=17.0
 g(n)= 37.0 h(n)=16.0
 g(n)= 38.0 h(n)=15.0
 g(n)= 40.0 h(n)=14.0
 g(n)= 41.0 h(n)=13.0
 g(n)= 42.0 h(n)=12.0
 g(n)= 43.0 h(n)=11.0
 g(n)= 45.0 h(n)=10.0
 g(n)= 46.0 h(n)=9.0
 g(n)= 47.0 h(n)=8.0
 g(n)= 48.0 h(n)=7.0
 g(n)= 49.0 h(n)=6.0
 g(n)= 50.0 h(n)=5.0
 g(n)= 51.0 h(n)=4.0
 g(n)= 52.0 h(n)=3.0
 g(n)= 53.0 h(n)=2.0
 g(n)= 54.0 h(n)=1.0
problem solved

found plan:
0.0: (drive-truck trucknaples naplesport capodichino naples)
1.0: (drive-truck truckrome romecenter fiumicino rome)
2.0: (load-truck pack2 truckmilan milancenter)
3.0: (drive-truck truckmilan milancenter malpensa milan)
4.0: (unload-truck pack2 truckmilan malpensa)
5.0: (load-airplane pack2 plane1 malpensa)
6.0: (fly-airplane plane1 malpensa capodichino)
7.0: (unload-airplane pack2 plane1 capodichino)
8.0: (load-truck pack2 trucknaples capodichino)
9.0: (drive-truck trucknaples capodichino naplescenter naples)
10.0: (load-truck pack5 trucknaples naplescenter)
11.0: (drive-truck trucknaples naplescenter capodichino naples)
12.0: (unload-truck pack5 trucknaples capodichino)
13.0: (load-airplane pack5 plane1 capodichino)
14.0: (fly-airplane plane1 capodichino fiumicino)
15.0: (unload-airplane pack5 plane1 fiumicino)
16.0: (load-truck pack5 truckrome fiumicino)
17.0: (drive-truck trucknaples capodichino naplesport naples)
18.0: (unload-truck pack2 trucknaples naplesport)
19.0: (drive-truck trucknaples naplesport capodichino naples)
20.0: (fly-airplane plane2 fiumicino malpensa)
21.0: (drive-truck truckrome fiumicino romecenter rome)
22.0: (load-truck pack4 truckrome romecenter)
23.0: (drive-truck truckrome romecenter fiumicino rome)
24.0: (unload-truck pack4 truckrome fiumicino)
25.0: (load-airplane pack4 plane1 fiumicino)
26.0: (fly-airplane plane1 fiumicino capodichino)
27.0: (unload-airplane pack4 plane1 capodichino)
28.0: (load-truck pack4 trucknaples capodichino)
29.0: (drive-truck trucknaples capodichino naplescenter naples)
30.0: (unload-truck pack4 trucknaples naplescenter)
31.0: (drive-truck truckrome fiumicino termini rome)
32.0: (load-truck pack3 truckrome termini)
33.0: (drive-truck truckrome termini fiumicino rome)
34.0: (unload-truck pack3 truckrome fiumicino)
35.0: (drive-truck truckrome fiumicino termini rome)
36.0: (unload-truck pack5 truckrome termini)
37.0: (drive-truck truckrome termini fiumicino rome)
38.0: (fly-airplane plane2 malpensa fiumicino)
39.0: (load-airplane pack3 plane2 fiumicino)
40.0: (fly-airplane plane2 fiumicino malpensa)
41.0: (unload-airplane pack3 plane2 malpensa)
42.0: (load-truck pack3 truckmilan malpensa)
43.0: (drive-truck truckmilan malpensa milanstation milan)
44.0: (load-truck pack1 truckmilan milanstation)
45.0: (drive-truck truckmilan milanstation malpensa milan)
46.0: (unload-truck pack1 truckmilan malpensa)
47.0: (drive-truck truckmilan malpensa milancenter milan)
48.0: (load-airplane pack1 plane2 malpensa)
49.0: (fly-airplane plane2 malpensa fiumicino)
50.0: (unload-airplane pack1 plane2 fiumicino)
51.0: (load-truck pack1 truckrome fiumicino)
52.0: (drive-truck truckrome fiumicino romecenter rome)
53.0: (unload-truck pack3 truckmilan milancenter)
54.0: (unload-truck pack1 truckrome romecenter)

plan-length:55
metric (search):55.0
planning time (msec): 146
heuristic time (msec): 113
search time (msec): 142
expanded nodes:84
states evaluated:874
number of dead-ends detected:176
number of duplicates detected:341`;
export const prob1_numeric = `(define (problem logistics-multi-city)
  (:domain logistics)
  
  (:objects
    milan rome naples - city
    malpensa fiumicino capodichino - airport
    milancenter milanstation - location
    romecenter termini - location
    naplescenter naplesport - location
    pack1 pack2 pack3 pack4 pack5 - package
    truckmilan truckrome trucknaples - truck
    plane1 plane2 - airplane
  )
  
  (:init
    (in-city malpensa milan)
    (in-city milancenter milan)
    (in-city milanstation milan)
    (in-city fiumicino rome)
    (in-city romecenter rome)
    (in-city termini rome)
    (in-city capodichino naples)
    (in-city naplescenter naples)
    (in-city naplesport naples)
    (at truckmilan milancenter)
    (at truckrome romecenter)
    (at trucknaples naplesport)
    (at plane1 malpensa)
    (at plane2 fiumicino)
    (at pack1 milanstation)
    (at pack2 milancenter)
    (at pack3 termini)
    (at pack4 romecenter)
    (at pack5 naplescenter)


    (= (capacity truckmilan) 4)
    (= (capacity truckrome) 3)
    (= (capacity trucknaples) 3)
    (= (capacity plane1) 8)
    (= (capacity plane2) 9)
    
    (= (current-load truckmilan) 0)
    (= (current-load truckrome) 0)
    (= (current-load trucknaples) 0)
    (= (current-load plane1) 0)
    (= (current-load plane2) 0)
  )
  
  (:goal
    (and
      (at pack1 romecenter)
      (at pack2 naplesport)
      (at pack3 milancenter)
      (at pack4 naplescenter)
      (at pack5 termini)
    )
  )
)`
export const plan1_numeric = `domain parsed
problem parsed
grounding..
grounding time: 47
aibr preprocessing
|f|:85
|x|:5
|a|:195
|p|:0
|e|:0
h1 setup time (msec): 15
 g(n)= 1.0 h(n)=48.0
 g(n)= 2.0 h(n)=46.0
 g(n)= 3.0 h(n)=45.0
 g(n)= 4.0 h(n)=43.0
 g(n)= 5.0 h(n)=42.0
 g(n)= 6.0 h(n)=41.0
 g(n)= 7.0 h(n)=40.0
 g(n)= 8.0 h(n)=39.0
 g(n)= 9.0 h(n)=38.0
 g(n)= 11.0 h(n)=37.0
 g(n)= 12.0 h(n)=36.0
 g(n)= 13.0 h(n)=35.0
 g(n)= 14.0 h(n)=34.0
 g(n)= 15.0 h(n)=33.0
 g(n)= 16.0 h(n)=32.0
 g(n)= 17.0 h(n)=31.0
 g(n)= 19.0 h(n)=30.0
 g(n)= 20.0 h(n)=29.0
 g(n)= 23.0 h(n)=27.0
 g(n)= 24.0 h(n)=26.0
 g(n)= 26.0 h(n)=25.0
 g(n)= 27.0 h(n)=24.0
 g(n)= 28.0 h(n)=23.0
 g(n)= 29.0 h(n)=22.0
 g(n)= 31.0 h(n)=21.0
 g(n)= 32.0 h(n)=20.0
 g(n)= 33.0 h(n)=19.0
 g(n)= 34.0 h(n)=18.0
 g(n)= 35.0 h(n)=16.0
 g(n)= 36.0 h(n)=15.0
 g(n)= 37.0 h(n)=14.0
 g(n)= 38.0 h(n)=13.0
 g(n)= 39.0 h(n)=12.0
 g(n)= 40.0 h(n)=11.0
 g(n)= 41.0 h(n)=10.0
 g(n)= 42.0 h(n)=9.0
 g(n)= 43.0 h(n)=8.0
 g(n)= 44.0 h(n)=7.0
 g(n)= 45.0 h(n)=6.0
 g(n)= 46.0 h(n)=5.0
 g(n)= 47.0 h(n)=4.0
 g(n)= 48.0 h(n)=3.0
 g(n)= 49.0 h(n)=2.0
 g(n)= 50.0 h(n)=1.0
problem solved

found plan:
0.0: (drive-truck trucknaples naplesport capodichino naples)
1.0: (drive-truck truckrome romecenter fiumicino rome)
2.0: (load-truck pack2 truckmilan milancenter)
3.0: (drive-truck truckmilan milancenter malpensa milan)
4.0: (unload-truck pack2 truckmilan malpensa)
5.0: (load-airplane pack2 plane1 malpensa)
6.0: (fly-airplane plane1 malpensa capodichino)
7.0: (unload-airplane pack2 plane1 capodichino)
8.0: (load-truck pack2 trucknaples capodichino)
9.0: (drive-truck trucknaples capodichino naplescenter naples)
10.0: (load-truck pack5 trucknaples naplescenter)
11.0: (drive-truck trucknaples naplescenter capodichino naples)
12.0: (unload-truck pack5 trucknaples capodichino)
13.0: (load-airplane pack5 plane1 capodichino)
14.0: (fly-airplane plane1 capodichino fiumicino)
15.0: (unload-airplane pack5 plane1 fiumicino)
16.0: (load-truck pack5 truckrome fiumicino)
17.0: (drive-truck trucknaples capodichino naplesport naples)
18.0: (unload-truck pack2 trucknaples naplesport)
19.0: (drive-truck trucknaples naplesport capodichino naples)
20.0: (drive-truck truckmilan malpensa milanstation milan)
21.0: (load-truck pack1 truckmilan milanstation)
22.0: (drive-truck truckmilan milanstation malpensa milan)
23.0: (unload-truck pack1 truckmilan malpensa)
24.0: (fly-airplane plane2 fiumicino malpensa)
25.0: (load-airplane pack1 plane2 malpensa)
26.0: (fly-airplane plane2 malpensa fiumicino)
27.0: (unload-airplane pack1 plane2 fiumicino)
28.0: (load-truck pack1 truckrome fiumicino)
29.0: (drive-truck truckrome fiumicino romecenter rome)
30.0: (load-truck pack4 truckrome romecenter)
31.0: (drive-truck truckrome romecenter termini rome)
32.0: (unload-truck pack5 truckrome termini)
33.0: (load-truck pack3 truckrome termini)
34.0: (drive-truck truckrome termini fiumicino rome)
35.0: (unload-truck pack4 truckrome fiumicino)
36.0: (load-airplane pack4 plane1 fiumicino)
37.0: (fly-airplane plane1 fiumicino capodichino)
38.0: (unload-truck pack3 truckrome fiumicino)
39.0: (drive-truck truckrome fiumicino romecenter rome)
40.0: (load-airplane pack3 plane2 fiumicino)
41.0: (fly-airplane plane2 fiumicino malpensa)
42.0: (unload-airplane pack4 plane1 capodichino)
43.0: (unload-airplane pack3 plane2 malpensa)
44.0: (load-truck pack4 trucknaples capodichino)
45.0: (drive-truck trucknaples capodichino naplescenter naples)
46.0: (load-truck pack3 truckmilan malpensa)
47.0: (drive-truck truckmilan malpensa milancenter milan)
48.0: (unload-truck pack4 trucknaples naplescenter)
49.0: (unload-truck pack3 truckmilan milancenter)
50.0: (unload-truck pack1 truckrome romecenter)

plan-length:51
metric (search):51.0
planning time (msec): 175
heuristic time (msec): 141
search time (msec): 171
expanded nodes:88
states evaluated:839
number of dead-ends detected:185
number of duplicates detected:442`;
export const prob2_classic = `(define (problem logistics-delivery)
  (:domain logistics)
  
  (:objects
    turin bologna florence venice - city
    caselle marconi peretola marcotessera - airport
    piazzacastello lingotto - location
    bolognastation mercato - location
    duomo pontevecchio - location
    sanmarco rialto - location
    pack1 pack2 pack3 pack4 pack5 pack6 - package
    truckturin truckbologna truckflorence truckvenice - truck
    plane1 plane2 plane3 - airplane
  )
  
  (:init
    (in-city caselle turin)
    (in-city piazzacastello turin)
    (in-city lingotto turin)
    (in-city marconi bologna)
    (in-city bolognastation bologna)
    (in-city mercato bologna)
    (in-city peretola florence)
    (in-city duomo florence)
    (in-city pontevecchio florence)
    (in-city marcotessera venice)
    (in-city sanmarco venice)
    (in-city rialto venice)
    (at truckturin lingotto)
    (at truckbologna mercato)
    (at truckflorence duomo)
    (at truckvenice sanmarco)
    (at plane1 caselle)
    (at plane2 marconi)
    (at plane3 marcotessera)
    (at pack1 piazzacastello)
    (at pack2 bolognastation)
    (at pack3 lingotto)
    (at pack4 pontevecchio)
    (at pack5 sanmarco)
    (at pack6 rialto)
    
  )
  
  (:goal
    (and
      (at pack1 mercato)
      (at pack2 duomo)
      (at pack3 bolognastation)
      (at pack4 piazzacastello)
      (at pack5 lingotto)
      (at pack6 pontevecchio)
    )
  )
)`;
export const plan2_classic = `domain parsed
problem parsed
grounding..
grounding time: 49
aibr preprocessing
|f|:138
|x|:0
|a|:372
|p|:0
|e|:0
h1 setup time (msec): 19
 g(n)= 1.0 h(n)=59.0
 g(n)= 2.0 h(n)=57.0
 g(n)= 3.0 h(n)=55.0
 g(n)= 4.0 h(n)=54.0
 g(n)= 5.0 h(n)=52.0
 g(n)= 6.0 h(n)=51.0
 g(n)= 7.0 h(n)=50.0
 g(n)= 9.0 h(n)=49.0
 g(n)= 10.0 h(n)=48.0
 g(n)= 11.0 h(n)=47.0
 g(n)= 14.0 h(n)=46.0
 g(n)= 15.0 h(n)=45.0
 g(n)= 16.0 h(n)=44.0
 g(n)= 18.0 h(n)=43.0
 g(n)= 19.0 h(n)=42.0
 g(n)= 20.0 h(n)=41.0
 g(n)= 21.0 h(n)=40.0
 g(n)= 24.0 h(n)=39.0
 g(n)= 25.0 h(n)=38.0
 g(n)= 26.0 h(n)=37.0
 g(n)= 27.0 h(n)=36.0
 g(n)= 29.0 h(n)=35.0
 g(n)= 30.0 h(n)=34.0
 g(n)= 31.0 h(n)=33.0
 g(n)= 33.0 h(n)=32.0
 g(n)= 34.0 h(n)=31.0
 g(n)= 35.0 h(n)=30.0
 g(n)= 36.0 h(n)=29.0
 g(n)= 37.0 h(n)=28.0
 g(n)= 38.0 h(n)=27.0
 g(n)= 39.0 h(n)=26.0
 g(n)= 40.0 h(n)=25.0
 g(n)= 41.0 h(n)=24.0
 g(n)= 42.0 h(n)=23.0
 g(n)= 43.0 h(n)=22.0
 g(n)= 44.0 h(n)=21.0
 g(n)= 45.0 h(n)=20.0
 g(n)= 46.0 h(n)=19.0
 g(n)= 47.0 h(n)=18.0
 g(n)= 48.0 h(n)=17.0
 g(n)= 49.0 h(n)=16.0
 g(n)= 50.0 h(n)=15.0
 g(n)= 51.0 h(n)=14.0
 g(n)= 52.0 h(n)=13.0
 g(n)= 53.0 h(n)=12.0
 g(n)= 54.0 h(n)=11.0
 g(n)= 55.0 h(n)=10.0
 g(n)= 56.0 h(n)=9.0
 g(n)= 57.0 h(n)=8.0
 g(n)= 58.0 h(n)=7.0
 g(n)= 59.0 h(n)=6.0
 g(n)= 60.0 h(n)=5.0
 g(n)= 61.0 h(n)=4.0
 g(n)= 62.0 h(n)=3.0
 g(n)= 63.0 h(n)=2.0
 g(n)= 64.0 h(n)=1.0
problem solved

found plan:
0.0: (drive-truck truckturin lingotto caselle turin)
1.0: (drive-truck truckbologna mercato marconi bologna)
2.0: (drive-truck truckflorence duomo peretola florence)
3.0: (load-truck pack5 truckvenice sanmarco)
4.0: (drive-truck truckvenice sanmarco marcotessera venice)
5.0: (unload-truck pack5 truckvenice marcotessera)
6.0: (load-airplane pack5 plane3 marcotessera)
7.0: (fly-airplane plane2 marconi peretola)
8.0: (fly-airplane plane3 marcotessera caselle)
9.0: (unload-airplane pack5 plane3 caselle)
10.0: (load-truck pack5 truckturin caselle)
11.0: (fly-airplane plane1 caselle peretola)
12.0: (drive-truck truckvenice marcotessera rialto venice)
13.0: (load-truck pack6 truckvenice rialto)
14.0: (drive-truck truckvenice rialto marcotessera venice)
15.0: (unload-truck pack6 truckvenice marcotessera)
16.0: (fly-airplane plane2 peretola marcotessera)
17.0: (load-airplane pack6 plane2 marcotessera)
18.0: (fly-airplane plane2 marcotessera peretola)
19.0: (unload-airplane pack6 plane2 peretola)
20.0: (load-truck pack6 truckflorence peretola)
21.0: (fly-airplane plane2 peretola caselle)
22.0: (drive-truck truckflorence peretola pontevecchio florence)
23.0: (load-truck pack4 truckflorence pontevecchio)
24.0: (drive-truck truckflorence pontevecchio peretola florence)
25.0: (unload-truck pack4 truckflorence peretola)
26.0: (load-airplane pack4 plane1 peretola)
27.0: (fly-airplane plane2 caselle marconi)
28.0: (fly-airplane plane1 peretola caselle)
29.0: (unload-airplane pack4 plane1 caselle)
30.0: (load-truck pack4 truckturin caselle)
31.0: (drive-truck truckturin caselle piazzacastello turin)
32.0: (load-truck pack1 truckturin piazzacastello)
33.0: (drive-truck truckturin piazzacastello caselle turin)
34.0: (unload-truck pack1 truckturin caselle)
35.0: (drive-truck truckturin caselle lingotto turin)
36.0: (load-truck pack3 truckturin lingotto)
37.0: (load-airplane pack1 plane1 caselle)
38.0: (fly-airplane plane1 caselle marconi)
39.0: (unload-airplane pack1 plane1 marconi)
40.0: (load-truck pack1 truckbologna marconi)
41.0: (unload-truck pack5 truckturin lingotto)
42.0: (drive-truck truckturin lingotto caselle turin)
43.0: (unload-truck pack3 truckturin caselle)
44.0: (drive-truck truckturin caselle piazzacastello turin)
45.0: (load-airplane pack3 plane3 caselle)
46.0: (fly-airplane plane3 caselle marconi)
47.0: (unload-airplane pack3 plane3 marconi)
48.0: (load-truck pack3 truckbologna marconi)
49.0: (drive-truck truckbologna marconi bolognastation bologna)
50.0: (load-truck pack2 truckbologna bolognastation)
51.0: (unload-truck pack3 truckbologna bolognastation)
52.0: (drive-truck truckbologna bolognastation marconi bologna)
53.0: (unload-truck pack2 truckbologna marconi)
54.0: (drive-truck truckbologna marconi mercato bologna)
55.0: (load-airplane pack2 plane1 marconi)
56.0: (fly-airplane plane1 marconi peretola)
57.0: (unload-airplane pack2 plane1 peretola)
58.0: (load-truck pack2 truckflorence peretola)
59.0: (drive-truck truckflorence peretola duomo florence)
60.0: (unload-truck pack4 truckturin piazzacastello)
61.0: (unload-truck pack2 truckflorence duomo)
62.0: (drive-truck truckflorence duomo pontevecchio florence)
63.0: (unload-truck pack6 truckflorence pontevecchio)
64.0: (unload-truck pack1 truckbologna mercato)

plan-length:65
metric (search):65.0
planning time (msec): 345
heuristic time (msec): 305
search time (msec): 341
expanded nodes:86
states evaluated:1696
number of dead-ends detected:271
number of duplicates detected:322`;
export const prob2_numeric =`(define (problem logistics-delivery)
  (:domain logistics)
  
  (:objects
    turin bologna florence venice - city
    caselle marconi peretola marcotessera - airport
    piazzacastello lingotto - location
    bolognastation mercato - location
    duomo pontevecchio - location
    sanmarco rialto - location
    pack1 pack2 pack3 pack4 pack5 pack6 - package
    truckturin truckbologna truckflorence truckvenice - truck
    plane1 plane2 plane3 - airplane
  )
  
  (:init
    (in-city caselle turin)
    (in-city piazzacastello turin)
    (in-city lingotto turin)
    (in-city marconi bologna)
    (in-city bolognastation bologna)
    (in-city mercato bologna)
    (in-city peretola florence)
    (in-city duomo florence)
    (in-city pontevecchio florence)
    (in-city marcotessera venice)
    (in-city sanmarco venice)
    (in-city rialto venice)
    (at truckturin lingotto)
    (at truckbologna mercato)
    (at truckflorence duomo)
    (at truckvenice sanmarco)
    (at plane1 caselle)
    (at plane2 marconi)
    (at plane3 marcotessera)
    (at pack1 piazzacastello)
    (at pack2 bolognastation)
    (at pack3 lingotto)
    (at pack4 pontevecchio)
    (at pack5 sanmarco)
    (at pack6 rialto)
    (= (capacity truckturin) 4)
    (= (capacity truckbologna) 3)
    (= (capacity truckflorence) 3)
    (= (capacity truckvenice) 2)
    (= (capacity plane1) 8)
    (= (capacity plane2) 9)
    (= (capacity plane3) 6)
    
    (= (current-load truckturin) 0)
    (= (current-load truckbologna) 0)
    (= (current-load truckflorence) 0)
    (= (current-load truckvenice) 0)
    (= (current-load plane1) 0)
    (= (current-load plane2) 0)
    (= (current-load plane3) 0)
  )
  
  (:goal
    (and
      (at pack1 mercato)
      (at pack2 duomo)
      (at pack3 bolognastation)
      (at pack4 piazzacastello)
      (at pack5 lingotto)
      (at pack6 pontevecchio)
    )
  )
)`;
export const plan2_numeric =`domain parsed
problem parsed
grounding..
grounding time: 59
aibr preprocessing
|f|:138
|x|:7
|a|:372
|p|:0
|e|:0
h1 setup time (msec): 18
 g(n)= 1.0 h(n)=59.0
 g(n)= 2.0 h(n)=57.0
 g(n)= 3.0 h(n)=55.0
 g(n)= 4.0 h(n)=54.0
 g(n)= 5.0 h(n)=52.0
 g(n)= 6.0 h(n)=51.0
 g(n)= 7.0 h(n)=50.0
 g(n)= 9.0 h(n)=49.0
 g(n)= 10.0 h(n)=48.0
 g(n)= 11.0 h(n)=47.0
 g(n)= 14.0 h(n)=46.0
 g(n)= 15.0 h(n)=45.0
 g(n)= 16.0 h(n)=44.0
 g(n)= 18.0 h(n)=43.0
 g(n)= 19.0 h(n)=42.0
 g(n)= 20.0 h(n)=41.0
 g(n)= 21.0 h(n)=40.0
 g(n)= 24.0 h(n)=39.0
 g(n)= 25.0 h(n)=38.0
 g(n)= 26.0 h(n)=37.0
 g(n)= 28.0 h(n)=36.0
 g(n)= 29.0 h(n)=35.0
 g(n)= 30.0 h(n)=34.0
 g(n)= 31.0 h(n)=33.0
 g(n)= 33.0 h(n)=32.0
 g(n)= 34.0 h(n)=31.0
 g(n)= 35.0 h(n)=30.0
 g(n)= 36.0 h(n)=29.0
 g(n)= 37.0 h(n)=28.0
 g(n)= 38.0 h(n)=27.0
 g(n)= 39.0 h(n)=26.0
 g(n)= 40.0 h(n)=25.0
 g(n)= 41.0 h(n)=24.0
 g(n)= 42.0 h(n)=23.0
 g(n)= 43.0 h(n)=22.0
 g(n)= 44.0 h(n)=21.0
 g(n)= 45.0 h(n)=20.0
 g(n)= 46.0 h(n)=19.0
 g(n)= 47.0 h(n)=18.0
 g(n)= 48.0 h(n)=17.0
 g(n)= 49.0 h(n)=16.0
 g(n)= 50.0 h(n)=15.0
 g(n)= 51.0 h(n)=14.0
 g(n)= 52.0 h(n)=13.0
 g(n)= 53.0 h(n)=12.0
 g(n)= 54.0 h(n)=11.0
 g(n)= 55.0 h(n)=10.0
 g(n)= 56.0 h(n)=9.0
 g(n)= 57.0 h(n)=8.0
 g(n)= 58.0 h(n)=7.0
 g(n)= 59.0 h(n)=6.0
 g(n)= 60.0 h(n)=5.0
 g(n)= 61.0 h(n)=4.0
 g(n)= 62.0 h(n)=3.0
 g(n)= 63.0 h(n)=2.0
 g(n)= 64.0 h(n)=1.0
problem solved

found plan:
0.0: (drive-truck truckturin lingotto caselle turin)
1.0: (drive-truck truckbologna mercato marconi bologna)
2.0: (drive-truck truckflorence duomo peretola florence)
3.0: (load-truck pack5 truckvenice sanmarco)
4.0: (drive-truck truckvenice sanmarco marcotessera venice)
5.0: (unload-truck pack5 truckvenice marcotessera)
6.0: (load-airplane pack5 plane3 marcotessera)
7.0: (fly-airplane plane2 marconi peretola)
8.0: (fly-airplane plane3 marcotessera caselle)
9.0: (unload-airplane pack5 plane3 caselle)
10.0: (load-truck pack5 truckturin caselle)
11.0: (fly-airplane plane1 caselle marconi)
12.0: (drive-truck truckvenice marcotessera rialto venice)
13.0: (load-truck pack6 truckvenice rialto)
14.0: (drive-truck truckvenice rialto marcotessera venice)
15.0: (unload-truck pack6 truckvenice marcotessera)
16.0: (fly-airplane plane2 peretola marcotessera)
17.0: (load-airplane pack6 plane2 marcotessera)
18.0: (fly-airplane plane2 marcotessera peretola)
19.0: (unload-airplane pack6 plane2 peretola)
20.0: (load-truck pack6 truckflorence peretola)
21.0: (fly-airplane plane2 peretola marcotessera)
22.0: (drive-truck truckflorence peretola pontevecchio florence)
23.0: (load-truck pack4 truckflorence pontevecchio)
24.0: (drive-truck truckflorence pontevecchio peretola florence)
25.0: (unload-truck pack4 truckflorence peretola)
26.0: (fly-airplane plane2 marcotessera peretola)
27.0: (load-airplane pack4 plane2 peretola)
28.0: (fly-airplane plane2 peretola caselle)
29.0: (unload-airplane pack4 plane2 caselle)
30.0: (load-truck pack4 truckturin caselle)
31.0: (drive-truck truckturin caselle piazzacastello turin)
32.0: (load-truck pack1 truckturin piazzacastello)
33.0: (drive-truck truckturin piazzacastello caselle turin)
34.0: (unload-truck pack1 truckturin caselle)
35.0: (drive-truck truckturin caselle lingotto turin)
36.0: (load-truck pack3 truckturin lingotto)
37.0: (load-airplane pack1 plane3 caselle)
38.0: (fly-airplane plane3 caselle marconi)
39.0: (unload-airplane pack1 plane3 marconi)
40.0: (load-truck pack1 truckbologna marconi)
41.0: (unload-truck pack5 truckturin lingotto)
42.0: (drive-truck truckturin lingotto caselle turin)
43.0: (unload-truck pack3 truckturin caselle)
44.0: (drive-truck truckturin caselle piazzacastello turin)
45.0: (load-airplane pack3 plane2 caselle)
46.0: (fly-airplane plane2 caselle marconi)
47.0: (unload-airplane pack3 plane2 marconi)
48.0: (load-truck pack3 truckbologna marconi)
49.0: (drive-truck truckbologna marconi bolognastation bologna)
50.0: (load-truck pack2 truckbologna bolognastation)
51.0: (unload-truck pack3 truckbologna bolognastation)
52.0: (drive-truck truckbologna bolognastation marconi bologna)
53.0: (unload-truck pack2 truckbologna marconi)
54.0: (drive-truck truckbologna marconi mercato bologna)
55.0: (load-airplane pack2 plane1 marconi)
56.0: (fly-airplane plane1 marconi peretola)
57.0: (unload-airplane pack2 plane1 peretola)
58.0: (load-truck pack2 truckflorence peretola)
59.0: (drive-truck truckflorence peretola pontevecchio florence)
60.0: (unload-truck pack4 truckturin piazzacastello)
61.0: (unload-truck pack6 truckflorence pontevecchio)
62.0: (drive-truck truckflorence pontevecchio duomo florence)
63.0: (unload-truck pack2 truckflorence duomo)
64.0: (unload-truck pack1 truckbologna mercato)

plan-length:65
metric (search):65.0
planning time (msec): 381
heuristic time (msec): 342
search time (msec): 377
expanded nodes:89
states evaluated:1720
number of dead-ends detected:202
number of duplicates detected:442`; 
export const prob3_classic = `(define (problem logistics-five-cities)
  (:domain logistics)
  
  (:objects
    milan rome naples turin bologna - city
    malpensa fiumicino capodichino caselle marconi - airport
    milancenter milanstation navigli - location
    romecenter termini trastevere - location
    naplescenter naplesport quartierispagnoli - location
    centroturin portanuova lingotto - location
    centrobologna bolognastation universitabologna - location
    pack1 pack2 pack3 pack4 pack5 pack6 pack7 pack8 - package
    truckmilan truckrome trucknaples truckturin truckbologna - truck
    plane1 plane2 plane3 - airplane
  )
  
  (:init
    (in-city malpensa milan)
    (in-city fiumicino rome)
    (in-city capodichino naples)
    (in-city caselle turin)
    (in-city marconi bologna)
    (in-city milancenter milan)
    (in-city milanstation milan)
    (in-city navigli milan)
    (in-city romecenter rome)
    (in-city termini rome)
    (in-city trastevere rome)
    (in-city naplescenter naples)
    (in-city naplesport naples)
    (in-city quartierispagnoli naples)
    (in-city centroturin turin)
    (in-city portanuova turin)
    (in-city lingotto turin)
    (in-city centrobologna bologna)
    (in-city bolognastation bologna)
    (in-city universitabologna bologna)
    (at truckmilan milancenter)
    (at truckrome romecenter)
    (at trucknaples naplescenter)
    (at truckturin centroturin)
    (at truckbologna centrobologna)
    (at plane1 malpensa)
    (at plane2 fiumicino)
    (at plane3 caselle)
    (at pack1 milanstation)
    (at pack2 navigli)
    (at pack3 termini)
    (at pack4 trastevere)
    (at pack5 naplesport)
    (at pack6 quartierispagnoli)
    (at pack7 portanuova)
    (at pack8 universitabologna)
  )
  
  (:goal
    (and
      (at pack1 romecenter)
      (at pack2 naplesport)
      (at pack3 navigli)
      (at pack4 naplescenter)
      (at pack5 lingotto)
      (at pack6 bolognastation)
      (at pack7 trastevere)
      (at pack8 milanstation)
    )
  )
)`;
export const plan3_classic = `domain parsed
problem parsed
grounding..
grounding time: 71
aibr preprocessing
|f|:259
|x|:0
|a|:715
|p|:0
|e|:0
h1 setup time (msec): 22
 g(n)= 1.0 h(n)=83.0
 g(n)= 2.0 h(n)=80.0
 g(n)= 3.0 h(n)=77.0
 g(n)= 4.0 h(n)=75.0
 g(n)= 5.0 h(n)=73.0
 g(n)= 6.0 h(n)=72.0
 g(n)= 10.0 h(n)=70.0
 g(n)= 11.0 h(n)=69.0
 g(n)= 13.0 h(n)=68.0
 g(n)= 14.0 h(n)=67.0
 g(n)= 15.0 h(n)=66.0
 g(n)= 16.0 h(n)=65.0
 g(n)= 22.0 h(n)=63.0
 g(n)= 23.0 h(n)=62.0
 g(n)= 25.0 h(n)=61.0
 g(n)= 27.0 h(n)=60.0
 g(n)= 28.0 h(n)=59.0
 g(n)= 29.0 h(n)=58.0
 g(n)= 30.0 h(n)=57.0
 g(n)= 31.0 h(n)=56.0
 g(n)= 32.0 h(n)=55.0
 g(n)= 33.0 h(n)=54.0
 g(n)= 35.0 h(n)=53.0
 g(n)= 36.0 h(n)=52.0
 g(n)= 37.0 h(n)=51.0
 g(n)= 39.0 h(n)=50.0
 g(n)= 40.0 h(n)=49.0
 g(n)= 46.0 h(n)=47.0
 g(n)= 47.0 h(n)=46.0
 g(n)= 48.0 h(n)=45.0
 g(n)= 51.0 h(n)=44.0
 g(n)= 52.0 h(n)=43.0
 g(n)= 53.0 h(n)=42.0
 g(n)= 55.0 h(n)=41.0
 g(n)= 56.0 h(n)=40.0
 g(n)= 57.0 h(n)=39.0
 g(n)= 58.0 h(n)=38.0
 g(n)= 59.0 h(n)=37.0
 g(n)= 60.0 h(n)=36.0
 g(n)= 61.0 h(n)=35.0
 g(n)= 62.0 h(n)=34.0
 g(n)= 63.0 h(n)=33.0
 g(n)= 65.0 h(n)=32.0
 g(n)= 66.0 h(n)=31.0
 g(n)= 67.0 h(n)=30.0
 g(n)= 68.0 h(n)=29.0
 g(n)= 69.0 h(n)=28.0
 g(n)= 70.0 h(n)=27.0
 g(n)= 71.0 h(n)=26.0
 g(n)= 73.0 h(n)=25.0
 g(n)= 74.0 h(n)=24.0
 g(n)= 75.0 h(n)=23.0
 g(n)= 76.0 h(n)=22.0
 g(n)= 77.0 h(n)=21.0
 g(n)= 78.0 h(n)=20.0
 g(n)= 79.0 h(n)=19.0
 g(n)= 80.0 h(n)=18.0
 g(n)= 81.0 h(n)=17.0
 g(n)= 82.0 h(n)=16.0
 g(n)= 84.0 h(n)=15.0
 g(n)= 85.0 h(n)=14.0
 g(n)= 86.0 h(n)=13.0
 g(n)= 87.0 h(n)=12.0
 g(n)= 88.0 h(n)=11.0
 g(n)= 89.0 h(n)=10.0
 g(n)= 90.0 h(n)=9.0
 g(n)= 92.0 h(n)=8.0
 g(n)= 93.0 h(n)=7.0
 g(n)= 94.0 h(n)=6.0
 g(n)= 96.0 h(n)=5.0
 g(n)= 97.0 h(n)=4.0
 g(n)= 98.0 h(n)=3.0
 g(n)= 100.0 h(n)=2.0
 g(n)= 101.0 h(n)=1.0
problem solved

found plan:
0.0: (drive-truck truckmilan milancenter malpensa milan)
1.0: (drive-truck trucknaples naplescenter capodichino naples)
2.0: (drive-truck truckrome romecenter fiumicino rome)
3.0: (drive-truck truckbologna centrobologna marconi bologna)
4.0: (drive-truck truckturin centroturin caselle turin)
5.0: (fly-airplane plane2 fiumicino capodichino)
6.0: (fly-airplane plane3 caselle fiumicino)
7.0: (drive-truck truckbologna marconi universitabologna bologna)
8.0: (load-truck pack8 truckbologna universitabologna)
9.0: (drive-truck truckbologna universitabologna marconi bologna)
10.0: (unload-truck pack8 truckbologna marconi)
11.0: (fly-airplane plane1 malpensa marconi)
12.0: (load-airplane pack8 plane1 marconi)
13.0: (fly-airplane plane1 marconi malpensa)
14.0: (unload-airplane pack8 plane1 malpensa)
15.0: (load-truck pack8 truckmilan malpensa)
16.0: (fly-airplane plane1 malpensa capodichino)
17.0: (drive-truck truckbologna marconi bolognastation bologna)
18.0: (fly-airplane plane2 capodichino caselle)
19.0: (drive-truck truckmilan malpensa navigli milan)
20.0: (load-truck pack2 truckmilan navigli)
21.0: (drive-truck truckmilan navigli malpensa milan)
22.0: (unload-truck pack2 truckmilan malpensa)
23.0: (fly-airplane plane3 fiumicino malpensa)
24.0: (load-airplane pack2 plane3 malpensa)
25.0: (drive-truck truckmilan malpensa milanstation milan)
26.0: (load-truck pack1 truckmilan milanstation)
27.0: (drive-truck truckmilan milanstation malpensa milan)
28.0: (unload-truck pack1 truckmilan malpensa)
29.0: (load-airplane pack1 plane3 malpensa)
30.0: (fly-airplane plane3 malpensa fiumicino)
31.0: (unload-airplane pack1 plane3 fiumicino)
32.0: (load-truck pack1 truckrome fiumicino)
33.0: (fly-airplane plane3 fiumicino capodichino)
34.0: (fly-airplane plane1 capodichino malpensa)
35.0: (unload-airplane pack2 plane3 capodichino)
36.0: (load-truck pack2 trucknaples capodichino)
37.0: (drive-truck truckmilan malpensa milanstation milan)
38.0: (unload-truck pack8 truckmilan milanstation)
39.0: (drive-truck truckmilan milanstation navigli milan)
40.0: (fly-airplane plane1 malpensa fiumicino)
41.0: (fly-airplane plane2 caselle malpensa)
42.0: (fly-airplane plane1 fiumicino caselle)
43.0: (drive-truck trucknaples capodichino naplesport naples)
44.0: (load-truck pack5 trucknaples naplesport)
45.0: (drive-truck trucknaples naplesport capodichino naples)
46.0: (unload-truck pack5 trucknaples capodichino)
47.0: (load-airplane pack5 plane3 capodichino)
48.0: (fly-airplane plane1 caselle fiumicino)
49.0: (fly-airplane plane3 capodichino caselle)
50.0: (fly-airplane plane1 fiumicino capodichino)
51.0: (unload-airplane pack5 plane3 caselle)
52.0: (load-truck pack5 truckturin caselle)
53.0: (drive-truck truckturin caselle lingotto turin)
54.0: (unload-truck pack5 truckturin lingotto)
55.0: (drive-truck truckturin lingotto portanuova turin)
56.0: (load-truck pack7 truckturin portanuova)
57.0: (drive-truck truckturin portanuova caselle turin)
58.0: (unload-truck pack7 truckturin caselle)
59.0: (load-airplane pack7 plane3 caselle)
60.0: (fly-airplane plane3 caselle fiumicino)
61.0: (unload-airplane pack7 plane3 fiumicino)
62.0: (load-truck pack7 truckrome fiumicino)
63.0: (drive-truck truckrome fiumicino trastevere rome)
64.0: (load-truck pack4 truckrome trastevere)
65.0: (drive-truck truckrome trastevere fiumicino rome)
66.0: (unload-truck pack4 truckrome fiumicino)
67.0: (load-airplane pack4 plane3 fiumicino)
68.0: (fly-airplane plane3 fiumicino capodichino)
69.0: (unload-airplane pack4 plane3 capodichino)
70.0: (load-truck pack4 trucknaples capodichino)
71.0: (drive-truck trucknaples capodichino quartierispagnoli naples)
72.0: (load-truck pack6 trucknaples quartierispagnoli)
73.0: (drive-truck trucknaples quartierispagnoli naplescenter naples)
74.0: (unload-truck pack4 trucknaples naplescenter)
75.0: (drive-truck trucknaples naplescenter capodichino naples)
76.0: (unload-truck pack6 trucknaples capodichino)
77.0: (drive-truck trucknaples capodichino naplesport naples)
78.0: (load-airplane pack6 plane1 capodichino)
79.0: (fly-airplane plane1 capodichino marconi)
80.0: (unload-airplane pack6 plane1 marconi)
81.0: (unload-truck pack2 trucknaples naplesport)
82.0: (drive-truck truckrome fiumicino trastevere rome)
83.0: (unload-truck pack7 truckrome trastevere)
84.0: (drive-truck truckrome trastevere romecenter rome)
85.0: (unload-truck pack1 truckrome romecenter)
86.0: (drive-truck truckrome romecenter termini rome)
87.0: (load-truck pack3 truckrome termini)
88.0: (drive-truck truckrome termini fiumicino rome)
89.0: (unload-truck pack3 truckrome fiumicino)
90.0: (fly-airplane plane3 capodichino fiumicino)
91.0: (load-airplane pack3 plane3 fiumicino)
92.0: (fly-airplane plane3 fiumicino malpensa)
93.0: (unload-airplane pack3 plane3 malpensa)
94.0: (drive-truck truckmilan navigli malpensa milan)
95.0: (load-truck pack3 truckmilan malpensa)
96.0: (drive-truck truckmilan malpensa navigli milan)
97.0: (unload-truck pack3 truckmilan navigli)
98.0: (drive-truck truckbologna bolognastation marconi bologna)
99.0: (load-truck pack6 truckbologna marconi)
100.0: (drive-truck truckbologna marconi bolognastation bologna)
101.0: (unload-truck pack6 truckbologna bolognastation)

plan-length:102
metric (search):102.0
planning time (msec): 3710
heuristic time (msec): 3603
search time (msec): 3705
expanded nodes:503
states evaluated:10584
number of dead-ends detected:2248
number of duplicates detected:5529`;

export const prob3_numeric =`(define (problem logistics-five-cities)
  (:domain logistics)
  
  (:objects
    milan rome naples turin bologna - city
    malpensa fiumicino capodichino caselle marconi - airport
    milancenter milanstation navigli - location
    romecenter termini trastevere - location
    naplescenter naplesport quartierispagnoli - location
    centroturin portanuova lingotto - location
    centrobologna bolognastation universitabologna - location
    pack1 pack2 pack3 pack4 pack5 pack6 pack7 pack8 - package
    truckmilan truckrome trucknaples truckturin truckbologna - truck
    plane1 plane2 plane3 - airplane
  )
  
  (:init
    (in-city malpensa milan)
    (in-city fiumicino rome)
    (in-city capodichino naples)
    (in-city caselle turin)
    (in-city marconi bologna)
    (in-city milancenter milan)
    (in-city milanstation milan)
    (in-city navigli milan)
    (in-city romecenter rome)
    (in-city termini rome)
    (in-city trastevere rome)
    (in-city naplescenter naples)
    (in-city naplesport naples)
    (in-city quartierispagnoli naples)
    (in-city centroturin turin)
    (in-city portanuova turin)
    (in-city lingotto turin)
    (in-city centrobologna bologna)
    (in-city bolognastation bologna)
    (in-city universitabologna bologna)
    (at truckmilan milancenter)
    (at truckrome romecenter)
    (at trucknaples naplescenter)
    (at truckturin centroturin)
    (at truckbologna centrobologna)
    (at plane1 malpensa)
    (at plane2 fiumicino)
    (at plane3 caselle)
    (at pack1 milanstation)
    (at pack2 navigli)
    (at pack3 termini)
    (at pack4 trastevere)
    (at pack5 naplesport)
    (at pack6 quartierispagnoli)
    (at pack7 portanuova)
    (at pack8 universitabologna)
    
    (= (capacity truckmilan) 4)
    (= (capacity truckrome) 5)
    (= (capacity trucknaples) 3)
    (= (capacity truckturin) 4)
    (= (capacity truckbologna) 3)
    (= (capacity plane1) 10)
    (= (capacity plane2) 8)
    (= (capacity plane3) 6)
    
    (= (current-load truckmilan) 0)
    (= (current-load truckrome) 0)
    (= (current-load trucknaples) 0)
    (= (current-load truckturin) 0)
    (= (current-load truckbologna) 0)
    (= (current-load plane1) 0)
    (= (current-load plane2) 0)
    (= (current-load plane3) 0)
  )
  
  (:goal
    (and
      (at pack1 romecenter)
      (at pack2 naplesport)
      (at pack3 navigli)
      (at pack4 naplescenter)
      (at pack5 lingotto)
      (at pack6 bolognastation)
      (at pack7 trastevere)
      (at pack8 milanstation)
    )
  )
)`;
export const plan3_numeric =`domain parsed
problem parsed
grounding..
grounding time: 86
aibr preprocessing
|f|:259
|x|:8
|a|:715
|p|:0
|e|:0
h1 setup time (msec): 26
 g(n)= 1.0 h(n)=83.0
 g(n)= 2.0 h(n)=80.0
 g(n)= 3.0 h(n)=77.0
 g(n)= 4.0 h(n)=75.0
 g(n)= 5.0 h(n)=73.0
 g(n)= 6.0 h(n)=72.0
 g(n)= 11.0 h(n)=70.0
 g(n)= 12.0 h(n)=69.0
 g(n)= 13.0 h(n)=68.0
 g(n)= 14.0 h(n)=67.0
 g(n)= 15.0 h(n)=66.0
 g(n)= 16.0 h(n)=65.0
 g(n)= 22.0 h(n)=63.0
 g(n)= 23.0 h(n)=62.0
 g(n)= 24.0 h(n)=61.0
 g(n)= 25.0 h(n)=60.0
 g(n)= 26.0 h(n)=59.0
 g(n)= 27.0 h(n)=58.0
 g(n)= 29.0 h(n)=57.0
 g(n)= 30.0 h(n)=56.0
 g(n)= 31.0 h(n)=55.0
 g(n)= 33.0 h(n)=54.0
 g(n)= 34.0 h(n)=53.0
 g(n)= 36.0 h(n)=52.0
 g(n)= 37.0 h(n)=51.0
 g(n)= 38.0 h(n)=50.0
 g(n)= 39.0 h(n)=49.0
 g(n)= 45.0 h(n)=47.0
 g(n)= 46.0 h(n)=46.0
 g(n)= 48.0 h(n)=45.0
 g(n)= 49.0 h(n)=44.0
 g(n)= 50.0 h(n)=43.0
 g(n)= 51.0 h(n)=42.0
 g(n)= 53.0 h(n)=41.0
 g(n)= 54.0 h(n)=40.0
 g(n)= 55.0 h(n)=39.0
 g(n)= 56.0 h(n)=38.0
 g(n)= 57.0 h(n)=37.0
 g(n)= 58.0 h(n)=36.0
 g(n)= 59.0 h(n)=35.0
 g(n)= 61.0 h(n)=34.0
 g(n)= 62.0 h(n)=33.0
 g(n)= 63.0 h(n)=32.0
 g(n)= 64.0 h(n)=31.0
 g(n)= 65.0 h(n)=30.0
 g(n)= 66.0 h(n)=29.0
 g(n)= 67.0 h(n)=28.0
 g(n)= 68.0 h(n)=27.0
 g(n)= 69.0 h(n)=26.0
 g(n)= 71.0 h(n)=25.0
 g(n)= 72.0 h(n)=24.0
 g(n)= 73.0 h(n)=23.0
 g(n)= 74.0 h(n)=22.0
 g(n)= 75.0 h(n)=21.0
 g(n)= 76.0 h(n)=20.0
 g(n)= 77.0 h(n)=19.0
 g(n)= 78.0 h(n)=18.0
 g(n)= 79.0 h(n)=17.0
 g(n)= 80.0 h(n)=16.0
 g(n)= 82.0 h(n)=15.0
 g(n)= 83.0 h(n)=14.0
 g(n)= 84.0 h(n)=13.0
 g(n)= 85.0 h(n)=12.0
 g(n)= 86.0 h(n)=11.0
 g(n)= 87.0 h(n)=10.0
 g(n)= 88.0 h(n)=9.0
 g(n)= 89.0 h(n)=8.0
 g(n)= 90.0 h(n)=7.0
 g(n)= 91.0 h(n)=6.0
 g(n)= 93.0 h(n)=5.0
 g(n)= 94.0 h(n)=4.0
 g(n)= 95.0 h(n)=3.0
 g(n)= 97.0 h(n)=2.0
 g(n)= 98.0 h(n)=1.0
problem solved

found plan:
0.0: (drive-truck truckmilan milancenter malpensa milan)
1.0: (drive-truck trucknaples naplescenter capodichino naples)
2.0: (drive-truck truckrome romecenter fiumicino rome)
3.0: (drive-truck truckbologna centrobologna marconi bologna)
4.0: (drive-truck truckturin centroturin caselle turin)
5.0: (fly-airplane plane2 fiumicino capodichino)
6.0: (fly-airplane plane3 caselle fiumicino)
7.0: (fly-airplane plane1 malpensa marconi)
8.0: (drive-truck truckbologna marconi universitabologna bologna)
9.0: (load-truck pack8 truckbologna universitabologna)
10.0: (drive-truck truckbologna universitabologna marconi bologna)
11.0: (unload-truck pack8 truckbologna marconi)
12.0: (load-airplane pack8 plane1 marconi)
13.0: (fly-airplane plane1 marconi malpensa)
14.0: (unload-airplane pack8 plane1 malpensa)
15.0: (load-truck pack8 truckmilan malpensa)
16.0: (fly-airplane plane1 malpensa fiumicino)
17.0: (fly-airplane plane3 fiumicino malpensa)
18.0: (drive-truck truckbologna marconi bolognastation bologna)
19.0: (drive-truck truckmilan malpensa navigli milan)
20.0: (load-truck pack2 truckmilan navigli)
21.0: (drive-truck truckmilan navigli malpensa milan)
22.0: (unload-truck pack2 truckmilan malpensa)
23.0: (load-airplane pack2 plane3 malpensa)
24.0: (fly-airplane plane3 malpensa capodichino)
25.0: (unload-airplane pack2 plane3 capodichino)
26.0: (load-truck pack2 trucknaples capodichino)
27.0: (drive-truck truckmilan malpensa milanstation milan)
28.0: (load-truck pack1 truckmilan milanstation)
29.0: (drive-truck truckmilan milanstation malpensa milan)
30.0: (unload-truck pack1 truckmilan malpensa)
31.0: (drive-truck truckmilan malpensa milanstation milan)
32.0: (unload-truck pack8 truckmilan milanstation)
33.0: (drive-truck truckmilan milanstation malpensa milan)
34.0: (fly-airplane plane2 capodichino malpensa)
35.0: (load-airplane pack1 plane2 malpensa)
36.0: (fly-airplane plane2 malpensa fiumicino)
37.0: (unload-airplane pack1 plane2 fiumicino)
38.0: (load-truck pack1 truckrome fiumicino)
39.0: (fly-airplane plane1 fiumicino capodichino)
40.0: (drive-truck truckmilan malpensa navigli milan)
41.0: (fly-airplane plane3 capodichino fiumicino)
42.0: (drive-truck truckturin caselle portanuova turin)
43.0: (load-truck pack7 truckturin portanuova)
44.0: (drive-truck truckturin portanuova caselle turin)
45.0: (unload-truck pack7 truckturin caselle)
46.0: (fly-airplane plane2 fiumicino caselle)
47.0: (load-airplane pack7 plane2 caselle)
48.0: (fly-airplane plane2 caselle fiumicino)
49.0: (unload-airplane pack7 plane2 fiumicino)
50.0: (load-truck pack7 truckrome fiumicino)
51.0: (drive-truck truckrome fiumicino trastevere rome)
52.0: (load-truck pack4 truckrome trastevere)
53.0: (drive-truck truckrome trastevere fiumicino rome)
54.0: (unload-truck pack4 truckrome fiumicino)
55.0: (load-airplane pack4 plane3 fiumicino)
56.0: (fly-airplane plane3 fiumicino capodichino)
57.0: (unload-airplane pack4 plane3 capodichino)
58.0: (load-truck pack4 trucknaples capodichino)
59.0: (drive-truck trucknaples capodichino naplesport naples)
60.0: (load-truck pack5 trucknaples naplesport)
61.0: (drive-truck trucknaples naplesport capodichino naples)
62.0: (unload-truck pack5 trucknaples capodichino)
63.0: (load-airplane pack5 plane1 capodichino)
64.0: (fly-airplane plane1 capodichino caselle)
65.0: (unload-airplane pack5 plane1 caselle)
66.0: (load-truck pack5 truckturin caselle)
67.0: (drive-truck truckturin caselle lingotto turin)
68.0: (unload-truck pack5 truckturin lingotto)
69.0: (drive-truck trucknaples capodichino quartierispagnoli naples)
70.0: (load-truck pack6 trucknaples quartierispagnoli)
71.0: (drive-truck trucknaples quartierispagnoli naplescenter naples)
72.0: (unload-truck pack4 trucknaples naplescenter)
73.0: (drive-truck trucknaples naplescenter capodichino naples)
74.0: (unload-truck pack6 trucknaples capodichino)
75.0: (drive-truck trucknaples capodichino naplesport naples)
76.0: (load-airplane pack6 plane3 capodichino)
77.0: (fly-airplane plane3 capodichino marconi)
78.0: (unload-airplane pack6 plane3 marconi)
79.0: (unload-truck pack2 trucknaples naplesport)
80.0: (drive-truck truckrome fiumicino trastevere rome)
81.0: (unload-truck pack7 truckrome trastevere)
82.0: (drive-truck truckrome trastevere romecenter rome)
83.0: (unload-truck pack1 truckrome romecenter)
84.0: (drive-truck truckrome romecenter termini rome)
85.0: (load-truck pack3 truckrome termini)
86.0: (drive-truck truckrome termini fiumicino rome)
87.0: (unload-truck pack3 truckrome fiumicino)
88.0: (load-airplane pack3 plane2 fiumicino)
89.0: (fly-airplane plane2 fiumicino malpensa)
90.0: (unload-airplane pack3 plane2 malpensa)
91.0: (drive-truck truckmilan navigli malpensa milan)
92.0: (load-truck pack3 truckmilan malpensa)
93.0: (drive-truck truckmilan malpensa navigli milan)
94.0: (unload-truck pack3 truckmilan navigli)
95.0: (drive-truck truckbologna bolognastation marconi bologna)
96.0: (load-truck pack6 truckbologna marconi)
97.0: (drive-truck truckbologna marconi bolognastation bologna)
98.0: (unload-truck pack6 truckbologna bolognastation)

plan-length:99
metric (search):99.0
planning time (msec): 3808
heuristic time (msec): 3689
search time (msec): 3804
expanded nodes:465
states evaluated:9684
number of dead-ends detected:1851
number of duplicates detected:5536`;
export const probb = `(define (problem logistics-delivery)
  (:domain logistics)
  
  (:objects
    turin bologna florence - city
    caselle marconi peretola - airport
    piazzacastello lingotto - location
    bolognastation mercato - location
    duomo pontevecchio - location
    pack1 pack2 pack3 pack4 - package
    truckturin truckbologna truckflorence - truck
    plane1 plane2 - airplane
  )
  
  (:init
    (in-city caselle turin)
    (in-city piazzacastello turin)
    (in-city lingotto turin)
    (in-city marconi bologna)
    (in-city bolognastation bologna)
    (in-city mercato bologna)
    (in-city peretola florence)
    (in-city duomo florence)
    (in-city pontevecchio florence)
    (at truckturin lingotto)
    (at truckbologna mercato)
    (at truckflorence duomo)
    (at plane1 caselle)
    (at plane2 marconi)
    (at pack1 piazzacastello)
    (at pack2 bolognastation)
    (at pack3 lingotto)
    (at pack4 pontevecchio)
  )
  
  (:goal
    (and
      (at pack1 mercato)
      (at pack2 duomo)
      (at pack3 bolognastation)
      (at pack4 piazzacastello)
    )
  )
)`;
export const planb = `domain parsed
problem parsed
grounding..
grounding time: 57
aibr preprocessing
|f|:71
|x|:0
|a|:165
|p|:0
|e|:0
h1 setup time (msec): 17
 g(n)= 1.0 h(n)=39.0
 g(n)= 2.0 h(n)=37.0
 g(n)= 3.0 h(n)=36.0
 g(n)= 6.0 h(n)=34.0
 g(n)= 7.0 h(n)=33.0
 g(n)= 8.0 h(n)=32.0
 g(n)= 10.0 h(n)=31.0
 g(n)= 11.0 h(n)=30.0
 g(n)= 12.0 h(n)=29.0
 g(n)= 14.0 h(n)=28.0
 g(n)= 15.0 h(n)=27.0
 g(n)= 16.0 h(n)=26.0
 g(n)= 17.0 h(n)=25.0
 g(n)= 19.0 h(n)=24.0
 g(n)= 20.0 h(n)=23.0
 g(n)= 22.0 h(n)=22.0
 g(n)= 23.0 h(n)=21.0
 g(n)= 24.0 h(n)=20.0
 g(n)= 26.0 h(n)=19.0
 g(n)= 27.0 h(n)=18.0
 g(n)= 28.0 h(n)=17.0
 g(n)= 29.0 h(n)=16.0
 g(n)= 30.0 h(n)=15.0
 g(n)= 31.0 h(n)=14.0
 g(n)= 32.0 h(n)=13.0
 g(n)= 33.0 h(n)=12.0
 g(n)= 34.0 h(n)=11.0
 g(n)= 37.0 h(n)=10.0
 g(n)= 38.0 h(n)=9.0
 g(n)= 39.0 h(n)=8.0
 g(n)= 40.0 h(n)=7.0
 g(n)= 41.0 h(n)=6.0
 g(n)= 42.0 h(n)=5.0
 g(n)= 43.0 h(n)=4.0
 g(n)= 44.0 h(n)=3.0
 g(n)= 45.0 h(n)=2.0
 g(n)= 46.0 h(n)=1.0
problem solved

found plan:
0.0: (drive-truck truckturin lingotto caselle turin)
1.0: (drive-truck truckbologna mercato marconi bologna)
2.0: (drive-truck truckflorence duomo peretola florence)
3.0: (drive-truck truckturin caselle piazzacastello turin)
4.0: (load-truck pack1 truckturin piazzacastello)
5.0: (drive-truck truckturin piazzacastello caselle turin)
6.0: (unload-truck pack1 truckturin caselle)
7.0: (load-airplane pack1 plane1 caselle)
8.0: (fly-airplane plane2 marconi peretola)
9.0: (fly-airplane plane1 caselle marconi)
10.0: (unload-airplane pack1 plane1 marconi)
11.0: (load-truck pack1 truckbologna marconi)
12.0: (drive-truck truckbologna marconi bolognastation bologna)
13.0: (load-truck pack2 truckbologna bolognastation)
14.0: (drive-truck truckbologna bolognastation marconi bologna)
15.0: (unload-truck pack2 truckbologna marconi)
16.0: (load-airplane pack2 plane1 marconi)
17.0: (drive-truck truckbologna marconi mercato bologna)
18.0: (unload-truck pack1 truckbologna mercato)
19.0: (drive-truck truckbologna mercato bolognastation bologna)
20.0: (fly-airplane plane1 marconi peretola)
21.0: (fly-airplane plane2 peretola caselle)
22.0: (unload-airplane pack2 plane1 peretola)
23.0: (load-truck pack2 truckflorence peretola)
24.0: (drive-truck truckflorence peretola duomo florence)
25.0: (unload-truck pack2 truckflorence duomo)
26.0: (drive-truck truckflorence duomo pontevecchio florence)
27.0: (load-truck pack4 truckflorence pontevecchio)
28.0: (drive-truck truckflorence pontevecchio peretola florence)
29.0: (unload-truck pack4 truckflorence peretola)
30.0: (load-airplane pack4 plane1 peretola)
31.0: (fly-airplane plane1 peretola caselle)
32.0: (unload-airplane pack4 plane1 caselle)
33.0: (load-truck pack4 truckturin caselle)
34.0: (drive-truck truckbologna bolognastation marconi bologna)
35.0: (drive-truck truckturin caselle lingotto turin)
36.0: (load-truck pack3 truckturin lingotto)
37.0: (drive-truck truckturin lingotto caselle turin)
38.0: (unload-truck pack3 truckturin caselle)
39.0: (drive-truck truckturin caselle piazzacastello turin)
40.0: (load-airplane pack3 plane2 caselle)
41.0: (fly-airplane plane2 caselle marconi)
42.0: (unload-airplane pack3 plane2 marconi)
43.0: (load-truck pack3 truckbologna marconi)
44.0: (drive-truck truckbologna marconi bolognastation bologna)
45.0: (unload-truck pack3 truckbologna bolognastation)
46.0: (unload-truck pack4 truckturin piazzacastello)

plan-length:47
metric (search):47.0
planning time (msec): 164
heuristic time (msec): 118
search time (msec): 157
expanded nodes:69
states evaluated:704
number of dead-ends detected:188
number of duplicates detected:206`


export const prob2ex1 = `(define (problem logistics-temporal)
  (:domain logistics)

  (:objects
    milan rome naples turin bologna florence - city
    milancenter milanstation - location
    romecenter termini - location
    naplescenter naplesport - location
    piazzacastello lingotto - location
    bolognastation mercato - location
    duomo pontevecchio - location
    pack1 pack2 pack3 pack4 pack5 pack6 - package
    truck1 truck2 truck3 truck4 - truck
  )

  (:init
    (in-city milancenter milan)
    (in-city milanstation milan)
    (in-city romecenter rome)
    (in-city termini rome)
    (in-city naplescenter naples)
    (in-city naplesport naples)
    (in-city piazzacastello turin)
    (in-city lingotto turin)
    (in-city bolognastation bologna)
    (in-city mercato bologna)
    (in-city duomo florence)
    (in-city pontevecchio florence)

    (at truck1 milancenter)
    (at truck2 romecenter)
    (at truck3 piazzacastello)
    (at truck4 duomo)

    (at pack1 milanstation)
    (at pack2 termini)
    (at pack3 naplescenter)
    (at pack4 lingotto)
    (at pack5 mercato)
    (at pack6 pontevecchio)

    (= (distance milan milan) 0)
    (= (distance milan rome) 5)
    (= (distance milan naples) 8)
    (= (distance milan turin) 2)
    (= (distance milan bologna) 3)
    (= (distance milan florence) 4)

    (= (distance rome milan) 5)
    (= (distance rome rome) 0)
    (= (distance rome naples) 2)
    (= (distance rome turin) 7)
    (= (distance rome bologna) 4)
    (= (distance rome florence) 3)

    (= (distance naples milan) 8)
    (= (distance naples rome) 2)
    (= (distance naples naples) 0)
    (= (distance naples turin) 10)
    (= (distance naples bologna) 6)
    (= (distance naples florence) 5)

    (= (distance turin milan) 2)
    (= (distance turin rome) 7)
    (= (distance turin naples) 10)
    (= (distance turin turin) 0)
    (= (distance turin bologna) 4)
    (= (distance turin florence) 6)

    (= (distance bologna milan) 3)
    (= (distance bologna rome) 4)
    (= (distance bologna naples) 6)
    (= (distance bologna turin) 4)
    (= (distance bologna bologna) 0)
    (= (distance bologna florence) 2)

    (= (distance florence milan) 4)
    (= (distance florence rome) 3)
    (= (distance florence naples) 5)
    (= (distance florence turin) 6)
    (= (distance florence bologna) 2)
    (= (distance florence florence) 0)
  )

  (:goal
    (and
      (at pack1 romecenter)
      (at pack2 naplesport)
      (at pack3 piazzacastello)
      (at pack4 mercato)
      (at pack5 duomo)
      (at pack6 milancenter)
    )
  )
      (:metric minimize total-time)

)`;
export const plan2ex1 = `
NUMERIC_THREATS_MODE: 0

; Command line: ./lpg-td -o dom.pddl -f prog.pddl -n 3


Parsing domain file:  domain 'LOGISTICS' defined ... done.
Parsing problem file:  problem 'LOGISTICS-TEMPORAL' defined ... done.



Modality: Incremental Planner

Number of actions             :    1152
Number of conditional actions :       0
Number of facts               :     144


Analyzing Planning Problem:
        Temporal Planning Problem: YES
        Numeric Planning Problem: YES
        Problem with Timed Initial Literals: NO
        Problem with Derived Predicates: NO

Evaluation function weights:
     Action duration 1.00; Action cost 0.00


Computing mutex... done

Preprocessing total time: 0.01 seconds

Searching ('.' = every 50 search steps):
 solution found:
 Recompute start times

 first_solution_cpu_time: 0.04
Solution number: 1
Total time:      0.04
Search time:     0.03
Actions:         31
Duration:        24.000
Plan quality:    24.000
Total Num Flips: 32
     Plan file:       plan_prog.pddl_1.SOL Restart using stored plan
. solution found:
 Recompute start times

Solution number: 2
Total time:      0.05
Search time:     0.04
Actions:         30
Duration:        19.000
Plan quality:    19.000
Total Num Flips: 83
     Plan file:       plan_prog.pddl_2.SOL Restart using stored plan
 solution found:
 Recompute start times


Plan computed:
   Time: (ACTION) [action Duration; action Cost]
 0.0000: (DRIVE-TRUCK TRUCK3 PIAZZACASTELLO milanstation turin milan) [D:2.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK4 DUOMO termini florence rome) [D:3.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK1 milancenter LINGOTTO milan turin) [D:2.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK2 romecenter naplescenter rome naples) [D:2.00; C:0.10]
 2.0000: (LOAD-TRUCK pack1 TRUCK3 milanstation) [D:0.00; C:0.10]
 2.0000: (DRIVE-TRUCK TRUCK3 milanstation romecenter milan rome) [D:5.00; C:0.10]
 2.0000: (LOAD-TRUCK pack4 TRUCK1 LINGOTTO) [D:0.00; C:0.10]
 2.0000: (DRIVE-TRUCK TRUCK1 LINGOTTO MERCATO turin BOLOGNA) [D:4.00; C:0.10]
 2.0000: (LOAD-TRUCK pack3 TRUCK2 naplescenter) [D:0.00; C:0.10]
 2.0000: (DRIVE-TRUCK TRUCK2 naplescenter MERCATO naples BOLOGNA) [D:6.00; C:0.10]
 3.0000: (LOAD-TRUCK pack2 TRUCK4 termini) [D:0.00; C:0.10]
 3.0000: (DRIVE-TRUCK TRUCK4 termini naplesport rome naples) [D:2.00; C:0.10]
 5.0000: (UNLOAD-TRUCK pack2 TRUCK4 naplesport) [D:0.00; C:0.10]
 5.0000: (DRIVE-TRUCK TRUCK4 naplesport PONTEVECCHIO naples florence) [D:5.00; C:0.10]
 6.0000: (UNLOAD-TRUCK pack4 TRUCK1 MERCATO) [D:0.00; C:0.10]
 6.0000: (LOAD-TRUCK pack5 TRUCK1 MERCATO) [D:0.00; C:0.10]
 6.0000: (DRIVE-TRUCK TRUCK1 MERCATO romecenter BOLOGNA rome) [D:4.00; C:0.10]
 7.0000: (UNLOAD-TRUCK pack1 TRUCK3 romecenter) [D:0.00; C:0.10]
 8.0000: (UNLOAD-TRUCK pack3 TRUCK2 MERCATO) [D:0.00; C:0.10]
 8.0000: (LOAD-TRUCK pack3 TRUCK2 MERCATO) [D:0.00; C:0.10]
 8.0000: (DRIVE-TRUCK TRUCK2 MERCATO milanstation BOLOGNA milan) [D:3.00; C:0.10]
 10.0000: (LOAD-TRUCK pack6 TRUCK4 PONTEVECCHIO) [D:0.00; C:0.10]
 10.0000: (DRIVE-TRUCK TRUCK4 PONTEVECCHIO milancenter florence milan) [D:4.00; C:0.10]
 10.0000: (DRIVE-TRUCK TRUCK1 romecenter naplesport rome naples) [D:2.00; C:0.10]
 11.0000: (DRIVE-TRUCK TRUCK2 milanstation milancenter milan milan) [D:0.00; C:0.10]
 11.0000: (DRIVE-TRUCK TRUCK2 milancenter PIAZZACASTELLO milan turin) [D:2.00; C:0.10]
 12.0000: (DRIVE-TRUCK TRUCK1 naplesport DUOMO naples florence) [D:5.00; C:0.10]
 13.0000: (UNLOAD-TRUCK pack3 TRUCK2 PIAZZACASTELLO) [D:0.00; C:0.10]
 14.0000: (UNLOAD-TRUCK pack6 TRUCK4 milancenter) [D:0.00; C:0.10]
 17.0000: (UNLOAD-TRUCK pack5 TRUCK1 DUOMO) [D:0.00; C:0.10]



METRIC_VALUE = 17.00
Solution number: 3
Total time:      0.05
Search time:     0.04
Actions:         30
Duration:        17.000
Plan quality:    17.000
Total Num Flips: 93
     Plan file:       plan_prog.pddl_3.SOL`;
export const prob2ex2 = `(define (problem logistics-temporal-air)
  (:domain logistics)
  
  (:objects
    milan rome turin - city
    malpensa fiumicino caselle - airport
    milancenter milanstation - location
    romecenter termini - location
    piazzacastello lingotto - location
    pack1 pack2 pack3 pack4 - package
    truck1 truck2 truck3 - truck
    plane1 plane2 - airplane
  )
  
  (:init
    (in-city malpensa milan)
    (in-city milancenter milan)
    (in-city milanstation milan)
    (in-city fiumicino rome)
    (in-city romecenter rome)
    (in-city termini rome)
    (in-city caselle turin)
    (in-city piazzacastello turin)
    (in-city lingotto turin)
    
    (at truck1 milancenter)
    (at truck2 romecenter)
    (at truck3 piazzacastello)
    (at plane1 malpensa)
    (at plane2 fiumicino)
    
    (at pack1 malpensa)
    (at pack2 fiumicino)
    (at pack3 lingotto)
    (at pack4 caselle)
    
    (= (distance milan milan) 0)
    (= (distance milan rome) 5)
    (= (distance milan turin) 2)
    
    (= (distance rome milan) 5)
    (= (distance rome rome) 0)
    (= (distance rome turin) 7)
    
    (= (distance turin milan) 2)
    (= (distance turin rome) 7)
    (= (distance turin turin) 0)
  )
  
  (:goal
    (and
      (at pack1 caselle)
      (at pack2 malpensa)
      (at pack3 milancenter)
      (at pack4 fiumicino)
    )
  )
  (:metric minimize total-time)
)`;
export const plan2ex2 = `

NUMERIC_THREATS_MODE: 0

; Command line: ./lpg-td -o dom.pddl -f prog.pddl -n 4


Parsing domain file:  domain 'LOGISTICS' defined ... done.
Parsing problem file:  problem 'LOGISTICS-TEMPORAL-AIR' defined ... done.



Modality: Incremental Planner

Number of actions             :     525
Number of conditional actions :       0
Number of facts               :      89


Analyzing Planning Problem:
        Temporal Planning Problem: YES
        Numeric Planning Problem: YES
        Problem with Timed Initial Literals: NO
        Problem with Derived Predicates: NO

Evaluation function weights:
     Action duration 1.00; Action cost 0.00


Computing mutex... done

Preprocessing total time: 0.01 seconds

Searching ('.' = every 50 search steps):
 solution found:
 Recompute start times

 first_solution_cpu_time: 0.02
Solution number: 1
Total time:      0.02
Search time:     0.01
Actions:         18
Duration:        28.000
Plan quality:    28.000
Total Num Flips: 18
     Plan file:       plan_prog.pddl_1.SOL Restart using stored plan
 solution found:
 Recompute start times

Solution number: 2
Total time:      0.02
Search time:     0.01
Actions:         20
Duration:        14.000
Plan quality:    14.000
Total Num Flips: 32
     Plan file:       plan_prog.pddl_2.SOL Restart using stored plan
. solution found:
 Recompute start times

Solution number: 3
Total time:      0.03
Search time:     0.02
Actions:         17
Duration:        9.000
Plan quality:    9.000
Total Num Flips: 102
     Plan file:       plan_prog.pddl_3.SOL Restart using null plan
 Restart using stored plan
 Restart using stored plan
. Restart using null plan
..... solution found:
 Recompute start times


Plan computed:
   Time: (ACTION) [action Duration; action Cost]
 0.0000: (LOAD-AIRPLANE pack2 plane2 FIUMICINO) [D:0.00; C:0.10]
 0.0000: (FLY-AIRPLANE plane2 FIUMICINO MALPENSA rome milan) [D:5.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK1 milancenter LINGOTTO milan turin) [D:2.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK3 PIAZZACASTELLO CASELLE turin turin) [D:0.00; C:0.10]
 0.0000: (LOAD-TRUCK pack4 TRUCK3 CASELLE) [D:0.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK3 CASELLE FIUMICINO turin rome) [D:7.00; C:0.10]
 2.0000: (LOAD-TRUCK pack3 TRUCK1 LINGOTTO) [D:0.00; C:0.10]
 2.0000: (DRIVE-TRUCK TRUCK1 LINGOTTO milancenter turin milan) [D:2.00; C:0.10]
 4.0000: (UNLOAD-TRUCK pack3 TRUCK1 milancenter) [D:0.00; C:0.10]
 5.0000: (UNLOAD-AIRPLANE pack2 plane2 MALPENSA) [D:0.00; C:0.10]
 5.0000: (LOAD-AIRPLANE pack1 plane2 MALPENSA) [D:0.00; C:0.10]
 5.0000: (FLY-AIRPLANE plane2 MALPENSA CASELLE milan turin) [D:2.00; C:0.10]
 7.0000: (UNLOAD-AIRPLANE pack1 plane2 CASELLE) [D:0.00; C:0.10]
 7.0000: (UNLOAD-TRUCK pack4 TRUCK3 FIUMICINO) [D:0.00; C:0.10]



METRIC_VALUE = 7.00
Solution number: 4
Total time:      0.05
Search time:     0.04
Actions:         14
Duration:        7.000
Plan quality:    7.000
Total Num Flips: 513
     Plan file:       plan_prog.pddl_4.SOL
`
export const prob2ex3 = `(define (problem logistics-temporal-air-4cities)
  (:domain logistics)

  (:objects
    milan rome turin naples - city
    malpensa fiumicino caselle capodichino - airport
    milancenter milanstation duomo - location
    romecenter termini colosseo - location
    piazzacastello lingotto portanuova - location
    centralenaples vomero posillipo - location
    pack1 pack2 pack3 pack4 pack5 pack6 - package
    truck1 truck2 truck3 truck4 - truck
    plane1 plane2 plane3 - airplane
  )

  (:init
    (in-city malpensa milan)
    (in-city milancenter milan)
    (in-city milanstation milan)
    (in-city duomo milan)

    (in-city fiumicino rome)
    (in-city romecenter rome)
    (in-city termini rome)
    (in-city colosseo rome)

    (in-city caselle turin)
    (in-city piazzacastello turin)
    (in-city lingotto turin)
    (in-city portanuova turin)

    (in-city capodichino naples)
    (in-city centralenaples naples)
    (in-city vomero naples)
    (in-city posillipo naples)

    (at truck1 milancenter)
    (at truck2 romecenter)
    (at truck3 piazzacastello)
    (at truck4 centralenaples)

    (at plane1 malpensa)
    (at plane2 fiumicino)
    (at plane3 capodichino)

    (at pack1 duomo)
    (at pack2 colosseo)
    (at pack3 lingotto)
    (at pack4 vomero)
    (at pack5 malpensa)
    (at pack6 caselle)
    (= (distance milan milan) 0)
    (= (distance milan rome) 5)
    (= (distance milan turin) 2)
    (= (distance milan naples) 8)

    (= (distance rome milan) 5)
    (= (distance rome rome) 0)
    (= (distance rome turin) 7)
    (= (distance rome naples) 3)

    (= (distance turin milan) 2)
    (= (distance turin rome) 7)
    (= (distance turin turin) 0)
    (= (distance turin naples) 10)

    (= (distance naples milan) 8)
    (= (distance naples rome) 3)
    (= (distance naples turin) 10)
    (= (distance naples naples) 0)
  )

  (:goal
    (and
      (at pack1 capodichino)
      (at pack2 portanuova)
      (at pack3 termini)
      (at pack4 milanstation)
      (at pack5 posillipo)
      (at pack6 fiumicino)
    )
  )
(:metric minimize total-time)
)`;
export const plan2ex3 = `
NUMERIC_THREATS_MODE: 0

; Command line: ./lpg-td -o dom.pddl -f prog.pddl -n 3


Parsing domain file:  domain 'LOGISTICS' defined ... done.
Parsing problem file:  problem 'LOGISTICS-TEMPORAL-AIR-4CITIES' defined ... done.



Modality: Incremental Planner

Number of actions             :    1984
Number of conditional actions :       0
Number of facts               :     214


Analyzing Planning Problem:
        Temporal Planning Problem: YES
        Numeric Planning Problem: YES
        Problem with Timed Initial Literals: NO
        Problem with Derived Predicates: NO

Evaluation function weights:
     Action duration 1.00; Action cost 0.00


Computing mutex... done

Preprocessing total time: 0.01 seconds

Searching ('.' = every 50 search steps):
 solution found:
 Recompute start times

 first_solution_cpu_time: 0.03
Solution number: 1
Total time:      0.03
Search time:     0.02
Actions:         27
Duration:        29.000
Plan quality:    29.000
Total Num Flips: 28
     Plan file:       plan_prog.pddl_1.SOL Restart using stored plan
. solution found:
 Recompute start times

Solution number: 2
Total time:      0.04
Search time:     0.03
Actions:         32
Duration:        19.000
Plan quality:    19.000
Total Num Flips: 109
     Plan file:       plan_prog.pddl_2.SOL Restart using stored plan
 solution found:
 Recompute start times


Plan computed:
   Time: (ACTION) [action Duration; action Cost]
 0.0000: (FLY-AIRPLANE plane2 FIUMICINO CASELLE rome turin) [D:7.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK4 CENTRALEnaples COLOSSEO naples rome) [D:3.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK3 PIAZZACASTELLO VOMERO turin naples) [D:10.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK2 romecenter milanstation rome milan) [D:5.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK1 milancenter LINGOTTO milan turin) [D:2.00; C:0.10]
 2.0000: (LOAD-TRUCK pack3 TRUCK1 LINGOTTO) [D:0.00; C:0.10]
 2.0000: (DRIVE-TRUCK TRUCK1 LINGOTTO termini turin rome) [D:7.00; C:0.10]
 3.0000: (LOAD-TRUCK pack2 TRUCK4 COLOSSEO) [D:0.00; C:0.10]
 3.0000: (DRIVE-TRUCK TRUCK4 COLOSSEO CENTRALEnaples rome naples) [D:3.00; C:0.10]
 5.0000: (DRIVE-TRUCK TRUCK2 milanstation MALPENSA milan milan) [D:0.00; C:0.10]
 5.0000: (LOAD-TRUCK pack5 TRUCK2 MALPENSA) [D:0.00; C:0.10]
 5.0000: (DRIVE-TRUCK TRUCK2 MALPENSA PORTANUOVA milan turin) [D:2.00; C:0.10]
 6.0000: (DRIVE-TRUCK TRUCK4 CENTRALEnaples PORTANUOVA naples turin) [D:10.00; C:0.10]
 7.0000: (LOAD-AIRPLANE pack6 plane2 CASELLE) [D:0.00; C:0.10]
 7.0000: (FLY-AIRPLANE plane2 CASELLE FIUMICINO turin rome) [D:7.00; C:0.10]
 7.0000: (DRIVE-TRUCK TRUCK2 PORTANUOVA DUOMO turin milan) [D:2.00; C:0.10]
 9.0000: (LOAD-TRUCK pack1 TRUCK2 DUOMO) [D:0.00; C:0.10]
 9.0000: (DRIVE-TRUCK TRUCK2 DUOMO MALPENSA milan milan) [D:0.00; C:0.10]
 9.0000: (UNLOAD-TRUCK pack1 TRUCK2 MALPENSA) [D:0.00; C:0.10]
 9.0000: (LOAD-AIRPLANE pack1 plane1 MALPENSA) [D:0.00; C:0.10]
 9.0000: (FLY-AIRPLANE plane1 MALPENSA CAPODICHINO milan naples) [D:8.00; C:0.10]
 9.0000: (DRIVE-TRUCK TRUCK2 MALPENSA POSILLIPO milan naples) [D:8.00; C:0.10]
 9.0000: (UNLOAD-TRUCK pack3 TRUCK1 termini) [D:0.00; C:0.10]
 10.0000: (LOAD-TRUCK pack4 TRUCK3 VOMERO) [D:0.00; C:0.10]
 10.0000: (DRIVE-TRUCK TRUCK3 VOMERO milanstation naples milan) [D:8.00; C:0.10]
 14.0000: (UNLOAD-AIRPLANE pack6 plane2 FIUMICINO) [D:0.00; C:0.10]
 16.0000: (UNLOAD-TRUCK pack2 TRUCK4 PORTANUOVA) [D:0.00; C:0.10]
 17.0000: (UNLOAD-AIRPLANE pack1 plane1 CAPODICHINO) [D:0.00; C:0.10]
 17.0000: (UNLOAD-TRUCK pack5 TRUCK2 POSILLIPO) [D:0.00; C:0.10]
 18.0000: (UNLOAD-TRUCK pack4 TRUCK3 milanstation) [D:0.00; C:0.10]



METRIC_VALUE = 18.00
Solution number: 3
Total time:      0.05
Search time:     0.04
Actions:         30
Duration:        18.000
Plan quality:    18.000
Total Num Flips: 116
     Plan file:       plan_prog.pddl_3.SOL`;
export const domainpddlplus = `(define (domain logistics)
  (:requirements :strips :typing :fluents :time :processes :events)
  (:types
    truck - vehicle
    package vehicle - physobj
    location gasstation - place
    city place physobj - object
  )

  (:predicates
    (in-city ?loc - place ?city - city)
    (at ?obj - physobj ?loc - place)
    (in ?pkg - package ?veh - vehicle)
    (moving ?truck - truck)
    (refueling ?truck - truck)
    (moving-path ?truck - truck ?from - place ?to - place)
  )

  (:functions
    (distance ?c1 - city ?c2 - city)
    (gasoline ?truck - truck)
    (moved-distance ?truck - truck)
    (speed ?truck - truck)
  )

  (:action load-truck
    :parameters (?pkg - package ?truck - truck ?loc - place)
    :precondition (and
      (at ?truck ?loc)
      (at ?pkg ?loc)
    )
    :effect (and
      (not (at ?pkg ?loc))
      (in ?pkg ?truck)
    )
  )

  (:action unload-truck
    :parameters (?pkg - package ?truck - truck ?loc - place)
    :precondition (and
      (at ?truck ?loc)
      (in ?pkg ?truck)
    )
    :effect (and
      (not (in ?pkg ?truck))
      (at ?pkg ?loc)
    )
  )

  (:action start-move
    :parameters (?truck - truck ?loc-from - place ?loc-to - place ?city-from - city ?city-to - city)
    :precondition (and 
      (at ?truck ?loc-from)
      (in-city ?loc-from ?city-from)
      (in-city ?loc-to ?city-to)
      (not (refueling ?truck))
      (not (moving ?truck))
      (> (gasoline ?truck) 0)
    )
    :effect (and
      (not (at ?truck ?loc-from))
      (moving ?truck) 
      (moving-path ?truck ?loc-from ?loc-to)
      (assign (moved-distance ?truck) 0)
    )
  )

  (:process moving-process
    :parameters (?truck - truck)
    :precondition (and 
      (moving ?truck)
      (> (gasoline ?truck) 0)
    )
    :effect (and
      (increase (moved-distance ?truck) (* (speed ?truck) #t))
      (decrease (gasoline ?truck) (* 2 #t))
    )
  )

  (:event arrived
    :parameters (?truck - truck ?loc-from - place ?loc-to - place ?city-from - city ?city-to - city)
    :precondition (and 
      (moving ?truck) 
      (moving-path ?truck ?loc-from ?loc-to)
      (in-city ?loc-from ?city-from)
      (in-city ?loc-to ?city-to)
      (>= (moved-distance ?truck) (distance ?city-from ?city-to))
    )
    :effect (and
      (at ?truck ?loc-to) 
      (not (moving ?truck))
      (not (moving-path ?truck ?loc-from ?loc-to))
    )
  )

  (:event out-of-gas
    :parameters (?truck - truck)
    :precondition (and
      (moving ?truck)
      (<= (gasoline ?truck) 0)
    )
    :effect (and
      (not (moving ?truck))
    )
  )

  (:action start-refuel
    :parameters (?truck - truck ?gs - gasstation)
    :precondition (and
      (at ?truck ?gs)
      (not (moving ?truck))
      (not (refueling ?truck))
      (< (gasoline ?truck) 100)
    )
    :effect (and
      (refueling ?truck)
    )
  )

  (:action stop-refuel
    :parameters (?truck - truck)
    :precondition (and
      (refueling ?truck)
      (>= (gasoline ?truck) 90)
    )
    :effect (and
      (not (refueling ?truck))
    )
  )

  (:process refueling-process
    :parameters (?truck - truck)
    :precondition (and
      (refueling ?truck)
      (< (gasoline ?truck) 100)
    )
    :effect (and
      (increase (gasoline ?truck) (* 10 #t))
    )
  )
)`;
export const prob1plus = `(define (problem logistics-fuel-test)
  (:domain logistics)
  (:objects
    pos1 pos2 pos3 - location
    gs1 gs2 - gasstation
    cit1 cit2 - city
    tru1 - truck
    obj11 - package
  )

  (:init 
    (at tru1 pos1) 
    (at obj11 pos1)
    
    (in-city pos1 cit1)
    (in-city pos2 cit1)
    (in-city pos3 cit2)
    (in-city gs1 cit1)
    (in-city gs2 cit2)
    
    (can-refuel gs1)
    (can-refuel gs2)

    (= (distance cit1 cit1) 5)
    (= (distance cit1 cit2) 40)
    (= (distance cit2 cit1) 40)
    (= (distance cit2 cit2) 5)

    (= (gasoline tru1) 30)
    (= (speed tru1) 1)
    (= (moved-distance tru1) 0)
  )

  (:goal (and
    (at obj11 pos3)
  ))
)`;
export const plan1plus = `Domain parsed
Problem parsed
Grounding..
Grounding Time: 88
Aibr Preprocessing
|F|:38
|X|:2
Aibr Preprocessing
|A|:38
|P|:2
|E|:26
Delta time heuristic model:1.0
Delta time planning model:1.0
Delta time search-execution model:1.0
Delta time validation model:1
H1 Setup Time (msec): 28
Setting horizon to:NaN
Running Greedy Best First Search
h(n = s_0)=6.0
 g(n)= 1.0 h(n)=5.0
 g(n)= 56.0 h(n)=4.0
 g(n)= 57.0 h(n)=3.0
 g(n)= 58.0 h(n)=1.0
 g(n)= 59.0 h(n)=0.0
Extracting plan with execution delta: 1.0
Problem Solved

Found Plan:
0: (load-truck obj11 tru1 pos1)
0: (start-move tru1 pos1 gs1 cit1 cit1)
0: -----waiting---- [5.0]
5.0: (start-refuel tru1 gs1)
5.0: -----waiting---- [13.0]
13.0: (stop-refuel tru1)
13.0: (start-move tru1 gs1 pos3 cit1 cit2)
13.0: -----waiting---- [53.0]
53.0: (unload-truck obj11 tru1 pos3)

Plan-Length:61
Elapsed Time: 53.0
Metric (Search):59.0
Planning Time (msec): 743
Heuristic Time (msec): 31
Search Time (msec): 93
Expanded Nodes:836
States Evaluated:1028
Fixed constraint violations during search (zero-crossing):0
Number of Dead-Ends detected:18
Number of Duplicates detected:156`
export const prob2plus = `(define (problem logistics-fuel-test-v2)
  (:domain logistics)
  (:objects
    pos1 pos2 pos3 - location
    gs1 gs2 - gasstation
    cit1 cit2 cit3 - city
    tru1 - truck
    obj11 - package
  )

  (:init 
    (at tru1 pos1) 
    (at obj11 pos1)
    
    (in-city pos1 cit1)
    (in-city pos2 cit2)
    (in-city pos3 cit3)
    (in-city gs1 cit1)
    (in-city gs2 cit2)
    
    (can-refuel gs1)
    (can-refuel gs2)

    (= (distance cit1 cit1) 5)
    (= (distance cit1 cit2) 45)
    (= (distance cit1 cit3) 90)
    (= (distance cit2 cit1) 45)
    (= (distance cit2 cit2) 5)
    (= (distance cit2 cit3) 45)
    (= (distance cit3 cit1) 90)
    (= (distance cit3 cit2) 45)
    (= (distance cit3 cit3) 5)

    (= (gasoline tru1) 30)
    (= (speed tru1) 1)
    (= (moved-distance tru1) 0)
  )

  (:goal (and
    (at obj11 pos3)
  ))
)`;
export const plan2plus = `domain parsed
problem parsed
grounding..
grounding time: 68
aibr preprocessing
|f|:38
|x|:2
heuristic problem creation
aibr preprocessing
|a|:38
|p|:2
|e|:26
delta time heuristic model:1.0
delta time planning model:1.0
delta time search-execution model:1.0
delta time validation model:1
h1 setup time (msec): 13
 g(n)= 1.0 h(n)=5.0
 g(n)= 63.0 h(n)=4.0
 g(n)= 126.0 h(n)=3.0
 g(n)= 127.0 h(n)=1.0
extracting plan with execution delta: 1.0
problem solved

found plan:
0: (load-truck obj11 tru1 pos1)
0: (start-move tru1 pos1 gs1 cit1 cit1)
0: -----waiting---- [5.0]
5.0: (start-refuel tru1 gs1)
5.0: -----waiting---- [13.0]
13.0: (stop-refuel tru1)
13.0: (start-move tru1 gs1 gs2 cit1 cit2)
13.0: -----waiting---- [58.0]
58.0: (start-refuel tru1 gs2)
58.0: -----waiting---- [68.0]
68.0: (stop-refuel tru1)
68.0: (start-move tru1 gs2 pos2 cit2 cit2)
68.0: -----waiting---- [73.0]
73.0: (start-move tru1 pos2 pos3 cit2 cit3)
73.0: -----waiting---- [118.0]
118.0: (unload-truck obj11 tru1 pos3)

plan-length:132
elapsed time: 118.0
metric (search):128.0
planning time (msec): 189
heuristic time (msec): 110
search time (msec): 182
expanded nodes:3091
states evaluated:3451
number of dead-ends detected:91
number of duplicates detected:376`

export const prob3plus = `(define (problem logistics-two-trucks)
  (:domain logistics)
  (:objects
    pos1 pos3 - location
    gs1 gs2 - gasstation
    cit1 cit2 - city
    tru1 - truck
    obj1 obj2 - package
  )

  (:init 
    (at tru1 pos1) 
    (at obj1 pos1)
    (at obj2 pos3)
    
    (in-city pos1 cit1)
    (in-city pos3 cit2)
    (in-city gs1 cit1)
    (in-city gs2 cit2)

    (= (distance cit1 cit1) 5)
    (= (distance cit1 cit2) 35)
    (= (distance cit2 cit1) 35)
    (= (distance cit2 cit2) 5)


    (= (gasoline tru1) 25)
    (= (speed tru1) 1)
    (= (moved-distance tru1) 0)
  )

  (:goal (and
    (at obj1 pos3)
    (at obj2 pos1)
      ))
)`;
export const plan3plus = `Domain parsed
Problem parsed
Grounding..
Grounding Time: 38
Aibr Preprocessing
|F|:32
|X|:2
Aibr Preprocessing
|A|:35
|P|:2
|E|:17
Delta time heuristic model:1.0
Delta time planning model:1.0
Delta time search-execution model:1.0
Delta time validation model:1
H1 Setup Time (msec): 16
Setting horizon to:NaN
Running Greedy Best First Search
h(n = s_0)=12.0
 g(n)= 1.0 h(n)=11.0
 g(n)= 65.0 h(n)=6.0
 g(n)= 66.0 h(n)=5.0
 g(n)= 67.0 h(n)=4.0
 g(n)= 118.0 h(n)=3.0
 g(n)= 119.0 h(n)=1.0
 g(n)= 120.0 h(n)=0.0
Extracting plan with execution delta: 1.0
Problem Solved

Found Plan:
0: (load-truck obj1 tru1 pos1)
0: (start-move tru1 pos1 gs1 cit1 cit1)
0: -----waiting---- [5.0]
5.0: (start-refuel tru1 gs1)
5.0: -----waiting---- [14.0]
14.0: (stop-refuel tru1)
14.0: (start-move tru1 gs1 pos3 cit1 cit2)
14.0: -----waiting---- [49.0]
49.0: (load-truck obj2 tru1 pos3)
49.0: (unload-truck obj1 tru1 pos3)
49.0: (start-move tru1 pos3 gs2 cit2 cit2)
49.0: -----waiting---- [54.0]
54.0: (start-refuel tru1 gs2)
54.0: -----waiting---- [61.0]
61.0: (stop-refuel tru1)
61.0: (start-move tru1 gs2 gs2 cit2 cit2)
61.0: -----waiting---- [66.0]
66.0: (start-move tru1 gs2 pos3 cit2 cit2)
66.0: -----waiting---- [71.0]
71.0: (start-move tru1 pos3 pos1 cit2 cit1)
71.0: -----waiting---- [106.0]
106.0: (unload-truck obj2 tru1 pos1)

Plan-Length:126
Elapsed Time: 106.0
Metric (Search):120.0
Planning Time (msec): 524
Heuristic Time (msec): 115
Search Time (msec): 172
Expanded Nodes:1793
States Evaluated:2202
Fixed constraint violations during search (zero-crossing):0
Number of Dead-Ends detected:46
Number of Duplicates detected:417`;

export const prob4plus = `(define (problem logistics-four-cities)
  (:domain logistics)
  (:objects
    depot1 store1 - location
    depot2 store2 - location  
    depot3 store3 - location
    depot4 store4 - location
    
    gs1 gs2 gs3 gs4 - gasstation
    
    milan rome naples florence - city
    
    truck1 truck2 truck3 - truck
    
    pkg1 pkg2 pkg3 pkg4 pkg5 pkg6 - package
  )

  (:init 
    (at truck1 depot1) 
    (at truck2 depot2)
    (at truck3 depot3)
    
    (at pkg1 depot1)
    (at pkg2 store1)
    (at pkg3 depot2)
    (at pkg4 store2)
    (at pkg5 depot3)
    (at pkg6 store3)
    
    (in-city depot1 milan)
    (in-city store1 milan)
    (in-city gs1 milan)
    
    (in-city depot2 rome)
    (in-city store2 rome)
    (in-city gs2 rome)
    
    (in-city depot3 naples)
    (in-city store3 naples)
    (in-city gs3 naples)
    
    (in-city depot4 florence)
    (in-city store4 florence)
    (in-city gs4 florence)

    (= (distance milan milan) 0)
    (= (distance milan rome) 2)
    (= (distance milan naples) 3)
    (= (distance milan florence) 1)
    
    (= (distance rome milan) 2)
    (= (distance rome rome) 0)
    (= (distance rome naples) 1)
    (= (distance rome florence) 2)
    
    (= (distance naples milan) 3)
    (= (distance naples rome) 1)
    (= (distance naples naples) 0)
    (= (distance naples florence) 3)

    (= (distance florence milan) 1)
    (= (distance florence rome) 2)
    (= (distance florence naples) 3)
    (= (distance florence florence) 0)

    (= (gasoline truck1) 40)
    (= (gasoline truck2) 30)
    (= (gasoline truck3) 60)
    
    (= (speed truck1) 1)
    (= (speed truck2) 1)
    (= (speed truck3) 1)
    
    (= (moved-distance truck1) 0)
    (= (moved-distance truck2) 0)
    (= (moved-distance truck3) 0)
  )

  (:goal (and
    (at pkg1 store3)
    (at pkg2 depot4)
    (at pkg3 store1)
    (at pkg4 depot3)
    (at pkg5 store2)
    (at pkg6 store4)
  ))
)`;

export const plan4plus = `Domain parsed
Problem parsed
Grounding..
Grounding Time: 89
Aibr Preprocessing
|F|:84
|X|:6
Aibr Preprocessing
|A|:156
|P|:6
|E|:42
Delta time heuristic model:1.0
Delta time planning model:1.0
Delta time search-execution model:1.0
Delta time validation model:1
H1 Setup Time (msec): 45
Setting horizon to:NaN
Running Greedy Best First Search
h(n = s_0)=36.0
 g(n)= 1.0 h(n)=35.0
 g(n)= 4.0 h(n)=32.0
 g(n)= 34.0 h(n)=28.0
 g(n)= 48.0 h(n)=24.0
 g(n)= 105.0 h(n)=18.0
 g(n)= 162.0 h(n)=12.0
 g(n)= 219.0 h(n)=8.0
 g(n)= 276.0 h(n)=4.0
 g(n)= 320.0 h(n)=0.0
Extracting plan with execution delta: 1.0
Problem Solved

Found Plan:
0: (load-truck pkg1 truck1 depot1)
0: (load-truck pkg2 truck1 store1)
1: (load-truck pkg3 truck2 depot2)
1: (load-truck pkg4 truck2 store2)
2: (load-truck pkg5 truck3 depot3)
2: (load-truck pkg6 truck3 store3)
3: (start-move truck1 depot1 gs1 milan milan)
3: -----waiting---- [4.0]
4: (start-move truck2 depot2 store1 rome milan)
4: -----waiting---- [6.0]
5: (start-move truck3 depot3 store2 naples rome)
5: -----waiting---- [6.0]
6: (start-refuel truck1 gs1)
6: -----waiting---- [20.0]
20: (stop-refuel truck1)
21: (start-move truck1 gs1 store3 milan naples)
21: -----waiting---- [24.0]
24: (unload-truck pkg5 truck3 store2)
29: (start-move truck3 store2 store4 rome florence)
29: -----waiting---- [31.0]
56: (unload-truck pkg6 truck3 store4)
61: (unload-truck pkg3 truck2 store1)
62: (start-move truck2 store1 gs1 milan milan)
62: -----waiting---- [62.0]
65: (start-refuel truck2 gs1)
65: -----waiting---- [75.0]
75: (stop-refuel truck2)
76: (start-move truck2 gs1 depot3 milan naples)
76: -----waiting---- [79.0]
79: (unload-truck pkg1 truck1 store3)
99: (start-move truck1 store3 gs3 naples naples)
99: -----waiting---- [99.0]
102: (start-refuel truck1 gs3)
102: -----waiting---- [112.0]
112: (stop-refuel truck1)
113: (start-move truck1 gs3 depot4 naples florence)
113: -----waiting---- [116.0]
153: (unload-truck pkg4 truck2 depot3)
159: (unload-truck pkg2 truck1 depot4)

Plan-Length: 159
Elapsed Time: 159.0
Metric (Search): 159.0
Planning Time (msec): 1245
Heuristic Time (msec): 342
Search Time (msec): 567
Expanded Nodes: 4521
States Evaluated: 5684
Fixed constraint violations during search (zero-crossing): 0
Number of Dead-Ends detected: 128
Number of Duplicates detected: 892`;

export const probnumeric1 = `(define (problem logistics-capacity-test)
  (:domain logistics)
  
  (:objects
    milan rome - city
    milancenter milanstation - location
    romecenter termini - location
    pack1 pack2 pack3 pack4 pack5 - package
    truck1 - truck
  )
  
  (:init
    ; Definizione delle città
    (in-city milancenter milan)
    (in-city milanstation milan)
    (in-city romecenter rome)
    (in-city termini rome)
    
    ; Posizioni iniziali
    (at truck1 milancenter)
    (at pack1 milancenter)
    (at pack2 milancenter)
    (at pack3 milancenter)
    (at pack4 milancenter)
    (at pack5 milanstation)
    
    ; Distanze tra città
    (= (distance milan milan) 0)
    (= (distance milan rome) 5)
    (= (distance rome milan) 5)
    (= (distance rome rome) 0)
    
    ; Capacità e carico attuale dei veicoli
    (= (capacity truck1) 3)          ; il truck può trasportare massimo 3 pacchi
    (= (current-load truck1) 0)      ; inizialmente vuoto
  )
  
  (:goal
    (and
      (at pack1 romecenter)
      (at pack2 romecenter)
      (at pack3 termini)
      (at pack4 termini)
      (at pack5 romecenter)
    )
  )
)`;
export const plannumeric1 = `Plan computed:
   Time: (ACTION) [action Duration; action Cost]
 0.0000: (LOAD-TRUCK pack4 TRUCK1 milancenter) [D:0.00; C:1.00]
 0.0000: (LOAD-TRUCK pack3 TRUCK1 milancenter) [D:0.00; C:1.00]
 0.0000: (DRIVE-TRUCK TRUCK1 milancenter milanstation milan milan) [D:0.00; C:1.00]
 0.0000: (LOAD-TRUCK pack5 TRUCK1 milanstation) [D:0.00; C:1.00]
 0.0000: (DRIVE-TRUCK TRUCK1 milanstation termini milan rome) [D:5.00; C:1.00]
 5.0000: (UNLOAD-TRUCK pack3 TRUCK1 termini) [D:0.00; C:1.00]
 5.0000: (UNLOAD-TRUCK pack4 TRUCK1 termini) [D:0.00; C:1.00]
 5.0000: (DRIVE-TRUCK TRUCK1 termini milancenter rome milan) [D:5.00; C:1.00]
 10.0000: (LOAD-TRUCK pack2 TRUCK1 milancenter) [D:0.00; C:1.00]
 10.0000: (LOAD-TRUCK pack1 TRUCK1 milancenter) [D:0.00; C:1.00]
 10.0000: (DRIVE-TRUCK TRUCK1 milancenter romecenter milan rome) [D:5.00; C:1.00]
 15.0000: (UNLOAD-TRUCK pack1 TRUCK1 romecenter) [D:0.00; C:1.00]
 15.0000: (UNLOAD-TRUCK pack5 TRUCK1 romecenter) [D:0.00; C:1.00]
 15.0000: (UNLOAD-TRUCK pack2 TRUCK1 romecenter) [D:0.00; C:1.00]
`;
export const plannumeric2 = `
NUMERIC_THREATS_MODE: 0

; Command line: ./lpg-td -o dom.pddl -f prog.pddl -n 1


Parsing domain file:  domain 'LOGISTICS' defined ... done.
Parsing problem file:  problem 'LOGISTICS-COMPLEX-DELIVERY' defined ... done.



Modality: Incremental Planner

Number of actions             :    3190
Number of conditional actions :       0
Number of facts               :     406


Analyzing Planning Problem:
        Temporal Planning Problem: NO
        Numeric Planning Problem: YES
        Problem with Timed Initial Literals: NO
        Problem with Derived Predicates: NO

Evaluation function weights:
     Action duration 0.00; Action cost 1.00


Computing mutex... done

Preprocessing total time: 0.04 seconds

Searching ('.' = every 50 search steps):
. solution found:
 Recompute start times

 first_solution_cpu_time: 0.09

Plan computed:
   Time: (ACTION) [action Duration; action Cost]
 0.0000: (DRIVE-TRUCK TRUCKC naplescenter STAZIONEturin naples turin) [D:9.00; C:1.00]
 0.0000: (LOAD-AIRPLANE packL plane1 AEROPORTOmilan) [D:0.00; C:1.00]
 0.0000: (FLY-AIRPLANE plane1 AEROPORTOmilan AEROnaplesport milan naples) [D:8.00; C:1.00]
 0.0000: (DRIVE-TRUCK TRUCKD CENTROturin CENTROvenice turin venice) [D:4.00; C:1.00]
 0.0000: (LOAD-AIRPLANE packM plane2 AEROPORTOrome) [D:0.00; C:1.00]
 0.0000: (FLY-AIRPLANE plane2 AEROPORTOrome AEROPORTOvenice rome venice) [D:5.00; C:1.00]
 0.0000: (DRIVE-TRUCK TRUCKA milancenter naplescenter milan naples) [D:8.00; C:1.00]
 4.0000: (LOAD-TRUCK packJ TRUCKD CENTROvenice) [D:0.00; C:1.00]
 4.0000: (DRIVE-TRUCK TRUCKD CENTROvenice AEROnaplesport venice naples) [D:6.00; C:1.00]
 5.0000: (UNLOAD-AIRPLANE packM plane2 AEROPORTOvenice) [D:0.00; C:1.00]
 8.0000: (UNLOAD-AIRPLANE packL plane1 AEROnaplesport) [D:0.00; C:1.00]
 8.0000: (LOAD-TRUCK packF TRUCKA naplescenter) [D:0.00; C:1.00]
 8.0000: (DRIVE-TRUCK TRUCKA naplescenter milanstation naples milan) [D:8.00; C:1.00]
 9.0000: (LOAD-TRUCK packI TRUCKC STAZIONEturin) [D:0.00; C:1.00]
 9.0000: (DRIVE-TRUCK TRUCKC STAZIONEturin PORTnaples turin naples) [D:9.00; C:1.00]
 10.0000: (UNLOAD-TRUCK packJ TRUCKD AEROnaplesport) [D:0.00; C:1.00]
 10.0000: (DRIVE-TRUCK TRUCKD AEROnaplesport CENTROturin naples turin) [D:9.00; C:1.00]
 16.0000: (UNLOAD-TRUCK packF TRUCKA milanstation) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK packI TRUCKC PORTnaples) [D:0.00; C:1.00]
 18.0000: (DRIVE-TRUCK TRUCKC PORTnaples AEROnaplesport naples naples) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK packN TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK packL TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK packJ TRUCKC AEROnaplesport) [D:0.00; C:1.00]
 18.0000: (DRIVE-TRUCK TRUCKC AEROnaplesport STAZIONEturin naples turin) [D:9.00; C:1.00]
 19.0000: (DRIVE-TRUCK TRUCKD CENTROturin PORTnaples turin naples) [D:9.00; C:1.00]
 27.0000: (UNLOAD-TRUCK packN TRUCKC STAZIONEturin) [D:0.00; C:1.00]
 27.0000: (DRIVE-TRUCK TRUCKC STAZIONEturin milancenter turin milan) [D:2.00; C:1.00]
 28.0000: (LOAD-TRUCK packG TRUCKD PORTnaples) [D:0.00; C:1.00]
 28.0000: (DRIVE-TRUCK TRUCKD PORTnaples CENTROturin naples turin) [D:9.00; C:1.00]
 29.0000: (LOAD-TRUCK packA TRUCKC milancenter) [D:0.00; C:1.00]
 29.0000: (DRIVE-TRUCK TRUCKC milancenter romecenter milan rome) [D:6.00; C:1.00]
 35.0000: (UNLOAD-TRUCK packA TRUCKC romecenter) [D:0.00; C:1.00]
 35.0000: (UNLOAD-TRUCK packL TRUCKC romecenter) [D:0.00; C:1.00]
 35.0000: (LOAD-TRUCK packL TRUCKB romecenter) [D:0.00; C:1.00]
 35.0000: (UNLOAD-TRUCK packJ TRUCKC romecenter) [D:0.00; C:1.00]
 35.0000: (DRIVE-TRUCK TRUCKC romecenter CENTROturin rome turin) [D:7.00; C:1.00]
 37.0000: (UNLOAD-TRUCK packG TRUCKD CENTROturin) [D:0.00; C:1.00]
 37.0000: (LOAD-TRUCK packH TRUCKD CENTROturin) [D:0.00; C:1.00]
 37.0000: (DRIVE-TRUCK TRUCKD CENTROturin STAZIONEvenice turin venice) [D:4.00; C:1.00]
 41.0000: (UNLOAD-TRUCK packH TRUCKD STAZIONEvenice) [D:0.00; C:1.00]
 41.0000: (DRIVE-TRUCK TRUCKD STAZIONEvenice AEROPORTOvenice venice venice) [D:0.00; C:1.00]
 41.0000: (LOAD-TRUCK packP TRUCKD AEROPORTOvenice) [D:0.00; C:1.00]
 41.0000: (LOAD-TRUCK packM TRUCKD AEROPORTOvenice) [D:0.00; C:1.00]
 41.0000: (DRIVE-TRUCK TRUCKD AEROPORTOvenice milanstation venice milan) [D:3.00; C:1.00]
 42.0000: (DRIVE-TRUCK TRUCKC CENTROturin AEROPORTOturin turin turin) [D:0.00; C:1.00]
 42.0000: (LOAD-TRUCK packO TRUCKC AEROPORTOturin) [D:0.00; C:1.00]
 42.0000: (DRIVE-TRUCK TRUCKC AEROPORTOturin romecenter turin rome) [D:7.00; C:1.00]
 44.0000: (UNLOAD-TRUCK packP TRUCKD milanstation) [D:0.00; C:1.00]
 44.0000: (LOAD-TRUCK packC TRUCKD milanstation) [D:0.00; C:1.00]
 44.0000: (DRIVE-TRUCK TRUCKD milanstation naplescenter milan naples) [D:8.00; C:1.00]
 49.0000: (UNLOAD-TRUCK packO TRUCKC romecenter) [D:0.00; C:1.00]
 49.0000: (LOAD-TRUCK packO TRUCKB romecenter) [D:0.00; C:1.00]
 49.0000: (DRIVE-TRUCK TRUCKC romecenter STAZIONEvenice rome venice) [D:5.00; C:1.00]
 49.0000: (LOAD-TRUCK packD TRUCKB romecenter) [D:0.00; C:1.00]
 49.0000: (DRIVE-TRUCK TRUCKB romecenter milancenter rome milan) [D:6.00; C:1.00]
 52.0000: (UNLOAD-TRUCK packC TRUCKD naplescenter) [D:0.00; C:1.00]
 52.0000: (UNLOAD-TRUCK packM TRUCKD naplescenter) [D:0.00; C:1.00]
 54.0000: (LOAD-TRUCK packK TRUCKC STAZIONEvenice) [D:0.00; C:1.00]
 54.0000: (DRIVE-TRUCK TRUCKC STAZIONEvenice milancenter venice milan) [D:3.00; C:1.00]
 55.0000: (UNLOAD-TRUCK packD TRUCKB milancenter) [D:0.00; C:1.00]
 55.0000: (LOAD-TRUCK packB TRUCKB milancenter) [D:0.00; C:1.00]
 55.0000: (DRIVE-TRUCK TRUCKB milancenter termini milan rome) [D:6.00; C:1.00]
 57.0000: (UNLOAD-TRUCK packK TRUCKC milancenter) [D:0.00; C:1.00]
 61.0000: (UNLOAD-TRUCK packB TRUCKB termini) [D:0.00; C:1.00]
 61.0000: (UNLOAD-TRUCK packL TRUCKB termini) [D:0.00; C:1.00]
 61.0000: (LOAD-TRUCK packE TRUCKB termini) [D:0.00; C:1.00]
 61.0000: (DRIVE-TRUCK TRUCKB termini CENTROvenice rome venice) [D:5.00; C:1.00]
 66.0000: (UNLOAD-TRUCK packE TRUCKB CENTROvenice) [D:0.00; C:1.00]
 66.0000: (UNLOAD-TRUCK packO TRUCKB CENTROvenice) [D:0.00; C:1.00]


Solution number: 1
Total time:      0.09
Search time:     0.05
Actions:         83
Duration:        66.000
Plan quality:    83.000
Total Num Flips: 96
     Plan file:       plan_prog.pddl_1.SOL`;

export const probnumeric2 = `(define (problem logistics-complex-delivery)
  (:domain logistics)
  (:objects
    milan rome naples turin venice - city
    milancenter milanstation aeroportomilan - location
    romecenter termini aeroportorome - location
    naplescenter portnaples aeronaplesport - location
    centroturin stazioneturin aeroportoturin - location
    centrovenice stazionevenice aeroportovenice - location
    aeroportomilan aeroportorome aeronaplesport aeroportoturin aeroportovenice - airport
    packa packb packc packd packe packf packg packh packi packj packk packl packm packn packo packp - package
    trucka truckb truckc truckd - truck
    plane1 plane2 - airplane
  )
  (:init
    (in-city milancenter milan)
    (in-city milanstation milan)
    (in-city aeroportomilan milan)
    (in-city romecenter rome)
    (in-city termini rome)
    (in-city aeroportorome rome)
    (in-city naplescenter naples)
    (in-city portnaples naples)
    (in-city aeronaplesport naples)
    (in-city centroturin turin)
    (in-city stazioneturin turin)
    (in-city aeroportoturin turin)
    (in-city centrovenice venice)
    (in-city stazionevenice venice)
    (in-city aeroportovenice venice)
    
    (at trucka milancenter)
    (at truckb romecenter)
    (at truckc naplescenter)
    (at truckd centroturin)
    (at plane1 aeroportomilan)
    (at plane2 aeroportorome)
    
    (at packa milancenter)
    (at packb milancenter)
    (at packc milanstation)
    (at packd romecenter)
    (at packe termini)
    (at packf naplescenter)
    (at packg portnaples)
    (at packh centroturin)
    (at packi stazioneturin)
    (at packj centrovenice)
    (at packk stazionevenice)
    (at packl aeroportomilan)
    (at packm aeroportorome)
    (at packn aeronaplesport)
    (at packo aeroportoturin)
    (at packp aeroportovenice)
    
    (= (distance milan milan) 1)
    (= (distance milan rome) 1)
    (= (distance milan naples) 1)
    (= (distance milan turin) 1)
    (= (distance milan venice) 1)
    (= (distance rome milan) 1)
    (= (distance rome rome) 1)
    (= (distance rome naples) 1)
    (= (distance rome turin) 1)
    (= (distance rome venice) 1)
    (= (distance naples milan) 1)
    (= (distance naples rome) 1)
    (= (distance naples naples) 1)
    (= (distance naples turin) 1)
    (= (distance naples venice) 1)
    (= (distance turin milan) 1)
    (= (distance turin rome) 1)
    (= (distance turin naples) 1)
    (= (distance turin turin) 1)
    (= (distance turin venice) 1)
    (= (distance venice milan) 1)
    (= (distance venice rome) 1)
    (= (distance venice naples) 1)
    (= (distance venice turin) 1)
    (= (distance venice venice) 1)
    
    (= (capacity trucka) 4)
    (= (capacity truckb) 3)
    (= (capacity truckc) 5)
    (= (capacity truckd) 2)
    (= (capacity plane1) 8)
    (= (capacity plane2) 6)
    
    (= (current-load trucka) 0)
    (= (current-load truckb) 0)
    (= (current-load truckc) 0)
    (= (current-load truckd) 0)
    (= (current-load plane1) 0)
    (= (current-load plane2) 0)
  )
  (:goal
    (and
      (at packa romecenter)
      (at packb termini)
      (at packc naplescenter)
      (at packd milancenter)
      (at packe centrovenice)
      (at packf milanstation)
      (at packg centroturin)
      (at packh stazionevenice)
      (at packi portnaples)
      (at packj romecenter)
      (at packk milancenter)
      (at packl termini)
      (at packm naplescenter)
      (at packn stazioneturin)
      (at packo centrovenice)
      (at packp milanstation)
    )
  )
)`;

export const prob1_ext2_classic = `(define (problem logistics-10-1)
  (:domain logistics)
  (:objects
    apn1 - airplane
    apt4 apt3 apt2 apt1 - airport
    pos4 pos3 pos2 pos1 - location
    cit4 cit3 cit2 cit1 - city
    tru4 tru3 tru2 tru1 - truck
    drone1 drone2 drone3 drone4 - drone
    obj43 obj42 obj41 obj33 obj32 obj31 obj23 obj22 obj21 obj13 obj12 obj11 - package
  )

  (:init
    (at apn1 apt2)
    (at tru1 pos1)
    (at obj11 pos1)
    (at obj12 pos1)
    (at obj13 pos1)
    (at tru2 pos2)
    (at obj21 pos2)
    (at obj22 pos2)
    (at obj23 pos2)
    (at tru3 pos3)
    (at obj31 pos3)
    (at obj32 pos3)
    (at obj33 pos3)
    (at tru4 pos4)
    (at obj41 pos4)
    (at obj42 pos4)
    (at obj43 pos4)
    (in-city pos1 cit1)
    (in-city apt1 cit1)
    (in-city pos2 cit2)
    (in-city apt2 cit2)
    (in-city pos3 cit3)
    (in-city apt3 cit3)
    (in-city pos4 cit4)
    (in-city apt4 cit4)
    (link cit4 cit3)
    (link cit3 cit4)
    (link cit1 cit2)
    (link cit2 cit1)
    (allowsDrones cit1)
    (allowsDrones cit2)
    (allowsDrones cit3)
    (at drone1 pos1)
    (at drone2 pos2)
    (at drone3 pos3)
    (at drone4 pos4)
  )

  (:goal
    (and (at obj43 apt4) (at obj32 pos3) (at obj42 apt3) (at obj12 pos1)
      (at obj41 apt3) (at obj23 pos3) (at obj13 apt4) (at obj22 pos4)
      (at obj31 apt3) (at obj33 apt1))
  )
)`;
export const plan1_ext2_classic = `domain parsed
problem parsed
grounding..
grounding time: 91
aibr preprocessing
|f|:226
|x|:0
|a|:500
|p|:0
|e|:0
h1 setup time (msec): 23
 g(n)= 1.0 h(n)=50.0
 g(n)= 2.0 h(n)=49.0
 g(n)= 3.0 h(n)=48.0
 g(n)= 4.0 h(n)=47.0
 g(n)= 5.0 h(n)=46.0
 g(n)= 6.0 h(n)=45.0
 g(n)= 7.0 h(n)=44.0
 g(n)= 8.0 h(n)=42.0
 g(n)= 9.0 h(n)=41.0
 g(n)= 10.0 h(n)=40.0
 g(n)= 11.0 h(n)=39.0
 g(n)= 12.0 h(n)=38.0
 g(n)= 13.0 h(n)=37.0
 g(n)= 14.0 h(n)=36.0
 g(n)= 15.0 h(n)=35.0
 g(n)= 16.0 h(n)=34.0
 g(n)= 17.0 h(n)=33.0
 g(n)= 18.0 h(n)=32.0
 g(n)= 19.0 h(n)=31.0
 g(n)= 20.0 h(n)=30.0
 g(n)= 21.0 h(n)=29.0
 g(n)= 22.0 h(n)=28.0
 g(n)= 23.0 h(n)=27.0
 g(n)= 24.0 h(n)=26.0
 g(n)= 25.0 h(n)=25.0
 g(n)= 26.0 h(n)=24.0
 g(n)= 28.0 h(n)=23.0
 g(n)= 29.0 h(n)=22.0
 g(n)= 30.0 h(n)=21.0
 g(n)= 31.0 h(n)=20.0
 g(n)= 33.0 h(n)=19.0
 g(n)= 34.0 h(n)=18.0
 g(n)= 35.0 h(n)=17.0
 g(n)= 36.0 h(n)=16.0
 g(n)= 37.0 h(n)=15.0
 g(n)= 38.0 h(n)=14.0
 g(n)= 39.0 h(n)=13.0
 g(n)= 40.0 h(n)=12.0
 g(n)= 41.0 h(n)=11.0
 g(n)= 42.0 h(n)=10.0
 g(n)= 43.0 h(n)=9.0
 g(n)= 44.0 h(n)=8.0
 g(n)= 45.0 h(n)=7.0
 g(n)= 46.0 h(n)=6.0
 g(n)= 48.0 h(n)=5.0
 g(n)= 49.0 h(n)=4.0
 g(n)= 50.0 h(n)=3.0
 g(n)= 51.0 h(n)=2.0
 g(n)= 52.0 h(n)=1.0
problem solved

found plan:
0.0: (fly-airplane apn1 apt2 apt4)
1.0: (load-truck obj33 tru3 pos3)
2.0: (load-drone obj23 drone2 pos2)
3.0: (load-truck obj22 tru2 pos2)
4.0: (drive-truck tru3 pos3 apt3 cit3)
5.0: (load-truck obj43 tru4 pos4)
6.0: (load-truck obj42 tru4 pos4)
7.0: (drive-truck tru4 pos4 apt4 cit4)
8.0: (fly-drone drone2 pos2 apt2 cit2)
9.0: (load-truck obj13 tru1 pos1)
10.0: (drive-truck tru1 pos1 apt1 cit1)
11.0: (drive-truck tru2 pos2 apt2 cit2)
12.0: (load-drone obj31 drone3 pos3)
13.0: (fly-drone drone3 pos3 apt3 cit3)
14.0: (unload-truck obj13 tru1 apt1)
15.0: (unload-truck obj43 tru4 apt4)
16.0: (unload-drone obj23 drone2 apt2)
17.0: (unload-truck obj22 tru2 apt2)
18.0: (unload-truck obj33 tru3 apt3)
19.0: (unload-drone obj31 drone3 apt3)
20.0: (unload-truck obj42 tru4 apt4)
21.0: (load-airplane obj42 apn1 apt4)
22.0: (fly-airplane apn1 apt4 apt3)
23.0: (load-airplane obj33 apn1 apt3)
24.0: (unload-airplane obj42 apn1 apt3)
25.0: (fly-airplane apn1 apt3 apt4)
26.0: (drive-truck tru4 apt4 pos4 cit4)
27.0: (load-truck obj41 tru4 pos4)
28.0: (drive-truck tru4 pos4 apt4 cit4)
29.0: (unload-truck obj41 tru4 apt4)
30.0: (load-airplane obj41 apn1 apt4)
31.0: (fly-airplane apn1 apt4 apt3)
32.0: (unload-airplane obj41 apn1 apt3)
33.0: (fly-airplane apn1 apt3 apt2)
34.0: (load-airplane obj22 apn1 apt2)
35.0: (fly-airplane apn1 apt2 apt4)
36.0: (unload-airplane obj22 apn1 apt4)
37.0: (fly-airplane apn1 apt4 apt1)
38.0: (load-airplane obj13 apn1 apt1)
39.0: (unload-airplane obj33 apn1 apt1)
40.0: (fly-airplane apn1 apt1 apt4)
41.0: (unload-airplane obj13 apn1 apt4)
42.0: (fly-airplane apn1 apt4 apt3)
43.0: (load-truck obj22 tru4 apt4)
44.0: (drive-truck tru4 apt4 pos4 cit4)
45.0: (unload-truck obj22 tru4 pos4)
46.0: (fly-airplane apn1 apt3 apt2)
47.0: (load-airplane obj23 apn1 apt2)
48.0: (fly-airplane apn1 apt2 apt3)
49.0: (unload-airplane obj23 apn1 apt3)
50.0: (load-drone obj23 drone3 apt3)
51.0: (fly-drone drone3 apt3 pos3 cit3)
52.0: (unload-drone obj23 drone3 pos3)

plan-length:53
metric (search):53.0
planning time (msec): 549
heuristic time (msec): 488
search time (msec): 543
expanded nodes:71
states evaluated:1837
number of dead-ends detected:130
number of duplicates detected:340`;