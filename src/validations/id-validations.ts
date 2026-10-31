import { z } from "zod";

/** Every record id is a UUID (v7) since the API switched from numbers (docs/setup-module.md §16). */
export const uuidSchema = z.uuid();

/** A form field that may hold no id yet: "" = none / create. */
export const optionalUuidSchema = z.union([z.literal(""), z.uuid()]);

/** A required id picked in a form; `message` is the i18n key shown when it is missing. */
export const requiredUuidSchema = (message: string) => z.uuid(message);
