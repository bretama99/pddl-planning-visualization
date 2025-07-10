;; Battery-enabled Robot Problem for Testing
(define (problem robot-battery-test)
  (:domain robot-battery)
  (:objects
    r1 r2 - robot
    loc1 loc2 - location
  )
  
  (:init
    (at r1 loc1)
    (at r2 loc1)
    (free r1)
    (free r2)
    (= (battery-level r1) 75)
    (= (battery-level r2) 50)
    (= (distance loc1 loc2) 10)
  )
  
  (:goal
    (and
      (at r1 loc2)
      (at r2 loc2)
    )
  )
)