import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TOPBAR_CONTENT_H = 56;
export const TABBAR_CONTENT_H = 64;
const COLLAPSED_SHEET_H = 108;

/** One hook, all layout metrics. Edit numbers here, nowhere else. */
export function useLayout() {
  const insets = useSafeAreaInsets();

  const topBarHeight = insets.top + TOPBAR_CONTENT_H;
  const tabBarHeight = TABBAR_CONTENT_H + insets.bottom;

  return {
    insets,
    topBarPadTop: insets.top + 8,          // TopBar internal top padding
    topBarHeight,                          // full top bar incl. status bar
    tabBarPadBottom: insets.bottom + 8,    // TabBar internal bottom padding
    tabBarHeight,                          // full tab bar incl. nav/gesture bar
    screenTop: topBarHeight + 16,          // where screen content starts
    sheetBottom: tabBarHeight + 8,         // sheet sits above tab bar
    chipBottom: tabBarHeight + 8 + COLLAPSED_SHEET_H,  // GPS chip above collapsed sheet
    alertTop: topBarHeight + 16,           // deviation toast below top bar
    listBottom: tabBarHeight + 36,         // scroll content bottom clearance
  };
}