import { useState, useEffect } from 'react'

export function useLocalImage(filePath) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (!filePath) { setSrc(null); return }
    window.electronAPI.readImage(filePath).then(setSrc)
  }, [filePath])
  return src
}
