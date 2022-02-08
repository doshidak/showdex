export enum StandardAnsiColor {
  Black = '#1E2431', // \e[30m
  Red = '#FF5C57', // \e[31m
  Green = '#5AF78E', // \e[32m
  Yellow = '#F3F99D', // \e[33m
  Blue = '#57C7FF', // \e[34m
  Magenta = '#FF6AC1', // \e[35m
  Cyan = '#9AEDFE', // \e[36m
  White = '#F1F1F0', // \e[37m
}

export enum HighIntensityAnsiColor {
  BrightBlack = '#686868', // \e[90m
  BrightRed = '#FF8C88', // \e[91m
  BrightGreen = '#BCDF7A', // \e[92m
  BrightYellow = '#FFE28C', // \e[93m
  BrightBlue = '#83D0F7', // \e[94m
  BrightMagenta = '#9989CC', // \e[95m
  BrightCyan = '#BFF3FD', // \e[96m
  BrightWhite = '#FFFFFF', // \e[97m
  Gray = BrightBlack,
  Grey = BrightBlack,
}

export type AnsiColor = StandardAnsiColor | HighIntensityAnsiColor; // e.g., '#FAFAFA'
