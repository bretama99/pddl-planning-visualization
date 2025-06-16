export const prob1_classic = `(define (problem logistics-multi-city)
  (:domain logistics)
  
  (:objects
    milano roma napoli - city
    malpensa fiumicino capodichino - airport
    centromilano stazionemilano - location
    centroroma terminiroma - location
    centronapoli portonapoli - location
    pacco1 pacco2 pacco3 pacco4 pacco5 - package
    truckmilano truckroma trucknapoli - truck
    aereo1 aereo2 - airplane
  )
  
  (:init
    (in-city malpensa milano)
    (in-city centromilano milano)
    (in-city stazionemilano milano)
    (in-city fiumicino roma)
    (in-city centroroma roma)
    (in-city terminiroma roma)
    (in-city capodichino napoli)
    (in-city centronapoli napoli)
    (in-city portonapoli napoli)
    (at truckmilano centromilano)
    (at truckroma centroroma)
    (at trucknapoli portonapoli)
    (at aereo1 malpensa)
    (at aereo2 fiumicino)
    (at pacco1 stazionemilano)
    (at pacco2 centromilano)
    (at pacco3 terminiroma)
    (at pacco4 centroroma)
    (at pacco5 centronapoli)
  )
  
  (:goal
    (and
      (at pacco1 centroroma)
      (at pacco2 portonapoli)
      (at pacco3 centromilano)
      (at pacco4 centronapoli)
      (at pacco5 terminiroma)
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
0.0: (drive-truck trucknapoli portonapoli capodichino napoli)
1.0: (drive-truck truckroma centroroma fiumicino roma)
2.0: (load-truck pacco2 truckmilano centromilano)
3.0: (drive-truck truckmilano centromilano malpensa milano)
4.0: (unload-truck pacco2 truckmilano malpensa)
5.0: (load-airplane pacco2 aereo1 malpensa)
6.0: (fly-airplane aereo1 malpensa capodichino)
7.0: (unload-airplane pacco2 aereo1 capodichino)
8.0: (load-truck pacco2 trucknapoli capodichino)
9.0: (drive-truck trucknapoli capodichino centronapoli napoli)
10.0: (load-truck pacco5 trucknapoli centronapoli)
11.0: (drive-truck trucknapoli centronapoli capodichino napoli)
12.0: (unload-truck pacco5 trucknapoli capodichino)
13.0: (load-airplane pacco5 aereo1 capodichino)
14.0: (fly-airplane aereo1 capodichino fiumicino)
15.0: (unload-airplane pacco5 aereo1 fiumicino)
16.0: (load-truck pacco5 truckroma fiumicino)
17.0: (drive-truck trucknapoli capodichino portonapoli napoli)
18.0: (unload-truck pacco2 trucknapoli portonapoli)
19.0: (drive-truck trucknapoli portonapoli capodichino napoli)
20.0: (fly-airplane aereo2 fiumicino malpensa)
21.0: (drive-truck truckroma fiumicino centroroma roma)
22.0: (load-truck pacco4 truckroma centroroma)
23.0: (drive-truck truckroma centroroma fiumicino roma)
24.0: (unload-truck pacco4 truckroma fiumicino)
25.0: (load-airplane pacco4 aereo1 fiumicino)
26.0: (fly-airplane aereo1 fiumicino capodichino)
27.0: (unload-airplane pacco4 aereo1 capodichino)
28.0: (load-truck pacco4 trucknapoli capodichino)
29.0: (drive-truck trucknapoli capodichino centronapoli napoli)
30.0: (unload-truck pacco4 trucknapoli centronapoli)
31.0: (drive-truck truckroma fiumicino terminiroma roma)
32.0: (load-truck pacco3 truckroma terminiroma)
33.0: (drive-truck truckroma terminiroma fiumicino roma)
34.0: (unload-truck pacco3 truckroma fiumicino)
35.0: (drive-truck truckroma fiumicino terminiroma roma)
36.0: (unload-truck pacco5 truckroma terminiroma)
37.0: (drive-truck truckroma terminiroma fiumicino roma)
38.0: (fly-airplane aereo2 malpensa fiumicino)
39.0: (load-airplane pacco3 aereo2 fiumicino)
40.0: (fly-airplane aereo2 fiumicino malpensa)
41.0: (unload-airplane pacco3 aereo2 malpensa)
42.0: (load-truck pacco3 truckmilano malpensa)
43.0: (drive-truck truckmilano malpensa stazionemilano milano)
44.0: (load-truck pacco1 truckmilano stazionemilano)
45.0: (drive-truck truckmilano stazionemilano malpensa milano)
46.0: (unload-truck pacco1 truckmilano malpensa)
47.0: (drive-truck truckmilano malpensa centromilano milano)
48.0: (load-airplane pacco1 aereo2 malpensa)
49.0: (fly-airplane aereo2 malpensa fiumicino)
50.0: (unload-airplane pacco1 aereo2 fiumicino)
51.0: (load-truck pacco1 truckroma fiumicino)
52.0: (drive-truck truckroma fiumicino centroroma roma)
53.0: (unload-truck pacco3 truckmilano centromilano)
54.0: (unload-truck pacco1 truckroma centroroma)

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
    milano roma napoli - city
    malpensa fiumicino capodichino - airport
    centromilano stazionemilano - location
    centroroma terminiroma - location
    centronapoli portonapoli - location
    pacco1 pacco2 pacco3 pacco4 pacco5 - package
    truckmilano truckroma trucknapoli - truck
    aereo1 aereo2 - airplane
  )
  
  (:init
    (in-city malpensa milano)
    (in-city centromilano milano)
    (in-city stazionemilano milano)
    (in-city fiumicino roma)
    (in-city centroroma roma)
    (in-city terminiroma roma)
    (in-city capodichino napoli)
    (in-city centronapoli napoli)
    (in-city portonapoli napoli)
    (at truckmilano centromilano)
    (at truckroma centroroma)
    (at trucknapoli portonapoli)
    (at aereo1 malpensa)
    (at aereo2 fiumicino)
    (at pacco1 stazionemilano)
    (at pacco2 centromilano)
    (at pacco3 terminiroma)
    (at pacco4 centroroma)
    (at pacco5 centronapoli)


    (= (capacity truckmilano) 4)
    (= (capacity truckroma) 3)
    (= (capacity trucknapoli) 3)
    (= (capacity aereo1) 8)
    (= (capacity aereo2) 9)
    
    (= (current-load truckmilano) 0)
    (= (current-load truckroma) 0)
    (= (current-load trucknapoli) 0)
    (= (current-load aereo1) 0)
    (= (current-load aereo2) 0)
  )
  
  (:goal
    (and
      (at pacco1 centroroma)
      (at pacco2 portonapoli)
      (at pacco3 centromilano)
      (at pacco4 centronapoli)
      (at pacco5 terminiroma)
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
0.0: (drive-truck trucknapoli portonapoli capodichino napoli)
1.0: (drive-truck truckroma centroroma fiumicino roma)
2.0: (load-truck pacco2 truckmilano centromilano)
3.0: (drive-truck truckmilano centromilano malpensa milano)
4.0: (unload-truck pacco2 truckmilano malpensa)
5.0: (load-airplane pacco2 aereo1 malpensa)
6.0: (fly-airplane aereo1 malpensa capodichino)
7.0: (unload-airplane pacco2 aereo1 capodichino)
8.0: (load-truck pacco2 trucknapoli capodichino)
9.0: (drive-truck trucknapoli capodichino centronapoli napoli)
10.0: (load-truck pacco5 trucknapoli centronapoli)
11.0: (drive-truck trucknapoli centronapoli capodichino napoli)
12.0: (unload-truck pacco5 trucknapoli capodichino)
13.0: (load-airplane pacco5 aereo1 capodichino)
14.0: (fly-airplane aereo1 capodichino fiumicino)
15.0: (unload-airplane pacco5 aereo1 fiumicino)
16.0: (load-truck pacco5 truckroma fiumicino)
17.0: (drive-truck trucknapoli capodichino portonapoli napoli)
18.0: (unload-truck pacco2 trucknapoli portonapoli)
19.0: (drive-truck trucknapoli portonapoli capodichino napoli)
20.0: (drive-truck truckmilano malpensa stazionemilano milano)
21.0: (load-truck pacco1 truckmilano stazionemilano)
22.0: (drive-truck truckmilano stazionemilano malpensa milano)
23.0: (unload-truck pacco1 truckmilano malpensa)
24.0: (fly-airplane aereo2 fiumicino malpensa)
25.0: (load-airplane pacco1 aereo2 malpensa)
26.0: (fly-airplane aereo2 malpensa fiumicino)
27.0: (unload-airplane pacco1 aereo2 fiumicino)
28.0: (load-truck pacco1 truckroma fiumicino)
29.0: (drive-truck truckroma fiumicino centroroma roma)
30.0: (load-truck pacco4 truckroma centroroma)
31.0: (drive-truck truckroma centroroma terminiroma roma)
32.0: (unload-truck pacco5 truckroma terminiroma)
33.0: (load-truck pacco3 truckroma terminiroma)
34.0: (drive-truck truckroma terminiroma fiumicino roma)
35.0: (unload-truck pacco4 truckroma fiumicino)
36.0: (load-airplane pacco4 aereo1 fiumicino)
37.0: (fly-airplane aereo1 fiumicino capodichino)
38.0: (unload-truck pacco3 truckroma fiumicino)
39.0: (drive-truck truckroma fiumicino centroroma roma)
40.0: (load-airplane pacco3 aereo2 fiumicino)
41.0: (fly-airplane aereo2 fiumicino malpensa)
42.0: (unload-airplane pacco4 aereo1 capodichino)
43.0: (unload-airplane pacco3 aereo2 malpensa)
44.0: (load-truck pacco4 trucknapoli capodichino)
45.0: (drive-truck trucknapoli capodichino centronapoli napoli)
46.0: (load-truck pacco3 truckmilano malpensa)
47.0: (drive-truck truckmilano malpensa centromilano milano)
48.0: (unload-truck pacco4 trucknapoli centronapoli)
49.0: (unload-truck pacco3 truckmilano centromilano)
50.0: (unload-truck pacco1 truckroma centroroma)

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
    torino bologna firenze venezia - city
    caselle marconi peretola marcotessera - airport
    piazzacastello lingotto - location
    stazionebologna mercato - location
    duomo pontevecchio - location
    sanmarco rialto - location
    pacco1 pacco2 pacco3 pacco4 pacco5 pacco6 - package
    trucktorino truckbologna truckfirenze truckvenezia - truck
    aereo1 aereo2 aereo3 - airplane
  )
  
  (:init
    (in-city caselle torino)
    (in-city piazzacastello torino)
    (in-city lingotto torino)
    (in-city marconi bologna)
    (in-city stazionebologna bologna)
    (in-city mercato bologna)
    (in-city peretola firenze)
    (in-city duomo firenze)
    (in-city pontevecchio firenze)
    (in-city marcotessera venezia)
    (in-city sanmarco venezia)
    (in-city rialto venezia)
    (at trucktorino lingotto)
    (at truckbologna mercato)
    (at truckfirenze duomo)
    (at truckvenezia sanmarco)
    (at aereo1 caselle)
    (at aereo2 marconi)
    (at aereo3 marcotessera)
    (at pacco1 piazzacastello)
    (at pacco2 stazionebologna)
    (at pacco3 lingotto)
    (at pacco4 pontevecchio)
    (at pacco5 sanmarco)
    (at pacco6 rialto)
    
  )
  
  (:goal
    (and
      (at pacco1 mercato)
      (at pacco2 duomo)
      (at pacco3 stazionebologna)
      (at pacco4 piazzacastello)
      (at pacco5 lingotto)
      (at pacco6 pontevecchio)
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
0.0: (drive-truck trucktorino lingotto caselle torino)
1.0: (drive-truck truckbologna mercato marconi bologna)
2.0: (drive-truck truckfirenze duomo peretola firenze)
3.0: (load-truck pacco5 truckvenezia sanmarco)
4.0: (drive-truck truckvenezia sanmarco marcotessera venezia)
5.0: (unload-truck pacco5 truckvenezia marcotessera)
6.0: (load-airplane pacco5 aereo3 marcotessera)
7.0: (fly-airplane aereo2 marconi peretola)
8.0: (fly-airplane aereo3 marcotessera caselle)
9.0: (unload-airplane pacco5 aereo3 caselle)
10.0: (load-truck pacco5 trucktorino caselle)
11.0: (fly-airplane aereo1 caselle peretola)
12.0: (drive-truck truckvenezia marcotessera rialto venezia)
13.0: (load-truck pacco6 truckvenezia rialto)
14.0: (drive-truck truckvenezia rialto marcotessera venezia)
15.0: (unload-truck pacco6 truckvenezia marcotessera)
16.0: (fly-airplane aereo2 peretola marcotessera)
17.0: (load-airplane pacco6 aereo2 marcotessera)
18.0: (fly-airplane aereo2 marcotessera peretola)
19.0: (unload-airplane pacco6 aereo2 peretola)
20.0: (load-truck pacco6 truckfirenze peretola)
21.0: (fly-airplane aereo2 peretola caselle)
22.0: (drive-truck truckfirenze peretola pontevecchio firenze)
23.0: (load-truck pacco4 truckfirenze pontevecchio)
24.0: (drive-truck truckfirenze pontevecchio peretola firenze)
25.0: (unload-truck pacco4 truckfirenze peretola)
26.0: (load-airplane pacco4 aereo1 peretola)
27.0: (fly-airplane aereo2 caselle marconi)
28.0: (fly-airplane aereo1 peretola caselle)
29.0: (unload-airplane pacco4 aereo1 caselle)
30.0: (load-truck pacco4 trucktorino caselle)
31.0: (drive-truck trucktorino caselle piazzacastello torino)
32.0: (load-truck pacco1 trucktorino piazzacastello)
33.0: (drive-truck trucktorino piazzacastello caselle torino)
34.0: (unload-truck pacco1 trucktorino caselle)
35.0: (drive-truck trucktorino caselle lingotto torino)
36.0: (load-truck pacco3 trucktorino lingotto)
37.0: (load-airplane pacco1 aereo1 caselle)
38.0: (fly-airplane aereo1 caselle marconi)
39.0: (unload-airplane pacco1 aereo1 marconi)
40.0: (load-truck pacco1 truckbologna marconi)
41.0: (unload-truck pacco5 trucktorino lingotto)
42.0: (drive-truck trucktorino lingotto caselle torino)
43.0: (unload-truck pacco3 trucktorino caselle)
44.0: (drive-truck trucktorino caselle piazzacastello torino)
45.0: (load-airplane pacco3 aereo3 caselle)
46.0: (fly-airplane aereo3 caselle marconi)
47.0: (unload-airplane pacco3 aereo3 marconi)
48.0: (load-truck pacco3 truckbologna marconi)
49.0: (drive-truck truckbologna marconi stazionebologna bologna)
50.0: (load-truck pacco2 truckbologna stazionebologna)
51.0: (unload-truck pacco3 truckbologna stazionebologna)
52.0: (drive-truck truckbologna stazionebologna marconi bologna)
53.0: (unload-truck pacco2 truckbologna marconi)
54.0: (drive-truck truckbologna marconi mercato bologna)
55.0: (load-airplane pacco2 aereo1 marconi)
56.0: (fly-airplane aereo1 marconi peretola)
57.0: (unload-airplane pacco2 aereo1 peretola)
58.0: (load-truck pacco2 truckfirenze peretola)
59.0: (drive-truck truckfirenze peretola duomo firenze)
60.0: (unload-truck pacco4 trucktorino piazzacastello)
61.0: (unload-truck pacco2 truckfirenze duomo)
62.0: (drive-truck truckfirenze duomo pontevecchio firenze)
63.0: (unload-truck pacco6 truckfirenze pontevecchio)
64.0: (unload-truck pacco1 truckbologna mercato)

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
    torino bologna firenze venezia - city
    caselle marconi peretola marcotessera - airport
    piazzacastello lingotto - location
    stazionebologna mercato - location
    duomo pontevecchio - location
    sanmarco rialto - location
    pacco1 pacco2 pacco3 pacco4 pacco5 pacco6 - package
    trucktorino truckbologna truckfirenze truckvenezia - truck
    aereo1 aereo2 aereo3 - airplane
  )
  
  (:init
    (in-city caselle torino)
    (in-city piazzacastello torino)
    (in-city lingotto torino)
    (in-city marconi bologna)
    (in-city stazionebologna bologna)
    (in-city mercato bologna)
    (in-city peretola firenze)
    (in-city duomo firenze)
    (in-city pontevecchio firenze)
    (in-city marcotessera venezia)
    (in-city sanmarco venezia)
    (in-city rialto venezia)
    (at trucktorino lingotto)
    (at truckbologna mercato)
    (at truckfirenze duomo)
    (at truckvenezia sanmarco)
    (at aereo1 caselle)
    (at aereo2 marconi)
    (at aereo3 marcotessera)
    (at pacco1 piazzacastello)
    (at pacco2 stazionebologna)
    (at pacco3 lingotto)
    (at pacco4 pontevecchio)
    (at pacco5 sanmarco)
    (at pacco6 rialto)
    (= (capacity trucktorino) 4)
    (= (capacity truckbologna) 3)
    (= (capacity truckfirenze) 3)
    (= (capacity truckvenezia) 2)
    (= (capacity aereo1) 8)
    (= (capacity aereo2) 9)
    (= (capacity aereo3) 6)
    
    (= (current-load trucktorino) 0)
    (= (current-load truckbologna) 0)
    (= (current-load truckfirenze) 0)
    (= (current-load truckvenezia) 0)
    (= (current-load aereo1) 0)
    (= (current-load aereo2) 0)
    (= (current-load aereo3) 0)
  )
  
  (:goal
    (and
      (at pacco1 mercato)
      (at pacco2 duomo)
      (at pacco3 stazionebologna)
      (at pacco4 piazzacastello)
      (at pacco5 lingotto)
      (at pacco6 pontevecchio)
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
0.0: (drive-truck trucktorino lingotto caselle torino)
1.0: (drive-truck truckbologna mercato marconi bologna)
2.0: (drive-truck truckfirenze duomo peretola firenze)
3.0: (load-truck pacco5 truckvenezia sanmarco)
4.0: (drive-truck truckvenezia sanmarco marcotessera venezia)
5.0: (unload-truck pacco5 truckvenezia marcotessera)
6.0: (load-airplane pacco5 aereo3 marcotessera)
7.0: (fly-airplane aereo2 marconi peretola)
8.0: (fly-airplane aereo3 marcotessera caselle)
9.0: (unload-airplane pacco5 aereo3 caselle)
10.0: (load-truck pacco5 trucktorino caselle)
11.0: (fly-airplane aereo1 caselle marconi)
12.0: (drive-truck truckvenezia marcotessera rialto venezia)
13.0: (load-truck pacco6 truckvenezia rialto)
14.0: (drive-truck truckvenezia rialto marcotessera venezia)
15.0: (unload-truck pacco6 truckvenezia marcotessera)
16.0: (fly-airplane aereo2 peretola marcotessera)
17.0: (load-airplane pacco6 aereo2 marcotessera)
18.0: (fly-airplane aereo2 marcotessera peretola)
19.0: (unload-airplane pacco6 aereo2 peretola)
20.0: (load-truck pacco6 truckfirenze peretola)
21.0: (fly-airplane aereo2 peretola marcotessera)
22.0: (drive-truck truckfirenze peretola pontevecchio firenze)
23.0: (load-truck pacco4 truckfirenze pontevecchio)
24.0: (drive-truck truckfirenze pontevecchio peretola firenze)
25.0: (unload-truck pacco4 truckfirenze peretola)
26.0: (fly-airplane aereo2 marcotessera peretola)
27.0: (load-airplane pacco4 aereo2 peretola)
28.0: (fly-airplane aereo2 peretola caselle)
29.0: (unload-airplane pacco4 aereo2 caselle)
30.0: (load-truck pacco4 trucktorino caselle)
31.0: (drive-truck trucktorino caselle piazzacastello torino)
32.0: (load-truck pacco1 trucktorino piazzacastello)
33.0: (drive-truck trucktorino piazzacastello caselle torino)
34.0: (unload-truck pacco1 trucktorino caselle)
35.0: (drive-truck trucktorino caselle lingotto torino)
36.0: (load-truck pacco3 trucktorino lingotto)
37.0: (load-airplane pacco1 aereo3 caselle)
38.0: (fly-airplane aereo3 caselle marconi)
39.0: (unload-airplane pacco1 aereo3 marconi)
40.0: (load-truck pacco1 truckbologna marconi)
41.0: (unload-truck pacco5 trucktorino lingotto)
42.0: (drive-truck trucktorino lingotto caselle torino)
43.0: (unload-truck pacco3 trucktorino caselle)
44.0: (drive-truck trucktorino caselle piazzacastello torino)
45.0: (load-airplane pacco3 aereo2 caselle)
46.0: (fly-airplane aereo2 caselle marconi)
47.0: (unload-airplane pacco3 aereo2 marconi)
48.0: (load-truck pacco3 truckbologna marconi)
49.0: (drive-truck truckbologna marconi stazionebologna bologna)
50.0: (load-truck pacco2 truckbologna stazionebologna)
51.0: (unload-truck pacco3 truckbologna stazionebologna)
52.0: (drive-truck truckbologna stazionebologna marconi bologna)
53.0: (unload-truck pacco2 truckbologna marconi)
54.0: (drive-truck truckbologna marconi mercato bologna)
55.0: (load-airplane pacco2 aereo1 marconi)
56.0: (fly-airplane aereo1 marconi peretola)
57.0: (unload-airplane pacco2 aereo1 peretola)
58.0: (load-truck pacco2 truckfirenze peretola)
59.0: (drive-truck truckfirenze peretola pontevecchio firenze)
60.0: (unload-truck pacco4 trucktorino piazzacastello)
61.0: (unload-truck pacco6 truckfirenze pontevecchio)
62.0: (drive-truck truckfirenze pontevecchio duomo firenze)
63.0: (unload-truck pacco2 truckfirenze duomo)
64.0: (unload-truck pacco1 truckbologna mercato)

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
    milano roma napoli torino bologna - city
    malpensa fiumicino capodichino caselle marconi - airport
    centromilano stazionemilano navigli - location
    centroroma terminiroma trastevere - location
    centronapoli portonapoli quartierispagnoli - location
    centrotorino portanuova lingotto - location
    centrobologna stazionebologna universitabologna - location
    pacco1 pacco2 pacco3 pacco4 pacco5 pacco6 pacco7 pacco8 - package
    truckmilano truckroma trucknapoli trucktorino truckbologna - truck
    aereo1 aereo2 aereo3 - airplane
  )
  
  (:init
    (in-city malpensa milano)
    (in-city fiumicino roma)
    (in-city capodichino napoli)
    (in-city caselle torino)
    (in-city marconi bologna)
    (in-city centromilano milano)
    (in-city stazionemilano milano)
    (in-city navigli milano)
    (in-city centroroma roma)
    (in-city terminiroma roma)
    (in-city trastevere roma)
    (in-city centronapoli napoli)
    (in-city portonapoli napoli)
    (in-city quartierispagnoli napoli)
    (in-city centrotorino torino)
    (in-city portanuova torino)
    (in-city lingotto torino)
    (in-city centrobologna bologna)
    (in-city stazionebologna bologna)
    (in-city universitabologna bologna)
    (at truckmilano centromilano)
    (at truckroma centroroma)
    (at trucknapoli centronapoli)
    (at trucktorino centrotorino)
    (at truckbologna centrobologna)
    (at aereo1 malpensa)
    (at aereo2 fiumicino)
    (at aereo3 caselle)
    (at pacco1 stazionemilano)
    (at pacco2 navigli)
    (at pacco3 terminiroma)
    (at pacco4 trastevere)
    (at pacco5 portonapoli)
    (at pacco6 quartierispagnoli)
    (at pacco7 portanuova)
    (at pacco8 universitabologna)
  )
  
  (:goal
    (and
      (at pacco1 centroroma)
      (at pacco2 portonapoli)
      (at pacco3 navigli)
      (at pacco4 centronapoli)
      (at pacco5 lingotto)
      (at pacco6 stazionebologna)
      (at pacco7 trastevere)
      (at pacco8 stazionemilano)
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
0.0: (drive-truck truckmilano centromilano malpensa milano)
1.0: (drive-truck trucknapoli centronapoli capodichino napoli)
2.0: (drive-truck truckroma centroroma fiumicino roma)
3.0: (drive-truck truckbologna centrobologna marconi bologna)
4.0: (drive-truck trucktorino centrotorino caselle torino)
5.0: (fly-airplane aereo2 fiumicino capodichino)
6.0: (fly-airplane aereo3 caselle fiumicino)
7.0: (drive-truck truckbologna marconi universitabologna bologna)
8.0: (load-truck pacco8 truckbologna universitabologna)
9.0: (drive-truck truckbologna universitabologna marconi bologna)
10.0: (unload-truck pacco8 truckbologna marconi)
11.0: (fly-airplane aereo1 malpensa marconi)
12.0: (load-airplane pacco8 aereo1 marconi)
13.0: (fly-airplane aereo1 marconi malpensa)
14.0: (unload-airplane pacco8 aereo1 malpensa)
15.0: (load-truck pacco8 truckmilano malpensa)
16.0: (fly-airplane aereo1 malpensa capodichino)
17.0: (drive-truck truckbologna marconi stazionebologna bologna)
18.0: (fly-airplane aereo2 capodichino caselle)
19.0: (drive-truck truckmilano malpensa navigli milano)
20.0: (load-truck pacco2 truckmilano navigli)
21.0: (drive-truck truckmilano navigli malpensa milano)
22.0: (unload-truck pacco2 truckmilano malpensa)
23.0: (fly-airplane aereo3 fiumicino malpensa)
24.0: (load-airplane pacco2 aereo3 malpensa)
25.0: (drive-truck truckmilano malpensa stazionemilano milano)
26.0: (load-truck pacco1 truckmilano stazionemilano)
27.0: (drive-truck truckmilano stazionemilano malpensa milano)
28.0: (unload-truck pacco1 truckmilano malpensa)
29.0: (load-airplane pacco1 aereo3 malpensa)
30.0: (fly-airplane aereo3 malpensa fiumicino)
31.0: (unload-airplane pacco1 aereo3 fiumicino)
32.0: (load-truck pacco1 truckroma fiumicino)
33.0: (fly-airplane aereo3 fiumicino capodichino)
34.0: (fly-airplane aereo1 capodichino malpensa)
35.0: (unload-airplane pacco2 aereo3 capodichino)
36.0: (load-truck pacco2 trucknapoli capodichino)
37.0: (drive-truck truckmilano malpensa stazionemilano milano)
38.0: (unload-truck pacco8 truckmilano stazionemilano)
39.0: (drive-truck truckmilano stazionemilano navigli milano)
40.0: (fly-airplane aereo1 malpensa fiumicino)
41.0: (fly-airplane aereo2 caselle malpensa)
42.0: (fly-airplane aereo1 fiumicino caselle)
43.0: (drive-truck trucknapoli capodichino portonapoli napoli)
44.0: (load-truck pacco5 trucknapoli portonapoli)
45.0: (drive-truck trucknapoli portonapoli capodichino napoli)
46.0: (unload-truck pacco5 trucknapoli capodichino)
47.0: (load-airplane pacco5 aereo3 capodichino)
48.0: (fly-airplane aereo1 caselle fiumicino)
49.0: (fly-airplane aereo3 capodichino caselle)
50.0: (fly-airplane aereo1 fiumicino capodichino)
51.0: (unload-airplane pacco5 aereo3 caselle)
52.0: (load-truck pacco5 trucktorino caselle)
53.0: (drive-truck trucktorino caselle lingotto torino)
54.0: (unload-truck pacco5 trucktorino lingotto)
55.0: (drive-truck trucktorino lingotto portanuova torino)
56.0: (load-truck pacco7 trucktorino portanuova)
57.0: (drive-truck trucktorino portanuova caselle torino)
58.0: (unload-truck pacco7 trucktorino caselle)
59.0: (load-airplane pacco7 aereo3 caselle)
60.0: (fly-airplane aereo3 caselle fiumicino)
61.0: (unload-airplane pacco7 aereo3 fiumicino)
62.0: (load-truck pacco7 truckroma fiumicino)
63.0: (drive-truck truckroma fiumicino trastevere roma)
64.0: (load-truck pacco4 truckroma trastevere)
65.0: (drive-truck truckroma trastevere fiumicino roma)
66.0: (unload-truck pacco4 truckroma fiumicino)
67.0: (load-airplane pacco4 aereo3 fiumicino)
68.0: (fly-airplane aereo3 fiumicino capodichino)
69.0: (unload-airplane pacco4 aereo3 capodichino)
70.0: (load-truck pacco4 trucknapoli capodichino)
71.0: (drive-truck trucknapoli capodichino quartierispagnoli napoli)
72.0: (load-truck pacco6 trucknapoli quartierispagnoli)
73.0: (drive-truck trucknapoli quartierispagnoli centronapoli napoli)
74.0: (unload-truck pacco4 trucknapoli centronapoli)
75.0: (drive-truck trucknapoli centronapoli capodichino napoli)
76.0: (unload-truck pacco6 trucknapoli capodichino)
77.0: (drive-truck trucknapoli capodichino portonapoli napoli)
78.0: (load-airplane pacco6 aereo1 capodichino)
79.0: (fly-airplane aereo1 capodichino marconi)
80.0: (unload-airplane pacco6 aereo1 marconi)
81.0: (unload-truck pacco2 trucknapoli portonapoli)
82.0: (drive-truck truckroma fiumicino trastevere roma)
83.0: (unload-truck pacco7 truckroma trastevere)
84.0: (drive-truck truckroma trastevere centroroma roma)
85.0: (unload-truck pacco1 truckroma centroroma)
86.0: (drive-truck truckroma centroroma terminiroma roma)
87.0: (load-truck pacco3 truckroma terminiroma)
88.0: (drive-truck truckroma terminiroma fiumicino roma)
89.0: (unload-truck pacco3 truckroma fiumicino)
90.0: (fly-airplane aereo3 capodichino fiumicino)
91.0: (load-airplane pacco3 aereo3 fiumicino)
92.0: (fly-airplane aereo3 fiumicino malpensa)
93.0: (unload-airplane pacco3 aereo3 malpensa)
94.0: (drive-truck truckmilano navigli malpensa milano)
95.0: (load-truck pacco3 truckmilano malpensa)
96.0: (drive-truck truckmilano malpensa navigli milano)
97.0: (unload-truck pacco3 truckmilano navigli)
98.0: (drive-truck truckbologna stazionebologna marconi bologna)
99.0: (load-truck pacco6 truckbologna marconi)
100.0: (drive-truck truckbologna marconi stazionebologna bologna)
101.0: (unload-truck pacco6 truckbologna stazionebologna)

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
    milano roma napoli torino bologna - city
    malpensa fiumicino capodichino caselle marconi - airport
    centromilano stazionemilano navigli - location
    centroroma terminiroma trastevere - location
    centronapoli portonapoli quartierispagnoli - location
    centrotorino portanuova lingotto - location
    centrobologna stazionebologna universitabologna - location
    pacco1 pacco2 pacco3 pacco4 pacco5 pacco6 pacco7 pacco8 - package
    truckmilano truckroma trucknapoli trucktorino truckbologna - truck
    aereo1 aereo2 aereo3 - airplane
  )
  
  (:init
    (in-city malpensa milano)
    (in-city fiumicino roma)
    (in-city capodichino napoli)
    (in-city caselle torino)
    (in-city marconi bologna)
    (in-city centromilano milano)
    (in-city stazionemilano milano)
    (in-city navigli milano)
    (in-city centroroma roma)
    (in-city terminiroma roma)
    (in-city trastevere roma)
    (in-city centronapoli napoli)
    (in-city portonapoli napoli)
    (in-city quartierispagnoli napoli)
    (in-city centrotorino torino)
    (in-city portanuova torino)
    (in-city lingotto torino)
    (in-city centrobologna bologna)
    (in-city stazionebologna bologna)
    (in-city universitabologna bologna)
    (at truckmilano centromilano)
    (at truckroma centroroma)
    (at trucknapoli centronapoli)
    (at trucktorino centrotorino)
    (at truckbologna centrobologna)
    (at aereo1 malpensa)
    (at aereo2 fiumicino)
    (at aereo3 caselle)
    (at pacco1 stazionemilano)
    (at pacco2 navigli)
    (at pacco3 terminiroma)
    (at pacco4 trastevere)
    (at pacco5 portonapoli)
    (at pacco6 quartierispagnoli)
    (at pacco7 portanuova)
    (at pacco8 universitabologna)
    
    (= (capacity truckmilano) 4)
    (= (capacity truckroma) 5)
    (= (capacity trucknapoli) 3)
    (= (capacity trucktorino) 4)
    (= (capacity truckbologna) 3)
    (= (capacity aereo1) 10)
    (= (capacity aereo2) 8)
    (= (capacity aereo3) 6)
    
    (= (current-load truckmilano) 0)
    (= (current-load truckroma) 0)
    (= (current-load trucknapoli) 0)
    (= (current-load trucktorino) 0)
    (= (current-load truckbologna) 0)
    (= (current-load aereo1) 0)
    (= (current-load aereo2) 0)
    (= (current-load aereo3) 0)
  )
  
  (:goal
    (and
      (at pacco1 centroroma)
      (at pacco2 portonapoli)
      (at pacco3 navigli)
      (at pacco4 centronapoli)
      (at pacco5 lingotto)
      (at pacco6 stazionebologna)
      (at pacco7 trastevere)
      (at pacco8 stazionemilano)
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
0.0: (drive-truck truckmilano centromilano malpensa milano)
1.0: (drive-truck trucknapoli centronapoli capodichino napoli)
2.0: (drive-truck truckroma centroroma fiumicino roma)
3.0: (drive-truck truckbologna centrobologna marconi bologna)
4.0: (drive-truck trucktorino centrotorino caselle torino)
5.0: (fly-airplane aereo2 fiumicino capodichino)
6.0: (fly-airplane aereo3 caselle fiumicino)
7.0: (fly-airplane aereo1 malpensa marconi)
8.0: (drive-truck truckbologna marconi universitabologna bologna)
9.0: (load-truck pacco8 truckbologna universitabologna)
10.0: (drive-truck truckbologna universitabologna marconi bologna)
11.0: (unload-truck pacco8 truckbologna marconi)
12.0: (load-airplane pacco8 aereo1 marconi)
13.0: (fly-airplane aereo1 marconi malpensa)
14.0: (unload-airplane pacco8 aereo1 malpensa)
15.0: (load-truck pacco8 truckmilano malpensa)
16.0: (fly-airplane aereo1 malpensa fiumicino)
17.0: (fly-airplane aereo3 fiumicino malpensa)
18.0: (drive-truck truckbologna marconi stazionebologna bologna)
19.0: (drive-truck truckmilano malpensa navigli milano)
20.0: (load-truck pacco2 truckmilano navigli)
21.0: (drive-truck truckmilano navigli malpensa milano)
22.0: (unload-truck pacco2 truckmilano malpensa)
23.0: (load-airplane pacco2 aereo3 malpensa)
24.0: (fly-airplane aereo3 malpensa capodichino)
25.0: (unload-airplane pacco2 aereo3 capodichino)
26.0: (load-truck pacco2 trucknapoli capodichino)
27.0: (drive-truck truckmilano malpensa stazionemilano milano)
28.0: (load-truck pacco1 truckmilano stazionemilano)
29.0: (drive-truck truckmilano stazionemilano malpensa milano)
30.0: (unload-truck pacco1 truckmilano malpensa)
31.0: (drive-truck truckmilano malpensa stazionemilano milano)
32.0: (unload-truck pacco8 truckmilano stazionemilano)
33.0: (drive-truck truckmilano stazionemilano malpensa milano)
34.0: (fly-airplane aereo2 capodichino malpensa)
35.0: (load-airplane pacco1 aereo2 malpensa)
36.0: (fly-airplane aereo2 malpensa fiumicino)
37.0: (unload-airplane pacco1 aereo2 fiumicino)
38.0: (load-truck pacco1 truckroma fiumicino)
39.0: (fly-airplane aereo1 fiumicino capodichino)
40.0: (drive-truck truckmilano malpensa navigli milano)
41.0: (fly-airplane aereo3 capodichino fiumicino)
42.0: (drive-truck trucktorino caselle portanuova torino)
43.0: (load-truck pacco7 trucktorino portanuova)
44.0: (drive-truck trucktorino portanuova caselle torino)
45.0: (unload-truck pacco7 trucktorino caselle)
46.0: (fly-airplane aereo2 fiumicino caselle)
47.0: (load-airplane pacco7 aereo2 caselle)
48.0: (fly-airplane aereo2 caselle fiumicino)
49.0: (unload-airplane pacco7 aereo2 fiumicino)
50.0: (load-truck pacco7 truckroma fiumicino)
51.0: (drive-truck truckroma fiumicino trastevere roma)
52.0: (load-truck pacco4 truckroma trastevere)
53.0: (drive-truck truckroma trastevere fiumicino roma)
54.0: (unload-truck pacco4 truckroma fiumicino)
55.0: (load-airplane pacco4 aereo3 fiumicino)
56.0: (fly-airplane aereo3 fiumicino capodichino)
57.0: (unload-airplane pacco4 aereo3 capodichino)
58.0: (load-truck pacco4 trucknapoli capodichino)
59.0: (drive-truck trucknapoli capodichino portonapoli napoli)
60.0: (load-truck pacco5 trucknapoli portonapoli)
61.0: (drive-truck trucknapoli portonapoli capodichino napoli)
62.0: (unload-truck pacco5 trucknapoli capodichino)
63.0: (load-airplane pacco5 aereo1 capodichino)
64.0: (fly-airplane aereo1 capodichino caselle)
65.0: (unload-airplane pacco5 aereo1 caselle)
66.0: (load-truck pacco5 trucktorino caselle)
67.0: (drive-truck trucktorino caselle lingotto torino)
68.0: (unload-truck pacco5 trucktorino lingotto)
69.0: (drive-truck trucknapoli capodichino quartierispagnoli napoli)
70.0: (load-truck pacco6 trucknapoli quartierispagnoli)
71.0: (drive-truck trucknapoli quartierispagnoli centronapoli napoli)
72.0: (unload-truck pacco4 trucknapoli centronapoli)
73.0: (drive-truck trucknapoli centronapoli capodichino napoli)
74.0: (unload-truck pacco6 trucknapoli capodichino)
75.0: (drive-truck trucknapoli capodichino portonapoli napoli)
76.0: (load-airplane pacco6 aereo3 capodichino)
77.0: (fly-airplane aereo3 capodichino marconi)
78.0: (unload-airplane pacco6 aereo3 marconi)
79.0: (unload-truck pacco2 trucknapoli portonapoli)
80.0: (drive-truck truckroma fiumicino trastevere roma)
81.0: (unload-truck pacco7 truckroma trastevere)
82.0: (drive-truck truckroma trastevere centroroma roma)
83.0: (unload-truck pacco1 truckroma centroroma)
84.0: (drive-truck truckroma centroroma terminiroma roma)
85.0: (load-truck pacco3 truckroma terminiroma)
86.0: (drive-truck truckroma terminiroma fiumicino roma)
87.0: (unload-truck pacco3 truckroma fiumicino)
88.0: (load-airplane pacco3 aereo2 fiumicino)
89.0: (fly-airplane aereo2 fiumicino malpensa)
90.0: (unload-airplane pacco3 aereo2 malpensa)
91.0: (drive-truck truckmilano navigli malpensa milano)
92.0: (load-truck pacco3 truckmilano malpensa)
93.0: (drive-truck truckmilano malpensa navigli milano)
94.0: (unload-truck pacco3 truckmilano navigli)
95.0: (drive-truck truckbologna stazionebologna marconi bologna)
96.0: (load-truck pacco6 truckbologna marconi)
97.0: (drive-truck truckbologna marconi stazionebologna bologna)
98.0: (unload-truck pacco6 truckbologna stazionebologna)

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
    torino bologna firenze - city
    caselle marconi peretola - airport
    piazzacastello lingotto - location
    stazionebologna mercato - location
    duomo pontevecchio - location
    pacco1 pacco2 pacco3 pacco4 - package
    trucktorino truckbologna truckfirenze - truck
    aereo1 aereo2 - airplane
  )
  
  (:init
    (in-city caselle torino)
    (in-city piazzacastello torino)
    (in-city lingotto torino)
    (in-city marconi bologna)
    (in-city stazionebologna bologna)
    (in-city mercato bologna)
    (in-city peretola firenze)
    (in-city duomo firenze)
    (in-city pontevecchio firenze)
    (at trucktorino lingotto)
    (at truckbologna mercato)
    (at truckfirenze duomo)
    (at aereo1 caselle)
    (at aereo2 marconi)
    (at pacco1 piazzacastello)
    (at pacco2 stazionebologna)
    (at pacco3 lingotto)
    (at pacco4 pontevecchio)
  )
  
  (:goal
    (and
      (at pacco1 mercato)
      (at pacco2 duomo)
      (at pacco3 stazionebologna)
      (at pacco4 piazzacastello)
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
0.0: (drive-truck trucktorino lingotto caselle torino)
1.0: (drive-truck truckbologna mercato marconi bologna)
2.0: (drive-truck truckfirenze duomo peretola firenze)
3.0: (drive-truck trucktorino caselle piazzacastello torino)
4.0: (load-truck pacco1 trucktorino piazzacastello)
5.0: (drive-truck trucktorino piazzacastello caselle torino)
6.0: (unload-truck pacco1 trucktorino caselle)
7.0: (load-airplane pacco1 aereo1 caselle)
8.0: (fly-airplane aereo2 marconi peretola)
9.0: (fly-airplane aereo1 caselle marconi)
10.0: (unload-airplane pacco1 aereo1 marconi)
11.0: (load-truck pacco1 truckbologna marconi)
12.0: (drive-truck truckbologna marconi stazionebologna bologna)
13.0: (load-truck pacco2 truckbologna stazionebologna)
14.0: (drive-truck truckbologna stazionebologna marconi bologna)
15.0: (unload-truck pacco2 truckbologna marconi)
16.0: (load-airplane pacco2 aereo1 marconi)
17.0: (drive-truck truckbologna marconi mercato bologna)
18.0: (unload-truck pacco1 truckbologna mercato)
19.0: (drive-truck truckbologna mercato stazionebologna bologna)
20.0: (fly-airplane aereo1 marconi peretola)
21.0: (fly-airplane aereo2 peretola caselle)
22.0: (unload-airplane pacco2 aereo1 peretola)
23.0: (load-truck pacco2 truckfirenze peretola)
24.0: (drive-truck truckfirenze peretola duomo firenze)
25.0: (unload-truck pacco2 truckfirenze duomo)
26.0: (drive-truck truckfirenze duomo pontevecchio firenze)
27.0: (load-truck pacco4 truckfirenze pontevecchio)
28.0: (drive-truck truckfirenze pontevecchio peretola firenze)
29.0: (unload-truck pacco4 truckfirenze peretola)
30.0: (load-airplane pacco4 aereo1 peretola)
31.0: (fly-airplane aereo1 peretola caselle)
32.0: (unload-airplane pacco4 aereo1 caselle)
33.0: (load-truck pacco4 trucktorino caselle)
34.0: (drive-truck truckbologna stazionebologna marconi bologna)
35.0: (drive-truck trucktorino caselle lingotto torino)
36.0: (load-truck pacco3 trucktorino lingotto)
37.0: (drive-truck trucktorino lingotto caselle torino)
38.0: (unload-truck pacco3 trucktorino caselle)
39.0: (drive-truck trucktorino caselle piazzacastello torino)
40.0: (load-airplane pacco3 aereo2 caselle)
41.0: (fly-airplane aereo2 caselle marconi)
42.0: (unload-airplane pacco3 aereo2 marconi)
43.0: (load-truck pacco3 truckbologna marconi)
44.0: (drive-truck truckbologna marconi stazionebologna bologna)
45.0: (unload-truck pacco3 truckbologna stazionebologna)
46.0: (unload-truck pacco4 trucktorino piazzacastello)

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
    milano roma napoli torino bologna firenze - city
    centromilano stazionemilano - location
    centroroma terminiroma - location
    centronapoli portonapoli - location
    piazzacastello lingotto - location
    stazionebologna mercato - location
    duomo pontevecchio - location
    pacco1 pacco2 pacco3 pacco4 pacco5 pacco6 - package
    truck1 truck2 truck3 truck4 - truck
  )

  (:init
    (in-city centromilano milano)
    (in-city stazionemilano milano)
    (in-city centroroma roma)
    (in-city terminiroma roma)
    (in-city centronapoli napoli)
    (in-city portonapoli napoli)
    (in-city piazzacastello torino)
    (in-city lingotto torino)
    (in-city stazionebologna bologna)
    (in-city mercato bologna)
    (in-city duomo firenze)
    (in-city pontevecchio firenze)

    (at truck1 centromilano)
    (at truck2 centroroma)
    (at truck3 piazzacastello)
    (at truck4 duomo)

    (at pacco1 stazionemilano)
    (at pacco2 terminiroma)
    (at pacco3 centronapoli)
    (at pacco4 lingotto)
    (at pacco5 mercato)
    (at pacco6 pontevecchio)

    (= (distance milano milano) 0)
    (= (distance milano roma) 5)
    (= (distance milano napoli) 8)
    (= (distance milano torino) 2)
    (= (distance milano bologna) 3)
    (= (distance milano firenze) 4)

    (= (distance roma milano) 5)
    (= (distance roma roma) 0)
    (= (distance roma napoli) 2)
    (= (distance roma torino) 7)
    (= (distance roma bologna) 4)
    (= (distance roma firenze) 3)

    (= (distance napoli milano) 8)
    (= (distance napoli roma) 2)
    (= (distance napoli napoli) 0)
    (= (distance napoli torino) 10)
    (= (distance napoli bologna) 6)
    (= (distance napoli firenze) 5)

    (= (distance torino milano) 2)
    (= (distance torino roma) 7)
    (= (distance torino napoli) 10)
    (= (distance torino torino) 0)
    (= (distance torino bologna) 4)
    (= (distance torino firenze) 6)

    (= (distance bologna milano) 3)
    (= (distance bologna roma) 4)
    (= (distance bologna napoli) 6)
    (= (distance bologna torino) 4)
    (= (distance bologna bologna) 0)
    (= (distance bologna firenze) 2)

    (= (distance firenze milano) 4)
    (= (distance firenze roma) 3)
    (= (distance firenze napoli) 5)
    (= (distance firenze torino) 6)
    (= (distance firenze bologna) 2)
    (= (distance firenze firenze) 0)
  )

  (:goal
    (and
      (at pacco1 centroroma)
      (at pacco2 portonapoli)
      (at pacco3 piazzacastello)
      (at pacco4 mercato)
      (at pacco5 duomo)
      (at pacco6 centromilano)
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
 0.0000: (DRIVE-TRUCK TRUCK3 PIAZZACASTELLO STAZIONEMILANO TORINO MILANO) [D:2.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK4 DUOMO TERMINIROMA FIRENZE ROMA) [D:3.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK1 CENTROMILANO LINGOTTO MILANO TORINO) [D:2.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK2 CENTROROMA CENTRONAPOLI ROMA NAPOLI) [D:2.00; C:0.10]
 2.0000: (LOAD-TRUCK PACCO1 TRUCK3 STAZIONEMILANO) [D:0.00; C:0.10]
 2.0000: (DRIVE-TRUCK TRUCK3 STAZIONEMILANO CENTROROMA MILANO ROMA) [D:5.00; C:0.10]
 2.0000: (LOAD-TRUCK PACCO4 TRUCK1 LINGOTTO) [D:0.00; C:0.10]
 2.0000: (DRIVE-TRUCK TRUCK1 LINGOTTO MERCATO TORINO BOLOGNA) [D:4.00; C:0.10]
 2.0000: (LOAD-TRUCK PACCO3 TRUCK2 CENTRONAPOLI) [D:0.00; C:0.10]
 2.0000: (DRIVE-TRUCK TRUCK2 CENTRONAPOLI MERCATO NAPOLI BOLOGNA) [D:6.00; C:0.10]
 3.0000: (LOAD-TRUCK PACCO2 TRUCK4 TERMINIROMA) [D:0.00; C:0.10]
 3.0000: (DRIVE-TRUCK TRUCK4 TERMINIROMA PORTONAPOLI ROMA NAPOLI) [D:2.00; C:0.10]
 5.0000: (UNLOAD-TRUCK PACCO2 TRUCK4 PORTONAPOLI) [D:0.00; C:0.10]
 5.0000: (DRIVE-TRUCK TRUCK4 PORTONAPOLI PONTEVECCHIO NAPOLI FIRENZE) [D:5.00; C:0.10]
 6.0000: (UNLOAD-TRUCK PACCO4 TRUCK1 MERCATO) [D:0.00; C:0.10]
 6.0000: (LOAD-TRUCK PACCO5 TRUCK1 MERCATO) [D:0.00; C:0.10]
 6.0000: (DRIVE-TRUCK TRUCK1 MERCATO CENTROROMA BOLOGNA ROMA) [D:4.00; C:0.10]
 7.0000: (UNLOAD-TRUCK PACCO1 TRUCK3 CENTROROMA) [D:0.00; C:0.10]
 8.0000: (UNLOAD-TRUCK PACCO3 TRUCK2 MERCATO) [D:0.00; C:0.10]
 8.0000: (LOAD-TRUCK PACCO3 TRUCK2 MERCATO) [D:0.00; C:0.10]
 8.0000: (DRIVE-TRUCK TRUCK2 MERCATO STAZIONEMILANO BOLOGNA MILANO) [D:3.00; C:0.10]
 10.0000: (LOAD-TRUCK PACCO6 TRUCK4 PONTEVECCHIO) [D:0.00; C:0.10]
 10.0000: (DRIVE-TRUCK TRUCK4 PONTEVECCHIO CENTROMILANO FIRENZE MILANO) [D:4.00; C:0.10]
 10.0000: (DRIVE-TRUCK TRUCK1 CENTROROMA PORTONAPOLI ROMA NAPOLI) [D:2.00; C:0.10]
 11.0000: (DRIVE-TRUCK TRUCK2 STAZIONEMILANO CENTROMILANO MILANO MILANO) [D:0.00; C:0.10]
 11.0000: (DRIVE-TRUCK TRUCK2 CENTROMILANO PIAZZACASTELLO MILANO TORINO) [D:2.00; C:0.10]
 12.0000: (DRIVE-TRUCK TRUCK1 PORTONAPOLI DUOMO NAPOLI FIRENZE) [D:5.00; C:0.10]
 13.0000: (UNLOAD-TRUCK PACCO3 TRUCK2 PIAZZACASTELLO) [D:0.00; C:0.10]
 14.0000: (UNLOAD-TRUCK PACCO6 TRUCK4 CENTROMILANO) [D:0.00; C:0.10]
 17.0000: (UNLOAD-TRUCK PACCO5 TRUCK1 DUOMO) [D:0.00; C:0.10]



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
    milano roma torino - city
    malpensa fiumicino caselle - airport
    centromilano stazionemilano - location
    centroroma terminiroma - location
    piazzacastello lingotto - location
    pacco1 pacco2 pacco3 pacco4 - package
    truck1 truck2 truck3 - truck
    aereo1 aereo2 - airplane
  )
  
  (:init
    (in-city malpensa milano)
    (in-city centromilano milano)
    (in-city stazionemilano milano)
    (in-city fiumicino roma)
    (in-city centroroma roma)
    (in-city terminiroma roma)
    (in-city caselle torino)
    (in-city piazzacastello torino)
    (in-city lingotto torino)
    
    (at truck1 centromilano)
    (at truck2 centroroma)
    (at truck3 piazzacastello)
    (at aereo1 malpensa)
    (at aereo2 fiumicino)
    
    (at pacco1 malpensa)
    (at pacco2 fiumicino)
    (at pacco3 lingotto)
    (at pacco4 caselle)
    
    (= (distance milano milano) 0)
    (= (distance milano roma) 5)
    (= (distance milano torino) 2)
    
    (= (distance roma milano) 5)
    (= (distance roma roma) 0)
    (= (distance roma torino) 7)
    
    (= (distance torino milano) 2)
    (= (distance torino roma) 7)
    (= (distance torino torino) 0)
  )
  
  (:goal
    (and
      (at pacco1 caselle)
      (at pacco2 malpensa)
      (at pacco3 centromilano)
      (at pacco4 fiumicino)
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
 0.0000: (LOAD-AIRPLANE PACCO2 AEREO2 FIUMICINO) [D:0.00; C:0.10]
 0.0000: (FLY-AIRPLANE AEREO2 FIUMICINO MALPENSA ROMA MILANO) [D:5.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK1 CENTROMILANO LINGOTTO MILANO TORINO) [D:2.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK3 PIAZZACASTELLO CASELLE TORINO TORINO) [D:0.00; C:0.10]
 0.0000: (LOAD-TRUCK PACCO4 TRUCK3 CASELLE) [D:0.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK3 CASELLE FIUMICINO TORINO ROMA) [D:7.00; C:0.10]
 2.0000: (LOAD-TRUCK PACCO3 TRUCK1 LINGOTTO) [D:0.00; C:0.10]
 2.0000: (DRIVE-TRUCK TRUCK1 LINGOTTO CENTROMILANO TORINO MILANO) [D:2.00; C:0.10]
 4.0000: (UNLOAD-TRUCK PACCO3 TRUCK1 CENTROMILANO) [D:0.00; C:0.10]
 5.0000: (UNLOAD-AIRPLANE PACCO2 AEREO2 MALPENSA) [D:0.00; C:0.10]
 5.0000: (LOAD-AIRPLANE PACCO1 AEREO2 MALPENSA) [D:0.00; C:0.10]
 5.0000: (FLY-AIRPLANE AEREO2 MALPENSA CASELLE MILANO TORINO) [D:2.00; C:0.10]
 7.0000: (UNLOAD-AIRPLANE PACCO1 AEREO2 CASELLE) [D:0.00; C:0.10]
 7.0000: (UNLOAD-TRUCK PACCO4 TRUCK3 FIUMICINO) [D:0.00; C:0.10]



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
    milano roma torino napoli - city
    malpensa fiumicino caselle capodichino - airport
    centromilano stazionemilano duomo - location
    centroroma terminiroma colosseo - location
    piazzacastello lingotto portanuova - location
    centralenapoli vomero posillipo - location
    pacco1 pacco2 pacco3 pacco4 pacco5 pacco6 - package
    truck1 truck2 truck3 truck4 - truck
    aereo1 aereo2 aereo3 - airplane
  )

  (:init
    (in-city malpensa milano)
    (in-city centromilano milano)
    (in-city stazionemilano milano)
    (in-city duomo milano)

    (in-city fiumicino roma)
    (in-city centroroma roma)
    (in-city terminiroma roma)
    (in-city colosseo roma)

    (in-city caselle torino)
    (in-city piazzacastello torino)
    (in-city lingotto torino)
    (in-city portanuova torino)

    (in-city capodichino napoli)
    (in-city centralenapoli napoli)
    (in-city vomero napoli)
    (in-city posillipo napoli)

    (at truck1 centromilano)
    (at truck2 centroroma)
    (at truck3 piazzacastello)
    (at truck4 centralenapoli)

    (at aereo1 malpensa)
    (at aereo2 fiumicino)
    (at aereo3 capodichino)

    (at pacco1 duomo)
    (at pacco2 colosseo)
    (at pacco3 lingotto)
    (at pacco4 vomero)
    (at pacco5 malpensa)
    (at pacco6 caselle)
    (= (distance milano milano) 0)
    (= (distance milano roma) 5)
    (= (distance milano torino) 2)
    (= (distance milano napoli) 8)

    (= (distance roma milano) 5)
    (= (distance roma roma) 0)
    (= (distance roma torino) 7)
    (= (distance roma napoli) 3)

    (= (distance torino milano) 2)
    (= (distance torino roma) 7)
    (= (distance torino torino) 0)
    (= (distance torino napoli) 10)

    (= (distance napoli milano) 8)
    (= (distance napoli roma) 3)
    (= (distance napoli torino) 10)
    (= (distance napoli napoli) 0)
  )

  (:goal
    (and
      (at pacco1 capodichino)
      (at pacco2 portanuova)
      (at pacco3 terminiroma)
      (at pacco4 stazionemilano)
      (at pacco5 posillipo)
      (at pacco6 fiumicino)
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
 0.0000: (FLY-AIRPLANE AEREO2 FIUMICINO CASELLE ROMA TORINO) [D:7.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK4 CENTRALENAPOLI COLOSSEO NAPOLI ROMA) [D:3.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK3 PIAZZACASTELLO VOMERO TORINO NAPOLI) [D:10.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK2 CENTROROMA STAZIONEMILANO ROMA MILANO) [D:5.00; C:0.10]
 0.0000: (DRIVE-TRUCK TRUCK1 CENTROMILANO LINGOTTO MILANO TORINO) [D:2.00; C:0.10]
 2.0000: (LOAD-TRUCK PACCO3 TRUCK1 LINGOTTO) [D:0.00; C:0.10]
 2.0000: (DRIVE-TRUCK TRUCK1 LINGOTTO TERMINIROMA TORINO ROMA) [D:7.00; C:0.10]
 3.0000: (LOAD-TRUCK PACCO2 TRUCK4 COLOSSEO) [D:0.00; C:0.10]
 3.0000: (DRIVE-TRUCK TRUCK4 COLOSSEO CENTRALENAPOLI ROMA NAPOLI) [D:3.00; C:0.10]
 5.0000: (DRIVE-TRUCK TRUCK2 STAZIONEMILANO MALPENSA MILANO MILANO) [D:0.00; C:0.10]
 5.0000: (LOAD-TRUCK PACCO5 TRUCK2 MALPENSA) [D:0.00; C:0.10]
 5.0000: (DRIVE-TRUCK TRUCK2 MALPENSA PORTANUOVA MILANO TORINO) [D:2.00; C:0.10]
 6.0000: (DRIVE-TRUCK TRUCK4 CENTRALENAPOLI PORTANUOVA NAPOLI TORINO) [D:10.00; C:0.10]
 7.0000: (LOAD-AIRPLANE PACCO6 AEREO2 CASELLE) [D:0.00; C:0.10]
 7.0000: (FLY-AIRPLANE AEREO2 CASELLE FIUMICINO TORINO ROMA) [D:7.00; C:0.10]
 7.0000: (DRIVE-TRUCK TRUCK2 PORTANUOVA DUOMO TORINO MILANO) [D:2.00; C:0.10]
 9.0000: (LOAD-TRUCK PACCO1 TRUCK2 DUOMO) [D:0.00; C:0.10]
 9.0000: (DRIVE-TRUCK TRUCK2 DUOMO MALPENSA MILANO MILANO) [D:0.00; C:0.10]
 9.0000: (UNLOAD-TRUCK PACCO1 TRUCK2 MALPENSA) [D:0.00; C:0.10]
 9.0000: (LOAD-AIRPLANE PACCO1 AEREO1 MALPENSA) [D:0.00; C:0.10]
 9.0000: (FLY-AIRPLANE AEREO1 MALPENSA CAPODICHINO MILANO NAPOLI) [D:8.00; C:0.10]
 9.0000: (DRIVE-TRUCK TRUCK2 MALPENSA POSILLIPO MILANO NAPOLI) [D:8.00; C:0.10]
 9.0000: (UNLOAD-TRUCK PACCO3 TRUCK1 TERMINIROMA) [D:0.00; C:0.10]
 10.0000: (LOAD-TRUCK PACCO4 TRUCK3 VOMERO) [D:0.00; C:0.10]
 10.0000: (DRIVE-TRUCK TRUCK3 VOMERO STAZIONEMILANO NAPOLI MILANO) [D:8.00; C:0.10]
 14.0000: (UNLOAD-AIRPLANE PACCO6 AEREO2 FIUMICINO) [D:0.00; C:0.10]
 16.0000: (UNLOAD-TRUCK PACCO2 TRUCK4 PORTANUOVA) [D:0.00; C:0.10]
 17.0000: (UNLOAD-AIRPLANE PACCO1 AEREO1 CAPODICHINO) [D:0.00; C:0.10]
 17.0000: (UNLOAD-TRUCK PACCO5 TRUCK2 POSILLIPO) [D:0.00; C:0.10]
 18.0000: (UNLOAD-TRUCK PACCO4 TRUCK3 STAZIONEMILANO) [D:0.00; C:0.10]



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
    milano roma - city
    centromilano stazionemilano - location
    centroroma terminiroma - location
    pacco1 pacco2 pacco3 pacco4 pacco5 - package
    truck1 - truck
  )
  
  (:init
    ; Definizione delle città
    (in-city centromilano milano)
    (in-city stazionemilano milano)
    (in-city centroroma roma)
    (in-city terminiroma roma)
    
    ; Posizioni iniziali
    (at truck1 centromilano)
    (at pacco1 centromilano)
    (at pacco2 centromilano)
    (at pacco3 centromilano)
    (at pacco4 centromilano)
    (at pacco5 stazionemilano)
    
    ; Distanze tra città
    (= (distance milano milano) 0)
    (= (distance milano roma) 5)
    (= (distance roma milano) 5)
    (= (distance roma roma) 0)
    
    ; Capacità e carico attuale dei veicoli
    (= (capacity truck1) 3)          ; il truck può trasportare massimo 3 pacchi
    (= (current-load truck1) 0)      ; inizialmente vuoto
  )
  
  (:goal
    (and
      (at pacco1 centroroma)
      (at pacco2 centroroma)
      (at pacco3 terminiroma)
      (at pacco4 terminiroma)
      (at pacco5 centroroma)
    )
  )
)`;
export const plannumeric1 = `Plan computed:
   Time: (ACTION) [action Duration; action Cost]
 0.0000: (LOAD-TRUCK PACCO4 TRUCK1 CENTROMILANO) [D:0.00; C:1.00]
 0.0000: (LOAD-TRUCK PACCO3 TRUCK1 CENTROMILANO) [D:0.00; C:1.00]
 0.0000: (DRIVE-TRUCK TRUCK1 CENTROMILANO STAZIONEMILANO MILANO MILANO) [D:0.00; C:1.00]
 0.0000: (LOAD-TRUCK PACCO5 TRUCK1 STAZIONEMILANO) [D:0.00; C:1.00]
 0.0000: (DRIVE-TRUCK TRUCK1 STAZIONEMILANO TERMINIROMA MILANO ROMA) [D:5.00; C:1.00]
 5.0000: (UNLOAD-TRUCK PACCO3 TRUCK1 TERMINIROMA) [D:0.00; C:1.00]
 5.0000: (UNLOAD-TRUCK PACCO4 TRUCK1 TERMINIROMA) [D:0.00; C:1.00]
 5.0000: (DRIVE-TRUCK TRUCK1 TERMINIROMA CENTROMILANO ROMA MILANO) [D:5.00; C:1.00]
 10.0000: (LOAD-TRUCK PACCO2 TRUCK1 CENTROMILANO) [D:0.00; C:1.00]
 10.0000: (LOAD-TRUCK PACCO1 TRUCK1 CENTROMILANO) [D:0.00; C:1.00]
 10.0000: (DRIVE-TRUCK TRUCK1 CENTROMILANO CENTROROMA MILANO ROMA) [D:5.00; C:1.00]
 15.0000: (UNLOAD-TRUCK PACCO1 TRUCK1 CENTROROMA) [D:0.00; C:1.00]
 15.0000: (UNLOAD-TRUCK PACCO5 TRUCK1 CENTROROMA) [D:0.00; C:1.00]
 15.0000: (UNLOAD-TRUCK PACCO2 TRUCK1 CENTROROMA) [D:0.00; C:1.00]
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
 0.0000: (DRIVE-TRUCK TRUCKC CENTRONAPOLI STAZIONETORINO NAPOLI TORINO) [D:9.00; C:1.00]
 0.0000: (LOAD-AIRPLANE PACCOL AEREO1 AEROPORTOMILANO) [D:0.00; C:1.00]
 0.0000: (FLY-AIRPLANE AEREO1 AEROPORTOMILANO AEROPORTONAPOLI MILANO NAPOLI) [D:8.00; C:1.00]
 0.0000: (DRIVE-TRUCK TRUCKD CENTROTORINO CENTROVENEZIA TORINO VENEZIA) [D:4.00; C:1.00]
 0.0000: (LOAD-AIRPLANE PACCOM AEREO2 AEROPORTOROMA) [D:0.00; C:1.00]
 0.0000: (FLY-AIRPLANE AEREO2 AEROPORTOROMA AEROPORTOVENEZIA ROMA VENEZIA) [D:5.00; C:1.00]
 0.0000: (DRIVE-TRUCK TRUCKA CENTROMILANO CENTRONAPOLI MILANO NAPOLI) [D:8.00; C:1.00]
 4.0000: (LOAD-TRUCK PACCOJ TRUCKD CENTROVENEZIA) [D:0.00; C:1.00]
 4.0000: (DRIVE-TRUCK TRUCKD CENTROVENEZIA AEROPORTONAPOLI VENEZIA NAPOLI) [D:6.00; C:1.00]
 5.0000: (UNLOAD-AIRPLANE PACCOM AEREO2 AEROPORTOVENEZIA) [D:0.00; C:1.00]
 8.0000: (UNLOAD-AIRPLANE PACCOL AEREO1 AEROPORTONAPOLI) [D:0.00; C:1.00]
 8.0000: (LOAD-TRUCK PACCOF TRUCKA CENTRONAPOLI) [D:0.00; C:1.00]
 8.0000: (DRIVE-TRUCK TRUCKA CENTRONAPOLI STAZIONEMILANO NAPOLI MILANO) [D:8.00; C:1.00]
 9.0000: (LOAD-TRUCK PACCOI TRUCKC STAZIONETORINO) [D:0.00; C:1.00]
 9.0000: (DRIVE-TRUCK TRUCKC STAZIONETORINO PORTNAPOLI TORINO NAPOLI) [D:9.00; C:1.00]
 10.0000: (UNLOAD-TRUCK PACCOJ TRUCKD AEROPORTONAPOLI) [D:0.00; C:1.00]
 10.0000: (DRIVE-TRUCK TRUCKD AEROPORTONAPOLI CENTROTORINO NAPOLI TORINO) [D:9.00; C:1.00]
 16.0000: (UNLOAD-TRUCK PACCOF TRUCKA STAZIONEMILANO) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK PACCOI TRUCKC PORTNAPOLI) [D:0.00; C:1.00]
 18.0000: (DRIVE-TRUCK TRUCKC PORTNAPOLI AEROPORTONAPOLI NAPOLI NAPOLI) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK PACCON TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK PACCOL TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (UNLOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (LOAD-TRUCK PACCOJ TRUCKC AEROPORTONAPOLI) [D:0.00; C:1.00]
 18.0000: (DRIVE-TRUCK TRUCKC AEROPORTONAPOLI STAZIONETORINO NAPOLI TORINO) [D:9.00; C:1.00]
 19.0000: (DRIVE-TRUCK TRUCKD CENTROTORINO PORTNAPOLI TORINO NAPOLI) [D:9.00; C:1.00]
 27.0000: (UNLOAD-TRUCK PACCON TRUCKC STAZIONETORINO) [D:0.00; C:1.00]
 27.0000: (DRIVE-TRUCK TRUCKC STAZIONETORINO CENTROMILANO TORINO MILANO) [D:2.00; C:1.00]
 28.0000: (LOAD-TRUCK PACCOG TRUCKD PORTNAPOLI) [D:0.00; C:1.00]
 28.0000: (DRIVE-TRUCK TRUCKD PORTNAPOLI CENTROTORINO NAPOLI TORINO) [D:9.00; C:1.00]
 29.0000: (LOAD-TRUCK PACCOA TRUCKC CENTROMILANO) [D:0.00; C:1.00]
 29.0000: (DRIVE-TRUCK TRUCKC CENTROMILANO CENTROROMA MILANO ROMA) [D:6.00; C:1.00]
 35.0000: (UNLOAD-TRUCK PACCOA TRUCKC CENTROROMA) [D:0.00; C:1.00]
 35.0000: (UNLOAD-TRUCK PACCOL TRUCKC CENTROROMA) [D:0.00; C:1.00]
 35.0000: (LOAD-TRUCK PACCOL TRUCKB CENTROROMA) [D:0.00; C:1.00]
 35.0000: (UNLOAD-TRUCK PACCOJ TRUCKC CENTROROMA) [D:0.00; C:1.00]
 35.0000: (DRIVE-TRUCK TRUCKC CENTROROMA CENTROTORINO ROMA TORINO) [D:7.00; C:1.00]
 37.0000: (UNLOAD-TRUCK PACCOG TRUCKD CENTROTORINO) [D:0.00; C:1.00]
 37.0000: (LOAD-TRUCK PACCOH TRUCKD CENTROTORINO) [D:0.00; C:1.00]
 37.0000: (DRIVE-TRUCK TRUCKD CENTROTORINO STAZIONEVENEZIA TORINO VENEZIA) [D:4.00; C:1.00]
 41.0000: (UNLOAD-TRUCK PACCOH TRUCKD STAZIONEVENEZIA) [D:0.00; C:1.00]
 41.0000: (DRIVE-TRUCK TRUCKD STAZIONEVENEZIA AEROPORTOVENEZIA VENEZIA VENEZIA) [D:0.00; C:1.00]
 41.0000: (LOAD-TRUCK PACCOP TRUCKD AEROPORTOVENEZIA) [D:0.00; C:1.00]
 41.0000: (LOAD-TRUCK PACCOM TRUCKD AEROPORTOVENEZIA) [D:0.00; C:1.00]
 41.0000: (DRIVE-TRUCK TRUCKD AEROPORTOVENEZIA STAZIONEMILANO VENEZIA MILANO) [D:3.00; C:1.00]
 42.0000: (DRIVE-TRUCK TRUCKC CENTROTORINO AEROPORTOTORINO TORINO TORINO) [D:0.00; C:1.00]
 42.0000: (LOAD-TRUCK PACCOO TRUCKC AEROPORTOTORINO) [D:0.00; C:1.00]
 42.0000: (DRIVE-TRUCK TRUCKC AEROPORTOTORINO CENTROROMA TORINO ROMA) [D:7.00; C:1.00]
 44.0000: (UNLOAD-TRUCK PACCOP TRUCKD STAZIONEMILANO) [D:0.00; C:1.00]
 44.0000: (LOAD-TRUCK PACCOC TRUCKD STAZIONEMILANO) [D:0.00; C:1.00]
 44.0000: (DRIVE-TRUCK TRUCKD STAZIONEMILANO CENTRONAPOLI MILANO NAPOLI) [D:8.00; C:1.00]
 49.0000: (UNLOAD-TRUCK PACCOO TRUCKC CENTROROMA) [D:0.00; C:1.00]
 49.0000: (LOAD-TRUCK PACCOO TRUCKB CENTROROMA) [D:0.00; C:1.00]
 49.0000: (DRIVE-TRUCK TRUCKC CENTROROMA STAZIONEVENEZIA ROMA VENEZIA) [D:5.00; C:1.00]
 49.0000: (LOAD-TRUCK PACCOD TRUCKB CENTROROMA) [D:0.00; C:1.00]
 49.0000: (DRIVE-TRUCK TRUCKB CENTROROMA CENTROMILANO ROMA MILANO) [D:6.00; C:1.00]
 52.0000: (UNLOAD-TRUCK PACCOC TRUCKD CENTRONAPOLI) [D:0.00; C:1.00]
 52.0000: (UNLOAD-TRUCK PACCOM TRUCKD CENTRONAPOLI) [D:0.00; C:1.00]
 54.0000: (LOAD-TRUCK PACCOK TRUCKC STAZIONEVENEZIA) [D:0.00; C:1.00]
 54.0000: (DRIVE-TRUCK TRUCKC STAZIONEVENEZIA CENTROMILANO VENEZIA MILANO) [D:3.00; C:1.00]
 55.0000: (UNLOAD-TRUCK PACCOD TRUCKB CENTROMILANO) [D:0.00; C:1.00]
 55.0000: (LOAD-TRUCK PACCOB TRUCKB CENTROMILANO) [D:0.00; C:1.00]
 55.0000: (DRIVE-TRUCK TRUCKB CENTROMILANO TERMINIROMA MILANO ROMA) [D:6.00; C:1.00]
 57.0000: (UNLOAD-TRUCK PACCOK TRUCKC CENTROMILANO) [D:0.00; C:1.00]
 61.0000: (UNLOAD-TRUCK PACCOB TRUCKB TERMINIROMA) [D:0.00; C:1.00]
 61.0000: (UNLOAD-TRUCK PACCOL TRUCKB TERMINIROMA) [D:0.00; C:1.00]
 61.0000: (LOAD-TRUCK PACCOE TRUCKB TERMINIROMA) [D:0.00; C:1.00]
 61.0000: (DRIVE-TRUCK TRUCKB TERMINIROMA CENTROVENEZIA ROMA VENEZIA) [D:5.00; C:1.00]
 66.0000: (UNLOAD-TRUCK PACCOE TRUCKB CENTROVENEZIA) [D:0.00; C:1.00]
 66.0000: (UNLOAD-TRUCK PACCOO TRUCKB CENTROVENEZIA) [D:0.00; C:1.00]


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
    milano roma napoli torino venezia - city
    centromilano stazionemilano aeroportomilano - location
    centroroma terminiroma aeroportoroma - location
    centronapoli portnapoli aeroportonapoli - location
    centrotorino stazionetorino aeroportotorino - location
    centrovenezia stazionevenezia aeroportovenezia - location
    aeroportomilano aeroportoroma aeroportonapoli aeroportotorino aeroportovenezia - airport
    paccoa paccob paccoc paccod paccoe paccof paccog paccoh paccoi paccoj paccok paccol paccom paccon paccoo paccop - package
    trucka truckb truckc truckd - truck
    aereo1 aereo2 - airplane
  )
  (:init
    (in-city centromilano milano)
    (in-city stazionemilano milano)
    (in-city aeroportomilano milano)
    (in-city centroroma roma)
    (in-city terminiroma roma)
    (in-city aeroportoroma roma)
    (in-city centronapoli napoli)
    (in-city portnapoli napoli)
    (in-city aeroportonapoli napoli)
    (in-city centrotorino torino)
    (in-city stazionetorino torino)
    (in-city aeroportotorino torino)
    (in-city centrovenezia venezia)
    (in-city stazionevenezia venezia)
    (in-city aeroportovenezia venezia)
    
    (at trucka centromilano)
    (at truckb centroroma)
    (at truckc centronapoli)
    (at truckd centrotorino)
    (at aereo1 aeroportomilano)
    (at aereo2 aeroportoroma)
    
    (at paccoa centromilano)
    (at paccob centromilano)
    (at paccoc stazionemilano)
    (at paccod centroroma)
    (at paccoe terminiroma)
    (at paccof centronapoli)
    (at paccog portnapoli)
    (at paccoh centrotorino)
    (at paccoi stazionetorino)
    (at paccoj centrovenezia)
    (at paccok stazionevenezia)
    (at paccol aeroportomilano)
    (at paccom aeroportoroma)
    (at paccon aeroportonapoli)
    (at paccoo aeroportotorino)
    (at paccop aeroportovenezia)
    
    (= (distance milano milano) 1)
    (= (distance milano roma) 1)
    (= (distance milano napoli) 1)
    (= (distance milano torino) 1)
    (= (distance milano venezia) 1)
    (= (distance roma milano) 1)
    (= (distance roma roma) 1)
    (= (distance roma napoli) 1)
    (= (distance roma torino) 1)
    (= (distance roma venezia) 1)
    (= (distance napoli milano) 1)
    (= (distance napoli roma) 1)
    (= (distance napoli napoli) 1)
    (= (distance napoli torino) 1)
    (= (distance napoli venezia) 1)
    (= (distance torino milano) 1)
    (= (distance torino roma) 1)
    (= (distance torino napoli) 1)
    (= (distance torino torino) 1)
    (= (distance torino venezia) 1)
    (= (distance venezia milano) 1)
    (= (distance venezia roma) 1)
    (= (distance venezia napoli) 1)
    (= (distance venezia torino) 1)
    (= (distance venezia venezia) 1)
    
    (= (capacity trucka) 4)
    (= (capacity truckb) 3)
    (= (capacity truckc) 5)
    (= (capacity truckd) 2)
    (= (capacity aereo1) 8)
    (= (capacity aereo2) 6)
    
    (= (current-load trucka) 0)
    (= (current-load truckb) 0)
    (= (current-load truckc) 0)
    (= (current-load truckd) 0)
    (= (current-load aereo1) 0)
    (= (current-load aereo2) 0)
  )
  (:goal
    (and
      (at paccoa centroroma)
      (at paccob terminiroma)
      (at paccoc centronapoli)
      (at paccod centromilano)
      (at paccoe centrovenezia)
      (at paccof stazionemilano)
      (at paccog centrotorino)
      (at paccoh stazionevenezia)
      (at paccoi portnapoli)
      (at paccoj centroroma)
      (at paccok centromilano)
      (at paccol terminiroma)
      (at paccom centronapoli)
      (at paccon stazionetorino)
      (at paccoo centrovenezia)
      (at paccop stazionemilano)
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