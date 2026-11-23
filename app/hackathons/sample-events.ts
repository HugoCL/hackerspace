export type SampleEvent = {
  slug: string;
  title: string;
  modality: "inPerson" | "virtual";
  dates: string;
  location: string;
  organizer: string;
  summary: string;
  topics: readonly string[];
  guidelines: string;
  rules: string;
};

export const sampleEvents: readonly SampleEvent[] = [
  {
    slug: "santiago-hacks",
    title: "Santiago Hacks 2027",
    modality: "inPerson",
    dates: "13–14 mar 2027",
    location: "Santiago, Chile",
    organizer: "Comunidad Santiago Hacks",
    summary:
      "Dos días para armar un equipo y crear herramientas que hagan más fácil moverse y vivir en la ciudad.",
    topics: ["Datos abiertos", "Ciudad", "Movilidad"],
    guidelines:
      "Pueden participar estudiantes y profesionales. Los equipos presentan un prototipo y una demo de tres minutos al cierre.",
    rules:
      "Construye el proyecto durante el evento. Puedes usar librerías públicas si declaras sus licencias y atribuyes el trabajo previo.",
  },
  {
    slug: "hack-puerto",
    title: "Hack Puerto",
    modality: "inPerson",
    dates: "20–21 mar 2027",
    location: "Valparaíso, Chile",
    organizer: "Comunidad Hack Puerto",
    summary:
      "Diseña y prueba ideas con gente que vive, trabaja y crea en el puerto.",
    topics: ["Comunidad", "Medio ambiente"],
    guidelines:
      "Se aceptan equipos de hasta cuatro personas. Al cierre, cada equipo comparte una demo y explica a quién ayuda su idea.",
    rules:
      "Publica las fuentes de los datos usados y pide consentimiento antes de compartir testimonios.",
  },
  {
    slug: "cordillera-lab",
    title: "Cordillera Lab",
    modality: "inPerson",
    dates: "10–11 abr 2027",
    location: "Mendoza, Argentina",
    organizer: "Comunidad Cordillera Lab",
    summary:
      "Un fin de semana para construir prototipos sobre agua, energía y entornos de montaña.",
    topics: ["Agua", "Energía"],
    guidelines:
      "Trae tu computadora. Cada equipo presenta un prototipo y una explicación breve del problema que eligió.",
    rules:
      "Cita las fuentes y distingue las mediciones reales de los datos de prueba.",
  },
  {
    slug: "codigo-sin-fronteras",
    title: "Código sin Fronteras",
    modality: "virtual",
    dates: "27–28 mar 2027",
    location: "En línea",
    organizer: "Comunidad Código sin Fronteras",
    summary:
      "Encuentra equipo a distancia y crea herramientas para comunidades de código abierto.",
    topics: ["Código abierto", "Accesibilidad"],
    guidelines:
      "Participa desde cualquier lugar. Entrega un repositorio y un video corto en el que se pueda ver el prototipo.",
    rules:
      "Documenta cómo reproducir la demo y da crédito a todas las personas que contribuyeron.",
  },
];
