import { z } from "zod";

export const addressSchema = z.object({
  street: z.string().min(1),
  suburb: z.string().min(1),
  state: z.string().min(1),
  postcode: z.string().min(1),
  country: z.string().min(1),
});

export type Address = z.infer<typeof addressSchema>;
