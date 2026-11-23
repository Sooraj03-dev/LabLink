import { z } from "zod";
import { departments, sampleResources, type Resource } from "./catalogue";
import { inventory } from "./inventory";

export const assistantMode = z.enum(["search", "plan", "compare"]);
export type AssistantMode = z.infer<typeof assistantMode>;
export const assistantInput = z
  .object({
    mode: assistantMode,
    description: z.string().trim().max(1200),
    deadline: z.iso.date().optional(),
    resourceId: z.string().max(80).optional(),
  })
  .superRefine((input, ctx) => {
    if (input.mode !== "compare" && input.description.length < 4)
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message:
          "Describe the equipment or project in at least four characters.",
      });
    if (
      input.mode === "compare" &&
      !sampleResources.some((item) => item.id === input.resourceId)
    )
      ctx.addIssue({
        code: "custom",
        path: ["resourceId"],
        message: "Choose a catalogue item to compare.",
      });
  });
export type AssistantInput = z.infer<typeof assistantInput>;

export const selection = z.object({
  type: z.enum(["any", "equipment", "workstation", "devKit"]),
  department: z.enum(["any", ...departments]),
  availableOnly: z.boolean(),
  matches: z
    .array(
      z.object({
        id: z.string().max(80),
        specIndex: z.number().int().min(0).max(20),
        hours: z.number().int().min(1).max(40),
      }),
    )
    .max(8),
});
export type Selection = z.infer<typeof selection>;

export function candidatesFor(input: AssistantInput) {
  if (input.mode !== "compare") return sampleResources;
  const source = sampleResources.find((item) => item.id === input.resourceId);
  return source
    ? sampleResources.filter(
        (item) =>
          item.type === source.type &&
          item.department !== source.department &&
          inventory(item.id).free > 0,
      )
    : [];
}

const stopWords = new Set(
  "a an and as at be by can do for from have how i in is it me my need of on or our please project that the to use want we with would".split(
    " ",
  ),
);
const words = (text: string) =>
  text
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu)
    ?.filter((word) => !stopWords.has(word)) ?? [];
export function catalogueSelection(
  input: AssistantInput,
  candidates: readonly Resource[],
): Selection {
  const terms = [...new Set(words(input.description))];
  const availableOnly = /\b(available|free)\b/i.test(input.description);
  const ranked = candidates
    .map((item) => {
      const specs = item.specs.map((spec) =>
        words(spec.label + " " + spec.value),
      );
      const name = words(item.name);
      const body = words(
        [item.description, item.department, ...item.tags].join(" "),
      );
      const scores = specs.map(
        (spec) => terms.filter((term) => spec.includes(term)).length,
      );
      const best = Math.max(0, ...scores);
      const score =
        terms.reduce(
          (total, term) =>
            total +
            (name.includes(term) ? 4 : 0) +
            (body.includes(term) ? 1 : 0),
          0,
        ) +
        best * 3;
      return {
        id: item.id,
        specIndex: Math.max(0, scores.indexOf(best)),
        hours: 1,
        score,
      };
    })
    .filter(
      (item) =>
        (input.mode === "compare" || item.score > 0) &&
        (!availableOnly || inventory(item.id).free > 0),
    );
  return {
    type: "any",
    department: "any",
    availableOnly,
    matches: ranked.sort((a, b) => b.score - a.score).slice(0, 4),
  };
}

export function groundSelection(
  input: AssistantInput,
  result: Selection,
  candidates: readonly Resource[],
) {
  const seen = new Set<string>();
  return result.matches
    .flatMap((match) => {
      const item = candidates.find((candidate) => candidate.id === match.id);
      const spec = item?.specs[match.specIndex];
      if (!item || !spec || seen.has(item.id)) return [];
      const free = inventory(item.id).free;
      if (
        (result.availableOnly && free === 0) ||
        (result.type !== "any" && item.type !== result.type) ||
        (result.department !== "any" && item.department !== result.department)
      )
        return [];
      seen.add(item.id);
      return [
        {
          id: item.id,
          name: item.name,
          lab: item.lab,
          department: item.department,
          free,
          spec,
          hours: input.mode === "plan" ? match.hours : null,
        },
      ];
    })
    .slice(0, 4);
}
export interface AssistantResult {
  source: "gemini" | "preview" | "catalogue";
  notice: string;
  matches: ReturnType<typeof groundSelection>;
}
