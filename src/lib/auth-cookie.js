export function isSecureRequest(request) {
  const forwardedProto = request.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    .trim()
    .toLowerCase();
  const origin = request.headers.get('origin')?.toLowerCase();
  const requestProtocol = new URL(request.url).protocol;

  return (
    forwardedProto === 'https' ||
    origin?.startsWith('https://') === true ||
    requestProtocol === 'https:'
  );
}
