export const generateColorFromString = (str: string, isDarkMode: boolean): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  const saturation = isDarkMode ? 70 : 50;
  const lightness = isDarkMode ? 30 : 60;
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}; 