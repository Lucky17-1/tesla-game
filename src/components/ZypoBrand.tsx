import emblem from '@/assets/zypo/emblem.png.asset.json';
import { assetUrl } from '@/lib/asset-url';
import { Link } from '@tanstack/react-router';
export function ZypoBrand({ large = false }: { large?: boolean }) {
  return <Link to="/zypo" aria-label="Zypo" className={`zypo-brand ${large ? 'zypo-brand-large' : ''}`}><img src={assetUrl(emblem.url)} alt="" width={96} height={96} /><span>Zypo</span></Link>;
}