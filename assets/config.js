/* ════════════════════════════════════════════════════════════════════════
   ✦  CONFIGURACIÓN — ESTE ES EL ÚNICO ARCHIVO QUE NECESITAS EDITAR  ✦
   ════════════════════════════════════════════════════════════════════════
   • Las fotos van en la carpeta  assets/fotos/
   • Cada recuerdo es una estrella del cielo: tiene FOTO, TÍTULO y MENSAJE.
   • Puedes poner más o menos recuerdos: el corazón se adapta solo.
   • Si cambias algo y quieres ver el regalo desde cero, usa el botón
     "Empezar de nuevo" al final de la carta.
═══════════════════════════════════════════════════════════════════════════ */

const CONFIG = {
  // ── Portada ──
  paraQuien: "Para la estrella más bonita de mi cielo",
  titulo: "Escrito en las estrellas",
  subtitulo: "Un cielo entero hecho de nosotros",
  textoAnillo: "✦ para ti, mi amor ✦ escrito en las estrellas ",
  fotoLuna: "21.jpg",      // la foto que aparece dentro de la luna
  cancion: "cancion.mp3",  // la canción de fondo

  // ── Lo que se lee antes de entrar al cielo (una frase por línea) ──
  prologo: [
    "Dicen que cada estrella del cielo guarda una historia…",
    "Yo escondí aquí arriba algunas de las nuestras.",
    "Cada estrella es un recuerdo tuyo, mío… nuestro.",
    "Tócalas una por una para encenderlas.",
    "Cuando brillen todas, descubrirás lo que dibujan juntas.",
  ],

  // ── Fecha en que empezaron (formato "AAAA-MM-DD").
  //    Si la pones, la carta final muestra un contador en vivo del tiempo juntos.
  //    Déjala vacía "" para ocultar el contador.
  fechaInicio: "",

  // ── Final ──
  fraseFinal: "Estrella por estrella, así se fue dibujando lo nuestro.",

  cartaFinal: {
    titulo: "Mi amor:",
    parrafos: [
      "Si llegaste hasta aquí, es porque encendiste cada una de nuestras estrellas. Y ahora ya sabes lo que dibujan juntas: un corazón. El mío, que desde hace tiempo es tuyo.",
      "No somos perfectos. Hemos tenido problemas, días difíciles y noches en las que no supimos qué hacer. Pero incluso en el cielo más oscuro, tú sigues siendo la luz que más brilla en el mío.",
      "Gracias por tu sonrisa, por tus ojitos llenos de amor, por tu fuerza y por cada momento que me regalas. Quiero seguir aprendiendo a ser mejor para ti, y construir contigo algo todavía más bonito que todo esto.",
      "Este cielo es tuyo. Vuelve a él cada vez que necesites recordar lo hermosa que eres y cuánto te amo.",
    ],
    firma: "Tuyo, hoy y siempre",
  },

  // ── Estrellas fugaces: si ella toca una, aparece uno de estos deseos ──
  deseos: [
    "Deseo que nunca dejes de sonreír así.",
    "Deseo un millón de días más a tu lado.",
    "Deseo que todos tus sueños se cumplan, y estar ahí para verlo.",
    "Deseo abrazarte justo ahora, fuerte y sin soltarte.",
    "Deseo que siempre sepas lo hermosa que eres.",
    "Deseo llevarte a todos los lugares que te mereces.",
    "Deseo que cada problema nos haga más fuertes, nunca más lejanos.",
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   ✦  RECUERDOS — cada uno es una estrella del corazón (en este orden)
═══════════════════════════════════════════════════════════════════════════ */
const RECUERDOS = [
  { foto: "1.jpg", titulo: "Amor a primera vista",
    mensaje: "Mira nada más mi cosita hermosa y preciosa: una captura de una foto bellísima de la mujer que me encantó con solo verla, esa que me hizo decir «ñam, quiero ser de esta mujer y hacerla mía». Quién diría que así sería, y que a pesar de tantos problemas hoy puedo decir que es mía, mía, y que es mi novia… una mujer tan hermosa y preciosa." },

  { foto: "2.jpg", titulo: "Edición de primera",
    mensaje: "Dios mío, encendiste una estrella de primera edición, de las primeras que salieron, muy exclusiva y hermosa. Es la que me hizo decir: «dios mío, esta mujer tan hermosa me está hablando, qué afortunado soy». Bella, este hermoso ángel que me atrae demasiado con solo verlo." },

  { foto: "3.jpg", titulo: "Su primer enojo",
    mensaje: "Uy, encendiste una estrella caliente, mi princesa: desde siempre firme y con un carácter fuerte. Este fue su primer enojo conmigo, porque no le dije que estaba hermosa en la videollamada… si supiera lo nervioso que estaba de ver a tan hermoso ser divino, que me tenía temblando y con el corazón a mil." },

  { foto: "4.jpg", titulo: "Cuerpo de reina",
    mensaje: "Uy, cuidado, te salió un cuerpo hermoso de una reina, cuando fue a comprar ropita. Y yo, afortunadamente, también le pude regalar ropita. Divino cuerpo el que tienes, mi amor, el que deseo con todo mi corazón." },

  { foto: "5.jpg", titulo: "Sus rosas",
    mensaje: "Uy, una muy especial: mi niña contenta con unas rosas que le dio su novio. Es una dulce niña, en su corazón sigue siéndolo, y aun teniendo una vida dura, su sonrisa por algo que le gusta es totalmente genuina. A veces soy duro con ella, pero es como una princesa de dulce en un mundo sucio y podrido. Solo no quiero que le pase nada malo y que tenga un futuro brillante." },

  { foto: "6.jpg", titulo: "Mi niña coqueta",
    mensaje: "Mi niña haciéndose un maquillaje bien bonito, jaja. Me encanta, mi amor, cuando se disfraza, se maquilla o se arregla… aunque, bueno, la ropa, si está conmigo, sobra: mucho mejor sin ella." },

  { foto: "7.jpg", titulo: "Belleza natural",
    mensaje: "Ella, bella, tomando fotos en mi casa. A veces ni cuenta me doy de cuándo las toma, pero todas le quedan hermosas. Ella no sabe que el maquillaje solo decora la belleza natural que ya tiene su hermosa carita, con esos ojitos llenos de amor y de mil sentimientos. Te amo, mi amorcito." },

  { foto: "8.jpg", titulo: "Tanta preciosura",
    mensaje: "Uy, otra exclusiva. Esta fue cuando dije: «dios mío, esto es mucho para mí, ¿qué haré si esta bella mujer me ama?, ¿qué haré con tanta preciosura?». Ella no sabe que cuando hay problemas, nunca tienen que ver con su belleza ni con ese increíble cuerpo. Yo sé que es hermosa y divina; solo que, a veces, los problemas se nos salen de las manos." },

  { foto: "9.jpg", titulo: "Su graduación",
    mensaje: "Uy, una muy especial: el día que se graduó mi amor. Me alegré tantísimo de estar ahí. Ella no sabe lo bonito que fue verla. Lástima no tener dinero a veces para llevarla a todos los lugares que se merece." },

  { foto: "10.jpg", titulo: "Solo para mí",
    mensaje: "Oh no, este postre tan sexy… no sé qué hacer con un cuerpo tan rico y delicioso. Divino cuerpo el que tienes, mi vida; no quiero que nadie lo toque. Tú puedes lucirte, mi amor, con todo tipo de ropa que quieras, pero que sepa todo el mundo que, al final del día, quien llega a quitar eso y a servirse un banquete de besos y ricura soy yo." },

  { foto: "11.jpg", titulo: "Más que hermosa",
    mensaje: "Uy, esta foto me encanta. Dios mío, mi vida, eres muy hermosa. Este regalo entero es justo para eso: para decirte una y mil veces que eres más que hermosa, mi amor." },

  { foto: "12.jpg", titulo: "Esa mirada",
    mensaje: "Esta foto, dios mío, es de mis favoritas. Me encanta tu mirada, tu pose, tus ojitos… todo. No sé, me encanta demasiado. Bueno, todas me encantan demasiado, mi corazón: todo lo que sea tuyo." },

  { foto: "13.jpg", titulo: "Cabello hermoso",
    mensaje: "Ay, mi niña con su cabellito de color y corto, toda preciosa. A ella le encanta cortarse el pelo y pintárselo… si supiera que de todas las formas se ve hermosa." },

  { foto: "14.jpg", titulo: "Me encanta cada foto tuya",
    mensaje: "Diablo, otra foto que me encanta, jaja. Bueno, dirás: «a este todas le encantan». Y claro, mi amor, si es tuya, claro que me encanta. Aunque, si esta es la primera estrella que enciendes, no sabrás cuántas veces digo que me encantas… pues que te quede claro: me encantas toda." },

  { foto: "15.jpg", titulo: "Tú y yo de niños",
    mensaje: "Una estrella especial: en esta nos vemos ella y yo de pequeños, tan tiernos. Cuando hizo esta bella foto me gustó muchísimo, jeje, y hasta salgo y todo, no tan feo como soy en verdad." },

  { foto: "16.jpg", titulo: "Buena suerte",
    mensaje: "Un pequeño cenizo de la suerte ha aparecido: tendrás mucha suerte mañana y el resto de tu vida, amor. Te amo." },

  { foto: "17.jpg", titulo: "Mi bendición",
    mensaje: "Uff, ¿qué es esto que estamos viendo? Una cosita divina y hermosa. Qué bendición, mi amorcito, es verte y tenerte a mi lado, a pesar de los miles de problemas que tenemos, jaja. Aunque vayamos de problema en problema, eso no le quita nada al deseo y al amor que te tengo, amor." },

  { foto: "18.jpg", titulo: "Todas tus fotos",
    mensaje: "Uy, y esta foto tan bella. Te quiero decir que no hay foto tuya que no me guste, mi vida. Todas son hermosas y todas cuentan algo, y para mí todas son preciosas." },

  { foto: "19.jpg", titulo: "Enamorado de ti",
    mensaje: "Oh no, mi amor… no sé si sabías que estoy muy enamorado de ti y de todo lo que eres. Quiero mejorar contigo y quiero que seamos juntos algo mucho más hermoso: una pareja feliz. Yo te amo, y trato cada día de aprender a ser un buen novio y un buen todo para ti." },

  { foto: "20.jpg", titulo: "Mi niña trabajadora",
    mensaje: "Mi niña trabajando. A veces soy duro con ella, pero de verdad la entiendo: cuando yo trabajaba, lo último que quería era trabajar, y tampoco tenía esas ganas ni la motivación que tienen otros. Hoy doy todo por lo que hago, porque me encanta, me gusta, es mi sueño; a veces hasta me desvelo. Pero entiendo que mi niña a veces solo está agotada, y es muy pesado, más cuando se gana tan poquito. Lo valoro, mi amor." },
];

/* Fotos extra: aparecen como polaroids sobre la carta final */
const FOTOS_EXTRA = ["sobre1.jpg", "sobre2.jpg", "sobre3.jpg", "sobre4.jpg"];
