import { React, ReactNative as RN, constants } from "@vendetta/metro/common";
import { findByName, findByProps, findByStoreName } from "@vendetta/metro";
import { rawColors, semanticColors } from "@vendetta/ui";
import { formatPermName, hexToRgba, OVERWRITE_PERMISSIONS } from "../lib/permissions";

const ActionSheet = findByProps("ActionSheet")?.ActionSheet;
const ASCBMod = findByProps("ActionSheetCloseButton");
const ActionSheetCloseButton = ASCBMod?.ActionSheetCloseButton;
const showUserProfile = findByName("showUserProfileActionSheet");
const ChannelStore = findByProps("getChannel");
const GuildRoleStore = findByProps("getSortedRoles", "getRole");
const GuildMemberStore = findByProps("getMember");
const UserStore = findByProps("getUser");
const Perms = constants?.Permissions ?? {};
const { hideActionSheet } = findByProps("openLazy", "hideActionSheet") ?? {};

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

function getPermsFromOverwrite(ow: any, Perms: Record<string, any>) {
    const allow = typeof ow.allow === "bigint" ? ow.allow : BigInt(ow.allow ?? "0");
    const deny = typeof ow.deny === "bigint" ? ow.deny : BigInt(ow.deny ?? "0");
    return {
        allowed: OVERWRITE_PERMISSIONS.filter((p) => (allow & (Perms[p] ?? 0n)) !== 0n),
        denied: OVERWRITE_PERMISSIONS.filter((p) => (deny & (Perms[p] ?? 0n)) !== 0n),
    };
}

export default function ChannelPermsView({ channelId }: { channelId: string }) {
    const channel = ChannelStore?.getChannel?.(channelId);
    if (!channel) return null;
    const guildId = channel.guild_id;
    if (!guildId) {
        return (
            <ActionSheet>
                <RN.View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 }}>
                    <T variant="heading-md/semibold" style={{ flex: 1, textAlign: "center" }}>{channel.name}</T>
                    {ActionSheetCloseButton
                        ? <ActionSheetCloseButton onPress={() => { hideActionSheet?.() }} />
                        : <T variant="text-md/semibold" style={{ color: rawColors.BRAND_500 }} onPress={() => { hideActionSheet?.() }}>Close</T>}
                </RN.View>
                <RN.View style={{ padding: 16, alignItems: "center" }}>
                    <T variant="text-md/medium">Channel is not in a server</T>
                </RN.View>
            </ActionSheet>
        );
    }

    const roles = GuildRoleStore?.getSortedRoles?.(guildId) ?? [];
    const roleList = Array.from(roles);
    const roleMap: Record<string, any> = {};
    for (const r of roleList) roleMap[r.id] = r;

    const overwrites: any[] = Array.isArray(channel.permissionOverwrites)
        ? channel.permissionOverwrites
        : channel.permissionOverwrites ? Object.values(channel.permissionOverwrites) : [];

    const roleOverwrites = overwrites.filter((ow: any) => ow.type === 0);
    const memberOverwrites = overwrites.filter((ow: any) => ow.type === 1);

    return (
        <ActionSheet>
            <RN.View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 }}>
                <T variant="heading-md/semibold" style={{ flex: 1, textAlign: "center" }}>#{channel.name}</T>
                {ActionSheetCloseButton
                    ? <ActionSheetCloseButton onPress={() => { hideActionSheet?.() }} />
                    : <T variant="text-md/semibold" style={{ color: rawColors.BRAND_500 }} onPress={() => { hideActionSheet?.() }}>Close</T>}
            </RN.View>
            <RN.ScrollView style={{ flex: 1 }}>
                {roleOverwrites.length === 0 && memberOverwrites.length === 0 && (
                    <RN.View style={{ padding: 16, alignItems: "center" }}>
                        <T variant="text-md/medium">No custom permissions</T>
                        <T variant="text-sm/medium" style={{ color: sc("text-muted"), marginTop: 4 }}>
                            This channel uses the server's default permissions
                        </T>
                    </RN.View>
                )}
                {roleOverwrites.length > 0 && (
                    <RN.View>
                        <T variant="text-sm/bold" style={{ color: sc("text-muted"), paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
                            Roles ({roleOverwrites.length})
                        </T>
                        {roleOverwrites.map((ow: any) => {
                            const role = roleMap[ow.id];
                            const name = role?.name ?? "Unknown role";
                            const color = role?.color > 0 ? "#" + role.color.toString(16).padStart(6, "0") : null;
                            const { allowed, denied } = getPermsFromOverwrite(ow, Perms);
                            return (
                                <RN.View key={ow.id} style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: sc("background-modifier-accent") }}>
                                    <T variant="text-md/semibold" style={color ? { color } : {}}>{name}</T>
                                    {allowed.length > 0 && (
                                        <RN.View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
                                            {allowed.map((p) => (
                                                <RN.View key={p} style={{ backgroundColor: hexToRgba(rawColors.GREEN_360, 0.15), borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4 }}>
                                                    <T variant="text-xs/medium" style={{ color: rawColors.GREEN_360 }}>{formatPermName(p)}</T>
                                                </RN.View>
                                            ))}
                                        </RN.View>
                                    )}
                                    {denied.length > 0 && (
                                        <RN.View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
                                            {denied.map((p) => (
                                                <RN.View key={p} style={{ backgroundColor: hexToRgba(rawColors.RED_400, 0.15), borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4 }}>
                                                    <T variant="text-xs/medium" style={{ color: rawColors.RED_400 }}>{formatPermName(p)}</T>
                                                </RN.View>
                                            ))}
                                        </RN.View>
                                    )}
                                    {allowed.length === 0 && denied.length === 0 && (
                                        <T variant="text-sm/medium" style={{ color: sc("text-muted"), marginTop: 4 }}>No changes</T>
                                    )}
                                </RN.View>
                            );
                        })}
                    </RN.View>
                )}
                {memberOverwrites.length > 0 && (
                    <RN.View>
                        <T variant="text-sm/bold" style={{ color: sc("text-muted"), paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
                            Members ({memberOverwrites.length})
                        </T>
                        {memberOverwrites.map((ow: any) => {
                            const userId = ow.id;
                            const member = GuildMemberStore?.getMember?.(guildId, userId);
                            const user = member?.user ?? UserStore?.getUser?.(userId);
                            const name = member?.nick ?? user?.globalName ?? user?.username ?? "User " + userId.slice(0, 6);
                            const avatarUrl = user?.getAvatarURL?.(true, 64) ?? "https://cdn.discordapp.com/embed/avatars/" + Number((BigInt(userId) >> 22n) % 6n) + ".png";
                            const { allowed, denied } = getPermsFromOverwrite(ow, Perms);
                            return (
                                <RN.Pressable key={ow.id} onPress={() => showUserProfile?.({ userId: ow.id })} style={({ pressed }: any) => ({ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: sc("background-modifier-accent"), backgroundColor: pressed ? sc("background-modifier-hover") : "transparent" })}>
                                    <RN.View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                                        {avatarUrl && <RN.Image source={{ uri: avatarUrl }} style={{ width: 20, height: 20, borderRadius: 10, marginRight: 8 }} />}
                                        <T variant="text-md/semibold">{name}</T>
                                    </RN.View>
                                    {allowed.length > 0 && (
                                        <RN.View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
                                            {allowed.map((p) => (
                                                <RN.View key={p} style={{ backgroundColor: hexToRgba(rawColors.GREEN_360, 0.15), borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4 }}>
                                                    <T variant="text-xs/medium" style={{ color: rawColors.GREEN_360 }}>{formatPermName(p)}</T>
                                                </RN.View>
                                            ))}
                                        </RN.View>
                                    )}
                                    {denied.length > 0 && (
                                        <RN.View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
                                            {denied.map((p) => (
                                                <RN.View key={p} style={{ backgroundColor: hexToRgba(rawColors.RED_400, 0.15), borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4 }}>
                                                    <T variant="text-xs/medium" style={{ color: rawColors.RED_400 }}>{formatPermName(p)}</T>
                                                </RN.View>
                                            ))}
                                        </RN.View>
                                    )}
                                    {allowed.length === 0 && denied.length === 0 && (
                                        <T variant="text-sm/medium" style={{ color: sc("text-muted"), marginTop: 4 }}>No changes</T>
                                    )}
                                </RN.Pressable>
                            );
                        })}
                    </RN.View>
                )}
            </RN.ScrollView>
        </ActionSheet>
    );
}
