// ============================================================
// Banco de lecturas — Lectura entre líneas
// UMD: este archivo se carga desde el browser (window.TEXTS)
// Y también desde Node (require) por el script de generación de audio.
// ============================================================

(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.TEXTS = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  return [
    {
      id: "01",
      title: "El cuervo y la jarra",
      passage:
        "Un cuervo tenía mucha sed. Encontró una jarra con un poco de agua en el fondo, pero su pico no llegaba. Entonces empezó a echar piedritas adentro, una por una. El agua subió hasta el borde y el cuervo pudo beber.",
      question: {
        prompt: "¿Por qué el cuervo echó piedritas en la jarra?",
        options: [
          "Para jugar dentro de la jarra.",
          "Para hacer subir el agua y poder beber.",
          "Porque las piedras le daban hambre.",
          "Para romper la jarra.",
        ],
        correct: 1,
      },
    },
    {
      id: "02",
      title: "La sombra de Mateo",
      passage:
        "Mateo notó algo raro: cuando caminaba al sol por la mañana, su sombra era larguísima. Pero al mediodía, casi no tenía sombra. Por la tarde, la sombra volvió a estirarse, pero ahora hacia el otro lado.",
      question: {
        prompt: "¿Por qué cambia el tamaño de la sombra de Mateo durante el día?",
        options: [
          "Porque las nubes la tapan.",
          "Porque Mateo crece a lo largo del día.",
          "Porque el sol cambia de posición en el cielo.",
          "Porque su sombra está cansada al mediodía.",
        ],
        correct: 2,
      },
    },
    {
      id: "03",
      title: "Una visita inesperada",
      passage:
        "Ana esperaba a su prima desde hacía una semana. Cuando sonó el timbre, corrió emocionada hasta la puerta. Pero al abrirla, no era su prima: era el cartero con un paquete que decía «De parte de tu prima».",
      question: {
        prompt: "¿Qué emoción debió sentir Ana al abrir la puerta?",
        options: [
          "Alegría, porque llegó su prima.",
          "Decepción, porque esperaba a alguien más.",
          "Miedo, porque no conocía al cartero.",
          "Aburrimiento, porque ya estaba cansada.",
        ],
        correct: 1,
      },
    },
    {
      id: "04",
      title: "El semáforo del barrio",
      passage:
        "En la esquina de la casa de Pepe pusieron un semáforo nuevo. Antes, los autos pasaban demasiado rápido y los vecinos tenían miedo de cruzar. Ahora se ven menos accidentes y los abuelos del barrio caminan tranquilos hasta la tienda.",
      question: {
        prompt: "¿Cuál es el principal beneficio del semáforo nuevo?",
        options: [
          "Que el barrio se ve más colorido.",
          "Que los autos llegan más rápido a sus casas.",
          "Que Pepe puede verlo desde su ventana.",
          "Que es más seguro cruzar la calle.",
        ],
        correct: 3,
      },
    },
    {
      id: "05",
      title: "Las hormigas trabajadoras",
      passage:
        "Una tarde de verano, Sofía vio a un grupo de hormigas cargando una hoja enorme entre todas. Aunque la hoja era diez veces más grande que cualquiera de las hormigas, juntas lograron llevarla hasta el hormiguero sin problema.",
      question: {
        prompt: "¿Qué nos enseña la escena que vio Sofía?",
        options: [
          "Que las hojas pesan poco en verano.",
          "Que las hormigas pueden comer hojas grandes.",
          "Que trabajar en equipo permite lograr cosas grandes.",
          "Que las hormigas son muy fuertes solas.",
        ],
        correct: 2,
      },
    },
    {
      id: "06",
      title: "El reloj de la abuela",
      passage:
        "La abuela tiene un reloj viejo que hace tic-tac muy fuerte. Cuando estoy de visita y no puedo dormir, ese sonido me marea. Pero la abuela dice que ese mismo tic-tac es lo que la hace dormir tranquila a ella todas las noches.",
      question: {
        prompt: "¿Qué idea principal transmite este texto?",
        options: [
          "Que los relojes viejos suenan más fuerte que los nuevos.",
          "Que un mismo sonido puede gustar a una persona y molestar a otra.",
          "Que la abuela necesita un reloj para dormir.",
          "Que todos los abuelos tienen relojes viejos.",
        ],
        correct: 1,
      },
    },
    {
      id: "07",
      title: "Lluvia en mi ventana",
      passage:
        "Cuando llueve, no salgo a jugar. Me siento junto a la ventana y miro las gotas correr por el vidrio. Cada gota toma un camino distinto: algunas bajan rápido, otras se quedan paradas un rato, y otras se juntan con una gota vecina para hacerse más grandes.",
      question: {
        prompt: "Según el texto, ¿qué pasa cuando dos gotas se encuentran en el vidrio?",
        options: [
          "Cambian de color al juntarse.",
          "Una empuja a la otra hacia abajo.",
          "Se unen y forman una gota más grande.",
          "Las dos desaparecen al instante.",
        ],
        correct: 2,
      },
    },
    {
      id: "08",
      title: "El gato de la biblioteca",
      passage:
        "En la biblioteca de la escuela vive un gato gris llamado Atún. Le gusta dormir sobre los libros más altos. Los niños lo buscan al entrar: si Atún está sobre la estantería de cuentos, todos saben que ese día llegaron libros nuevos.",
      question: {
        prompt: "Si los niños ven a Atún sobre la estantería de cuentos, ¿qué pueden saber?",
        options: [
          "Que Atún tiene hambre.",
          "Que la biblioteca va a cerrar.",
          "Que llegaron libros nuevos a esa estantería.",
          "Que es hora de salir al recreo.",
        ],
        correct: 2,
      },
    },
  ];
});
