;; Battery-enabled Robot Domain for Testing
(define (domain robot-battery)
  (:requirements :strips :typing :fluents :numeric-fluents)
  (:types
    robot - object
    location - object
  )
  
  (:predicates
    (at ?robot - robot ?location - location)
    (free ?robot - robot)
  )
  
  (:functions
    (battery-level ?robot - robot)
    (distance ?from ?to - location)
  )
  
  (:action move
    :parameters (?robot - robot ?from ?to - location)
    :precondition (and
      (at ?robot ?from)
      (> (battery-level ?robot) 0)
    )
    :effect (and
      (not (at ?robot ?from))
      (at ?robot ?to)
      (decrease (battery-level ?robot) 10)
    )
  )
  
  (:action charge
    :parameters (?robot - robot ?location - location)
    :precondition (and
      (at ?robot ?location)
      (< (battery-level ?robot) 100)
    )
    :effect (and
      (increase (battery-level ?robot) 50)
    )
  )
)