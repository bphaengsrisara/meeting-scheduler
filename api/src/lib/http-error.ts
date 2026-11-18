// Messages for each field, as the web forms show them under their fields.
export type FieldErrors = Record<string, string[]>;

// An error that the error handler sends as it is, with its status.
export class HttpError extends Error {
  readonly status: number;
  readonly fields?: FieldErrors;

  constructor(status: number, message: string, fields?: FieldErrors) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
