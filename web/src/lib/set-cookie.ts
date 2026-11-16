export type CookieOptions = {
  path?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
};

export type ParsedCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

// Reads one Set-Cookie header from the API, so the web server can set the same
// cookie on its own response. Domain is left out: the cookie belongs to the
// web app's host, not the API's.
export function parseSetCookie(header: string): ParsedCookie | null {
  const [pair = "", ...attributes] = header.split(";");
  const separator = pair.indexOf("=");
  if (separator < 1) {
    return null;
  }
  const name = pair.slice(0, separator).trim();
  const value = decodeURIComponent(pair.slice(separator + 1).trim());
  const options: CookieOptions = {};

  for (const attribute of attributes) {
    const [key = "", ...rest] = attribute.trim().split("=");
    const attributeValue = rest.join("=");
    switch (key.toLowerCase()) {
      case "path":
        options.path = attributeValue;
        break;
      case "max-age":
        options.maxAge = Number(attributeValue);
        break;
      case "expires":
        options.expires = new Date(attributeValue);
        break;
      case "httponly":
        options.httpOnly = true;
        break;
      case "secure":
        options.secure = true;
        break;
      case "samesite": {
        const sameSite = attributeValue.toLowerCase();
        if (
          sameSite === "lax" ||
          sameSite === "strict" ||
          sameSite === "none"
        ) {
          options.sameSite = sameSite;
        }
        break;
      }
    }
  }

  return { name, value, options };
}
