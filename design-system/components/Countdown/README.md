# Countdown

Cuenta regresiva con el reloj en monoespaciada tabular que se actualiza cada segundo: para el inicio de una hackathon, el cierre de inscripciones o la entrega.

- `to`: fecha (Date, timestamp o ISO). `label` corto ("Comienza en", "Entrega en").
- Al llegar a cero muestra `doneLabel` ("Ya comenzó") en `hs-live-ink`.
- Uno por vista. Más de un reloj compite por la atención.
