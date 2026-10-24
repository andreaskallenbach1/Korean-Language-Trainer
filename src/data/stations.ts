// The learning path as Seoul metro lines: every lesson is a station with a
// short culture note that unlocks when the station is reached.

export interface Station {
  ko: string;
  roman: string;
  fact: string;
}

/** Line colours follow the real Seoul Metro lines 1–4. */
export const LINES: Record<number, { name: string; color: string }> = {
  0: { name: "Linie 1", color: "#0052A4" },
  1: { name: "Linie 2", color: "#00A84D" },
  2: { name: "Linie 3", color: "#EF7C1C" },
  3: { name: "Linie 4", color: "#00A5DE" },
};

export const STATIONS: Record<string, Station> = {
  h1: {
    ko: "서울역",
    roman: "Seoul Station",
    fact: "Seouls Hauptbahnhof. Von hier fährt der Schnellzug KTX in rund zweieinhalb Stunden nach Busan.",
  },
  h2: {
    ko: "시청",
    roman: "Rathaus",
    fact: "Vor dem Rathaus liegt der Seoul Plaza. Im Winter wird dort eine Eislaufbahn aufgebaut.",
  },
  h3: {
    ko: "광화문",
    roman: "Gwanghwamun",
    fact: "Auf dem Gwanghwamun-Platz sitzt die Statue von König Sejong, dem Erfinder des Hangul.",
  },
  h4: {
    ko: "경복궁",
    roman: "Gyeongbokgung",
    fact: "Der größte der fünf Königspaläste Seouls, erbaut 1395. Wer einen Hanbok trägt, kommt kostenlos hinein.",
  },
  h5: {
    ko: "북촌",
    roman: "Bukchon",
    fact: "Hunderte traditionelle Hanok-Häuser zwischen zwei Palästen. Hier wohnen Menschen, deshalb bitten Schilder um Ruhe.",
  },
  h6: {
    ko: "종로",
    roman: "Jongno",
    fact: "Eine der ältesten Straßen Seouls. Die Glocke im Pavillon Bosingak wird in der Silvesternacht 33-mal geschlagen.",
  },
  h7: {
    ko: "동대문",
    roman: "Dongdaemun",
    fact: "Das „Große Osttor“ gibt einem Modeviertel seinen Namen, dessen Märkte bis tief in die Nacht geöffnet haben.",
  },
  h8: {
    ko: "명동",
    roman: "Myeongdong",
    fact: "Einkaufsstraße voller Kosmetikläden. Abends reihen sich hier die Streetfood-Stände aneinander.",
  },
  h9: {
    ko: "남산",
    roman: "Namsan",
    fact: "Auf dem Berg Namsan steht der N Seoul Tower. Am Zaun hängen tausende Liebesschlösser von Paaren.",
  },
  s1: {
    ko: "이태원",
    roman: "Itaewon",
    fact: "Das internationalste Viertel Seouls, mit Restaurants und Bars aus aller Welt.",
  },
  s2: {
    ko: "인사동",
    roman: "Insadong",
    fact: "Gassen voller Teehäuser, Galerien und Läden für traditionelles Kunsthandwerk.",
  },
  s3: {
    ko: "연남동",
    roman: "Yeonnam-dong",
    fact: "Café-Viertel entlang des Gyeongui-Line-Parks, einer begrünten ehemaligen Bahntrasse.",
  },
  s4: {
    ko: "광장시장",
    roman: "Gwangjang-Markt",
    fact: "Einer der ältesten Märkte Koreas, gegründet 1905. Berühmt für Bindaetteok, knusprige Mungobohnen-Pfannkuchen.",
  },
  s5: {
    ko: "신촌",
    roman: "Sinchon",
    fact: "Studentenviertel rund um die Yonsei-Universität, voller günstiger Restaurants.",
  },
  s6: {
    ko: "성수",
    roman: "Seongsu",
    fact: "Ein ehemaliges Fabrikviertel. Heute sitzen Cafés und Pop-up-Läden in alten Lagerhallen.",
  },
  s7: {
    ko: "한강공원",
    roman: "Han-Fluss-Park",
    fact: "An warmen Abenden picknickt halb Seoul am Han-Fluss und lässt sich Brathähnchen direkt auf die Decke liefern.",
  },
  s8: {
    ko: "홍대입구",
    roman: "Hongik University",
    fact: "Das Viertel der Straßenmusiker, Clubs und Indie-Läden rund um die Kunsthochschule Hongik.",
  },
};
