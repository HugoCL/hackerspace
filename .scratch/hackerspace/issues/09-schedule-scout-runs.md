# 09: Programar ejecuciones del Scout

Status: open
Checkpoint: 4. Scout
Bloqueado por: [08](08-review-scout-candidates.md).

Buscar nuevos eventos periódicamente y dejar los candidatos en la cola de revisión.

- [ ] Acordar fuentes iniciales, frecuencia y presupuesto de Firecrawl y del modelo. Mantener la ejecución desactivada hasta configurarlos.
- [ ] Una ejecución programada encola trabajo acotado, no duplica turnos ni publica perfiles. Se puede detener la programación sin perder los candidatos ya encontrados.
- [ ] Una persona operadora puede distinguir una ejecución correcta, un fallo de proveedor y un intento detenido por cuota. Probar los tres estados sin credenciales reales y hacer una prueba de integración autorizada.
