// react-syntax-highlighter 没有自带这些子路径的类型声明。
// 语言包对我们来说是不透明值——只是从 import 拿到再原样交给 registerLanguage，
// 因此用 unknown 而不是 any：既不需要 eslint-disable，也不会让调用点意外失去类型检查。
declare module "react-syntax-highlighter/dist/esm/prism-light" {
  import { ComponentType } from "react";
  const SyntaxHighlighter: ComponentType<Record<string, unknown>> & {
    registerLanguage: (name: string, lang: unknown) => void;
  };
  export default SyntaxHighlighter;
}

declare module "react-syntax-highlighter/dist/esm/languages/prism/*" {
  const language: unknown;
  export default language;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism" {
  import { CSSProperties } from "react";
  const oneDark: Record<string, CSSProperties>;
  export { oneDark };
}
