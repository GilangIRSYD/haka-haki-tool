export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Haka-Haki Tools 🤘",
  description: "Indonesian stock market analysis platform.",
  navItems: [
    {
      label: "Broker Calendar",
      href: "/broker-calendar",
    },
    {
      label: "Broker Activity",
      href: "/broker-activity",
    },
    {
      label: "Big Player Movement",
      href: "/bigplayer-movement",
    },
    {
      label: "Big Broksum",
      href: "/big-broksum",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
