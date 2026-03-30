/**
 * @file `scss.d.ts` - Typings for importing SCSS Modules.
 * @author Keith Choison <keith@tize.io>
 * @since 0.1.0
 */

declare module '*.module.scss' {
  const styles: { [className: string]: string; };

  export default styles;
}

// side-effect imports of non-module scss files (e.g. global.scss) — declare so TS2882 doesn't fire
declare module '*.scss' {}
