import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { CHECK_FIELDS_MESSAGE, HttpError } from "../lib/http-error.ts";

type Schemas = {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
};

// Checks the request with Zod and answers 400 with each field's messages.
// The parsed values go to res.locals, since Express 5's req.query is read-only.
export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const part of ["params", "query", "body"] as const) {
      const schema = schemas[part];
      if (!schema) {
        continue;
      }
      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        throw toHttpError(part, result.error);
      }
      res.locals[part] = result.data;
    }
    next();
  };
}

function toHttpError(part: keyof Schemas, error: z.ZodError) {
  // A malformed id finds nothing, the same as an id that does not exist.
  if (part === "params") {
    return new HttpError(404, "Not found");
  }
  const { formErrors, fieldErrors } = z.flattenError(error);
  return new HttpError(
    400,
    formErrors[0] ?? CHECK_FIELDS_MESSAGE,
    fieldErrors as Record<string, string[]>,
  );
}
