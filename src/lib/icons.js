// icons.js — curated Lucide icon registry. Map kebab-case name → component so
// the rest of the app can use <Icon name="flame" /> dynamically.
import {
  LayoutDashboard, CheckSquare, Calendar, CalendarDays, CalendarOff, CalendarCheck,
  TrendingUp, Settings, Timer, PieChart, Trophy, User, UserPlus, UserCircle2,
  Plus, X, Check, CheckCheck, Trash2, Pencil, Edit3, Search, Filter, SlidersHorizontal,
  ChevronDown, ChevronRight, ChevronLeft, ChevronsUpDown, ArrowLeft, MoreHorizontal,
  Pin, PinOff, Flame, Zap, Star, Sparkles, Target, Award, AlertTriangle, AlertCircle,
  HelpCircle, Info, Circle, CircleCheck, Clock, Bell, Waves, Moon, Sunrise, Sun, Monitor,
  Palette, Download, Smartphone, ExternalLink, Play, Pause, RotateCcw, Coffee,
  Brain, ListChecks, GripVertical, BarChart2, WifiOff, StickyNote, Tag, Folder, Mail,
  KeyRound, LogOut, Lock, Eye, EyeOff, Code2, Activity, Wind, GraduationCap, BookOpen,
  Dumbbell, Repeat, Plug, Volume2, Vibrate, PartyPopper, Rocket, Hourglass, Command, House,
} from '@lucide/svelte';

export const icons = {
  'layout-dashboard': LayoutDashboard, 'check-square': CheckSquare, calendar: Calendar,
  'calendar-days': CalendarDays, 'calendar-off': CalendarOff, 'calendar-check': CalendarCheck,
  'trending-up': TrendingUp, settings: Settings, timer: Timer, 'pie-chart': PieChart,
  trophy: Trophy, user: User, 'user-plus': UserPlus, 'user-circle': UserCircle2,
  plus: Plus, x: X, check: Check, 'check-check': CheckCheck, 'trash-2': Trash2,
  pencil: Pencil, 'edit-3': Edit3, search: Search, filter: Filter, 'sliders-horizontal': SlidersHorizontal,
  'chevron-down': ChevronDown, 'chevron-right': ChevronRight, 'chevron-left': ChevronLeft,
  'chevrons-up-down': ChevronsUpDown, 'arrow-left': ArrowLeft, 'more-horizontal': MoreHorizontal,
  pin: Pin, 'pin-off': PinOff, flame: Flame, zap: Zap, star: Star, sparkles: Sparkles,
  target: Target, award: Award, 'alert-triangle': AlertTriangle, 'alert-circle': AlertCircle,
  'help-circle': HelpCircle, info: Info, circle: Circle, 'circle-check': CircleCheck,
  clock: Clock, bell: Bell, waves: Waves, moon: Moon, sunrise: Sunrise, sun: Sun, monitor: Monitor,
  palette: Palette, download: Download, smartphone: Smartphone, apple: Smartphone,
  github: ExternalLink, linkedin: ExternalLink, 'external-link': ExternalLink,
  play: Play, pause: Pause, 'rotate-ccw': RotateCcw, coffee: Coffee,
  brain: Brain, 'list-checks': ListChecks, 'grip-vertical': GripVertical, 'bar-chart-2': BarChart2,
  'wifi-off': WifiOff, 'sticky-note': StickyNote, tag: Tag, folder: Folder, mail: Mail,
  'key-round': KeyRound, 'log-out': LogOut, lock: Lock, eye: Eye, 'eye-off': EyeOff,
  'code-2': Code2, activity: Activity, wind: Wind, 'graduation-cap': GraduationCap,
  'book-open': BookOpen, dumbbell: Dumbbell, repeat: Repeat, plug: Plug, 'volume-2': Volume2,
  vibrate: Vibrate, 'party-popper': PartyPopper, rocket: Rocket, hourglass: Hourglass, command: Command,
  house: House,
};
