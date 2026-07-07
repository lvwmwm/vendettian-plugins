import { React, ReactNative as RN, constants } from "@vendetta/metro/common";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { rawColors, semanticColors } from "@vendetta/ui";
import { PERMISSION_CATEGORIES, formatPermName } from "../lib/permissions";

const ActionSheet = findByProps("ActionSheet")?.ActionSheet;
const ASCBMod = findByProps("ActionSheetCloseButton");
const ActionSheetCloseButton = ASCBMod?.ActionSheetCloseButton;
const { openLazy, hideActionSheet } = findByProps("openLazy", "hideActionSheet") ?? {};
const GuildRoleStore = findByProps("getSortedRoles", "getRole");
const TableRowMod = findByProps("TableRow");
const TableRow = TableRowMod?.TableRow;
const TableRowGroup = findByProps("TableRowGroup")?.TableRowGroup ?? TableRowMod?.TableRowGroup;

const TextStyleSheet = findByProps("TextStyleSheet")?.TextStyleSheet;
const colorModule = findByProps("colors", "unsafe_rawColors");
const colorResolver = colorModule?.internal ?? colorModule?.meta;
const ThemeStore = findByStoreName("ThemeStore");

function sc(key: string): string {
    const t = ThemeStore?.theme ?? "dark";
    const uk = key.replace(/-/g, "_").toUpperCase();
    const sym = (semanticColors as any)?.[key] ?? (semanticColors as any)?.[uk];
    if (!sym) return "#DBDCDD";
    const resolved = colorResolver?.resolveSemanticColor(t, sym);
    return typeof resolved === "string" ? resolved : "#DBDCDD";
}

function T(p: any) {
    const { style, variant, ...rest } = p;
    return (
        <RN.Text
            style={[
                variant && TextStyleSheet?.[variant as keyof typeof TextStyleSheet],
                style?.color ? {} : { color: sc("text-default") },
                style,
            ]}
            {...rest}
        />
    );
}

const TableCheckboxRow = findByProps("TableCheckboxRow")?.TableCheckboxRow ?? null;

function tryHasPerm(perms: any, flag: any): boolean {
    if (perms == null || flag == null) return false;
    try {
        const p = typeof perms === "bigint" ? perms : BigInt(perms);
        const f = typeof flag === "bigint" ? flag : BigInt(flag);
        return (p & f) === f;
    } catch {
        return false;
    }
}

export default function RolesPage({ guildId }: { guildId: string }) {
    const roles = GuildRoleStore?.getSortedRoles?.(guildId) ?? [];
    const roleList = Array.from(roles);

    return (
        <ActionSheet>
            <RN.View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 }}>
                <RN.View style={{ width: 40 }} />
                <T variant="heading-md/semibold" style={{ flex: 1, textAlign: "center" }}>Roles</T>
                {ActionSheetCloseButton
                    ? React.createElement(ActionSheetCloseButton, { onPress: () => { hideActionSheet?.() } })
                    : React.createElement(T, { variant: "text-md/semibold", style: { color: rawColors.BRAND_500 }, onPress: () => { hideActionSheet?.() } }, "Close")}
            </RN.View>
            <TableRowGroup>
                {roleList.map((role: any) => {
                    const color = role.color > 0 ? "#" + role.color.toString(16).padStart(6, "0") : null;
                    return React.createElement(TableRow, {
                        key: role.id,
                        label: color
                            ? React.createElement(RN.View, { style: { flexDirection: "row", alignItems: "center" } },
                                React.createElement(RN.View, { style: { width: 12, height: 12, borderRadius: 6, backgroundColor: color, marginRight: 8 } }),
                                React.createElement(T, { variant: "text-md/semibold" }, role.name),
                            )
                            : role.name,
                        trailing: () => React.createElement(TableRow.Arrow, null),
                        onPress: () => {
                            hideActionSheet?.();
                            openLazy?.(Promise.resolve({ default: RolePermsPage }), "permissionviewer-role-" + role.id, { guildId, role });
                        },
                    });
                })}
                {roleList.length === 0 && (
                    <RN.View style={{ padding: 16, alignItems: "center" }}>
                        <T variant="text-md/medium">No roles found</T>
                    </RN.View>
                )}
            </TableRowGroup>
        </ActionSheet>
    );
}

function RolePermsPage({ guildId, role }: { guildId: string; role: any }) {
    const Perms = constants?.Permissions ?? {};
    const titleColor = role?.color > 0 ? "#" + role.color.toString(16).padStart(6, "0") : null;

    return (
        <ActionSheet>
            <RN.View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 }}>
                <T variant="text-md/semibold" style={{ color: rawColors.BRAND_500 }} onPress={() => {
                    hideActionSheet?.();
                    openLazy?.(Promise.resolve({ default: RolesPage }), "permissionviewer-roles", { guildId });
                }}>Back</T>
                <T variant="heading-md/semibold" style={{ flex: 1, textAlign: "center", ...(titleColor ? { color: titleColor } : {}) }}>
                    {role.name}
                </T>
                {ActionSheetCloseButton
                    ? React.createElement(ActionSheetCloseButton, { onPress: () => { hideActionSheet?.() } })
                    : React.createElement(T, { variant: "text-md/semibold", style: { color: rawColors.BRAND_500 }, onPress: () => { hideActionSheet?.() } }, "Close")}
            </RN.View>
            <RN.ScrollView>
                {PERMISSION_CATEGORIES.map((section) => {
                    const sectionPerms = section.permissions.filter((p) => Perms[p] != null);
                    if (sectionPerms.length === 0) return null;
                    return (
                        <RN.View key={section.name} style={{ marginBottom: 8 }}>
                            <TableRowGroup>
                                {sectionPerms.map((permName) => {
                                    const flag = Perms[permName];
                                    const hasPerm = tryHasPerm(role.permissions, flag);
                                    return TableCheckboxRow
                                        ? React.createElement(TableCheckboxRow, { key: permName, label: formatPermName(permName), checked: hasPerm, disabled: true })
                                        : React.createElement(TableRow, { key: permName, label: formatPermName(permName), trailing: () => React.createElement(T, { variant: "text-sm/medium", style: { color: hasPerm ? rawColors.GREEN_360 : undefined } }, hasPerm ? "Yes" : "No") });
                                })}
                            </TableRowGroup>
                        </RN.View>
                    );
                })}
            </RN.ScrollView>
        </ActionSheet>
    );
}
