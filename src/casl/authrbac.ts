import { Ability, AbilityBuilder, AbilityClass, PureAbility } from '@casl/ability';
import { User } from '../types/user.types.js';

type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';
type Subjects = 'User' | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;

export function defineAbilitiesFor(user: User) {
    const { can, cannot, build } =
        new AbilityBuilder<AppAbility>(PureAbility as AbilityClass<AppAbility>);

    if (user.role === 'admin') {
        can('manage', 'all');
    } else if (user.role === 'user') {
        can('read', 'User');
        cannot('delete', 'User');
    } else {
        can('read', 'User');
        cannot('update', 'User');
        cannot('delete', 'User');
    }

    return build({
        detectSubjectType: (item: any) =>
            item?.type ?? item?.constructor?.name,
    });
}

