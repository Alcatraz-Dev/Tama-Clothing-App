import Translations from '../translations';

export const getName = (field: any, currentLang: string, fallback = '') => {
  if (!field) return fallback;
  if (typeof field === 'string') return field || fallback;
  const val = field[currentLang] ||
    (currentLang === 'ar' ? (field['ar-tn'] || field['ar']) : undefined) ||
    field.fr || field.en || field['ar-tn'] || Object.values(field)[0];
  return (val as string) || fallback;
};

export const translateColor = (color: string, currentLang: string) => {
  if (!color) return '';
  const colorsMap: any = {
    red: { fr: 'Rouge', ar: 'أحمر', en: 'Red' },
    blue: { fr: 'Bleu', ar: 'أزرق', en: 'Blue' },
    green: { fr: 'Vert', ar: 'أخضر', en: 'Green' },
    black: { fr: 'Noir', ar: 'أسود', en: 'Black' },
    white: { fr: 'Blanc', ar: 'أبيض', en: 'White' },
    yellow: { fr: 'Jaune', ar: 'أصفر', en: 'Yellow' },
    grey: { fr: 'Gris', ar: 'رمادي', en: 'Grey' },
    gray: { fr: 'Gris', ar: 'رمادي', en: 'Gray' },
    purple: { fr: 'Violet', ar: 'بنفسجي', en: 'Purple' },
    pink: { fr: 'Rose', ar: 'وردي', en: 'Pink' },
    orange: { fr: 'Orange', ar: 'برتقالي', en: 'Orange' },
    brown: { fr: 'Marron', ar: 'بني', en: 'Brown' },
    beige: { fr: 'Beige', ar: 'بيج', en: 'Beige' },
    olive: { fr: 'Olive', ar: 'زيتوني', en: 'Olive' },
    navy: { fr: 'Marine', ar: 'كحلي', en: 'Navy' },
    burgundy: { fr: 'Bordeaux', ar: 'عنابي', en: 'Burgundy' },
    khaki: { fr: 'Kaki', ar: 'خاكي', en: 'Khaki' },
    teal: { fr: 'Teal', ar: 'تركوازي', en: 'Teal' },
    gold: { fr: 'Or', ar: 'ذهبي', en: 'Gold' },
    silver: { fr: 'Argent', ar: 'فضي', en: 'Silver' },
    mustard: { fr: 'Moutarde', ar: 'خردلي', en: 'Mustard' },
    emerald: { fr: 'Émeraude', ar: 'زمردي', en: 'Emerald' },
    sapphire: { fr: 'Saphir', ar: 'ياقوتي', en: 'Sapphire' },
    cream: { fr: 'Crème', ar: 'كريمي', en: 'Cream' },
    ivory: { fr: 'Ivoire', ar: 'عاجي', en: 'Ivory' },
  };
  const key = color.toLowerCase();
  const langKey = currentLang === 'ar-tn' ? 'ar' : (currentLang || 'fr');
  return colorsMap[key]?.[langKey] || colorsMap[key]?.[currentLang === 'ar' ? 'ar' : currentLang] || colorsMap[key]?.en || color;
};

// Convert color name to hex code for React Native backgroundColor
export const colorNameToHex = (color: string): string => {
  if (!color) return 'transparent';
  // If it's already a hex code, return as-is
  if (color.startsWith('#')) return color.toLowerCase();
  
  const colorHexMap: { [key: string]: string } = {
    red: '#FF0000',
    blue: '#0000FF',
    green: '#008000',
    black: '#000000',
    white: '#FFFFFF',
    yellow: '#FFFF00',
    grey: '#808080',
    gray: '#808080',
    purple: '#800080',
    pink: '#FFC0CB',
    orange: '#FFA500',
    brown: '#A52A2A',
    beige: '#F5F5DC',
    olive: '#808000',
    navy: '#000080',
    burgundy: '#800020',
    khaki: '#F0E68C',
    teal: '#008080',
    gold: '#FFD700',
    silver: '#C0C0C0',
    mustard: '#FFDB58',
    emerald: '#50C878',
    sapphire: '#0F52BA',
    cream: '#FFFDD0',
    ivory: '#FFFFF0',
    lightblue: '#ADD8E6',
    darkblue: '#00008B',
    lightgreen: '#90EE90',
    darkgreen: '#006400',
    lightpink: '#FFB6C1',
    darkred: '#8B0000',
    lightgray: '#D3D3D3',
    darkgray: '#A9A9A9',
    lightyellow: '#FFFFE0',
    lightorange: '#FFDAB9',
    lightpurple: '#DDA0DD',
    darkpurple: '#4B0082',
    lightbrown: '#CD853F',
    darkbrown: '#8B4513',
    lightbeige: '#F5F5DC',
    darkbeige: '#D2B48C',
    turquoise: '#40E0D0',
    coral: '#FF7F50',
    salmon: '#FA8072',
    tomato: '#FF6347',
    indigo: '#4B0082',
    lavender: '#E6E6FA',
    violet: '#EE82EE',
    maroon: '#800000',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    aqua: '#00FFFF',
    lime: '#00FF00',
    mint: '#98FF98',
    peach: '#FFDAB9',
    plum: '#DDA0DD',
    tan: '#D2B48C',
    wheat: '#F5DEB3',
    chocolate: '#D2691E',
    crimson: '#DC143C',
    firebrick: '#B22222',
    forestgreen: '#228B22',
    gainsboro: '#DCDCDC',
    honeydew: '#F0FFF0',
    linen: '#FAF0E6',
    mintcream: '#F5FFFA',
    mistyrose: '#FFE4E1',
    moccasin: '#FFE4B5',
    navajowhite: '#FFDEAD',
    oldlace: '#FDF5E6',
    olivedrab: '#6B8E23',
    orangered: '#FF4500',
    orchid: '#DA70D6',
    palegoldenrod: '#EEE8AA',
    palegreen: '#98FB98',
    paleturquoise: '#AFEEEE',
    palevioletred: '#DB7093',
    papayawhip: '#FFEFD5',
    powderblue: '#B0E0E6',
    rosybrown: '#BC8F8F',
    royalblue: '#4169E1',
    saddlebrown: '#8B4513',
    sandybrown: '#F4A460',
    seagreen: '#2E8B57',
    seashell: '#FFF5EE',
    sienna: '#A0522D',
    skyblue: '#87CEEB',
    slateblue: '#6A5ACD',
    slategray: '#708090',
    snow: '#FFFAFA',
    springgreen: '#00FF7F',
    steelblue: '#4682B4',
    thistle: '#D8BFD8',
    violetred: '#C71585',
    whitesmoke: '#F5F5F5',
  };
  
  const key = color.toLowerCase().trim();
  return colorHexMap[key] || color; // Return original if not found
};

export const translateCategory = (cat: string, currentLang: string) => {
  if (!cat) return '';
  const key = cat.toLowerCase();
  return Translations[currentLang]?.[key] || cat;
};
