export const SOURCES = [
  "The MET Museum",
  "NYPL",
  "Smithsonian",
  "Rijksmuseum",
  "Europeana",
  "Library of Congress",
  "Wellcome Collection",
];

export const pickSource = (seed: number) => SOURCES[seed % SOURCES.length];
