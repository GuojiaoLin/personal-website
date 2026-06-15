export type AdminNavigationIcon = 'loader' | 'shield' | 'login';

interface AdminNavigationInput {
  isAuthReady: boolean;
  isOwner: boolean;
}

interface AdminNavigationState {
  label: string;
  icon: AdminNavigationIcon;
  canUseAction: boolean;
}

export const getAdminNavigationState = ({
  isAuthReady,
  isOwner,
}: AdminNavigationInput): AdminNavigationState => {
  if (!isAuthReady) {
    return {
      label: '确认中',
      icon: 'loader',
      canUseAction: false,
    };
  }

  if (isOwner) {
    return {
      label: '进入后台',
      icon: 'shield',
      canUseAction: true,
    };
  }

  return {
    label: '站主登录',
    icon: 'login',
    canUseAction: true,
  };
};
