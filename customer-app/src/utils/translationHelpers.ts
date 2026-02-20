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

export const translateCategory = (cat: string, currentLang: string) => {
  if (!cat) return '';
  const key = cat.toLowerCase();
  return Translations[currentLang]?.[key] || cat;
};
