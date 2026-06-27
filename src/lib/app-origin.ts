import "server-only";

export function resolveTrustedAppOrigin(appBaseUrl: string | undefined) {
  const normalizedAppBaseUrl = appBaseUrl?.trim();

  if (!normalizedAppBaseUrl) {
    return null;
  }

  try {
    const url = new URL(normalizedAppBaseUrl);
    const isSupportedProtocol =
      url.protocol === "http:" || url.protocol === "https:";
    const hasNoCredentials = !url.username && !url.password;
    const hasRootPathOnly = url.pathname === "/";
    const hasNoSearchOrHash = !url.search && !url.hash;

    if (
      !isSupportedProtocol ||
      !hasNoCredentials ||
      !hasRootPathOnly ||
      !hasNoSearchOrHash
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function getTrustedAppOrigin() {
  return resolveTrustedAppOrigin(process.env.APP_BASE_URL);
}
