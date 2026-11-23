import { describe, expect, it } from "vitest";
import {
  filterResources,
  parseCatalogueFilters,
  sampleResources,
} from "../../src/lib/catalogue";

describe("catalogue filters", () => {
  it("combines keyword, category and approval filters", () => {
    const filters = parseCatalogueFilters({
      q: "  WI-FI ble ",
      type: "devKit",
      approval: "standard",
    });

    expect(
      filterResources(sampleResources, filters).map(({ id }) => id),
    ).toEqual(["esp32-prototyping-kit"]);
  });

  it("uses the first URL value and discards unknown filters", () => {
    const filters = parseCatalogueFilters({
      q: ["orbit", "printer"],
      type: "constructor",
      department: "Astronomy",
      approval: "prototype",
    });

    expect(filters).toEqual({
      query: "orbit",
      type: "",
      department: "",
      approval: "",
    });
    expect(filterResources(sampleResources, filters)).toEqual([]);
  });

  it("includes resources from the selected department only", () => {
    const filters = parseCatalogueFilters({ department: "Applied Physics" });

    expect(
      filterResources(sampleResources, filters).map(({ id }) => id),
    ).toEqual(["optical-spectrometer"]);
    expect(filterResources(sampleResources, parseCatalogueFilters({}))).toEqual(
      sampleResources,
    );
  });
});
