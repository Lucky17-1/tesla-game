/** CSS tokens are the shared source of truth for scene materials and UI. */
export function getSimulatorTheme() {
  const css = getComputedStyle(document.documentElement);
  const get = (name: string) => css.getPropertyValue(`--sim-${name}`).trim();
  return { sky: get("sky"), fog: get("fog"), ground: get("ground"), asphalt: get("asphalt"), line: get("line"), paint: get("paint"), carens: get("carens"), glass: get("glass"), trim: get("trim"), seat: get("seat"), metal: get("metal"), light: get("light"), tail: get("tail"), skin: get("skin"), hill: get("hill"), grain: get("grain"), sand: get("sand"), water: get("water"), wood: get("wood"), container1: get("container1"), container2: get("container2"), container3: get("container3"), hair: get("hair"), shirt1: get("shirt1"), shirt2: get("shirt2"), shirt3: get("shirt3"), pants: get("pants") };
}
export type SimulatorTheme = ReturnType<typeof getSimulatorTheme>;