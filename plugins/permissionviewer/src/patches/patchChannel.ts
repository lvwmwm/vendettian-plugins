import { after } from "@vendetta/patcher";
import { findByName, findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";

import ChannelPermsView from "../components/ChannelPermissionPage";

const ChannelLongPressActionSheet = findByName("ChannelLongPressActionSheet", false);
const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow;
const ActionSheetRowGroup = findByProps("ActionSheetRowGroup")?.ActionSheetRowGroup ?? findByProps("ActionSheetRow", "Group")?.Group;
const ActionSheetRowIcon = findByProps("ActionSheetRowIcon")?.ActionSheetRowIcon ?? findByProps("ActionSheetRow", "Icon")?.Icon;
const { openLazy } = findByProps("openLazy");

function findActionGroups(tree: any) {
    return findInReactTree(
        tree,
        (node: any) => node?.[0]?.type?.name === "ActionSheetRowGroup",
    );
}

const GroupComponent = ActionSheetRowGroup || (ActionSheetRow?.Group as any);
const IconComponent = ActionSheetRowIcon || (ActionSheetRow?.Icon as any);

export default () => {
    if (!ChannelLongPressActionSheet || !openLazy || !ActionSheetRow || !GroupComponent) return () => {};

    let innerUnpatch: (() => void) | null = null;

    const outerUnpatch = after("default", ChannelLongPressActionSheet, (_, ret) => {
        const channel = ret?.props?.channel;
        if (!channel || !channel.guild_id) return;

        if (innerUnpatch) innerUnpatch();

        innerUnpatch = after("type", ret, (_, component) => {
            const actions = findActionGroups(component);
            if (!actions) return;

            actions.push(
                React.createElement(GroupComponent, { key: "permviewer-channel" },
                    React.createElement(ActionSheetRow, {
                        label: "Channel Permissions",
                        icon: IconComponent ? React.createElement(IconComponent, { source: getAssetIDByName("ShieldIcon") }) : undefined,
                        onPress: () => {
                            openLazy(Promise.resolve({ default: ChannelPermsView }), "permissionviewer-channel-" + channel.id, { channelId: channel.id });
                        },
                    }),
                ),
            );
        });
    });

    return () => {
        if (innerUnpatch) innerUnpatch();
        outerUnpatch();
    };
};
