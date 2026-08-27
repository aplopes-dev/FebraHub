let defaultTemplate: import("./types").ToastTemplateName = "progress";
let defaultDuration = 4_000;

export function configureToast(options: {
  defaultTemplate?: import("./types").ToastTemplateName;
  defaultDuration?: number;
}): void {
  if (options.defaultTemplate) defaultTemplate = options.defaultTemplate;
  if (options.defaultDuration != null) defaultDuration = options.defaultDuration;
}

export function getToastDefaults() {
  return {
    defaultTemplate,
    defaultDuration,
  };
}
