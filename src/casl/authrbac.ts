import { AbilityBuilder, Ability, InferSubjects, PureAbility } from "@casl/ability";
import { User } from "../types/user.types.js";

type Actions = "manage" | "create" | "read" | "update" | "delete";

type Subjects = InferSubjects<typeof User> | "all";

export type AppAbility = Ability<[Actions, Subjects]>;

export function defineAbilitiesFor(user: User): AppAbility {
    const { can, cannot, build } =
        new AbilityBuilder<AppAbility>(PureAbility as any);

    if (user.role === "admin") {
        can("manage", "all");
    } else if (user.role === "user") {
        can("read", User, { id: user.id });
        can("update", User, { id: user.id });
        cannot("delete", User);
    } else {
        can("read", User, { id: user.id });
        cannot("update", User);
        cannot("delete", User);
    }

    return build({
        detectSubjectType: (item: any) =>
            item instanceof User ? User : item.constructor,
    });
}
