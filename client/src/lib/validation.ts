// 表单校验工具。Contact 与 Newsletter 共用同一份邮箱规则，
// 避免「a@」「@b」「abc」这类无效地址被提交后拼出错误的 mailto 链接。
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}
