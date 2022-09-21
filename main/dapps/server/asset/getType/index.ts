const types = {
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  ttf: 'application/font-sfnt',
  svg: 'image/svg+xml',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  png: 'image/png',
}

module.exports = (path: any) =>
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  types[path.substr(path.lastIndexOf('.') + 1)] || 'text/plain'
