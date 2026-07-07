import { after } from "@vendetta/patcher";
import { findByName, findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";

import RolesPage from "../components/PermissionPage";

const GuildActionSheetProgress = findByName("GuildActionSheetProgress", false);
const TableRow = findByProps("TableRow")?.TableRow;
const TableRowGroup = findByProps("TableRowGroup")?.TableRowGroup ?? findByProps("TableRow")?.TableRowGroup;
const { openLazy } = findByProps("openLazy");

export default () => {
    if (!GuildActionSheetProgress || !openLazy || !TableRow || !TableRowGroup) return () => {};

    return after("default", GuildActionSheetProgress, (args, ret) => {
        const guild = args[0]?.guild;
        if (!guild) return;

        return React.createElement(React.Fragment, null,
            ret,
            React.createElement(TableRowGroup, null,
                React.createElement(TableRow, {
                    label: "Permissions",
                    trailing: TableRow.Arrow ?? undefined,
                    onPress: () => openLazy(Promise.resolve({ default: RolesPage }), "permissionviewer-roles", { guildId: guild.id }),
                }),
            ),
        );
    });
};
