const entries: string[] = []

export function siteLog(message: string) {
  const timestamp = new Date().toISOString()
  const line = `${timestamp} - ${message}`
  entries.push(line)
  // keep last 200 lines
  if (entries.length > 200) entries.splice(0, entries.length - 200)
  // mirror to console for developer visibility
  // eslint-disable-next-line no-console
  console.log(line)
}

export function getSiteLog(): string[] {
  return entries.slice()
}

export function clearSiteLog(){
  entries.length = 0
}

export default {
  siteLog,
  getSiteLog,
  clearSiteLog
}
