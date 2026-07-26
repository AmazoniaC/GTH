/**
 * Departamentos de Colombia (32 + Bogotá D.C.) y una selección de sus
 * municipios principales usada como sugerencias. El campo de ciudad admite
 * texto libre, por lo que si un municipio no está en la lista igual puede
 * escribirse. Para un listado 100% completo del DANE, reemplaza este archivo.
 */
export const COLOMBIA: Record<string, string[]> = {
  Amazonas: ['Leticia', 'Puerto Nariño'],
  Antioquia: [
    'Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro', 'Apartadó', 'Turbo',
    'Sabaneta', 'La Estrella', 'Copacabana', 'Caldas', 'Marinilla', 'Caucasia',
  ],
  Arauca: ['Arauca', 'Tame', 'Saravena', 'Arauquita', 'Fortul'],
  Atlántico: ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Puerto Colombia', 'Galapa', 'Baranoa'],
  Bolívar: ['Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar', 'Mompós'],
  Boyacá: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa', 'Puerto Boyacá'],
  Caldas: ['Manizales', 'La Dorada', 'Chinchiná', 'Villamaría', 'Riosucio', 'Anserma'],
  Caquetá: ['Florencia', 'San Vicente del Caguán', 'Puerto Rico', 'La Montañita'],
  Casanare: ['Yopal', 'Aguazul', 'Villanueva', 'Tauramena', 'Monterrey'],
  Cauca: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía', 'Guapi'],
  Cesar: ['Valledupar', 'Aguachica', 'Bosconia', 'Agustín Codazzi', 'La Jagua de Ibirico'],
  Chocó: ['Quibdó', 'Istmina', 'Condoto', 'Tadó', 'Bahía Solano'],
  Córdoba: ['Montería', 'Lorica', 'Cereté', 'Sahagún', 'Montelíbano', 'Tierralta', 'Planeta Rica'],
  Cundinamarca: [
    'Soacha', 'Facatativá', 'Zipaquirá', 'Chía', 'Girardot', 'Fusagasugá', 'Mosquera',
    'Madrid', 'Funza', 'Cajicá', 'Ubaté', 'Cota', 'La Calera', 'Sibaté', 'Tocancipá',
  ],
  Guainía: ['Inírida'],
  Guaviare: ['San José del Guaviare', 'El Retorno', 'Calamar'],
  Huila: ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'Gigante'],
  'La Guajira': ['Riohacha', 'Maicao', 'Uribia', 'Fonseca', 'San Juan del Cesar', 'Manaure', 'Villanueva'],
  Magdalena: ['Santa Marta', 'Ciénaga', 'Fundación', 'El Banco', 'Plato', 'Zona Bananera'],
  Meta: ['Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'Cumaral', 'San Martín'],
  Nariño: ['Pasto', 'Ipiales', 'Tumaco', 'Túquerres', 'La Unión', 'Samaniego'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario', 'Los Patios', 'Tibú'],
  Putumayo: ['Mocoa', 'Puerto Asís', 'Orito', 'Valle del Guamuez', 'Sibundoy'],
  Quindío: ['Armenia', 'Calarcá', 'La Tebaida', 'Montenegro', 'Quimbaya', 'Circasia'],
  Risaralda: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia', 'Marsella'],
  'San Andrés y Providencia': ['San Andrés', 'Providencia'],
  Santander: [
    'Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil',
    'Socorro', 'Barbosa', 'Málaga',
  ],
  Sucre: ['Sincelejo', 'Corozal', 'Sampués', 'San Marcos', 'Tolú', 'San Onofre'],
  Tolima: ['Ibagué', 'Espinal', 'Melgar', 'Honda', 'Líbano', 'Chaparral', 'Mariquita'],
  'Valle del Cauca': [
    'Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Buga', 'Jamundí', 'Yumbo',
    'Candelaria', 'Florida', 'Zarzal',
  ],
  Vaupés: ['Mitú'],
  Vichada: ['Puerto Carreño', 'La Primavera', 'Cumaribo'],
  'Bogotá D.C.': ['Bogotá D.C.'],
};

export const DEPARTMENTS = Object.keys(COLOMBIA).sort((a, b) => a.localeCompare(b, 'es'));

export const COUNTRIES = [
  'Colombia', 'Venezuela', 'Ecuador', 'Perú', 'Panamá', 'Brasil', 'Chile',
  'Argentina', 'México', 'España', 'Estados Unidos', 'Otro',
];
