export type SpecStatus = "target" | "estimate" | "rumor";

export interface Spec {
  label: string;
  value: string;
  status: SpecStatus;
  note?: string;
}

/**
 * The Volterra GT-One is an original concept created for VoltEdge and its
 * racing game. It is NOT a real vehicle: every number below is a design
 * target or estimate produced for storytelling, never an official
 * specification of any product.
 */
export const CONCEPT_CAR = {
  name: "Volterra GT-One",
  kind: "Original concept · electric grand tourer",
  intro:
    "The GT-One is VoltEdge's in-house concept: an electric grand tourer we designed as the hero car of this site and our racing game. Nothing here is an official specification — every figure is clearly labeled as a design target or an estimate.",
  specs: {
    performance: [
      { label: "0–100 km/h", value: "< 3.0 s", status: "target", note: "Design goal for the concept's dual-motor layout." },
      { label: "Top speed", value: "260 km/h", status: "estimate", note: "Limited by our simulated gearing and battery thermal model." },
      { label: "Power (combined)", value: "~750 kW", status: "estimate", note: "Paper figure for the concept's two-motor powertrain." },
      { label: "Drive", value: "Dual-motor AWD", status: "target" },
    ] satisfies Spec[],
    battery: [
      { label: "Battery (usable)", value: "~95 kWh", status: "estimate" },
      { label: "Range (WLTP-style)", value: "520 km", status: "estimate", note: "Simulated figure for the concept — not a certified rating." },
      { label: "Architecture", value: "800 V", status: "target" },
      { label: "Weight", value: "~1,950 kg", status: "estimate" },
    ] satisfies Spec[],
    charging: [
      { label: "Peak DC rate", value: "350 kW", status: "estimate" },
      { label: "10–80% charge", value: "~18 min", status: "estimate", note: "Assumes a 350 kW-class charger and ideal battery temperature." },
      { label: "Added range in 15 min", value: "~300 km", status: "estimate" },
      { label: "Onboard AC charging", value: "11 kW", status: "estimate" },
    ] satisfies Spec[],
  },
  exterior: [
    "Long, low wedge silhouette with a full-width light blade instead of a conventional grille.",
    "Flush door handles, aero wheels and an active rear diffuser in our design sketches.",
    "Matte dark finishes with a thin red signature line along the rocker panel.",
  ],
  interior: [
    "Driver-focused cabin: a wide, curved instrument display and a yoke-style wheel in the concept art.",
    "Recycled-fiber seat surfaces and red contrast stitching in our renderings.",
    "Ambient lighting that shifts between calm white and performance red.",
  ],
  technology: [
    "Simulated torque-vectoring dual motor with adjustable regen in the game.",
    "Concept heat-pump thermal management targeting consistent cold-weather range.",
    "Over-the-air update architecture imagined for suspension and charging curves.",
  ],
};
