import type { SvgIconProps } from "@mui/material/SvgIcon";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import BoltOutlined from "@mui/icons-material/BoltOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import CalculateOutlined from "@mui/icons-material/CalculateOutlined";
import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import ChecklistOutlined from "@mui/icons-material/ChecklistOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import CreditCardOutlined from "@mui/icons-material/CreditCardOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import GridViewOutlined from "@mui/icons-material/GridViewOutlined";
import InputOutlined from "@mui/icons-material/InputOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import ListAltOutlined from "@mui/icons-material/ListAltOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import LocalShippingOutlined from "@mui/icons-material/LocalShippingOutlined";
import MailOutlined from "@mui/icons-material/MailOutlined";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import ShoppingCartOutlined from "@mui/icons-material/ShoppingCartOutlined";
import SouthWestOutlined from "@mui/icons-material/SouthWestOutlined";
import StarOutlined from "@mui/icons-material/StarOutlined";
import StraightenOutlined from "@mui/icons-material/StraightenOutlined";
import StyleOutlined from "@mui/icons-material/StyleOutlined";
import SwapHorizOutlined from "@mui/icons-material/SwapHorizOutlined";
import TrackChangesOutlined from "@mui/icons-material/TrackChangesOutlined";
import TrendingUpOutlined from "@mui/icons-material/TrendingUpOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import WarehouseOutlined from "@mui/icons-material/WarehouseOutlined";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import AttachMoneyOutlined from "@mui/icons-material/AttachMoneyOutlined";
import PieChartOutlineOutlined from "@mui/icons-material/PieChartOutlineOutlined";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import CableOutlined from "@mui/icons-material/CableOutlined";
import ChatOutlined from "@mui/icons-material/ChatOutlined";
import EventOutlined from "@mui/icons-material/EventOutlined";
import HandshakeOutlined from "@mui/icons-material/HandshakeOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import InboxOutlined from "@mui/icons-material/InboxOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import PhotoLibraryOutlined from "@mui/icons-material/PhotoLibraryOutlined";
import PointOfSaleOutlined from "@mui/icons-material/PointOfSaleOutlined";
import QrCodeScannerOutlined from "@mui/icons-material/QrCodeScannerOutlined";
import RocketLaunchOutlined from "@mui/icons-material/RocketLaunchOutlined";
import SchemaOutlined from "@mui/icons-material/SchemaOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import SendOutlined from "@mui/icons-material/SendOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import SmartToyOutlined from "@mui/icons-material/SmartToyOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import SupportAgentOutlined from "@mui/icons-material/SupportAgentOutlined";
import TaskAltOutlined from "@mui/icons-material/TaskAltOutlined";
import ViewKanbanOutlined from "@mui/icons-material/ViewKanbanOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import type { ElementType } from "react";

/**
 * Nomes semânticos usados em `navigation.ts` (rail + painel).
 * Glifos: `@mui/icons-material` (Outlined) — sem Solar/Iconify.
 */
export const NAV_ICON_MAP = {
  dashboard: DashboardOutlined,
  sales: ShoppingCartOutlined,
  mail: MailOutlined,
  "arrow-down-left": SouthWestOutlined,
  document: DescriptionOutlined,
  clipboard: AssignmentOutlined,
  tag: LocalOfferOutlined,
  star: StarOutlined,
  products: Inventory2Outlined,
  boxes: Inventory2Outlined,
  package: Inventory2Outlined,
  sliders: TuneOutlined,
  folder: FolderOutlined,
  ruler: StraightenOutlined,
  dollar: AttachMoneyOutlined,
  receipt: ReceiptLongOutlined,
  warehouse: WarehouseOutlined,
  grid: GridViewOutlined,
  "arrow-right": ArrowForwardOutlined,
  "arrow-left": ArrowBackOutlined,
  truck: LocalShippingOutlined,
  user: PersonOutlined,
  users: PeopleOutlined,
  "file-input": InputOutlined,
  clock: ScheduleOutlined,
  tags: StyleOutlined,
  customers: PeopleOutlined,
  megaphone: CampaignOutlined,
  finance: AccountBalanceWalletOutlined,
  wallet: AccountBalanceWalletOutlined,
  statement: DescriptionOutlined,
  transfer: SwapHorizOutlined,
  checklist: ChecklistOutlined,
  reports: TrendingUpOutlined,
  ticket: ConfirmationNumberOutlined,
  "credit-card": CreditCardOutlined,
  landmark: AccountBalanceOutlined,
  building: BusinessOutlined,
  list: ListAltOutlined,
  target: TrackChangesOutlined,
  calculator: CalculateOutlined,
  settings: SettingsOutlined,
  "map-pin": PlaceOutlined,
  car: DirectionsCarOutlined,
  zap: BoltOutlined,
  "pie-chart": PieChartOutlineOutlined,

  /* ── FebraHub: módulos e telas da unidade ── */
  handshake: HandshakeOutlined,
  graduation: SchoolOutlined,
  store: StorefrontOutlined,
  sitemap: AccountTreeOutlined,
  workflow: SchemaOutlined,
  pipeline: ViewKanbanOutlined,
  "id-card": BadgeOutlined,
  chat: ChatOutlined,
  calendar: EventOutlined,
  qr: QrCodeScannerOutlined,
  inbox: InboxOutlined,
  alert: WarningAmberOutlined,
  support: SupportAgentOutlined,
  pos: PointOfSaleOutlined,
  "menu-book": MenuBookOutlined,
  history: HistoryOutlined,
  approval: TaskAltOutlined,
  send: SendOutlined,
  image: PhotoLibraryOutlined,
  shield: ShieldOutlined,
  plug: CableOutlined,
  bot: SmartToyOutlined,
  bell: NotificationsOutlined,
  rocket: RocketLaunchOutlined,
} as const;

export type NavIconName = keyof typeof NAV_ICON_MAP;

type NavIconProps = {
  name: NavIconName;
  /** Tamanho em px (padrão 18 — rail e painel). */
  size?: number;
} & Omit<SvgIconProps, "fontSize" | "name">;

export function NavIcon({ name, size = 18, sx, ...rest }: NavIconProps) {
  const Component = NAV_ICON_MAP[name] as ElementType;
  return (
    <Component
      {...rest}
      sx={[{ fontSize: size }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    />
  );
}
