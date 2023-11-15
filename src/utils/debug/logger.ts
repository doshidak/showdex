import chalk from 'chalk';
import { format } from 'date-fns';
import { paramCase } from 'change-case';
import { type AnsiColor, HighIntensityAnsiColor, StandardAnsiColor } from '@showdex/consts/core';

export type LoggerLevel =
  | 'silly'
  | 'debug'
  | 'verbose'
  | 'info'
  | 'success'
  | 'warn'
  | 'error';

export type LoggerLogFunction = (...data: unknown[]) => void;
export type LoggerLogFactory = (scope?: string, level?: LoggerLevel) => LoggerLogFunction;

export interface LoggerLevelConfig {
  label: string;
  color: AnsiColor;
  htmlColor?: string;
  devOnly?: boolean;
  print: LoggerLogFunction;
}

export interface LoggerLevelFunctions extends Record<LoggerLevel, LoggerLogFunction> {
  scope?: string;
}

export type LoggerLevelFactory = (scope?: string) => LoggerLevelFunctions;
export type LoggerInstance = Omit<LoggerLevelFunctions, 'scope'> & LoggerLevelFactory;
export type LoggerHtmlStyles = Record<string, string | number>;

const __DEV__ = process.env.NODE_ENV === 'development';
const isBrowser = typeof window === 'object';

const timestamp = (): string => chalk.dim(format(
  new Date(),
  __DEV__ ? 'HH:mm:ss.SSS' : 'yyyy-MM-dd HH:mm:ss.SSSXX',
));

const levels: Record<LoggerLevel, LoggerLevelConfig> = {
  silly: {
    label: 'SILL',
    color: HighIntensityAnsiColor.Gray,
    htmlColor: '#616161', // MD Gray 700
    devOnly: true,
    print: console.log, // alias for `console.log` in node
  },

  debug: {
    label: 'DBUG',
    color: HighIntensityAnsiColor.Gray,
    htmlColor: '#616161', // MD Gray 700
    devOnly: true,
    print: console.log,
  },

  verbose: {
    label: 'VERB',
    color: HighIntensityAnsiColor.BrightBlue,
    htmlColor: '#0288D1', // MD Light Blue 700
    devOnly: true,
    print: console.info,
  },

  info: {
    label: 'INFO',
    color: StandardAnsiColor.Blue,
    htmlColor: '#1976D2', // MD Blue 700
    print: console.info,
  },

  success: {
    label: 'GUCC',
    color: StandardAnsiColor.Green,
    htmlColor: '#388E3C', // MD Green 700
    print: console.log,
  },

  warn: {
    // label: 'WARN',
    label: 'SHIT',
    color: StandardAnsiColor.Yellow,
    htmlColor: '#F57C00', // MD Orange 700
    print: console.warn,
  },

  error: {
    // label: 'ERR!',
    label: 'FUCK', // seems more appropriate
    color: StandardAnsiColor.Red,
    htmlColor: '#D32F2F', // MD Red 700
    print: console.error,
  },
};

const createTtyLevel: LoggerLogFactory = (
  scope,
  level = 'silly',
) => (
  ...data
) => {
  const {
    label,
    color,
    devOnly,
    print,
  } = levels[level];

  if (devOnly && !__DEV__) {
    return;
  }

  const args = [
    timestamp(),
    // `label` (w/ color formatting, if provided),
    // `scope` (if provided),
    ...data,
  ];

  if (/^#[a-f0-9]{6,8}$/i.test(color)) {
    args.splice(1, 0, chalk.hex(color)(label));
  }

  if (scope) {
    args.splice(2, 0, chalk.dim(`${scope}:`));
  }

  return print(...args);
};

const toInlineStyles = (
  styles: LoggerHtmlStyles,
) => Object.entries(styles).reduce((inline, entry) => {
  const [property, value] = entry;

  if (!property || !value) {
    return inline;
  }

  const parsedProperty = paramCase(property);
  const declaration = `${parsedProperty}: ${typeof value === 'number' ? `${value}px` : value};`;

  if (inline.includes(`${parsedProperty}:`)) {
    return inline.replace(new RegExp(`${parsedProperty}:.+;`, 'i'), declaration);
  }

  return inline + declaration;
}, '');

const createHtmlLevel: LoggerLogFactory = (
  scope,
  level = 'silly',
) => (
  ...data
) => {
  const {
    label,
    htmlColor,
    devOnly,
    print,
  } = levels[level];

  if (devOnly && !__DEV__) {
    return;
  }

  // makes the console logs in Chrome's DevTools look pretty (unsure about other browsers tho)
  const heading = [`%c${label}`];
  const headingStyles: LoggerHtmlStyles[] = [{
    marginLeft: 5,
    padding: '5px 10px',
    fontSize: 10,
    color: htmlColor,
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  }];

  if (scope) {
    heading.push(`%c${scope}`);
    headingStyles.push({
      padding: `${headingStyles[0].padding} ${String(headingStyles[0].padding).split(' ')[0]} 0`,
      fontSize: headingStyles[0].fontSize,
      // color: '#03A9F4', // MD Light Blue 500
      color: '#9E9E9E', // MD Gray 500
      backgroundColor: headingStyles[0].backgroundColor,
      borderTopRightRadius: headingStyles[0].borderTopRightRadius,
      borderBottomRightRadius: headingStyles[0].borderBottomRightRadius,
    });
  }

  // temporary workaround for source caller referring to this file
  // (when not using setTimeout() to remove the source caller)
  const stack = new Error().stack?.split('\n')[2]?.trim();

  // now we'll build out the print() arguments that are in a very particular order
  const args = [
    heading.join(''),
    ...headingStyles.map((styles) => toInlineStyles(styles)),
  ];

  if (stack) {
    const stackStyles: LoggerHtmlStyles = {
      padding: headingStyles[0].padding,
      fontSize: headingStyles[0].fontSize,
      color: '#9E9E9E', // MD Gray 500
    };

    args[0] += `\n%c${stack}\n`;
    args.push(toInlineStyles(stackStyles));
  }

  // setTimeout() gets rid of the source caller in the console (e.g., 'logger.ts:151')
  // (just fyi, this also defers the output since the callback is at the top of the stack, i.e., the logs may be delayed.)
  // return setTimeout(print.bind(console, ...args));
  return print(...args, ...data);
};

const createLevel: LoggerLogFactory = (
  scope,
  level = 'silly',
) => (
  isBrowser
    ? createHtmlLevel
    : createTtyLevel
)(scope, level);

export const logger: LoggerInstance = (
  scope,
): LoggerLevelFunctions => ({
  scope,
  silly: createLevel(scope, 'silly'),
  debug: createLevel(scope, 'debug'),
  verbose: createLevel(scope, 'verbose'),
  success: createLevel(scope, 'success'),
  info: createLevel(scope, 'info'),
  warn: createLevel(scope, 'warn'),
  error: createLevel(scope, 'error'),
});

logger.silly = createLevel(null, 'silly');
logger.debug = createLevel(null, 'debug');
logger.verbose = createLevel(null, 'verbose');
logger.success = createLevel(null, 'success');
logger.info = createLevel(null, 'info');
logger.warn = createLevel(null, 'warn');
logger.error = createLevel(null, 'error');
