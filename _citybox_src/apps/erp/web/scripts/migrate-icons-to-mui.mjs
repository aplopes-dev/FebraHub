#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "../src");

const KEEP_FILES = new Set([
  // Navegação já migrada para `@/lib/nav-icons` (Material) — nada a converter.
]);

const ICON_TO_MUI = {
  "more-horizontal": "MoreHoriz",
  edit: "EditOutlined",
  delete: "DeleteOutlined",
  restore: "Restore",
  download: "DownloadOutlined",
  eye: "VisibilityOutlined",
  copy: "ContentCopyOutlined",
  plus: "Add",
  close: "Close",
  filter: "FilterList",
  sort: "Sort",
  grip: "DragIndicator",
  info: "InfoOutlined",
  "chevron-right": "ChevronRight",
  "chevron-down": "ExpandMore",
  "chevron-up": "ExpandLess",
  upload: "CloudUploadOutlined",
  search: "Search",
  package: "Inventory2Outlined",
  products: "Inventory2Outlined",
  clipboard: "AssignmentOutlined",
  document: "DescriptionOutlined",
  receipt: "ReceiptOutlined",
  tag: "LocalOfferOutlined",
  sliders: "Tune",
  "arrow-left": "ArrowBack",
  "arrow-right": "ArrowForward",
  check: "Check",
  sun: "LightModeOutlined",
  moon: "DarkModeOutlined",
  notification: "NotificationsOutlined",
  user: "PersonOutlined",
  logout: "Logout",
  help: "HelpOutline",
  customers: "PeopleOutlined",
  sales: "PointOfSaleOutlined",
  "arrow-down-left": "SouthWestOutlined",
  "arrow-up-right": "NorthEastOutlined",
  transfer: "SwapHorizOutlined",
  scale: "ChecklistOutlined",
  factory: "FactoryOutlined",
  zap: "BoltOutlined",
  building: "BusinessOutlined",
  "chevrons-up-down": "UnfoldMore",
  clock: "ScheduleOutlined",
  dashboard: "DashboardOutlined",
  mail: "MailOutline",
  star: "StarOutline",
};

const ICON_TAG_RE = /<Icon\b([^>]*)\/>/gs;

function getAttr(attrs, name) {
  const m1 = attrs.match(new RegExp(`${name}="([^"]*)"`));
  if (m1) return m1[1];
  const m2 = attrs.match(new RegExp(`${name}='([^']*)'`));
  if (m2) return m2[1];
  const m3 = attrs.match(new RegExp(`${name}=\\{([^}]+)\\}`));
  if (m3) return `{${m3[1]}}`;
  return undefined;
}

function hasAttr(attrs, name) {
  return new RegExp(`\\b${name}(?:=|\\s|/)`).test(attrs);
}

function buildSx(size, color, sxRaw) {
  const parts = [];
  if (size) {
    const s = size.startsWith("{") ? size.slice(1, -1) : size;
    parts.push(`fontSize: ${s}`);
  }
  if (color) {
    if (color.startsWith("{")) parts.push(`color: ${color.slice(1, -1).trim()}`);
    else parts.push(`color: "${color}"`);
  }
  if (sxRaw) {
    const inner = sxRaw.trim();
    if (inner.startsWith("{")) parts.push(inner.slice(1, -1).trim());
    else parts.push(inner);
  }
  if (parts.length === 0) return null;
  return `{ ${parts.join(", ")} }`;
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) acc = walk(full, acc);
    else if (/\.(tsx?)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function convertFile(content) {
  const usedMui = new Set();
  let hasDynamic = false;

  const newContent = content.replace(ICON_TAG_RE, (full, attrs) => {
    const name = getAttr(attrs, "name");
    if (!name) {
      hasDynamic = true;
      return full;
    }

    const muiName = ICON_TO_MUI[name];
    if (!muiName) {
      console.warn(`    Unknown icon: ${name}`);
      hasDynamic = true;
      return full;
    }

    usedMui.add(muiName);
    const size = getAttr(attrs, "size");
    const color = getAttr(attrs, "color");
    const sxRaw = getAttr(attrs, "sx");
    const sx = buildSx(size, color, sxRaw);
    const aria = hasAttr(attrs, "aria-hidden") ? " aria-hidden" : "";
    return sx ? `<${muiName} sx={${sx}}${aria} />` : `<${muiName}${aria} />`;
  });

  if (usedMui.size === 0) return { content, changed: false, hasDynamic };

  let result = newContent
    .replace(
      /^import\s+\{[^}]*\bIcon\b[^}]*\}\s+from\s+["']@citybox\/mui\/icons["'];?\s*\n?/gm,
      "",
    )
    .replace(
      /^import\s+\{[^}]*\bIconName\b[^}]*\}\s+from\s+["']@citybox\/mui\/icons["'];?\s*\n?/gm,
      "",
    );

  const importLines = [...usedMui]
    .sort()
    .map((n) => `import ${n} from "@mui/icons-material/${n}";`)
    .join("\n");

  const importBlockMatch = result.match(/^((?:import .+\n)+)/);
  if (importBlockMatch) {
    const end = importBlockMatch[0].length;
    result = result.slice(0, end) + importLines + "\n" + result.slice(end);
  } else {
    result = importLines + "\n\n" + result;
  }

  return { content: result, changed: true, hasDynamic };
}

const files = walk(SRC).filter((f) => !KEEP_FILES.has(f));
let converted = 0;
let partial = 0;

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes("@citybox/mui/icons")) continue;

  const { content: newContent, changed, hasDynamic } = convertFile(content);
  if (changed) {
    fs.writeFileSync(file, newContent);
    converted++;
    const rel = path.relative(SRC, file);
    console.log(hasDynamic ? `Partial: ${rel}` : `Converted: ${rel}`);
    if (hasDynamic) partial++;
  } else {
    console.log(`Manual: ${path.relative(SRC, file)}`);
  }
}

console.log(`\nDone: ${converted} files (${partial} with remaining dynamic Icon)`);
