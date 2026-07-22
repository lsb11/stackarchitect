/**
 * Safely stringifies a JSON object for inclusion in a <script> tag.
 * Replaces HTML control characters with their unicode equivalents to prevent XSS.
 * This is especially useful for JSON-LD structured data.
 * @param obj The object to stringify
 * @param replacer A function that alters the behavior of the stringification process
 * @param space A String or Number object that's used to insert white space into the output JSON string for readability purposes
 * @returns The safely stringified JSON string
 */
export function safeJsonStringify(obj: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string {
  const jsonString = JSON.stringify(obj, replacer, space);
  return jsonString?
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026') ?? '';
}
