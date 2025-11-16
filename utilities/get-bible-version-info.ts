import bibleVersions from '@/assets/data/bible-versions.json';

// Types
interface BibleVersions {
  [key: string]: { fullname: string; shortname: string; supported: boolean };
}

interface BibleVersion {
  key: string;
  fullname: string;
  shortname: string;
}

const versions = bibleVersions as BibleVersions;

// ---------------------------------------------
// Precompute all lists ONCE when the file loads
// ---------------------------------------------

// Full objects of supported versions (key, fullname, shortname)
const SUPPORTED_BIBLE_VERSIONS: BibleVersion[] = Object.entries(versions)
  .filter(([_, v]) => v.supported)
  .map(([key, v]) => ({
    key,
    fullname: v.fullname,
    shortname: v.shortname,
  }));

// Supported keys only
const SUPPORTED_KEYS: string[] = SUPPORTED_BIBLE_VERSIONS.map((v) => v.key);

// Supported full names
const SUPPORTED_FULLNAMES: string[] = SUPPORTED_BIBLE_VERSIONS.map((v) => v.fullname);

// Supported short names
const SUPPORTED_SHORTNAMES: string[] = SUPPORTED_BIBLE_VERSIONS.map((v) => v.shortname);

// Fast lookup map (key → fullname)
const FULLNAME_LOOKUP: Record<string, string> = Object.fromEntries(
  Object.entries(versions).map(([key, v]) => [key, v.fullname]),
);

// ---------------------------
// Existing function signatures
// ---------------------------

export const getSupportedBibleVersions = (): BibleVersion[] => {
  return SUPPORTED_BIBLE_VERSIONS;
};

export const getBibleVersionDisplayName = (key: string): string => {
  return FULLNAME_LOOKUP[key] || '';
};

export const getKeyListOfSupportedBibleVersions = (): string[] => {
  return SUPPORTED_KEYS;
};

export const getSupportedBibleVersionFullnames = (): string[] => {
  return SUPPORTED_FULLNAMES;
};

export const getSupportedBibleVersionShortNames = (): string[] => {
  return SUPPORTED_SHORTNAMES;
};
