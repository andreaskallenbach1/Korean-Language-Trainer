// The Hangul letters with German explanations.

export type JamoGroup =
  | "basic-vowel"
  | "y-vowel"
  | "ae-e"
  | "compound-vowel"
  | "basic-consonant"
  | "aspirated"
  | "tense";

export interface Jamo {
  char: string;
  group: JamoGroup;
  roman: string;
  /** Korean letter name, e.g. 기역 (consonants only). */
  name?: string;
  nameRoman?: string;
  /** How it sounds, for German speakers. */
  sound: string;
  /** Memory aid based on the shape. */
  mnemonic: string;
}

export const GROUP_LABELS: Record<JamoGroup, string> = {
  "basic-vowel": "Grundvokale",
  "y-vowel": "Vokale mit j",
  "ae-e": "ä und e",
  "compound-vowel": "Zusammengesetzte Vokale",
  "basic-consonant": "Grundkonsonanten",
  aspirated: "Behauchte Konsonanten",
  tense: "Gespannte Konsonanten",
};

export const JAMO: Jamo[] = [
  // Grundvokale
  {
    char: "ㅏ", group: "basic-vowel", roman: "a",
    sound: "Wie das a in „Vater“.",
    mnemonic: "Der kleine Strich zeigt nach außen (rechts). Der Mund ist weit offen: a.",
  },
  {
    char: "ㅓ", group: "basic-vowel", roman: "eo",
    sound: "Ein offenes o wie in „Sonne“, aber ohne die Lippen zu runden. Klingt fast wie das u im englischen „but“.",
    mnemonic: "Das Spiegelbild von ㅏ: Der Strich zeigt nach innen (links).",
  },
  {
    char: "ㅗ", group: "basic-vowel", roman: "o",
    sound: "Ein geschlossenes o wie in „Ofen“, mit runden Lippen.",
    mnemonic: "Der Strich zeigt nach oben: o wie oben.",
  },
  {
    char: "ㅜ", group: "basic-vowel", roman: "u",
    sound: "Wie das u in „gut“.",
    mnemonic: "Der Strich zeigt nach unten: u wie unten.",
  },
  {
    char: "ㅡ", group: "basic-vowel", roman: "eu",
    sound: "Wie ein u, aber mit breit gezogenen Lippen, als würdest du lächeln. Diesen Laut gibt es im Deutschen nicht.",
    mnemonic: "Eine flache Linie: flache, breite Lippen.",
  },
  {
    char: "ㅣ", group: "basic-vowel", roman: "i",
    sound: "Wie das i in „Lied“.",
    mnemonic: "Ein schmaler, aufrechter Strich, schmal wie das i.",
  },
  // ä und e
  {
    char: "ㅐ", group: "ae-e", roman: "ae",
    sound: "Ein offenes ä wie in „Bär“. Im heutigen Koreanisch klingt es fast gleich wie ㅔ.",
    mnemonic: "ㅏ und ㅣ verschmelzen: a + i ergibt ä.",
  },
  {
    char: "ㅔ", group: "ae-e", roman: "e",
    sound: "Wie das e in „Bett“.",
    mnemonic: "ㅓ und ㅣ verschmelzen. Im Alltag hört man kaum einen Unterschied zu ㅐ.",
  },
  // Vokale mit j
  {
    char: "ㅑ", group: "y-vowel", roman: "ya",
    sound: "„ja“, wie in „Jacke“.",
    mnemonic: "Ein zweiter Strich bedeutet: ein j davor. ㅏ (a) wird zu ㅑ (ja).",
  },
  {
    char: "ㅕ", group: "y-vowel", roman: "yeo",
    sound: "j + ㅓ: ein offenes „jo“ ohne runde Lippen.",
    mnemonic: "ㅓ mit zweitem Strich, also ein j davor.",
  },
  {
    char: "ㅛ", group: "y-vowel", roman: "yo",
    sound: "„jo“ wie in „Joghurt“.",
    mnemonic: "ㅗ mit zweitem Strich, also ein j davor.",
  },
  {
    char: "ㅠ", group: "y-vowel", roman: "yu",
    sound: "„ju“ wie in „Jugend“.",
    mnemonic: "ㅜ mit zweitem Strich, also ein j davor.",
  },
  {
    char: "ㅒ", group: "y-vowel", roman: "yae",
    sound: "„jä“. Selten, kommt vor allem in 얘 (dieses Kind, umgangssprachlich) vor.",
    mnemonic: "ㅐ mit zweitem Strich, also ein j davor.",
  },
  {
    char: "ㅖ", group: "y-vowel", roman: "ye",
    sound: "„je“ wie in „jetzt“. Nach Konsonanten oft nur wie e: 시계 klingt wie „sige“.",
    mnemonic: "ㅔ mit zweitem Strich, also ein j davor.",
  },
  // Zusammengesetzte Vokale
  {
    char: "ㅘ", group: "compound-vowel", roman: "wa",
    sound: "„wa“ mit englischem w (Lippen kurz rund), wie in „water“.",
    mnemonic: "ㅗ + ㅏ: o + a, schnell gesprochen, ergibt wa.",
  },
  {
    char: "ㅙ", group: "compound-vowel", roman: "wae",
    sound: "„wä“, wie in 왜 (warum).",
    mnemonic: "ㅗ + ㅐ: o + ä ergibt wä.",
  },
  {
    char: "ㅚ", group: "compound-vowel", roman: "oe",
    sound: "Wird heute fast immer wie „we“ gesprochen.",
    mnemonic: "ㅗ + ㅣ. Klingt trotzdem wie we, nicht wie oi.",
  },
  {
    char: "ㅝ", group: "compound-vowel", roman: "wo",
    sound: "w + ㅓ: „wo“ mit offenem, ungerundetem o, wie in 뭐 (was).",
    mnemonic: "ㅜ + ㅓ: u + eo ergibt wo.",
  },
  {
    char: "ㅞ", group: "compound-vowel", roman: "we",
    sound: "„we“, wie in „wet“ (englisch). Selten.",
    mnemonic: "ㅜ + ㅔ: u + e ergibt we.",
  },
  {
    char: "ㅟ", group: "compound-vowel", roman: "wi",
    sound: "„wi“, wie das englische „we“.",
    mnemonic: "ㅜ + ㅣ: u + i ergibt wi.",
  },
  {
    char: "ㅢ", group: "compound-vowel", roman: "ui",
    sound: "ㅡ und ㅣ schnell hintereinander. Mitten im Wort oft nur i, als Besitz-Partikel (\"von\") wie e.",
    mnemonic: "ㅡ + ㅣ: breites u, dann i.",
  },
  // Grundkonsonanten
  {
    char: "ㄱ", group: "basic-consonant", roman: "g/k", name: "기역", nameRoman: "giyeok",
    sound: "Zwischen g und k, weich und ohne Luftstoß. Am Wortanfang eher wie ein schwaches k, zwischen Vokalen wie g.",
    mnemonic: "Zeigt die Zunge, deren hinterer Teil den Gaumen berührt.",
  },
  {
    char: "ㄴ", group: "basic-consonant", roman: "n", name: "니은", nameRoman: "nieun",
    sound: "Wie das deutsche n.",
    mnemonic: "Die Zungenspitze liegt hinter den oberen Zähnen. Genau so sieht ㄴ aus.",
  },
  {
    char: "ㄷ", group: "basic-consonant", roman: "d/t", name: "디귿", nameRoman: "digeut",
    sound: "Zwischen d und t, weich und ohne Luftstoß.",
    mnemonic: "ㄴ mit Deckel: gleiche Zungenstelle, aber der Luftweg ist kurz verschlossen.",
  },
  {
    char: "ㄹ", group: "basic-consonant", roman: "r/l", name: "리을", nameRoman: "rieul",
    sound: "Zwischen Vokalen ein kurz getipptes r (wie im spanischen „pero“). Am Silbenende ein l.",
    mnemonic: "Eine Zickzack-Linie: Die Zunge tippt kurz an.",
  },
  {
    char: "ㅁ", group: "basic-consonant", roman: "m", name: "미음", nameRoman: "mieum",
    sound: "Wie das deutsche m.",
    mnemonic: "Ein Quadrat: der geschlossene Mund.",
  },
  {
    char: "ㅂ", group: "basic-consonant", roman: "b/p", name: "비읍", nameRoman: "bieup",
    sound: "Zwischen b und p, weich und ohne Luftstoß.",
    mnemonic: "Ein Eimer (englisch bucket): b.",
  },
  {
    char: "ㅅ", group: "basic-consonant", roman: "s", name: "시옷", nameRoman: "siot",
    sound: "Ein stimmloses s wie in „Haus“. Vor ㅣ und den j-Vokalen klingt es wie sch: 시 klingt wie „schi“.",
    mnemonic: "Sieht aus wie ein Zahn, denn das s entsteht an den Zähnen.",
  },
  {
    char: "ㅇ", group: "basic-consonant", roman: "– / ng", name: "이응", nameRoman: "ieung",
    sound: "Am Silbenanfang stumm, es hält nur den Platz. Am Silbenende klingt es wie ng in „lang“.",
    mnemonic: "Ein Kreis: die offene Kehle.",
  },
  {
    char: "ㅈ", group: "basic-consonant", roman: "j", name: "지읒", nameRoman: "jieut",
    sound: "Ein weiches dsch wie in „Dschungel“. Am Wortanfang eher wie ein weiches tsch.",
    mnemonic: "Ein ㅅ mit einem Strich darüber.",
  },
  {
    char: "ㅎ", group: "basic-consonant", roman: "h", name: "히읗", nameRoman: "hieut",
    sound: "Wie das h in „Haus“. Zwischen Vokalen oft kaum hörbar.",
    mnemonic: "Ein Hut über einem Kreis (der Kehle): Luft strömt heraus.",
  },
  // Behauchte Konsonanten
  {
    char: "ㅋ", group: "aspirated", roman: "k", name: "키읔", nameRoman: "kieuk",
    sound: "Ein kräftiges k mit hörbarem Luftstoß, genau wie das deutsche k in „Kino“.",
    mnemonic: "ㄱ plus Strich: plus Luft.",
  },
  {
    char: "ㅌ", group: "aspirated", roman: "t", name: "티읕", nameRoman: "tieut",
    sound: "Ein kräftiges t mit Luftstoß wie in „Tal“.",
    mnemonic: "ㄷ plus Strich: plus Luft.",
  },
  {
    char: "ㅍ", group: "aspirated", roman: "p", name: "피읖", nameRoman: "pieup",
    sound: "Ein kräftiges p mit Luftstoß wie in „Post“.",
    mnemonic: "Eine kleine Tür, die die Luft herauslässt.",
  },
  {
    char: "ㅊ", group: "aspirated", roman: "ch", name: "치읓", nameRoman: "chieut",
    sound: "Ein kräftiges tsch mit Luftstoß wie in „Tschüss“.",
    mnemonic: "ㅈ mit einem zusätzlichen Strich obendrauf: plus Luft.",
  },
  // Gespannte Konsonanten
  {
    char: "ㄲ", group: "tense", roman: "kk", name: "쌍기역", nameRoman: "ssanggiyeok",
    sound: "Ein hartes k ohne Luftstoß, mit angespanntem Hals. Wie das k im französischen „café“.",
    mnemonic: "Zwei ㄱ: doppelte Spannung.",
  },
  {
    char: "ㄸ", group: "tense", roman: "tt", name: "쌍디귿", nameRoman: "ssangdigeut",
    sound: "Ein hartes t ohne Luftstoß. Wie das t in „Stein“: Dort hauchst du nicht.",
    mnemonic: "Zwei ㄷ: doppelte Spannung.",
  },
  {
    char: "ㅃ", group: "tense", roman: "pp", name: "쌍비읍", nameRoman: "ssangbieup",
    sound: "Ein hartes p ohne Luftstoß. Wie das p in „Spaß“.",
    mnemonic: "Zwei ㅂ: doppelte Spannung.",
  },
  {
    char: "ㅆ", group: "tense", roman: "ss", name: "쌍시옷", nameRoman: "ssangsiot",
    sound: "Ein scharfes, gepresstes s.",
    mnemonic: "Zwei ㅅ: doppelte Spannung.",
  },
  {
    char: "ㅉ", group: "tense", roman: "jj", name: "쌍지읒", nameRoman: "ssangjieut",
    sound: "Ein gepresstes tz ohne Luftstoß, wie das zz im italienischen „pizza“.",
    mnemonic: "Zwei ㅈ: doppelte Spannung.",
  },
];

export const JAMO_BY_CHAR: Record<string, Jamo> = Object.fromEntries(JAMO.map((j) => [j.char, j]));
