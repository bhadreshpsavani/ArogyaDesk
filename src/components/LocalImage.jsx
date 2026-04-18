import { useLocalImage } from '../utils'

export default function LocalImage({ filePath, alt, className, style }) {
  const src = useLocalImage(filePath)
  if (!src) return null
  return <img src={src} alt={alt || ''} className={className} style={style} />
}
