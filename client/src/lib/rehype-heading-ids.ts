import type { Root, Element } from "hast";

const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

/**
 * 兜底补齐标题 ID。
 *
 * rehype-slug 已经负责生成绝大部分 ID（并用 github-slugger 处理重名，
 * 产出 `安装步骤`、`安装步骤-1`、`安装步骤-2`）。但纯符号标题（如 `### !!!`）
 * 会被 slug 成空串，留下 `id=""`——空 ID 无法作为锚点跳转，目录点了没反应。
 *
 * 这个插件跑在 rehype-slug 之后，只处理它没能给出有效 ID 的标题，
 * 按文档顺序补 `section-1`、`section-2`……并保证与已有 ID 不冲突。
 * 结果只依赖文档内容与顺序，因此多次渲染、刷新、预渲染之间保持稳定。
 */
export function rehypeHeadingIds() {
  return (tree: Root) => {
    const used = new Set<string>();
    const needsId: Element[] = [];

    const visit = (node: Root | Element) => {
      for (const child of node.children ?? []) {
        if (child.type !== "element") continue;
        const el = child as Element;
        if (HEADINGS.has(el.tagName)) {
          const id = el.properties?.id;
          if (typeof id === "string" && id.length > 0) {
            used.add(id);
          } else {
            needsId.push(el);
          }
        }
        visit(el);
      }
    };
    visit(tree);

    let counter = 0;
    for (const el of needsId) {
      let candidate: string;
      do {
        counter += 1;
        candidate = `section-${counter}`;
      } while (used.has(candidate));
      used.add(candidate);
      el.properties = { ...(el.properties ?? {}), id: candidate };
    }
  };
}
