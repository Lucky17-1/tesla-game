/** CSS tokens are the shared source of truth for scene materials and UI. */
export function getSimulatorTheme() {
  const css = getComputedStyle(document.documentElement);
  const get = (name: string) => css.getPropertyValue(`--sim-${name}`).trim();
  return { sky: get("sky"), fog: get("fog"), ground: get("ground"), asphalt: get("asphalt"), line: get("line"), paint: get("paint"), glass: get("glass"), trim: get("trim"), seat: get("seat"), metal: get("metal"), light: get("light"), tail: get("tail"), skin: get("skin"), hill: get("hill"), grain: get("grain") };
}
export type SimulatorTheme = ReturnType<typeof getSimulatorTheme>;