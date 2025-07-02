(define (problem logistics-capacity-test)
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
)