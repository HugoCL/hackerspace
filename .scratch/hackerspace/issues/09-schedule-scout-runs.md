# 09: Programar ejecuciones del Scout

Status: open
Checkpoint: 4. Scout
Bloqueado por: [08](08-review-scout-candidates.md).

Buscar nuevos eventos periódicamente y dejar los candidatos en la cola de revisión.

- [ ] Acordar fuentes iniciales, frecuencia y presupuesto de Firecrawl y del modelo. Mantener la ejecución desactivada hasta configurarlos.
- [ ] Una ejecución programada encola trabajo acotado, no duplica turnos ni publica perfiles. Se puede detener la programación sin perder los candidatos ya encontrados.
- [ ] Una persona operadora puede distinguir una ejecución correcta, un fallo de proveedor y un intento detenido por cuota. Probar los tres estados sin credenciales reales y hacer una prueba de integración autorizada.

## Decisiones (Hugo, 2026-11-23)

- Orden: primero el 08. La búsqueda periódica se habilita después de validar la cola.
- Frecuencia: semanal. Una corrida de la búsqueda actual cuesta unos 130 créditos de Firecrawl (medido el 2026-11-23), unos 560 al mes.
- Tope: 1.000 créditos de Firecrawl al mes. Al alcanzarlo, la corrida se registra como detenida por cuota.
- Fuentes iniciales: la búsqueda actual (`hackatón Chile <año>`, `hackathon Chile <año+1>`, `datatón Chile <año>`), Luma y Devpost. Medir Luma y Devpost antes de fijarlas.
- No hay un modelo aparte: la extracción la hace Firecrawl y se cobra en sus créditos.
- Fuera por ahora: LinkedIn (sus condiciones prohíben cuentas automatizadas) y X (requiere su API de pago o la de xAI, sin verificar).

