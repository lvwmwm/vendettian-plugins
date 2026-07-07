import { React, ReactNative as RN, constants } from "@vendetta/metro/common";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { rawColors, semanticColors } from "@vendetta/ui";
import { PERMISSION_CATEGORIES, formatPermName } from "../lib/permissions";

const ActionSheet = findByProps("ActionSheet")?.ActionSheet;
const ASCBMod = findByProps("ActionSheetCloseButton");
const ActionSheetCloseButton = ASCBMod?.ActionSheetCloseButton;
const { hideActionSheet } = findByProps("openLazy", "hideActionSheet") ?? {};
const GuildRoleStore = findByProps("getSortedRoles", "getRole");
const GuildMemberStore = findByProps("getMember");
const UserStore = findByProps("getUser");
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

function parsePerms(v: any): bigint {
    if (v == null) return 0n;
    try { return typeof v === "bigint" ? v : BigInt(v); } catch { return 0n; }
}

function getCombinedPerms(guildId: string, roleIds: string[]): bigint {
    let combined = 0n;
    const everyone = GuildRoleStore?.getRole?.(guildId, guildId);
    if (everyone?.permissions) combined |= parsePerms(everyone.permissions);
    for (const id of roleIds) {
        const role = GuildRoleStore?.getRole?.(guildId, id);
        if (role?.permissions) combined |= parsePerms(role.permissions);
    }
    return combined;
}

export default function UserPermissionPage({ guildId, userId }: { guildId: string; userId: string }) {
    const Perms = constants?.Permissions ?? {};
    const member = GuildMemberStore?.getMember?.(guildId, userId);
    const user = UserStore?.getUser?.(userId);
    const roleIds = member?.roles ?? [];
    const roles = roleIds.map((id: string) => GuildRoleStore?.getRole?.(guildId, id)).filter(Boolean);
    const perms = getCombinedPerms(guildId, roleIds);
    const avatarUrl = user?.getAvatarURL?.(true, 64) ?? (user ? "https://cdn.discordapp.com/embed/avatars/" + Number((BigInt(user.id) >> 22n) % 6n) + ".png" : null);
    const name = member?.nick ?? user?.globalName ?? user?.username ?? userId.slice(0, 8);

    function hasPerm(flagName: string): boolean {
        const flag = Perms[flagName];
        if (flag == null) return false;
        const f = typeof flag === "bigint" ? flag : BigInt(flag);
        return (perms & f) === f;
    }

    return (
        <ActionSheet>
            <RN.View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 }}>
                <RN.View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    {avatarUrl && <RN.Image source={{ uri: avatarUrl }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />}
                    <T variant="heading-md/semibold">{name}</T>
                </RN.View>
                {ActionSheetCloseButton
                    ? React.createElement(ActionSheetCloseButton, { onPress: () => { hideActionSheet?.() } })
                    : <T variant="text-md/semibold" style={{ color: rawColors.BRAND_500 }} onPress={() => { hideActionSheet?.() }}>Close</T>}
            </RN.View>
            {roles.length > 0 && (
                <RN.View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                    <T variant="text-sm/bold" style={{ color: sc("text-muted"), marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Roles</T>
                    <RN.View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {roles.map((role: any) => {
                            const roleColor = role.color > 0 ? "#" + role.color.toString(16).padStart(6, "0") : null;
                            return (
                                <RN.View key={role.id} style={{ flexDirection: "row", alignItems: "center", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4, marginBottom: 4 }}>
                                    {roleColor && <RN.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: roleColor, marginRight: 4 }} />}
                                    <T variant="text-sm/medium" style={roleColor ? { color: roleColor } : {}}>{role.name}</T>
                                </RN.View>
                            );
                        })}
                    </RN.View>
                </RN.View>
            )}
            <RN.ScrollView style={{ flex: 1 }}>
                {PERMISSION_CATEGORIES.map((section) => {
                    const sectionPerms = section.permissions.filter((p) => Perms[p] != null);
                    if (sectionPerms.length === 0) return null;
                    return (
                        <RN.View key={section.name} style={{ marginBottom: 8 }}>
                            <TableRowGroup>
                                {sectionPerms.map((permName) => {
                                    const checked = hasPerm(permName);
                                    return TableCheckboxRow
                                        ? React.createElement(TableCheckboxRow, { key: permName, label: formatPermName(permName), checked, disabled: true })
                                        : React.createElement(TableRow, { key: permName, label: formatPermName(permName), trailing: () => React.createElement(T, { variant: "text-sm/medium", style: { color: checked ? rawColors.GREEN_360 : undefined } }, checked ? "Yes" : "No") });
                                })}
                            </TableRowGroup>
                        </RN.View>
                    );
                })}
            </RN.ScrollView>
        </ActionSheet>
    );
}
