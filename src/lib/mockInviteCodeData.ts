// Mock invite-code data for Network → Invite Codes tab

export interface InviteCode {
  id: string;
  code: string;
  groupCount: number;
  creator: string;
  dateCreated: Date;
}

const CODES = [
  "SPORTGEEKSTELL2",
  "SPORTGEEKS1234123",
  "SPORTGEEKSSPORTGEEKSTELL4",
  "SPORTGEEKSSPORTGEEKSUJMI",
  "SPORTGEEKSTELL",
  "SPORTGEEKSJAZZY",
  "SPORTGEEKSTESTCODE4",
  "SPORTGEEKSAJGROUP",
  "SPORTGEEKS9432",
  "SPORTGEEKS15R1434R5143",
  "SPORTGEEKS10876",
  "SPORTGEEKSDEMO",
  "SPORTGEEKSALPHA",
  "SPORTGEEKSBETA",
  "SPORTGEEKSGAMMA",
  "VIPACCESS",
  "EARLYBIRD",
  "TEAMNHL",
  "INFLUENCERPROG",
  "BRANDPARTNER25",
];

const CREATORS = [
  "Tell Vickers (Admin)",
  "cristi admin",
  "Amber Johnson (Admin)",
  "Andrew Toltzis",
  "Maria Chen (Admin)",
  "Sam Calmes (GF Admin)",
];

function pickCreator(i: number): string {
  return CREATORS[i % CREATORS.length];
}

export const mockInviteCodes: InviteCode[] = CODES.map((code, i) => ({
  id: `ic${i}`,
  code,
  groupCount: i % 4 === 0 ? (i % 3) + 1 : 0,
  creator: pickCreator(i),
  dateCreated: new Date(2026 - Math.floor(i / 6), (i * 2) % 12, ((i * 5) % 28) + 1),
}));

export function getUniqueInviteCodeCreators(): string[] {
  return Array.from(new Set(mockInviteCodes.map(c => c.creator)));
}
