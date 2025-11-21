import { useEffect, useState } from 'react'

export function useThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('fbl-theme')
    if (savedTheme) {
      setIsDark(savedTheme === 'dark')
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches
      setIsDark(systemPrefersDark)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('fbl-theme', newTheme ? 'dark' : 'light')
  }

  return {
    isDark,
    toggleTheme,
  }
}
