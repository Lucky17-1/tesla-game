import { assetUrl } from "@/lib/asset-url";
import video01 from "@/assets/home-media/Screen_Recording_2026-10-27_110838.mp4.asset.json";
import poster01 from "@/assets/home-media/Screen_Recording_2026-10-27_110838.jpg.asset.json";
import video02 from "@/assets/home-media/Screen_Recording_2026-10-27_111050.mp4.asset.json";
import poster02 from "@/assets/home-media/Screen_Recording_2026-10-27_111050.jpg.asset.json";
import video03 from "@/assets/home-media/Screen_Recording_2026-10-27_111137.mp4.asset.json";
import poster03 from "@/assets/home-media/Screen_Recording_2026-10-27_111137.jpg.asset.json";
import video04 from "@/assets/home-media/Screen_Recording_2026-10-27_111220.mp4.asset.json";
import poster04 from "@/assets/home-media/Screen_Recording_2026-10-27_111220.jpg.asset.json";
import video05 from "@/assets/home-media/Screen_Recording_2026-10-27_111306.mp4.asset.json";
import poster05 from "@/assets/home-media/Screen_Recording_2026-10-27_111306.jpg.asset.json";
import video06 from "@/assets/home-media/Screen_Recording_2026-10-27_111407.mp4.asset.json";
import poster06 from "@/assets/home-media/Screen_Recording_2026-10-27_111407.jpg.asset.json";
import video07 from "@/assets/home-media/Screen_Recording_2026-10-27_111510.mp4.asset.json";
import poster07 from "@/assets/home-media/Screen_Recording_2026-10-27_111510.jpg.asset.json";
import webm01 from "@/assets/home-media/Screen_Recording_2026-10-27_110838.webm.asset.json";
import webm02 from "@/assets/home-media/Screen_Recording_2026-10-27_111050.webm.asset.json";
import webm03 from "@/assets/home-media/Screen_Recording_2026-10-27_111137.webm.asset.json";
import webm04 from "@/assets/home-media/Screen_Recording_2026-10-27_111220.webm.asset.json";
import webm05 from "@/assets/home-media/Screen_Recording_2026-10-27_111306.webm.asset.json";
import webm06 from "@/assets/home-media/Screen_Recording_2026-10-27_111407.webm.asset.json";
import webm07 from "@/assets/home-media/Screen_Recording_2026-10-27_111510.webm.asset.json";

export const homeMedia = [
  { id: "110838", title: "Touchscreen", video: assetUrl(video01.url), webm: assetUrl(webm01.url), poster: assetUrl(poster01.url) },
  { id: "111050", title: "Glass roof", video: assetUrl(video02.url), webm: assetUrl(webm02.url), poster: assetUrl(poster02.url) },
  { id: "111137", title: "Car settings", video: assetUrl(video03.url), webm: assetUrl(webm03.url), poster: assetUrl(poster03.url) },
  { id: "111220", title: "Entertainment", video: assetUrl(video04.url), webm: assetUrl(webm04.url), poster: assetUrl(poster04.url) },
  { id: "111306", title: "Cabin details", video: assetUrl(video05.url), webm: assetUrl(webm05.url), poster: assetUrl(poster05.url) },
  { id: "111407", title: "Sound system", video: assetUrl(video06.url), webm: assetUrl(webm06.url), poster: assetUrl(poster06.url) },
  { id: "111510", title: "Design", video: assetUrl(video07.url), webm: assetUrl(webm07.url), poster: assetUrl(poster07.url) },
];