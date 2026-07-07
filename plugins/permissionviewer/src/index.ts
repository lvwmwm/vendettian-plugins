import patchServer from "./patches/patchServer";
import patchChannel from "./patches/patchChannel";
import patchUserProfile from "./patches/patchUserProfile";

const patches: (() => void)[] = [];

export default {
    onLoad: () => {
        patches.push(patchServer());
        patches.push(patchChannel());
        patches.push(patchUserProfile());
    },
    onUnload: () => {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
};
