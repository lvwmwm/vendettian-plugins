import { instead } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";

const patches: (() => void)[] = [];

export default {
    onLoad: () => {
        const PremiumUtils = findByProps("canUseHighVideoUploadQuality", "canStreamQuality");
        if (!PremiumUtils) return;

        patches.push(
            instead("canUseHighVideoUploadQuality", PremiumUtils, () => true),
            instead("canStreamQuality", PremiumUtils, () => true),
        );
    },
    onUnload: () => {
        for (const p of patches) p();
        patches.length = 0;
    },
};
