const rankAbbreviations: Record<string, string> = {
  CEL: "Cel",
  TEN_CEL: "Ten Cel",
  MAJ: "Maj",
  CAP: "Cap",
  TEN_1: "1º Ten",
  TEN_2: "2º Ten",
  STEN: "Sub Ten",
  SGT_1: "1º Sgt",
  SGT_2: "2º Sgt",
  SGT_3: "3º Sgt",
  CB: "Cb",
  SD_EP: "Sd EP",
  SD_EV: "Sd EV",
};

export const getRankAbbreviation = (rankValue: string) => {
  return rankAbbreviations[rankValue] || rankValue;
};
