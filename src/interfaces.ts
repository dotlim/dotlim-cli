// terminal option
export interface Option {
  flags: string;
  required: boolean;
  optional: boolean;
  variadic: boolean;
  mandatory: boolean;
  short: string;
  long: string;
  negate: boolean;
  description: string;
  defaultValue: number | string | boolean;
}

// terminal stdout
export interface Cmd {
  options: Option[];
  [key: string]: any;
}

// parsed terminal stdout
export interface ParsedParams {
  [key: string]: boolean | number | string;
}
