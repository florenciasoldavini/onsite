import ArrowRight from "lucide-react-native/dist/esm/icons/arrow-right.js";
import ArrowUpDown from "lucide-react-native/dist/esm/icons/arrow-up-down.js";
import AtSign from "lucide-react-native/dist/esm/icons/at-sign.js";
import Bell from "lucide-react-native/dist/esm/icons/bell.js";
import CalendarDays from "lucide-react-native/dist/esm/icons/calendar-days.js";
import Camera from "lucide-react-native/dist/esm/icons/camera.js";
import Check from "lucide-react-native/dist/esm/icons/check.js";
import CheckCircle2 from "lucide-react-native/dist/esm/icons/circle-check.js";
import ChevronDown from "lucide-react-native/dist/esm/icons/chevron-down.js";
import ChevronLeft from "lucide-react-native/dist/esm/icons/chevron-left.js";
import ChevronRight from "lucide-react-native/dist/esm/icons/chevron-right.js";
import ChevronUp from "lucide-react-native/dist/esm/icons/chevron-up.js";
import CircleAlert from "lucide-react-native/dist/esm/icons/circle-alert.js";
import CirclePlus from "lucide-react-native/dist/esm/icons/circle-plus.js";
import CircleUserRound from "lucide-react-native/dist/esm/icons/circle-user-round.js";
import Construction from "lucide-react-native/dist/esm/icons/construction.js";
import EllipsisVertical from "lucide-react-native/dist/esm/icons/ellipsis-vertical.js";
import Eye from "lucide-react-native/dist/esm/icons/eye.js";
import EyeOff from "lucide-react-native/dist/esm/icons/eye-off.js";
import FolderKanban from "lucide-react-native/dist/esm/icons/folder-kanban.js";
import FolderOpen from "lucide-react-native/dist/esm/icons/folder-open.js";
import FolderPlus from "lucide-react-native/dist/esm/icons/folder-plus.js";
import HardHat from "lucide-react-native/dist/esm/icons/hard-hat.js";
import House from "lucide-react-native/dist/esm/icons/house.js";
import ImageOff from "lucide-react-native/dist/esm/icons/image-off.js";
import ImagePlus from "lucide-react-native/dist/esm/icons/image-plus.js";
import Link2 from "lucide-react-native/dist/esm/icons/link-2.js";
import ListTodo from "lucide-react-native/dist/esm/icons/list-todo.js";
import ListChecks from "lucide-react-native/dist/esm/icons/list-checks.js";
import Languages from "lucide-react-native/dist/esm/icons/languages.js";
import LocateFixed from "lucide-react-native/dist/esm/icons/locate-fixed.js";
import Lock from "lucide-react-native/dist/esm/icons/lock.js";
import LogOut from "lucide-react-native/dist/esm/icons/log-out.js";
import Mail from "lucide-react-native/dist/esm/icons/mail.js";
import MapPinned from "lucide-react-native/dist/esm/icons/map-pinned.js";
import Pencil from "lucide-react-native/dist/esm/icons/pencil.js";
import Phone from "lucide-react-native/dist/esm/icons/phone.js";
import Plus from "lucide-react-native/dist/esm/icons/plus.js";
import RefreshCw from "lucide-react-native/dist/esm/icons/refresh-cw.js";
import Save from "lucide-react-native/dist/esm/icons/save.js";
import Search from "lucide-react-native/dist/esm/icons/search.js";
import SlidersHorizontal from "lucide-react-native/dist/esm/icons/sliders-horizontal.js";
import Store from "lucide-react-native/dist/esm/icons/store.js";
import Trash2 from "lucide-react-native/dist/esm/icons/trash-2.js";
import UserRound from "lucide-react-native/dist/esm/icons/user-round.js";
import X from "lucide-react-native/dist/esm/icons/x.js";
import ZoomIn from "lucide-react-native/dist/esm/icons/zoom-in.js";
import ZoomOut from "lucide-react-native/dist/esm/icons/zoom-out.js";
import type { LucideIcon, LucideProps } from "lucide-react-native";
import type { ComponentType } from "react";

export type AppIconSize = "xs" | "sm" | "md" | "lg";

export const appIconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24
} as const satisfies Record<AppIconSize, number>;

export type AppIconProps = {
  color: NonNullable<LucideProps["color"]>;
  size?: AppIconSize | number;
  strokeWidth?: LucideProps["strokeWidth"];
};

export type AppIconComponent = ComponentType<AppIconProps>;

function createIcon(Icon: LucideIcon): AppIconComponent {
  return function AppIcon({
    color,
    size = "md",
    strokeWidth = 1.8
  }: AppIconProps) {
    const resolvedSize = typeof size === "number" ? size : appIconSizes[size];

    return <Icon color={color} size={resolvedSize} strokeWidth={strokeWidth} />;
  };
}

export const ArrowRightIcon = createIcon(ArrowRight);
export const AlertIcon = createIcon(CircleAlert);
export const AtSignIcon = createIcon(AtSign);
export const BellIcon = createIcon(Bell);
export const CalendarIcon = createIcon(CalendarDays);
export const CameraIcon = createIcon(Camera);
export const CheckIcon = createIcon(Check);
export const CheckCircleIcon = createIcon(CheckCircle2);
export const ChevronDownIcon = createIcon(ChevronDown);
export const ChevronLeftIcon = createIcon(ChevronLeft);
export const ChevronRightIcon = createIcon(ChevronRight);
export const ChevronUpIcon = createIcon(ChevronUp);
export const CirclePlusIcon = createIcon(CirclePlus);
export const ClosedEyeIcon = createIcon(EyeOff);
export const CloseIcon = createIcon(X);
export const ConstructionIcon = createIcon(Construction);
export const FilterIcon = createIcon(SlidersHorizontal);
export const FolderOpenIcon = createIcon(FolderOpen);
export const FolderPlusIcon = createIcon(FolderPlus);
export const HardHatIcon = createIcon(HardHat);
export const HomeIcon = createIcon(House);
export const ImageOffIcon = createIcon(ImageOff);
export const ImagePlusIcon = createIcon(ImagePlus);
export const LinkIcon = createIcon(Link2);
export const LanguagesIcon = createIcon(Languages);
export const ListChecksIcon = createIcon(ListChecks);
export const LocateIcon = createIcon(LocateFixed);
export const LockIcon = createIcon(Lock);
export const LogoutIcon = createIcon(LogOut);
export const MailIcon = createIcon(Mail);
export const MapPinIcon = createIcon(MapPinned);
export const MoreVerticalIcon = createIcon(EllipsisVertical);
export const OpenEyeIcon = createIcon(Eye);
export const PencilIcon = createIcon(Pencil);
export const PlusIcon = createIcon(Plus);
export const ProfileIcon = createIcon(CircleUserRound);
export const ProjectsIcon = createIcon(FolderKanban);
export const RefreshIcon = createIcon(RefreshCw);
export const SaveIcon = createIcon(Save);
export const SearchIcon = createIcon(Search);
export const SortIcon = createIcon(ArrowUpDown);
export const StoreIcon = createIcon(Store);
export const TasksIcon = createIcon(ListTodo);
export const ToDoIcon = TasksIcon;
export const TrashIcon = createIcon(Trash2);
export const UserIcon = createIcon(UserRound);
export const PhoneIcon = createIcon(Phone);
export const ZoomInIcon = createIcon(ZoomIn);
export const ZoomOutIcon = createIcon(ZoomOut);
