# Countdown

Cuenta regresiva en mono tabular que se actualiza cada segundo: para el inicio de una hackathon, el cierre de inscripciones o la entrega.

- `to`: fecha (Date, timestamp o ISO). `label` corto en mayúsculas ("COMIENZA EN", "ENTREGA EN").
- Al llegar a cero muestra `doneLabel` ("YA COMENZÓ") en `hs-live-ink`.
- Uno por vista. Más de un reloj compite por la atención.
