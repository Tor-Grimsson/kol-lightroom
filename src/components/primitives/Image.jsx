/**
 * Image — raster wrapper with graceful missing-asset fallback.
 *
 * Replaces raw <img> where brand raster assets may be missing. On load error,
 * renders AssetPlaceholder with category/name labels so the slot stays
 * visible at its intended size (aspect-ratio preserved).
 */
import { useState } from 'react'
import AssetPlaceholder from './AssetPlaceholder'

export default function Image({
  src,
  alt = '',
  category,
  name,
  aspectRatio,
  className = '',
  loading = 'lazy',
  ...rest
}) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return <AssetPlaceholder category={category} name={name} aspectRatio={aspectRatio} note="missing" className={className} />
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={`kol-image block max-w-full h-auto ${className}`.trim()}
      style={aspectRatio ? { aspectRatio } : undefined}
      onError={() => setFailed(true)}
      {...rest}
    />
  )
}
