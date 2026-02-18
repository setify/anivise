'use client'

import { useEffect } from 'react'

export function DynamicFavicon({ href }: { href: string }) {
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = href
  }, [href])

  return null
}
