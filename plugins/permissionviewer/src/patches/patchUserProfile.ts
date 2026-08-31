import { after } from "@vendetta/patcher";
import { findByName, findByProps } from "@vendetta/metro";
import { findInReactTree } from "@vendetta/utils";

import UserPermissionPage from "../components/UserPermissionPage";

const NAMES = ["UserProfileOverflowMenu", "BotUserProfileOverflowMenu"];
const { openLazy } = findByProps("openLazy");

function getMainItems(ret: any): any[] | null {
    let items = ret?.props?.items;
    if (Array.isArray(items) && Array.isArray(items[0])) return items[0];
    items = ret?.props?.children?.props?.items;
    if (Array.isArray(items) && Array.isArray(items[0])) return items[0];
    const node = findInReactTree(ret, (n: any) => Array.isArray(n?.props?.items) && Array.isArray(n.props.items[0]));
    return node?.props.items[0] ?? null;
}

function patchFn(args: any[], ret: any) {
    const props = args[0] ?? {};
    const guildId = props.guildId ?? props.displayProfile?.guildId ?? props.channel?.guild_id;
    const userId = props.user?.id;
    if (!guildId || !userId || !openLazy) return;
    const items = getMainItems(ret);
    if (!items || items.some((i: any) => i?.label === "Permissions")) return;
    items.push({
        label: "Permissions",
        action: () => openLazy(Promise.resolve({ default: UserPermissionPage }), "permviewer-user-" + userId, { guildId, userId }),
    });
}

export default () => {
    const unpatches: (() => void)[] = [];

    for (const name of NAMES) {
        const mod = findByName(name, false);
        if (mod) unpatches.push(after("default", mod, patchFn));
    }

    return () => { for (const fn of unpatches) fn(); };
};
