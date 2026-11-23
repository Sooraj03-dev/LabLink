export const resourceTypes = {
  equipment: "Equipment",
  devKit: "Development kit",
  workstation: "Workstation",
} as const;

export type ResourceType = keyof typeof resourceTypes;
export type ApprovalPolicy = "standard" | "faculty";

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  department: string;
  lab: string;
  location: string;
  description: string;
  specs: readonly { label: string; value: string }[];
  tags: readonly string[];
  approval: ApprovalPolicy;
}

export const sampleResources: readonly Resource[] = [
  {
    id: "mixed-signal-oscilloscope",
    name: "Mixed-signal oscilloscope",
    type: "equipment",
    department: "Electronics",
    lab: "Circuits & Instrumentation Lab",
    location: "Engineering Block B · Room 204",
    description:
      "Capture analogue and digital signals together when debugging a board or comparing sensor traces.",
    specs: [
      { label: "Bandwidth", value: "200 MHz" },
      { label: "Analogue channels", value: "4" },
      { label: "Digital channels", value: "16" },
    ],
    tags: ["oscilloscope", "logic analysis"],
    approval: "standard",
  },
  {
    id: "esp32-prototyping-kit",
    name: "ESP32 prototyping kit",
    type: "devKit",
    department: "Electronics",
    lab: "Embedded Systems Lab",
    location: "Engineering Block B · Room 208",
    description:
      "Prototype a wireless sensor or controller with a development board, breadboard, and jumper leads.",
    specs: [
      { label: "Wireless", value: "Wi-Fi · BLE" },
      { label: "Logic level", value: "3.3 V" },
      { label: "Included", value: "USB cable · breadboard" },
    ],
    tags: ["microcontroller", "IoT", "sensors"],
    approval: "standard",
  },
  {
    id: "gpu-workstation",
    name: "GPU workstation",
    type: "workstation",
    department: "Computer Science",
    lab: "Computing Studio",
    location: "Computing Block · Room 306",
    description:
      "Use a dedicated GPU for rendering, simulation, and small machine-learning experiments.",
    specs: [
      { label: "GPU memory", value: "16 GB" },
      { label: "System memory", value: "64 GB" },
      { label: "Operating system", value: "Linux" },
    ],
    tags: ["CUDA", "rendering", "parallel computing"],
    approval: "faculty",
  },
  {
    id: "fdm-3d-printer",
    name: "FDM 3D printer",
    type: "equipment",
    department: "Mechanical Engineering",
    lab: "Rapid Prototyping Lab",
    location: "Workshop Annex · Bay 3",
    description:
      "Print enclosure prototypes, fixtures, and fit-check parts in PLA or PETG.",
    specs: [
      { label: "Build volume", value: "250 × 210 × 220 mm" },
      { label: "Nozzle", value: "0.4 mm" },
      { label: "Materials", value: "PLA · PETG" },
    ],
    tags: ["additive manufacturing", "3D printing"],
    approval: "faculty",
  },
  {
    id: "digital-logic-analyser",
    name: "Digital logic analyser",
    type: "equipment",
    department: "Electronics",
    lab: "Circuits & Instrumentation Lab",
    location: "Engineering Block B · Room 204",
    description:
      "Inspect serial traffic and timing across multiple pins during embedded-system debugging.",
    specs: [
      { label: "Channels", value: "8" },
      { label: "Sample rate", value: "100 MS/s" },
      { label: "Protocol decoding", value: "SPI · I²C · UART" },
    ],
    tags: ["timing", "embedded systems"],
    approval: "standard",
  },
  {
    id: "fpga-development-kit",
    name: "FPGA development kit",
    type: "devKit",
    department: "Computer Science",
    lab: "Digital Design Lab",
    location: "Computing Block · Room 102",
    description:
      "Build and verify digital logic using onboard switches, LEDs, and expansion headers.",
    specs: [
      { label: "Device family", value: "Artix-7" },
      { label: "Interfaces", value: "USB-JTAG · Pmod" },
      { label: "Toolchain", value: "Vivado" },
    ],
    tags: ["Verilog", "VHDL", "digital logic"],
    approval: "faculty",
  },
  {
    id: "cad-workstation",
    name: "CAD workstation",
    type: "workstation",
    department: "Mechanical Engineering",
    lab: "Design Computing Lab",
    location: "Engineering Block A · Room 312",
    description:
      "Prepare mechanical assemblies and drawings for prototyping and review.",
    specs: [
      { label: "System memory", value: "32 GB" },
      { label: "Displays", value: "2 × 27 in" },
      { label: "Operating system", value: "Windows" },
    ],
    tags: ["mechanical design", "modelling"],
    approval: "standard",
  },
  {
    id: "optical-spectrometer",
    name: "Visible-light spectrometer",
    type: "equipment",
    department: "Applied Physics",
    lab: "Optics Lab",
    location: "Science Block · Room 118",
    description:
      "Compare visible-light spectra from teaching sources and optical filters.",
    specs: [
      { label: "Range", value: "380–780 nm" },
      { label: "Input", value: "Fibre optic" },
      { label: "Interface", value: "USB" },
    ],
    tags: ["optics", "light", "spectroscopy"],
    approval: "faculty",
  },
];

export type SearchParams = Record<string, string | string[] | undefined>;

interface CatalogueFilters {
  query: string;
  type: string;
  department: string;
  approval: string;
}

export const departments = [
  ...new Set(sampleResources.map((resource) => resource.department)),
].sort();

export const approvalLabels: Record<ApprovalPolicy, string> = {
  standard: "Standard access",
  faculty: "Faculty approval",
};

function firstValue(value: SearchParams[string]) {
  return Array.isArray(value) ? value[0] : value;
}

/** Read shareable catalogue filters from a link or a GET form. */
export function parseCatalogueFilters(params: SearchParams): CatalogueFilters {
  const type = firstValue(params.type) ?? "";
  const approval = firstValue(params.approval) ?? "";
  const department = firstValue(params.department) ?? "";

  return {
    query: (firstValue(params.q) ?? "").trim().slice(0, 120),
    type: Object.hasOwn(resourceTypes, type) ? type : "",
    department: departments.includes(department) ? department : "",
    approval: Object.hasOwn(approvalLabels, approval) ? approval : "",
  };
}

/** Find resources matching all search terms and selected filters. */
export function filterResources(
  resources: readonly Resource[],
  filters: CatalogueFilters,
) {
  const terms = filters.query.toLowerCase().split(/\s+/).filter(Boolean);

  return resources.filter((resource) => {
    if (filters.type && filters.type !== resource.type) return false;
    if (filters.department && filters.department !== resource.department)
      return false;
    if (filters.approval && filters.approval !== resource.approval)
      return false;

    const searchText = [
      resource.name,
      resourceTypes[resource.type],
      resource.department,
      resource.lab,
      resource.description,
      ...resource.tags,
      ...resource.specs.flatMap(({ label, value }) => [label, value]),
    ]
      .join(" ")
      .toLowerCase();

    return terms.every((term) => searchText.includes(term));
  });
}
