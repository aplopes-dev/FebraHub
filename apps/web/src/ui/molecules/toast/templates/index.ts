import type { ToastTemplateComponent, ToastTemplateName } from "../types";
import { ProgressToastTemplate } from "./progress-toast";
import { SimpleToastTemplate } from "./simple-toast";

export const TOAST_TEMPLATES: Record<
  ToastTemplateName,
  ToastTemplateComponent
> = {
  progress: ProgressToastTemplate,
  simple: SimpleToastTemplate,
};

export { ProgressToastTemplate, SimpleToastTemplate };
