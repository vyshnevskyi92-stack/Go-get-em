export function shouldUseMock(request: Request): boolean {
  const url = new URL(request.url);
  if (url.searchParams.get("mock") !== "true") return false;
  const host = (request.headers.get("host") || "").toLowerCase();
  const hostname = host.split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}
