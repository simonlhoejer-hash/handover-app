export type HandoverNameIssue = 'author' | 'receiver'

const VAGUE_OR_PLACEHOLDER_TEXT = [
  /\ben eller anden\b/i,
  /\b(ved|aner) (det )?ikke\b/i,
  /\b(ukendt|nogen|whatever|dude|test|asdf|xxx|lol|idk)\b/i,
  /\b(someone|somebody|don'?t know|unknown)\b/i,
  /\b(någon|vet inte|okänd)\b/i,
]

const NON_NAME_WORDS = new Set([
  'afløser', 'anden', 'chef', 'dude', 'eller', 'en', 'et', 'fyr', 'ingen',
  'kok', 'kokken', 'mand', 'nogen', 'person', 'team', 'teamet', 'tilfældig',
  'ukendt', 'vagt', 'vagten', 'whatever',
  'guy', 'someone', 'somebody', 'unknown',
  'någon', 'okänd',
])

const NAME_CONNECTORS = new Set(['og', 'and', 'och'])

const BLOCKED_NAME_VALUES = new Set([
  'algis benjamin og andre',
  'facket',
  'johnniii',
  'pia og en eller anden dude',
  'pineapple',
  'tobe one kenobe',
  'tonga for morgen mad',
])

function normalizedPlainText(value: string) {
  return value
    .replace(/<br\s*\/?>|<\/p>|<\/li>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isUnprofessionalName(value: string) {
  const normalized = normalizedPlainText(value)
  const normalizedLowerCase = normalized.toLocaleLowerCase('da-DK')
  const letters = normalized.match(/\p{L}/gu)?.length ?? 0
  const words = normalizedLowerCase
    .split(/\s+|&/)
    .map((word) => word.replace(/^[.'’-]+|[.'’-]+$/g, ''))
    .filter(Boolean)

  return (
    letters < 2 ||
    normalized.length > 80 ||
    BLOCKED_NAME_VALUES.has(normalizedLowerCase) ||
    /\d/.test(normalized) ||
    /[^\p{L}\p{M}\s.'’&-]/u.test(normalized) ||
    words.some((word) => !NAME_CONNECTORS.has(word) && NON_NAME_WORDS.has(word)) ||
    VAGUE_OR_PLACEHOLDER_TEXT.some((pattern) => pattern.test(normalized))
  )
}

export function getHandoverNameIssue(input: {
  authorName: string
  receiverName: string
}): HandoverNameIssue | null {
  if (isUnprofessionalName(input.authorName)) return 'author'
  if (isUnprofessionalName(input.receiverName)) return 'receiver'
  return null
}
