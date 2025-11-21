export const getCategoryName = (category: string) => {
  const categories = {
    MS: "Men's Singles",
    WS: "Women's Singles",
    MD: "Men's Doubles",
    WD: "Women's Doubles",
    XD: 'Mixed Doubles',
  }
  return categories[category as keyof typeof categories] || category
}

export const getPlayerInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
}
