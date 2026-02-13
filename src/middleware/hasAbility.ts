import { subject } from "@casl/ability";
import { defineAbilitiesFor } from "../casl/authrbac.js";
import { getUserById } from "../services/userService.js";

export const canUpdateUser = async (loggedInUser: any, userId: string) => {
    const ability = defineAbilitiesFor(loggedInUser);

    const targetUser = await getUserById(userId);
    if (!targetUser) {
        throw new Error("User not found");
    }

    if (ability.cannot("update", subject("User", targetUser) as any)) {
        throw new Error("Forbidden");
    }

    return targetUser;
};

export const canDeleteUser = async (loggedInUser: any, userId: string) => {
    const ability = defineAbilitiesFor(loggedInUser);

    const targetUser = await getUserById(userId);
    if (!targetUser) {
        throw new Error("User not found");
    }

    if (ability.cannot("delete", subject("User", targetUser) as any)) {
        throw new Error("Forbidden");
    }

    return targetUser;
};
