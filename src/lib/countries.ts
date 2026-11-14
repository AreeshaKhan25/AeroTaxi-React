export interface Country {
  name: string;
  /** Dialling code without the leading plus. */
  code: string;
  flag: string;
  /** ISO-3166 alpha-2, used as a stable key (dial codes are not unique). */
  iso: string;
}

export const COUNTRIES: readonly Country[] = [
  { name: 'United Kingdom', code: '44', flag: '🇬🇧', iso: 'GB' },
  { name: 'United States', code: '1', flag: '🇺🇸', iso: 'US' },
  { name: 'Ireland', code: '353', flag: '🇮🇪', iso: 'IE' },
  { name: 'France', code: '33', flag: '🇫🇷', iso: 'FR' },
  { name: 'Germany', code: '49', flag: '🇩🇪', iso: 'DE' },
  { name: 'Spain', code: '34', flag: '🇪🇸', iso: 'ES' },
  { name: 'Italy', code: '39', flag: '🇮🇹', iso: 'IT' },
  { name: 'Netherlands', code: '31', flag: '🇳🇱', iso: 'NL' },
  { name: 'Belgium', code: '32', flag: '🇧🇪', iso: 'BE' },
  { name: 'Portugal', code: '351', flag: '🇵🇹', iso: 'PT' },
  { name: 'Switzerland', code: '41', flag: '🇨🇭', iso: 'CH' },
  { name: 'Austria', code: '43', flag: '🇦🇹', iso: 'AT' },
  { name: 'Sweden', code: '46', flag: '🇸🇪', iso: 'SE' },
  { name: 'Norway', code: '47', flag: '🇳🇴', iso: 'NO' },
  { name: 'Denmark', code: '45', flag: '🇩🇰', iso: 'DK' },
  { name: 'Finland', code: '358', flag: '🇫🇮', iso: 'FI' },
  { name: 'Poland', code: '48', flag: '🇵🇱', iso: 'PL' },
  { name: 'Czech Republic', code: '420', flag: '🇨🇿', iso: 'CZ' },
  { name: 'Greece', code: '30', flag: '🇬🇷', iso: 'GR' },
  { name: 'Turkey', code: '90', flag: '🇹🇷', iso: 'TR' },
  { name: 'Romania', code: '40', flag: '🇷🇴', iso: 'RO' },
  { name: 'Hungary', code: '36', flag: '🇭🇺', iso: 'HU' },
  { name: 'Croatia', code: '385', flag: '🇭🇷', iso: 'HR' },
  { name: 'India', code: '91', flag: '🇮🇳', iso: 'IN' },
  { name: 'Pakistan', code: '92', flag: '🇵🇰', iso: 'PK' },
  { name: 'Bangladesh', code: '880', flag: '🇧🇩', iso: 'BD' },
  { name: 'China', code: '86', flag: '🇨🇳', iso: 'CN' },
  { name: 'Japan', code: '81', flag: '🇯🇵', iso: 'JP' },
  { name: 'South Korea', code: '82', flag: '🇰🇷', iso: 'KR' },
  { name: 'Australia', code: '61', flag: '🇦🇺', iso: 'AU' },
  { name: 'New Zealand', code: '64', flag: '🇳🇿', iso: 'NZ' },
  { name: 'Canada', code: '1', flag: '🇨🇦', iso: 'CA' },
  { name: 'Brazil', code: '55', flag: '🇧🇷', iso: 'BR' },
  { name: 'Mexico', code: '52', flag: '🇲🇽', iso: 'MX' },
  { name: 'South Africa', code: '27', flag: '🇿🇦', iso: 'ZA' },
  { name: 'Nigeria', code: '234', flag: '🇳🇬', iso: 'NG' },
  { name: 'Kenya', code: '254', flag: '🇰🇪', iso: 'KE' },
  { name: 'Egypt', code: '20', flag: '🇪🇬', iso: 'EG' },
  { name: 'United Arab Emirates', code: '971', flag: '🇦🇪', iso: 'AE' },
  { name: 'Saudi Arabia', code: '966', flag: '🇸🇦', iso: 'SA' },
  { name: 'Qatar', code: '974', flag: '🇶🇦', iso: 'QA' },
  { name: 'Kuwait', code: '965', flag: '🇰🇼', iso: 'KW' },
  { name: 'Singapore', code: '65', flag: '🇸🇬', iso: 'SG' },
  { name: 'Malaysia', code: '60', flag: '🇲🇾', iso: 'MY' },
  { name: 'Thailand', code: '66', flag: '🇹🇭', iso: 'TH' },
  { name: 'Philippines', code: '63', flag: '🇵🇭', iso: 'PH' },
  { name: 'Russia', code: '7', flag: '🇷🇺', iso: 'RU' },
  { name: 'Ukraine', code: '380', flag: '🇺🇦', iso: 'UA' },
  { name: 'Israel', code: '972', flag: '🇮🇱', iso: 'IL' },
  { name: 'Argentina', code: '54', flag: '🇦🇷', iso: 'AR' },
] as const;

export const DEFAULT_COUNTRY: Country =
  COUNTRIES.find((country) => country.iso === 'GB') ?? COUNTRIES[0];

export const findCountryByDialCode = (dialCode: string | null | undefined): Country => {
  if (!dialCode) return DEFAULT_COUNTRY;
  const normalised = dialCode.replace(/^\+/, '');
  return COUNTRIES.find((country) => country.code === normalised) ?? DEFAULT_COUNTRY;
};

export const filterCountries = (query: string): readonly Country[] => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return COUNTRIES;
  const bare = trimmed.replace(/^\+/, '');
  return COUNTRIES.filter(
    (country) => country.name.toLowerCase().includes(trimmed) || country.code.includes(bare),
  );
};
