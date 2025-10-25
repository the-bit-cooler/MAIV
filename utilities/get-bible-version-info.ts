import bibleVersions from '@/assets/data/bible-versions.json';

// Create a type for the bible versions
interface BibleVersions {
  [key: string]: { fullname: string; shortname: string; supported: boolean };
}

interface BibleVersion {
  key: string;
  fullname: string;
  shortname: string;
}

export const getSupportedBibleVersions = (): BibleVersion[] => {
  const versions = bibleVersions as BibleVersions;

  return Object.entries(versions)
    .filter(([_, value]) => value.supported)
    .map(([key, value]) => ({
      key,
      fullname: value.fullname,
      shortname: value.shortname,
    }));
};

export const getBibleVersionDisplayName = (key: string): string => {
  return (bibleVersions as BibleVersions)[key].fullname || '';
};

export const getSupportedBibleVersionsShortNames = (): string[] => {
  const versions = bibleVersions as BibleVersions;
  return Object.keys(versions).filter((key) => versions[key].supported);
};

export const getSupportedBibleVersionFullnames = (): string[] => {
  const versions = bibleVersions as BibleVersions;
  return Object.values(versions)
    .filter((v) => v.supported)
    .map((v) => v.fullname);
};

export const getSupportedBibleVersionShortNames = (): string[] => {
  const versions = bibleVersions as BibleVersions;
  return Object.values(versions)
    .filter((v) => v.supported)
    .map((v) => v.shortname);
};
