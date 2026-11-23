import { describe, expect, it } from "vitest";
import {
  assistantInput,
  candidatesFor,
  catalogueSelection,
  groundSelection,
  selection,
  type AssistantInput,
} from "../../src/lib/assistant";
import { sampleResources } from "../../src/lib/catalogue";
const input: AssistantInput = {
  mode: "plan",
  description: "Wireless BLE board for a sensor",
};
describe("equipment assistant", () => {
  it("finds a relevant catalogue item with an exact recorded specification", () => {
    const result = groundSelection(
      input,
      catalogueSelection(input, sampleResources),
      sampleResources,
    );
    expect(result[0]).toMatchObject({
      id: "esp32-prototyping-kit",
      spec: { label: "Wireless", value: "Wi-Fi · BLE" },
    });
  });
  it("drops unknown IDs, duplicate IDs and out-of-range evidence", () => {
    const id = "esp32-prototyping-kit";
    const matches = [
      { id: "made-up", specIndex: 0, hours: 2 },
      { id, specIndex: 99, hours: 3 },
      { id, specIndex: 0, hours: 2 },
      { id, specIndex: 0, hours: 5 },
    ];
    const result = groundSelection(
      input,
      { type: "any", department: "any", availableOnly: false, matches },
      sampleResources,
    );
    expect(result.map((row) => [row.id, row.hours])).toEqual([[id, 2]]);
  });
  it("limits comparisons to available same-type candidates in other departments", () => {
    const compare: AssistantInput = {
      mode: "compare",
      description: "",
      resourceId: "gpu-workstation",
    };
    expect(candidatesFor(compare).map((row) => row.id)).toEqual([
      "cad-workstation",
    ]);
    expect(candidatesFor({ ...compare, resourceId: "not-found" })).toEqual([]);
  });
  it("honours structured filters and rejects malformed requests and provider output", () => {
    const result = catalogueSelection(input, sampleResources);
    expect(
      groundSelection(
        input,
        { ...result, department: "Applied Physics" },
        sampleResources,
      ),
    ).toEqual([]);
    expect(
      assistantInput.safeParse({ ...input, deadline: "2026-02-30" }).success,
    ).toBe(false);
    expect(
      assistantInput.safeParse({ ...input, description: "z".repeat(1201) })
        .success,
    ).toBe(false);
    expect(
      selection.safeParse({
        ...result,
        matches: [{ id: "abc", hours: -1, specIndex: 0 }],
      }).success,
    ).toBe(false);
  });
});
