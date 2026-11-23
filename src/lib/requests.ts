import { z } from "zod";
import { sampleResources } from "./catalogue";

export const requestInput = z.object({
  projectTitle: z.string().trim().min(3).max(100),
  resourceId: z
    .string()
    .refine((id) => sampleResources.some((item) => item.id === id)),
  hoursNeeded: z.coerce.number().int().min(1).max(40),
});
export const requestRow = z.object({
  id: z.string(),
  projectTitle: z.string(),
  resourceName: z.string(),
  hoursNeeded: z.number(),
  status: z.enum(["draft", "submitted", "approved", "rejected"]),
});
export type RequestRow = z.infer<typeof requestRow>;
export const sampleRequests: RequestRow[] = [
  {
    id: "scope-crunch",
    projectTitle: "Thursday scope crunch",
    resourceName: "Mixed-signal oscilloscope",
    hoursNeeded: 2,
    status: "submitted",
  },
  {
    id: "prototype-review",
    projectTitle: "Sensor enclosure fit check",
    resourceName: "FDM 3D printer",
    hoursNeeded: 3,
    status: "submitted",
  },
];
