declare module 'parse-address' {
  interface ParsedAddress {
    number?: string
    prefix?: string
    street?: string
    type?: string
    suffix?: string
    city?: string
    state?: string
    zip?: string
  }
  export function parseLocation(address: string): ParsedAddress | null
}