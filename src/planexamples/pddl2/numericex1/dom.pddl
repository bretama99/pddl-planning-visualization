(define (domain logistics)
  (:requirements :strips :typing :fluents :durative-actions)
  (:types
    truck airplane - vehicle
    package vehicle - physobj
    airport location - place
    city place physobj - object
  )
  (:predicates
    (in-city ?loc - place ?city - city)
    (at ?obj - physobj ?loc - place)
    (in ?pkg - package ?veh - vehicle)
  )
  (:functions
    (distance ?c1 - city ?c2 - city)
    (capacity ?veh - vehicle)          ; capacità massima del veicolo
    (current-load ?veh - vehicle)      ; carico attuale del veicolo
  )

  (:action load-truck
    :parameters (?pkg - package ?truck - truck ?loc - place)
    :precondition (and
      (at ?truck ?loc)
      (at ?pkg ?loc)
      (< (current-load ?truck) (capacity ?truck))  ; verifica capacità
    )
    :effect (and
      (not (at ?pkg ?loc))
      (in ?pkg ?truck)
      (assign (current-load ?truck) (+ (current-load ?truck) 1))  ; incrementa carico
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
      (assign (current-load ?truck) (- (current-load ?truck) 1))  ; decrementa carico
    )
  )

  (:action load-airplane
    :parameters (?pkg - package ?airplane - airplane ?loc - airport)
    :precondition (and
      (at ?pkg ?loc)
      (at ?airplane ?loc)
      (< (current-load ?airplane) (capacity ?airplane))  ; verifica capacità
    )
    :effect (and
      (not (at ?pkg ?loc))
      (in ?pkg ?airplane)
      (assign (current-load ?airplane) (+ (current-load ?airplane) 1))  ; incrementa carico
    )
  )

  (:action unload-airplane
    :parameters (?pkg - package ?airplane - airplane ?loc - airport)
    :precondition (and
      (in ?pkg ?airplane)
      (at ?airplane ?loc)
    )
    :effect (and
      (not (in ?pkg ?airplane))
      (at ?pkg ?loc)
      (assign (current-load ?airplane) (- (current-load ?airplane) 1))  ; decrementa carico
    )
  )

  (:durative-action drive-truck
    :parameters (?truck - truck ?loc-from - place ?loc-to - place ?city-from - city ?city-to - city)
    :duration (= ?duration (distance ?city-from ?city-to))
    :condition (and
      (at start (at ?truck ?loc-from))
      (at start (in-city ?loc-from ?city-from))
      (at start (in-city ?loc-to ?city-to))
    )
    :effect (and
      (at start (not (at ?truck ?loc-from)))
      (at end (at ?truck ?loc-to))
    )
  )

  (:durative-action fly-airplane
    :parameters (?airplane - airplane ?loc-from - airport ?loc-to - airport ?city-from - city ?city-to - city)
    :duration (= ?duration (distance ?city-from ?city-to))
    :condition (and
      (at start (at ?airplane ?loc-from))
      (at start (in-city ?loc-from ?city-from))
      (at start (in-city ?loc-to ?city-to))
    )
    :effect (and
      (at start (not (at ?airplane ?loc-from)))
      (at end (at ?airplane ?loc-to))
    )
  )
)