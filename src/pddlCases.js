export const probA = `(define (problem logistics-multi-city)
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
)`
export const planA = `domain parsed
problem parsed
grounding..
grounding time: 44
aibr preprocessing
|f|:85
|x|:0
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
planning time (msec): 186
heuristic time (msec): 142
search time (msec): 179
expanded nodes:84
states evaluated:874
number of dead-ends detected:176
number of duplicates detected:341`
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
)`;
export const plan2ex1 = `

NUMERIC_THREATS_MODE: 0

; Command line: ./lpg-td -o dom.pddl -f prog.pddl -n 1


Parsing domain file:  domain 'LOGISTICS' defined ... done.
Parsing problem file:  problem 'LOGISTICS-TEMPORAL' defined ... done.



Modality: Incremental Planner

Number of actions             :    1152
Number of conditional actions :       0
Number of facts               :     144


Analyzing Planning Problem:
        Temporal Planning Problem: NO
        Numeric Planning Problem: YES
        Problem with Timed Initial Literals: NO
        Problem with Derived Predicates: NO

Evaluation function weights:
     Action duration 0.00; Action cost 1.00


Computing mutex... done

Preprocessing total time: 0.00 seconds

Searching ('.' = every 50 search steps):
 solution found:
 Recompute start times

 first_solution_cpu_time: 0.02

Plan computed:
   Time: (ACTION) [action Duration; action Cost]
 0.0000: (DRIVE-TRUCK TRUCK3 PIAZZACASTELLO CENTRONAPOLI TORINO NAPOLI) [D:10.00; C:1.00]
 0.0000: (DRIVE-TRUCK TRUCK2 CENTROROMA STAZIONEMILANO ROMA MILANO) [D:5.00; C:1.00]
 5.0000: (LOAD-TRUCK PACCO1 TRUCK2 STAZIONEMILANO) [D:0.00; C:1.00]
 5.0000: (DRIVE-TRUCK TRUCK2 STAZIONEMILANO CENTROROMA MILANO ROMA) [D:5.00; C:1.00]
 10.0000: (LOAD-TRUCK PACCO3 TRUCK3 CENTRONAPOLI) [D:0.00; C:1.00]
 10.0000: (DRIVE-TRUCK TRUCK3 CENTRONAPOLI PIAZZACASTELLO NAPOLI TORINO) [D:10.00; C:1.00]
 10.0000: (UNLOAD-TRUCK PACCO1 TRUCK2 CENTROROMA) [D:0.00; C:1.00]
 10.0000: (DRIVE-TRUCK TRUCK2 CENTROROMA TERMINIROMA ROMA ROMA) [D:0.00; C:1.00]
 10.0000: (LOAD-TRUCK PACCO2 TRUCK2 TERMINIROMA) [D:0.00; C:1.00]
 10.0000: (DRIVE-TRUCK TRUCK2 TERMINIROMA PORTONAPOLI ROMA NAPOLI) [D:2.00; C:1.00]
 12.0000: (UNLOAD-TRUCK PACCO2 TRUCK2 PORTONAPOLI) [D:0.00; C:1.00]
 12.0000: (DRIVE-TRUCK TRUCK2 PORTONAPOLI LINGOTTO NAPOLI TORINO) [D:10.00; C:1.00]
 20.0000: (UNLOAD-TRUCK PACCO3 TRUCK3 PIAZZACASTELLO) [D:0.00; C:1.00]
 20.0000: (DRIVE-TRUCK TRUCK3 PIAZZACASTELLO CENTROROMA TORINO ROMA) [D:7.00; C:1.00]
 22.0000: (LOAD-TRUCK PACCO4 TRUCK2 LINGOTTO) [D:0.00; C:1.00]
 22.0000: (DRIVE-TRUCK TRUCK2 LINGOTTO MERCATO TORINO BOLOGNA) [D:4.00; C:1.00]
 26.0000: (UNLOAD-TRUCK PACCO4 TRUCK2 MERCATO) [D:0.00; C:1.00]
 26.0000: (LOAD-TRUCK PACCO5 TRUCK2 MERCATO) [D:0.00; C:1.00]
 26.0000: (DRIVE-TRUCK TRUCK2 MERCATO PIAZZACASTELLO BOLOGNA TORINO) [D:4.00; C:1.00]
 27.0000: (LOAD-TRUCK PACCO1 TRUCK3 CENTROROMA) [D:0.00; C:1.00]
 27.0000: (UNLOAD-TRUCK PACCO1 TRUCK3 CENTROROMA) [D:0.00; C:1.00]
 30.0000: (DRIVE-TRUCK TRUCK2 PIAZZACASTELLO DUOMO TORINO FIRENZE) [D:6.00; C:1.00]
 36.0000: (UNLOAD-TRUCK PACCO5 TRUCK2 DUOMO) [D:0.00; C:1.00]
 36.0000: (LOAD-TRUCK PACCO5 TRUCK4 DUOMO) [D:0.00; C:1.00]
 36.0000: (UNLOAD-TRUCK PACCO5 TRUCK4 DUOMO) [D:0.00; C:1.00]
 36.0000: (DRIVE-TRUCK TRUCK2 DUOMO PONTEVECCHIO FIRENZE FIRENZE) [D:0.00; C:1.00]
 36.0000: (LOAD-TRUCK PACCO6 TRUCK2 PONTEVECCHIO) [D:0.00; C:1.00]
 36.0000: (DRIVE-TRUCK TRUCK2 PONTEVECCHIO CENTROMILANO FIRENZE MILANO) [D:4.00; C:1.00]
 40.0000: (UNLOAD-TRUCK PACCO6 TRUCK2 CENTROMILANO) [D:0.00; C:1.00]
 40.0000: (LOAD-TRUCK PACCO6 TRUCK1 CENTROMILANO) [D:0.00; C:1.00]
 40.0000: (UNLOAD-TRUCK PACCO6 TRUCK1 CENTROMILANO) [D:0.00; C:1.00]


Solution number: 1
Total time:      0.02
Search time:     0.02
Actions:         31
Duration:        40.000
Plan quality:    31.000
Total Num Flips: 36
     Plan file:       plan_prog.pddl_1.SOL`;
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
)`;
export const plan2ex2 = `

NUMERIC_THREATS_MODE: 0

; Command line: ./lpg-td -o dom2.pddl -f prog.pddl -n 1


Parsing domain file:  domain 'LOGISTICS' defined ... done.
Parsing problem file:  problem 'LOGISTICS-TEMPORAL-AIR' defined ... done.



Modality: Incremental Planner

Number of actions             :     525
Number of conditional actions :       0
Number of facts               :      89


Analyzing Planning Problem:
        Temporal Planning Problem: NO
        Numeric Planning Problem: YES
        Problem with Timed Initial Literals: NO
        Problem with Derived Predicates: NO

Evaluation function weights:
     Action duration 0.00; Action cost 1.00


Computing mutex... done

Preprocessing total time: 0.00 seconds

Searching ('.' = every 50 search steps):
 solution found:
 Recompute start times

 first_solution_cpu_time: 0.03

Plan computed:
   Time: (ACTION) [action Duration; action Cost]
 0.0000: (DRIVE-TRUCK TRUCK2 CENTROROMA LINGOTTO ROMA TORINO) [D:7.00; C:1.00]
 0.0000: (LOAD-AIRPLANE PACCO2 AEREO2 FIUMICINO) [D:0.00; C:1.00]
 0.0000: (FLY-AIRPLANE AEREO2 FIUMICINO CASELLE ROMA TORINO) [D:7.00; C:1.00]
 7.0000: (LOAD-TRUCK PACCO3 TRUCK2 LINGOTTO) [D:0.00; C:1.00]
 7.0000: (DRIVE-TRUCK TRUCK2 LINGOTTO CENTROMILANO TORINO MILANO) [D:2.00; C:1.00]
 7.0000: (FLY-AIRPLANE AEREO2 CASELLE MALPENSA TORINO MILANO) [D:2.00; C:1.00]
 9.0000: (UNLOAD-TRUCK PACCO3 TRUCK2 CENTROMILANO) [D:0.00; C:1.00]
 9.0000: (LOAD-TRUCK PACCO3 TRUCK1 CENTROMILANO) [D:0.00; C:1.00]
 9.0000: (UNLOAD-TRUCK PACCO3 TRUCK1 CENTROMILANO) [D:0.00; C:1.00]
 9.0000: (UNLOAD-AIRPLANE PACCO2 AEREO2 MALPENSA) [D:0.00; C:1.00]
 9.0000: (LOAD-AIRPLANE PACCO1 AEREO2 MALPENSA) [D:0.00; C:1.00]
 9.0000: (FLY-AIRPLANE AEREO2 MALPENSA FIUMICINO MILANO ROMA) [D:5.00; C:1.00]
 14.0000: (FLY-AIRPLANE AEREO2 FIUMICINO CASELLE ROMA TORINO) [D:7.00; C:1.00]
 21.0000: (UNLOAD-AIRPLANE PACCO1 AEREO2 CASELLE) [D:0.00; C:1.00]
 21.0000: (LOAD-AIRPLANE PACCO4 AEREO2 CASELLE) [D:0.00; C:1.00]
 21.0000: (FLY-AIRPLANE AEREO2 CASELLE MALPENSA TORINO MILANO) [D:2.00; C:1.00]
 23.0000: (FLY-AIRPLANE AEREO2 MALPENSA FIUMICINO MILANO ROMA) [D:5.00; C:1.00]
 28.0000: (UNLOAD-AIRPLANE PACCO4 AEREO2 FIUMICINO) [D:0.00; C:1.00]


Solution number: 1
Total time:      0.03
Search time:     0.03
Actions:         18
Duration:        28.000
Plan quality:    18.000
Total Num Flips: 20
     Plan file:       plan_prog.pddl_1.SOL
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
)`;
export const plan2ex3 = `
NUMERIC_THREATS_MODE: 0

; Command line: ./lpg-td -o dom2.pddl -f prog.pddl -n 1


Parsing domain file:  domain 'LOGISTICS' defined ... done.
Parsing problem file:  problem 'LOGISTICS-TEMPORAL-AIR-4CITIES' defined ... done.



Modality: Incremental Planner

Number of actions             :    1984
Number of conditional actions :       0
Number of facts               :     214


Analyzing Planning Problem:
        Temporal Planning Problem: NO
        Numeric Planning Problem: YES
        Problem with Timed Initial Literals: NO
        Problem with Derived Predicates: NO

Evaluation function weights:
     Action duration 0.00; Action cost 1.00


Computing mutex... done

Preprocessing total time: 0.00 seconds

Searching ('.' = every 50 search steps):
 solution found:
 Recompute start times

 first_solution_cpu_time: 0.03

Plan computed:
   Time: (ACTION) [action Duration; action Cost]
 0.0000: (DRIVE-TRUCK TRUCK1 CENTROMILANO VOMERO MILANO NAPOLI) [D:8.00; C:1.00]
 0.0000: (DRIVE-TRUCK TRUCK3 PIAZZACASTELLO COLOSSEO TORINO ROMA) [D:7.00; C:1.00]
 0.0000: (FLY-AIRPLANE AEREO2 FIUMICINO CASELLE ROMA TORINO) [D:7.00; C:1.00]
 7.0000: (LOAD-TRUCK PACCO2 TRUCK3 COLOSSEO) [D:0.00; C:1.00]
 7.0000: (DRIVE-TRUCK TRUCK3 COLOSSEO PORTANUOVA ROMA TORINO) [D:7.00; C:1.00]
 7.0000: (LOAD-AIRPLANE PACCO6 AEREO2 CASELLE) [D:0.00; C:1.00]
 7.0000: (FLY-AIRPLANE AEREO2 CASELLE FIUMICINO TORINO ROMA) [D:7.00; C:1.00]
 8.0000: (LOAD-TRUCK PACCO4 TRUCK1 VOMERO) [D:0.00; C:1.00]
 8.0000: (DRIVE-TRUCK TRUCK1 VOMERO STAZIONEMILANO NAPOLI MILANO) [D:8.00; C:1.00]
 14.0000: (UNLOAD-TRUCK PACCO2 TRUCK3 PORTANUOVA) [D:0.00; C:1.00]
 14.0000: (DRIVE-TRUCK TRUCK3 PORTANUOVA LINGOTTO TORINO TORINO) [D:0.00; C:1.00]
 14.0000: (LOAD-TRUCK PACCO3 TRUCK3 LINGOTTO) [D:0.00; C:1.00]
 14.0000: (DRIVE-TRUCK TRUCK3 LINGOTTO TERMINIROMA TORINO ROMA) [D:7.00; C:1.00]
 14.0000: (UNLOAD-AIRPLANE PACCO6 AEREO2 FIUMICINO) [D:0.00; C:1.00]
 16.0000: (UNLOAD-TRUCK PACCO4 TRUCK1 STAZIONEMILANO) [D:0.00; C:1.00]
 16.0000: (DRIVE-TRUCK TRUCK1 STAZIONEMILANO PORTANUOVA MILANO TORINO) [D:2.00; C:1.00]
 18.0000: (DRIVE-TRUCK TRUCK1 PORTANUOVA PIAZZACASTELLO TORINO TORINO) [D:0.00; C:1.00]
 18.0000: (DRIVE-TRUCK TRUCK1 PIAZZACASTELLO MALPENSA TORINO MILANO) [D:2.00; C:1.00]
 20.0000: (LOAD-TRUCK PACCO5 TRUCK1 MALPENSA) [D:0.00; C:1.00]
 20.0000: (DRIVE-TRUCK TRUCK1 MALPENSA POSILLIPO MILANO NAPOLI) [D:8.00; C:1.00]
 21.0000: (UNLOAD-TRUCK PACCO3 TRUCK3 TERMINIROMA) [D:0.00; C:1.00]
 28.0000: (UNLOAD-TRUCK PACCO5 TRUCK1 POSILLIPO) [D:0.00; C:1.00]
 28.0000: (DRIVE-TRUCK TRUCK1 POSILLIPO CENTROMILANO NAPOLI MILANO) [D:8.00; C:1.00]
 36.0000: (DRIVE-TRUCK TRUCK1 CENTROMILANO DUOMO MILANO MILANO) [D:0.00; C:1.00]
 36.0000: (LOAD-TRUCK PACCO1 TRUCK1 DUOMO) [D:0.00; C:1.00]
 36.0000: (DRIVE-TRUCK TRUCK1 DUOMO CAPODICHINO MILANO NAPOLI) [D:8.00; C:1.00]
 44.0000: (UNLOAD-TRUCK PACCO1 TRUCK1 CAPODICHINO) [D:0.00; C:1.00]


Solution number: 1
Total time:      0.03
Search time:     0.03
Actions:         27
Duration:        44.000
Plan quality:    27.000
Total Num Flips: 28
     Plan file:       plan_prog.pddl_1.SOL`;
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
export const problogpddlplus = `(define (problem logistics-fuel-test)
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
export const planpddlplus = `Domain parsed
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
export const problogpddlplus2 = `(define (problem logistics-fuel-test-v2)
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
export const planpddlplus2 = `domain parsed
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

export const problogpddlplus3 = `(define (problem logistics-two-trucks)
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

export const planpddlplus3 = `Domain parsed
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