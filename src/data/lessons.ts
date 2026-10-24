// Curriculum content. Stage 0 (Hangul) is fully playable; later stages are
// listed on the learning path as the roadmap.

export interface Word {
  ko: string;
  roman: string;
  de: string;
  /** Actual pronunciation in Hangul when it differs from the spelling. */
  say?: string;
  note?: string;
}

export interface InfoCard {
  title: string;
  body: string[];
}

export interface Lesson {
  id: string;
  stage: number;
  title: string;
  summary: string;
  newJamo: string[];
  info: InfoCard[];
  words: Word[];
  /** Groups of syllables that are easy to confuse by ear. */
  soundGroups?: string[][];
}

export const LESSONS: Lesson[] = [
  {
    id: "h1",
    stage: 0,
    title: "Die ersten Vokale",
    summary: "ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ und das stumme ㅇ",
    newJamo: ["ㅇ", "ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"],
    info: [
      {
        title: "So funktioniert Hangul",
        body: [
          "Hangul wurde 1443 unter König Sejong erfunden, damit alle Menschen lesen lernen können, nicht nur Gelehrte. Es ist ein Alphabet: Jedes Zeichen steht für einen Laut.",
          "Die Buchstaben stehen aber nicht in einer Reihe. Sie werden zu Silbenblöcken zusammengesetzt: 한 = ㅎ + ㅏ + ㄴ.",
          "Mit 24 Grundzeichen kannst du alles lesen. Die meisten Lernenden schaffen das in ein bis zwei Wochen.",
        ],
      },
      {
        title: "Vokale brauchen einen Platzhalter",
        body: [
          "Ein Vokal steht nie allein. Beginnt eine Silbe mit einem Vokal, steht davor das stumme ㅇ.",
          "Senkrechte Vokale (ㅏ ㅓ ㅣ) kommen rechts neben das ㅇ: 아 어 이.",
          "Waagerechte Vokale (ㅗ ㅜ ㅡ) kommen darunter: 오 우 으.",
        ],
      },
      {
        title: "Schreiben mit der koreanischen Tastatur",
        body: [
          "In den Übungen schreibst du mit dem echten koreanischen Tastaturlayout: links die Konsonanten, rechts die Vokale.",
          "Du tippst Buchstabe für Buchstabe, die Silbenblöcke entstehen von selbst. Für 아 tippst du ㅇ und dann ㅏ.",
          "Du kannst klicken oder deine eigene Tastatur benutzen. Die Taste D ist zum Beispiel ㅇ, die Taste K ist ㅏ.",
        ],
      },
    ],
    words: [
      { ko: "아이", roman: "ai", de: "Kind" },
      { ko: "오이", roman: "oi", de: "Gurke" },
      { ko: "이", roman: "i", de: "zwei / Zahn" },
      { ko: "오", roman: "o", de: "fünf" },
      { ko: "우아", roman: "ua", de: "elegant (in 우아하다)" },
    ],
    soundGroups: [["어", "오"], ["우", "으"], ["아", "어"], ["오", "우"]],
  },
  {
    id: "h2",
    stage: 0,
    title: "Erste Konsonanten",
    summary: "ㄱ ㄴ ㄷ ㄹ ㅁ",
    newJamo: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ"],
    info: [
      {
        title: "Konsonant + Vokal",
        body: [
          "Jetzt ersetzt du das stumme ㅇ durch einen echten Konsonanten: ㄱ + ㅏ = 가, ㄴ + ㅗ = 노.",
          "Das Prinzip bleibt gleich: Senkrechte Vokale stehen rechts, waagerechte darunter.",
        ],
      },
      {
        title: "Weiche Laute",
        body: [
          "ㄱ und ㄷ liegen zwischen g und k bzw. d und t. Am Wortanfang klingen sie fast wie k und t, aber ohne Luftstoß. Zwischen Vokalen klingen sie wie g und d.",
          "Deshalb schreibt man 고기 „gogi“, obwohl das erste ㄱ eher wie ein weiches k klingt. Hör genau hin und sprich nach, was du hörst.",
        ],
      },
    ],
    words: [
      { ko: "나", roman: "na", de: "ich (informell)" },
      { ko: "너", roman: "neo", de: "du (informell)" },
      { ko: "나무", roman: "namu", de: "Baum" },
      { ko: "고기", roman: "gogi", de: "Fleisch" },
      { ko: "머리", roman: "meori", de: "Kopf / Haare" },
      { ko: "다리", roman: "dari", de: "Bein / Brücke" },
      { ko: "어머니", roman: "eomeoni", de: "Mutter" },
      { ko: "누나", roman: "nuna", de: "ältere Schwester (eines Mannes)" },
      { ko: "구두", roman: "gudu", de: "Lederschuhe" },
      { ko: "라디오", roman: "radio", de: "Radio" },
    ],
    soundGroups: [["나", "다", "라"], ["고", "구", "거"], ["머", "모", "무"]],
  },
  {
    id: "h3",
    stage: 0,
    title: "ㅂ ㅅ ㅈ ㅎ",
    summary: "Die restlichen Grundkonsonanten",
    newJamo: ["ㅂ", "ㅅ", "ㅈ", "ㅎ"],
    info: [
      {
        title: "Wörter Silbe für Silbe lesen",
        body: [
          "Lies neue Wörter Block für Block: 아버지 = 아 · 버 · 지.",
          "Sprich dabei laut mit. Das verbindet Schriftbild und Klang und hilft enorm beim Merken.",
        ],
      },
      {
        title: "ㅅ vor i klingt wie sch",
        body: [
          "Vor ㅣ (und später vor den j-Vokalen) wird ㅅ zu einem weichen sch: 시 klingt wie „schi“.",
          "Die Umschrift bleibt trotzdem „si“. Die Umschrift ist nur eine Krücke: Vertraue deinem Ohr mehr als den lateinischen Buchstaben.",
        ],
      },
    ],
    words: [
      { ko: "바다", roman: "bada", de: "Meer" },
      { ko: "바나나", roman: "banana", de: "Banane" },
      { ko: "비", roman: "bi", de: "Regen" },
      { ko: "소리", roman: "sori", de: "Geräusch / Klang" },
      { ko: "모자", roman: "moja", de: "Mütze / Hut" },
      { ko: "아버지", roman: "abeoji", de: "Vater" },
      { ko: "지도", roman: "jido", de: "Landkarte" },
      { ko: "하나", roman: "hana", de: "eins" },
      { ko: "오후", roman: "ohu", de: "Nachmittag" },
      { ko: "버스", roman: "beoseu", de: "Bus" },
      { ko: "주스", roman: "juseu", de: "Saft" },
      { ko: "두부", roman: "dubu", de: "Tofu" },
    ],
    soundGroups: [["사", "자", "하"], ["바", "마", "아"], ["서", "소", "수"]],
  },
  {
    id: "h4",
    stage: 0,
    title: "Vokale mit j, ä und e",
    summary: "ㅑ ㅕ ㅛ ㅠ ㅐ ㅔ",
    newJamo: ["ㅑ", "ㅕ", "ㅛ", "ㅠ", "ㅐ", "ㅔ"],
    info: [
      {
        title: "Der zweite Strich bedeutet j",
        body: [
          "Ein zusätzlicher kleiner Strich setzt ein j vor den Vokal: ㅏ → ㅑ (a → ja), ㅓ → ㅕ, ㅗ → ㅛ, ㅜ → ㅠ.",
          "Wenn du die Grundvokale kennst, kennst du damit schon vier neue.",
        ],
      },
      {
        title: "ㅐ und ㅔ",
        body: [
          "ㅐ (ae) und ㅔ (e) klingen im heutigen Koreanisch fast gleich, ungefähr wie das e in „Bett“.",
          "Beim Hören musst du sie nicht unterscheiden. Beim Schreiben schon, also merk dir bei jedem Wort, welches dazugehört.",
        ],
      },
    ],
    words: [
      { ko: "우유", roman: "uyu", de: "Milch" },
      { ko: "여자", roman: "yeoja", de: "Frau" },
      { ko: "야구", roman: "yagu", de: "Baseball" },
      { ko: "요리", roman: "yori", de: "Kochen / Gericht" },
      { ko: "여기", roman: "yeogi", de: "hier" },
      { ko: "휴지", roman: "hyuji", de: "Taschentuch / Klopapier" },
      { ko: "개", roman: "gae", de: "Hund" },
      { ko: "노래", roman: "norae", de: "Lied" },
      { ko: "네", roman: "ne", de: "ja" },
      { ko: "가게", roman: "gage", de: "Laden / Geschäft" },
      { ko: "어제", roman: "eoje", de: "gestern" },
      { ko: "메뉴", roman: "menyu", de: "Speisekarte" },
      { ko: "여보세요", roman: "yeoboseyo", de: "Hallo? (am Telefon)" },
    ],
    soundGroups: [["야", "여", "요", "유"], ["아", "야"], ["오", "요"], ["어", "여"]],
  },
  {
    id: "h5",
    stage: 0,
    title: "Behauchte Konsonanten",
    summary: "ㅋ ㅌ ㅍ ㅊ",
    newJamo: ["ㅋ", "ㅌ", "ㅍ", "ㅊ"],
    info: [
      {
        title: "Der Luftstoß-Test",
        body: [
          "Halte deine Hand vor den Mund. Bei ㅋ ㅌ ㅍ ㅊ spürst du einen deutlichen Luftstoß, bei ㄱ ㄷ ㅂ ㅈ kaum einen.",
          "Gute Nachricht: Das deutsche k, t und p hat diesen Luftstoß schon. 카 klingt wie „ka“ in „Kamm“.",
          "Jedes behauchte Zeichen ist das weiche Zeichen mit einem Extrastrich: ㄱ → ㅋ, ㄷ → ㅌ, ㅈ → ㅊ.",
        ],
      },
    ],
    words: [
      { ko: "커피", roman: "keopi", de: "Kaffee" },
      { ko: "코", roman: "ko", de: "Nase" },
      { ko: "차", roman: "cha", de: "Tee / Auto" },
      { ko: "기차", roman: "gicha", de: "Zug" },
      { ko: "치마", roman: "chima", de: "Rock" },
      { ko: "토마토", roman: "tomato", de: "Tomate" },
      { ko: "피자", roman: "pija", de: "Pizza" },
      { ko: "우표", roman: "upyo", de: "Briefmarke" },
      { ko: "고추", roman: "gochu", de: "Chili" },
      { ko: "카메라", roman: "kamera", de: "Kamera" },
      { ko: "아파트", roman: "apateu", de: "Wohnung (im Hochhaus)" },
      { ko: "포도", roman: "podo", de: "Weintrauben" },
      { ko: "치즈", roman: "chijeu", de: "Käse" },
    ],
    soundGroups: [["가", "카"], ["다", "타"], ["바", "파"], ["자", "차"], ["고", "코"], ["두", "투"]],
  },
  {
    id: "h6",
    stage: 0,
    title: "Gespannte Konsonanten",
    summary: "ㄲ ㄸ ㅃ ㅆ ㅉ",
    newJamo: ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"],
    info: [
      {
        title: "Drei Arten von Konsonanten",
        body: [
          "Weich: ㄱ ㄷ ㅂ ㅈ ㅅ. Entspannt, wenig Luft.",
          "Behaucht: ㅋ ㅌ ㅍ ㅊ. Kräftiger Luftstoß.",
          "Gespannt: ㄲ ㄸ ㅃ ㅉ ㅆ. Hals und Zunge anspannen, keine Luft, der Vokal danach beginnt etwas höher.",
          "Tipp für Deutsche: In „Spaß“, „Stein“ und „Skat“ sprichst du p, t und k bereits ohne Luftstoß. Das ist sehr nah am gespannten Laut.",
        ],
      },
    ],
    words: [
      { ko: "아빠", roman: "appa", de: "Papa" },
      { ko: "오빠", roman: "oppa", de: "älterer Bruder (einer Frau)" },
      { ko: "아저씨", roman: "ajeossi", de: "Herr (mittleren Alters) / Onkel" },
      { ko: "토끼", roman: "tokki", de: "Hase" },
      { ko: "꼬리", roman: "kkori", de: "Schwanz" },
      { ko: "또", roman: "tto", de: "wieder / noch einmal" },
      { ko: "이따가", roman: "ittaga", de: "später, nachher" },
      { ko: "싸다", roman: "ssada", de: "billig sein" },
      { ko: "비싸다", roman: "bissada", de: "teuer sein" },
      { ko: "짜다", roman: "jjada", de: "salzig sein" },
      { ko: "찌개", roman: "jjigae", de: "Eintopf" },
      { ko: "가짜", roman: "gajja", de: "Fälschung, unecht" },
      { ko: "어깨", roman: "eokkae", de: "Schulter" },
    ],
    soundGroups: [
      ["가", "카", "까"], ["다", "타", "따"], ["바", "파", "빠"],
      ["자", "차", "짜"], ["사", "싸"], ["기", "키", "끼"],
    ],
  },
  {
    id: "h7",
    stage: 0,
    title: "Batchim: Schlusskonsonanten",
    summary: "Silben mit Konsonant am Ende",
    newJamo: [],
    info: [
      {
        title: "Konsonanten unten im Block",
        body: [
          "Ein Konsonant kann auch unten im Silbenblock stehen: 한 = ㅎ + ㅏ + ㄴ.",
          "Diesen Schlusskonsonanten nennt man 받침 (Batchim, „Stütze“).",
        ],
      },
      {
        title: "Nur sieben Schlusslaute",
        body: [
          "Am Silbenende gibt es nur sieben Laute: k (ㄱ ㅋ ㄲ), n (ㄴ), t (ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ), l (ㄹ), m (ㅁ), p (ㅂ ㅍ) und ng (ㅇ).",
          "k, t und p werden nicht gelöst: Der Mund geht in Position, aber es kommt keine Luft heraus.",
          "Darum enden 옷 (Kleidung) und 꽃 (Blume) beide auf einem stummen t.",
        ],
      },
      {
        title: "Bindung: der Konsonant rutscht weiter",
        body: [
          "Folgt auf einen Batchim eine Silbe mit stummem ㅇ, rutscht der Konsonant in die nächste Silbe hinüber.",
          "한국어 (Koreanisch) spricht man [한구거], 음악 (Musik) spricht man [으막].",
        ],
      },
    ],
    words: [
      { ko: "한국", roman: "hanguk", de: "Korea" },
      { ko: "밥", roman: "bap", de: "Reis / Mahlzeit" },
      { ko: "물", roman: "mul", de: "Wasser" },
      { ko: "김치", roman: "gimchi", de: "Kimchi" },
      { ko: "사랑", roman: "sarang", de: "Liebe" },
      { ko: "서울", roman: "seoul", de: "Seoul" },
      { ko: "이름", roman: "ireum", de: "Name" },
      { ko: "친구", roman: "chingu", de: "Freund / Freundin" },
      { ko: "집", roman: "jip", de: "Haus / Zuhause" },
      { ko: "책", roman: "chaek", de: "Buch" },
      { ko: "옷", roman: "ot", de: "Kleidung", say: "옫" },
      { ko: "꽃", roman: "kkot", de: "Blume", say: "꼳" },
      { ko: "빵", roman: "ppang", de: "Brot" },
      { ko: "선생님", roman: "seonsaengnim", de: "Lehrer / Lehrerin" },
      { ko: "한국어", roman: "hangugeo", de: "Koreanisch (Sprache)", say: "한구거" },
      { ko: "음악", roman: "eumak", de: "Musik", say: "으막" },
      { ko: "학생", roman: "haksaeng", de: "Schüler / Student", say: "학쌩" },
    ],
    soundGroups: [
      ["박", "반", "발", "밤", "밥", "방"],
      ["산", "상", "삼"],
      ["각", "간", "감"],
      ["물", "문", "뭄"],
    ],
  },
  {
    id: "h8",
    stage: 0,
    title: "Zusammengesetzte Vokale",
    summary: "ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ ㅒ ㅖ",
    newJamo: ["ㅘ", "ㅝ", "ㅙ", "ㅚ", "ㅞ", "ㅟ", "ㅢ", "ㅒ", "ㅖ"],
    info: [
      {
        title: "Zwei Vokale werden einer",
        body: [
          "Manche Vokale werden aus zwei Vokalen gebaut: ㅗ + ㅏ = ㅘ (wa), ㅜ + ㅓ = ㅝ (wo).",
          "Auf der Tastatur tippst du einfach beide nacheinander: ㅗ dann ㅏ ergibt ㅘ.",
        ],
      },
      {
        title: "Welche Vokale zusammenpassen",
        body: [
          "ㅗ verbindet sich mit ㅏ, ㅐ und ㅣ. ㅜ verbindet sich mit ㅓ, ㅔ und ㅣ.",
          "ㅚ wird trotz seiner Bauteile wie „we“ gesprochen. ㅙ, ㅚ und ㅞ klingen im Alltag fast gleich.",
        ],
      },
    ],
    words: [
      { ko: "사과", roman: "sagwa", de: "Apfel / Entschuldigung" },
      { ko: "과자", roman: "gwaja", de: "Knabberzeug / Kekse" },
      { ko: "화장실", roman: "hwajangsil", de: "Toilette" },
      { ko: "뭐", roman: "mwo", de: "was?" },
      { ko: "왜", roman: "wae", de: "warum?" },
      { ko: "회사", roman: "hoesa", de: "Firma" },
      { ko: "외국", roman: "oeguk", de: "Ausland" },
      { ko: "귀", roman: "gwi", de: "Ohr" },
      { ko: "위", roman: "wi", de: "oben" },
      { ko: "의사", roman: "uisa", de: "Arzt / Ärztin" },
      { ko: "의자", roman: "uija", de: "Stuhl" },
      { ko: "돼지", roman: "dwaeji", de: "Schwein" },
      { ko: "시계", roman: "sigye", de: "Uhr", say: "시게" },
      { ko: "예", roman: "ye", de: "ja (sehr höflich)" },
      { ko: "원", roman: "won", de: "Won (Währung)" },
    ],
    soundGroups: [["와", "워"], ["위", "의"], ["와", "왜"], ["예", "얘", "에"]],
  },
  {
    id: "h9",
    stage: 0,
    title: "Lesepraxis: Koreanisch im Alltag",
    summary: "Ausdrücke aus Dramen, Cafés und Speisekarten",
    newJamo: [],
    info: [
      {
        title: "Geschrieben ist nicht gleich gesprochen",
        body: [
          "Drei Regeln helfen dir sofort:",
          "Bindung: 맛있어요 (lecker) spricht man [마시써요].",
          "Nasalierung: ㅂ vor ㄴ oder ㅁ wird zu m. 감사합니다 spricht man [감사함니다].",
          "Schwaches ㅎ: Nach ㄴ, ㄹ, ㅁ, ㅇ und zwischen Vokalen verschwindet ㅎ oft: 괜찮아요 spricht man [괜차나요].",
        ],
      },
      {
        title: "Doppelter Batchim",
        body: [
          "Manche Silben haben zwei Schlusskonsonanten, etwa 괜찮아요 (ㄴ + ㅎ) oder 없어요 (ㅂ + ㅅ).",
          "Meist wird nur einer davon gesprochen. Das lernst du nebenbei mit den Wörtern.",
        ],
      },
    ],
    words: [
      { ko: "안녕하세요", roman: "annyeonghaseyo", de: "Hallo / Guten Tag" },
      { ko: "감사합니다", roman: "gamsahamnida", de: "Danke", say: "감사함니다" },
      { ko: "아니요", roman: "aniyo", de: "nein" },
      { ko: "죄송합니다", roman: "joesonghamnida", de: "Entschuldigung", say: "죄송함니다" },
      { ko: "괜찮아요", roman: "gwaenchanayo", de: "Kein Problem / Alles gut", say: "괜차나요" },
      { ko: "사랑해요", roman: "saranghaeyo", de: "Ich liebe dich" },
      { ko: "진짜", roman: "jinjja", de: "Wirklich? / echt" },
      { ko: "대박", roman: "daebak", de: "Wahnsinn! / Mega!" },
      { ko: "맛있어요", roman: "masisseoyo", de: "Es ist lecker", say: "마시써요" },
      { ko: "화이팅", roman: "hwaiting", de: "Du schaffst das! / Viel Erfolg!" },
      { ko: "비빔밥", roman: "bibimbap", de: "Bibimbap (Reis mit Gemüse)" },
      { ko: "불고기", roman: "bulgogi", de: "Bulgogi (mariniertes Rindfleisch)" },
      { ko: "김밥", roman: "gimbap", de: "Gimbap (Reisrolle)" },
      { ko: "떡볶이", roman: "tteokbokki", de: "Tteokbokki (scharfe Reiskuchen)", say: "떡뽀끼" },
      { ko: "맥주", roman: "maekju", de: "Bier", say: "맥쭈" },
      { ko: "잠깐만요", roman: "jamkkanmanyo", de: "Einen Moment bitte" },
      { ko: "아이고", roman: "aigo", de: "Ach je! / Oh Mann!" },
      { ko: "언니", roman: "eonni", de: "ältere Schwester (einer Frau)" },
    ],
  },
];

export interface RoadmapStage {
  stage: number;
  title: string;
  level: string;
  units: string[];
}

/** Planned stages after Hangul, oriented on TOPIK I (levels 1 and 2). */
export const ROADMAP: RoadmapStage[] = [
  {
    stage: 0,
    title: "Hangul",
    level: "Lesen und Schreiben",
    units: LESSONS.filter((l) => l.stage === 0).map((l) => l.title),
  },
  {
    stage: 1,
    title: "Erste Gespräche",
    level: "TOPIK 1, Teil 1",
    units: [
      "Sich vorstellen: 저는 … 이에요/예요",
      "Das ist …: 이것, 그것, 저것",
      "Haben und nicht haben: 있어요 / 없어요",
      "Zahlen I: 일, 이, 삼 … (Preise, Telefonnummern)",
      "Zahlen II: 하나, 둘, 셋 … (Alter, Anzahl)",
      "Im Café bestellen: … 주세요",
      "Die höfliche Verbform -아요/-어요",
      "Objekte und Orte: 을/를, 에, 에서",
    ],
  },
  {
    stage: 2,
    title: "Alltag erzählen",
    level: "TOPIK 1, Teil 2",
    units: [
      "Uhrzeit und Wochentage",
      "Vergangenheit: -았어요/-었어요",
      "Verneinung: 안 und 못",
      "Wünsche: -고 싶어요",
      "Unterwegs: Wegbeschreibung, U-Bahn, Taxi",
      "Einkaufen und Handeln",
      "Pläne: -(으)ㄹ 거예요",
      "Gründe: -아서/-어서, 그래서",
    ],
  },
  {
    stage: 3,
    title: "Freier sprechen",
    level: "TOPIK 2",
    units: [
      "Höflichkeitsstufen: 반말 und 존댓말",
      "Verbinden: -고, -지만, -는데",
      "Können: -(으)ㄹ 수 있어요",
      "Vorschläge: -(으)ㄹ까요?, -아요/어요 (lass uns)",
      "Beschreiben: Adjektive vor Nomen (-(으)ㄴ)",
      "Gefühle und Meinungen",
      "Dramen-Koreanisch: typische Sätze verstehen",
      "Freies Gespräch mit dem KI-Tutor",
    ],
  },
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
