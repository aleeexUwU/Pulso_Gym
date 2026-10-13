/**
 * Tabla de alimentos habituales en España, valores aproximados por 100 g de
 * porción comestible (referencias tipo BEDCA/USDA, redondeadas). Sirve para
 * interpretar lo que escribes sin conexión y sin IA. Son estimaciones.
 */

export interface Nutrientes {
  kcal: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
  azucares: number;
  sal: number;
}

export interface Alimento extends Nutrientes {
  id: string;
  nombre: string;
  /** Formas de llamarlo (sin tildes, en minúscula). Se busca la más larga primero. */
  alias: string[];
  /** Gramos de una ración típica ("un plato", "una ración"). */
  racion: number;
  /** Gramos por unidad contable (huevo, plátano, rebanada...). */
  unidad?: number;
  /** Líquidos: los ml se tratan como g. */
  liquido?: boolean;
}

type Fila = [
  id: string,
  nombre: string,
  alias: string[],
  kcal: number,
  prot: number,
  carb: number,
  grasa: number,
  fibra: number,
  azucar: number,
  sal: number,
  racion: number,
  unidad?: number,
  liquido?: boolean,
];

const FILAS: Fila[] = [
  // Huevos, lácteos
  ["huevo", "Huevo", ["huevo", "huevos", "huevo cocido", "huevo frito", "tortilla francesa"], 143, 12.6, 0.7, 9.9, 0, 0.4, 0.35, 120, 60],
  ["clara", "Clara de huevo", ["clara", "claras", "claras de huevo"], 52, 10.9, 0.7, 0.2, 0, 0.7, 0.4, 100, 33],
  ["tortilla_patatas", "Tortilla de patatas", ["tortilla de patatas", "tortilla de patata", "tortilla espanola"], 190, 6.5, 14, 12, 1.2, 1, 0.9, 150],
  ["leche_entera", "Leche entera", ["leche entera", "leche", "vaso de leche"], 64, 3.2, 4.7, 3.6, 0, 4.7, 0.1, 250, undefined, true],
  ["leche_semi", "Leche semidesnatada", ["leche semidesnatada", "leche semi"], 46, 3.3, 4.8, 1.6, 0, 4.8, 0.1, 250, undefined, true],
  ["leche_desnatada", "Leche desnatada", ["leche desnatada"], 35, 3.4, 4.9, 0.2, 0, 4.9, 0.1, 250, undefined, true],
  ["bebida_avena", "Bebida de avena", ["leche de avena", "bebida de avena"], 45, 0.7, 7, 1.5, 0.8, 4, 0.1, 250, undefined, true],
  ["bebida_soja", "Bebida de soja", ["leche de soja", "bebida de soja"], 40, 3.3, 2.5, 1.8, 0.5, 2.5, 0.1, 250, undefined, true],
  ["yogur_natural", "Yogur natural", ["yogur natural", "yogur", "yogures"], 62, 3.8, 4.7, 3.2, 0, 4.7, 0.1, 125, 125],
  ["yogur_griego", "Yogur griego", ["yogur griego"], 115, 6, 4, 8.5, 0, 4, 0.1, 125, 125],
  ["yogur_proteico", "Yogur proteico / skyr", ["skyr", "yogur proteico", "yogur alto en proteinas"], 62, 10.5, 4, 0.2, 0, 4, 0.1, 150, 150],
  ["queso_fresco", "Queso fresco", ["queso fresco", "queso de burgos"], 175, 12, 3, 13, 0, 3, 0.9, 60],
  ["queso_batido", "Queso fresco batido 0%", ["queso batido", "queso fresco batido"], 46, 8, 3.5, 0.1, 0, 3.5, 0.1, 125],
  ["queso_curado", "Queso curado", ["queso curado", "queso manchego", "queso"], 400, 26, 0.5, 33, 0, 0.5, 1.6, 30],
  ["mozzarella", "Mozzarella", ["mozzarella"], 254, 18, 2.2, 19, 0, 1, 0.5, 60],
  ["cafe_con_leche", "Café con leche", ["cafe con leche", "cortado"], 30, 1.6, 2.4, 1.6, 0, 2.4, 0.05, 200, undefined, true],
  ["cafe_solo", "Café solo", ["cafe solo", "cafe", "espresso", "americano"], 2, 0.1, 0, 0, 0, 0, 0, 60, undefined, true],
  // Cereales, pan, pasta
  ["pan_blanco", "Pan blanco (barra)", ["pan", "pan blanco", "barra de pan", "bocadillo de pan", "baguette"], 270, 8.5, 54, 1.6, 2.7, 3, 1.3, 60, 30],
  ["pan_integral", "Pan integral", ["pan integral"], 245, 9, 44, 3, 7, 4, 1.1, 60, 30],
  ["pan_molde", "Pan de molde", ["pan de molde", "rebanada de pan", "rebanadas de pan", "tostada", "tostadas"], 265, 8, 48, 4, 3, 5, 1.1, 60, 30],
  ["avena", "Copos de avena", ["avena", "copos de avena", "porridge", "gachas de avena"], 375, 13, 60, 7, 10, 1, 0, 50],
  ["cereales", "Cereales de desayuno", ["cereales", "corn flakes", "muesli"], 380, 7, 80, 2.5, 4, 20, 0.8, 40],
  ["arroz_cocido", "Arroz blanco cocido", ["arroz", "arroz blanco", "arroz cocido", "plato de arroz"], 130, 2.7, 28, 0.3, 0.4, 0, 0, 200],
  ["arroz_integral", "Arroz integral cocido", ["arroz integral"], 123, 2.7, 25.6, 1, 1.6, 0, 0, 200],
  ["paella", "Paella", ["paella", "arroz con pollo"], 160, 8, 20, 5, 1, 1, 0.8, 300],
  ["pasta_cocida", "Pasta cocida", ["pasta", "macarrones", "espaguetis", "spaghetti", "fideos", "plato de pasta", "tallarines"], 158, 5.8, 31, 0.9, 1.8, 0.6, 0, 220],
  ["pasta_bolonesa", "Pasta a la boloñesa", ["macarrones con tomate", "pasta bolonesa", "espaguetis a la bolonesa", "macarrones con carne"], 150, 7, 20, 4.5, 1.8, 2.5, 0.6, 300],
  ["pizza", "Pizza", ["pizza", "porcion de pizza", "porciones de pizza"], 266, 11, 33, 10, 2.3, 3.6, 1.3, 300, 110],
  ["patata_cocida", "Patata cocida", ["patata", "patatas", "patata cocida", "pure de patata"], 87, 1.9, 20, 0.1, 1.8, 0.9, 0, 200, 150],
  ["patatas_fritas", "Patatas fritas", ["patatas fritas", "patatas fritas de bolsa"], 312, 3.4, 41, 15, 3.8, 0.3, 0.6, 150],
  ["boniato", "Boniato", ["boniato", "batata"], 90, 2, 21, 0.2, 3.3, 6.5, 0, 200, 200],
  ["quinoa", "Quinoa cocida", ["quinoa"], 120, 4.4, 21, 1.9, 2.8, 0.9, 0, 180],
  ["cuscus", "Cuscús cocido", ["cuscus"], 112, 3.8, 23, 0.2, 1.4, 0.1, 0, 180],
  ["tortita_maiz", "Tortitas de arroz/maíz", ["tortitas de arroz", "tortitas de maiz", "tortita de arroz"], 387, 8, 81, 3, 4, 1, 0.3, 20, 8],
  ["galletas", "Galletas", ["galletas", "galleta", "galletas maria"], 440, 7, 70, 15, 2.5, 22, 0.8, 30, 6],
  ["bolleria", "Bollería (croissant, magdalena)", ["croissant", "cruasan", "magdalena", "magdalenas", "bolleria", "napolitana", "donut"], 420, 7, 48, 22, 2, 18, 0.9, 60, 60],
  // Legumbres
  ["lentejas", "Lentejas guisadas", ["lentejas", "plato de lentejas"], 116, 9, 20, 0.4, 7.9, 1.8, 0.5, 300],
  ["garbanzos", "Garbanzos cocidos", ["garbanzos", "cocido", "hummus de garbanzos"], 164, 8.9, 27, 2.6, 7.6, 4.8, 0.3, 250],
  ["alubias", "Alubias cocidas", ["alubias", "judias blancas", "fabada"], 127, 8.7, 22.8, 0.5, 6.4, 0.3, 0.3, 250],
  ["hummus", "Hummus", ["hummus"], 166, 7.9, 14, 9.6, 6, 0.3, 0.9, 50],
  ["tofu", "Tofu", ["tofu"], 144, 15.8, 2.8, 8.7, 2.3, 0.6, 0, 125],
  // Carnes y pescados
  ["pollo_pechuga", "Pechuga de pollo", ["pollo", "pechuga de pollo", "pechuga", "filete de pollo", "pollo a la plancha"], 165, 31, 0, 3.6, 0, 0, 0.2, 150, 150],
  ["pollo_muslo", "Muslo de pollo", ["muslo de pollo", "muslos de pollo", "contramuslo", "pollo asado"], 209, 26, 0, 10.9, 0, 0, 0.2, 150, 120],
  ["pavo", "Pavo (pechuga)", ["pavo", "pechuga de pavo"], 135, 30, 0, 1, 0, 0, 0.2, 150, 150],
  ["fiambre_pavo", "Fiambre de pavo", ["fiambre de pavo", "jamon de pavo", "lonchas de pavo"], 105, 18, 2, 2.5, 0, 1.5, 2, 50, 10],
  ["ternera", "Ternera (filete)", ["ternera", "filete de ternera", "filete", "bistec"], 190, 26, 0, 9, 0, 0, 0.2, 150, 150],
  ["carne_picada", "Carne picada", ["carne picada", "hamburguesa", "hamburguesas", "albondigas"], 250, 19, 1, 19, 0, 0, 0.8, 150, 120],
  ["cerdo_lomo", "Lomo de cerdo", ["lomo", "lomo de cerdo", "cinta de lomo", "chuleta de cerdo", "cerdo"], 200, 27, 0, 10, 0, 0, 0.2, 150, 150],
  ["jamon_serrano", "Jamón serrano", ["jamon serrano", "jamon", "jamon iberico"], 241, 31, 0, 13, 0, 0, 4.9, 40, 15],
  ["jamon_york", "Jamón cocido", ["jamon york", "jamon cocido"], 115, 18, 1.5, 4, 0, 1, 2, 50, 15],
  ["chorizo", "Chorizo / embutido", ["chorizo", "salchichon", "salami", "embutido", "fuet"], 455, 24, 2, 39, 0, 1, 4.2, 40],
  ["salchichas", "Salchichas", ["salchichas", "salchicha", "frankfurt"], 270, 12, 3, 23, 0, 1, 2.2, 100, 50],
  ["salmon", "Salmón", ["salmon"], 208, 20, 0, 13, 0, 0, 0.1, 150, 150],
  ["merluza", "Merluza / pescado blanco", ["merluza", "pescado", "pescado blanco", "bacalao", "lubina", "dorada", "pescadilla"], 86, 17.5, 0, 1.8, 0, 0, 0.3, 180, 180],
  ["atun_lata", "Atún en lata (escurrido)", ["atun", "atun en lata", "lata de atun", "latas de atun"], 190, 26, 0, 9.5, 0, 0, 0.9, 60, 60],
  ["sardinas", "Sardinas en lata", ["sardinas"], 208, 24.6, 0, 11.5, 0, 0, 0.8, 85, 85],
  ["gambas", "Gambas / marisco", ["gambas", "langostinos", "marisco", "mejillones", "calamares"], 99, 20, 1, 1.5, 0, 0, 0.6, 150],
  // Verduras y frutas
  ["ensalada", "Ensalada verde", ["ensalada", "lechuga", "ensalada verde", "canonigos", "rucula"], 17, 1.3, 2.4, 0.2, 1.5, 1.2, 0.03, 150],
  ["tomate", "Tomate", ["tomate", "tomates"], 18, 0.9, 3.9, 0.2, 1.2, 2.6, 0.01, 150, 120],
  ["verduras", "Verduras variadas", ["verduras", "verdura", "brocoli", "judias verdes", "calabacin", "espinacas", "pimiento", "zanahoria", "coliflor", "berenjena", "champinones", "setas", "cebolla"], 30, 2, 5, 0.3, 2.5, 2.5, 0.05, 200],
  ["gazpacho", "Gazpacho", ["gazpacho", "salmorejo"], 70, 1, 5, 5, 1, 3.5, 0.6, 250, undefined, true],
  ["pure_verduras", "Puré / crema de verduras", ["pure de verduras", "crema de verduras", "crema de calabacin", "sopa"], 50, 1.5, 6, 2.2, 1.5, 2.5, 0.5, 300, undefined, true],
  ["aguacate", "Aguacate", ["aguacate", "guacamole"], 160, 2, 8.5, 14.7, 6.7, 0.7, 0, 100, 150],
  ["platano", "Plátano", ["platano", "platanos", "banana"], 89, 1.1, 22.8, 0.3, 2.6, 12.2, 0, 120, 120],
  ["manzana", "Manzana", ["manzana", "manzanas"], 52, 0.3, 13.8, 0.2, 2.4, 10.4, 0, 180, 180],
  ["naranja", "Naranja / mandarina", ["naranja", "naranjas", "mandarina", "mandarinas"], 47, 0.9, 11.8, 0.1, 2.4, 9.4, 0, 150, 150],
  ["fresas", "Fresas / frutos rojos", ["fresas", "frutos rojos", "arandanos", "frambuesas"], 33, 0.7, 7.7, 0.3, 2, 4.9, 0, 150],
  ["fruta", "Fruta variada", ["fruta", "pera", "melocoton", "kiwi", "uvas", "melon", "sandia", "pina"], 50, 0.6, 12, 0.2, 2, 10, 0, 150, 150],
  ["zumo_naranja", "Zumo de naranja", ["zumo", "zumo de naranja"], 45, 0.7, 10.4, 0.2, 0.2, 8.4, 0, 200, undefined, true],
  ["datiles", "Dátiles / fruta seca", ["datiles", "pasas", "orejones"], 280, 2.5, 75, 0.4, 7, 63, 0, 40, 8],
  // Grasas, frutos secos, salsas
  ["aceite_oliva", "Aceite de oliva", ["aceite", "aceite de oliva", "chorro de aceite", "aove"], 884, 0, 0, 100, 0, 0, 0, 10],
  ["mantequilla", "Mantequilla", ["mantequilla"], 717, 0.9, 0.1, 81, 0, 0.1, 0.6, 10],
  ["frutos_secos", "Frutos secos", ["frutos secos", "almendras", "nueces", "cacahuetes", "anacardos", "avellanas", "pistachos", "punado de frutos secos"], 600, 20, 16, 52, 8, 4, 0, 30],
  ["crema_cacahuete", "Crema de cacahuete", ["crema de cacahuete", "mantequilla de cacahuete"], 588, 25, 20, 50, 6, 9, 0.4, 20],
  ["mayonesa", "Mayonesa / salsas", ["mayonesa", "alioli", "salsa"], 680, 1, 1, 75, 0, 1, 1.5, 15],
  ["ketchup", "Ketchup / tomate frito", ["ketchup", "tomate frito"], 110, 1.5, 22, 1, 1, 20, 2, 20],
  ["miel", "Miel / mermelada / azúcar", ["miel", "mermelada", "azucar", "sirope"], 304, 0.3, 80, 0, 0, 80, 0, 15],
  ["chocolate", "Chocolate", ["chocolate", "onza de chocolate", "nocilla", "nutella", "cacao soluble"], 540, 6, 55, 31, 6, 48, 0.2, 20, 5],
  // Suplementos y bebidas
  ["whey", "Proteína en polvo (whey)", ["proteina", "batido de proteinas", "whey", "proteina en polvo", "scoop de proteina", "cacito de proteina"], 380, 78, 8, 5, 0, 6, 0.5, 30, 30],
  ["cerveza", "Cerveza", ["cerveza", "cana", "canas", "tercio"], 43, 0.5, 3.6, 0, 0, 0, 0, 330, undefined, true],
  ["vino", "Vino", ["vino", "copa de vino"], 85, 0.1, 2.6, 0, 0, 0.6, 0, 150, undefined, true],
  ["refresco", "Refresco azucarado", ["refresco", "coca cola", "cocacola", "fanta", "aquarius", "zumo envasado"], 42, 0, 10.6, 0, 0, 10.6, 0, 330, undefined, true],
  ["refresco_zero", "Refresco zero", ["coca cola zero", "refresco zero", "refresco light", "zero"], 1, 0, 0, 0, 0, 0, 0, 330, undefined, true],
  // Platos y comida rápida
  ["bocadillo_jamon", "Bocadillo de jamón", ["bocadillo de jamon", "bocata de jamon"], 260, 14, 34, 7, 2, 2, 2.5, 180],
  ["bocadillo", "Bocadillo / sándwich", ["bocadillo", "bocata", "sandwich", "sandwich mixto", "montadito"], 250, 11, 30, 9, 2, 3, 1.5, 180],
  ["hamburguesa_completa", "Hamburguesa completa", ["hamburguesa con pan", "hamburguesa completa", "burger", "big mac"], 255, 13, 24, 12, 1.5, 5, 1.2, 230, 230],
  ["kebab", "Kebab / durum", ["kebab", "durum"], 215, 12, 20, 10, 2, 2, 1.3, 350, 350],
  ["croquetas", "Croquetas", ["croquetas", "croqueta"], 230, 7, 22, 13, 1, 2, 1, 120, 30],
  ["empanadilla", "Empanada / empanadilla", ["empanada", "empanadilla", "empanadillas"], 300, 8, 30, 16, 1.5, 2, 1, 150, 50],
  ["sushi", "Sushi", ["sushi", "maki", "nigiri"], 150, 6, 28, 1.5, 0.8, 5, 1.2, 250, 30],
  ["helado", "Helado", ["helado", "helados"], 207, 3.5, 24, 11, 0.7, 21, 0.2, 100],
];

export const ALIMENTOS: Alimento[] = FILAS.map(
  ([id, nombre, alias, kcal, proteinas, carbohidratos, grasas, fibra, azucares, sal, racion, unidad, liquido]) => ({
    id,
    nombre,
    alias,
    kcal,
    proteinas,
    carbohidratos,
    grasas,
    fibra,
    azucares,
    sal,
    racion,
    unidad,
    liquido,
  }),
);

export function getAlimento(id: string): Alimento | undefined {
  return ALIMENTOS.find((a) => a.id === id);
}

export const NUTRIENTES_CERO: Nutrientes = { kcal: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0, azucares: 0, sal: 0 };

/** Nutrientes de `gramos` de un alimento. */
export function nutrientesDe(a: Nutrientes, gramos: number): Nutrientes {
  const f = gramos / 100;
  return {
    kcal: a.kcal * f,
    proteinas: a.proteinas * f,
    carbohidratos: a.carbohidratos * f,
    grasas: a.grasas * f,
    fibra: a.fibra * f,
    azucares: a.azucares * f,
    sal: a.sal * f,
  };
}

export function sumarNutrientes(...ns: Nutrientes[]): Nutrientes {
  return ns.reduce(
    (t, n) => ({
      kcal: t.kcal + n.kcal,
      proteinas: t.proteinas + n.proteinas,
      carbohidratos: t.carbohidratos + n.carbohidratos,
      grasas: t.grasas + n.grasas,
      fibra: t.fibra + n.fibra,
      azucares: t.azucares + n.azucares,
      sal: t.sal + n.sal,
    }),
    { ...NUTRIENTES_CERO },
  );
}
