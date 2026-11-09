export const TELUGU_VIRAMA = '్';
export const TELUGU_SIGN_AA = 'ా';
export const TELUGU_SIGN_I = 'ి';
export const TELUGU_SIGN_II = 'ీ';
export const TELUGU_SIGN_U = 'ు';
export const TELUGU_SIGN_UU = 'ూ';
export const TELUGU_SIGN_R = 'ృ';
export const TELUGU_SIGN_E = 'ె';
export const TELUGU_SIGN_AI = 'ై';
export const TELUGU_SIGN_O = 'ొ';
export const TELUGU_SIGN_OO = 'ో';
export const TELUGU_SIGN_AU = 'ౌ';
export const TELUGU_KSHA = 'క్ష';
export const TELUGU_TTA = 'త్త';
export const TELUGU_DDA = 'ద్ద';
export const TELUGU_NNA = 'న్న';
export const TELUGU_LLA = 'ల్ల';

/** Inherent vowels, i.e. the "a" sound a bare consonant carries. */
export const INHERENT_VOWEL: Record<string, string> = {
  క: 'ka', ఖ: 'kha', గ: 'ga', ఘ: 'gha', ఙ: 'nga',
  చ: 'cha', ఛ: 'chha', జ: 'ja', ఝ: 'jha', ఞ: 'nya',
  ట: 'ta', ఠ: 'tha', డ: 'da', ఢ: 'dha', ణ: 'na',
  త: 'ta', థ: 'tha', ద: 'da', ధ: 'dha', న: 'na',
  ప: 'pa', ఫ: 'pha', బ: 'ba', భ: 'bha', మ: 'ma',
  య: 'ya', ర: 'ra', ల: 'la', వ: 'va', శ: 'sha',
  ష: 'sha', స: 'sa', హ: 'ha', ళ: 'la', క్ష: 'ksha',
  ఱ: 'ra',
};

/** Independent vowels. */
export const VOWEL: Record<string, string> = {
  అ: 'a', ఆ: 'aa', ఇ: 'i', ఈ: 'ee', ఉ: 'u', ఊ: 'oo',
  ఋ: 'ri', ఎ: 'e', ఏ: 'ee', ఐ: 'ai', ఒ: 'o', ఓ: 'oo',
  ఔ: 'au', అం: 'am', అః: 'ah',
};

/** Long/mark forms written after the base vowel. */
export const VOWEL_SIGN: Record<string, string> = {
  [TELUGU_SIGN_AA]: 'aa',
  [TELUGU_SIGN_I]: 'i',
  [TELUGU_SIGN_II]: 'ee',
  [TELUGU_SIGN_U]: 'u',
  [TELUGU_SIGN_UU]: 'oo',
  [TELUGU_SIGN_R]: 'ri',
  [TELUGU_SIGN_E]: 'e',
  [TELUGU_SIGN_AI]: 'ai',
  [TELUGU_SIGN_O]: 'o',
  [TELUGU_SIGN_OO]: 'oo',
  [TELUGU_SIGN_AU]: 'au',
  [TELUGU_VIRAMA]: '',
};

/** Common conjuncts that need an explicit mapping. */
export const CONJUNCT: Record<string, string> = {
  [TELUGU_KSHA]: 'ksha',
  [TELUGU_TTA]: 'tta',
  [TELUGU_DDA]: 'dda',
  [TELUGU_NNA]: 'nna',
  [TELUGU_LLA]: 'lla',
};

export const DIGIT_TE: Record<string, string> = {
  '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4',
  '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
};
